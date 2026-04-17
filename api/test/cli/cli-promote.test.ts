import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { access, cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { schemaPromote } from '../../cli/commands/promote.ts'

/**
 * Exercises `schema:promote` end-to-end. The happy path runs against
 * a fresh git repo created inside tmpdir so commit side-effects are
 * contained. Failure paths use `skipGit: true` to avoid the process
 * isolation overhead when git ops are not being tested.
 */

const fixtureRoot = fileURLToPath(new URL('../fixtures/schemas', import.meta.url))

const logs: string[] = []
const captureLog = (line: string) => {
  logs.push(line)
}

let scratch: string
let sourceRoot: string

beforeEach(async () => {
  logs.length = 0
  scratch = await mkdtemp(join(tmpdir(), 'dtpr-cli-promote-'))
  sourceRoot = join(scratch, 'api', 'schemas')
  await cp(fixtureRoot, sourceRoot, { recursive: true })
})

afterEach(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true })
})

function initGitRepo(root: string): void {
  execFileSync('git', ['init', '-b', 'main'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['config', 'commit.gpgsign', 'false'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['add', '-A'], { cwd: root, stdio: 'ignore' })
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: root, stdio: 'ignore' })
}

describe('schema:promote', () => {
  it('renames, rewrites meta, and commits to a fresh branch', async () => {
    initGitRepo(scratch)

    const result = await schemaPromote('ai@2026-04-16-beta', {
      sourceRoot,
      gitRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(true)
    expect(result.branch).toBe('schema/promote-ai-2026-04-16')

    // The beta dir should no longer exist; stable should take its place.
    await expect(access(join(sourceRoot, 'ai', '2026-04-16-beta'))).rejects.toThrow()
    await access(join(sourceRoot, 'ai', '2026-04-16'))

    const metaRaw = await readFile(
      join(sourceRoot, 'ai', '2026-04-16', 'meta.yaml'),
      'utf8',
    )
    const meta = yaml.load(metaRaw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>
    expect(meta.version).toBe('ai@2026-04-16')
    expect(meta.status).toBe('stable')
    expect(meta.notes).toBe('Promoted from ai@2026-04-16-beta')

    // Branch + commit exist.
    const branch = execFileSync('git', ['branch', '--show-current'], {
      cwd: scratch,
      encoding: 'utf8',
    }).trim()
    expect(branch).toBe('schema/promote-ai-2026-04-16')

    const log = execFileSync(
      'git',
      ['log', '-1', '--name-status', '--pretty=format:%s'],
      { cwd: scratch, encoding: 'utf8' },
    )
    expect(log.split('\n')[0]).toBe('promote schema ai@2026-04-16')
    // The rename should appear as paired delete + add (or a rename,
    // depending on git's similarity threshold). Either way, both the
    // old beta path and the new stable path must appear in the diff.
    expect(log).toContain('api/schemas/ai/2026-04-16')
    expect(log).toContain('api/schemas/ai/2026-04-16-beta')
  })

  it('refuses when the stable target already exists', async () => {
    // Pre-populate the stable target.
    await cp(
      join(sourceRoot, 'ai', '2026-04-16-beta'),
      join(sourceRoot, 'ai', '2026-04-16'),
      { recursive: true },
    )
    const result = await schemaPromote('ai@2026-04-16-beta', {
      sourceRoot,
      skipGit: true,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('immutable'))).toBe(true)
    // Beta dir stays put.
    await access(join(sourceRoot, 'ai', '2026-04-16-beta'))
  })

  it('refuses a non-beta version', async () => {
    const result = await schemaPromote('ai@2026-04-16', {
      sourceRoot,
      skipGit: true,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('-beta'))).toBe(true)
  })

  it('refuses when validation fails', async () => {
    // Corrupt the manifest so validation fails.
    await writeFile(
      join(sourceRoot, 'ai', '2026-04-16-beta', 'meta.yaml'),
      'version: "ai@2026-04-16-beta"\nstatus: beta\n', // missing required fields
      'utf8',
    )
    const result = await schemaPromote('ai@2026-04-16-beta', {
      sourceRoot,
      skipGit: true,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    // The directory should still be the beta version — no half-applied rename.
    await access(join(sourceRoot, 'ai', '2026-04-16-beta'))
    await expect(access(join(sourceRoot, 'ai', '2026-04-16'))).rejects.toThrow()
  })

  it('refuses when the working tree is dirty', async () => {
    initGitRepo(scratch)
    // Make an untracked change inside the repo.
    await writeFile(join(scratch, 'stray.txt'), 'untracked\n', 'utf8')

    const result = await schemaPromote('ai@2026-04-16-beta', {
      sourceRoot,
      gitRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.toLowerCase().includes('dirty'))).toBe(true)
    // Rename should not have been applied.
    await access(join(sourceRoot, 'ai', '2026-04-16-beta'))
  })

  it('refuses when the target branch already exists (leftover from a prior partial run)', async () => {
    initGitRepo(scratch)
    // Simulate a leftover branch from a prior partial promote.
    execFileSync('git', ['branch', 'schema/promote-ai-2026-04-16'], {
      cwd: scratch,
      stdio: 'ignore',
    })

    const result = await schemaPromote('ai@2026-04-16-beta', {
      sourceRoot,
      gitRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('already exists'))).toBe(true)
    // Rename and meta rewrite must not have run — this is the rollback guarantee.
    await access(join(sourceRoot, 'ai', '2026-04-16-beta'))
    await expect(access(join(sourceRoot, 'ai', '2026-04-16'))).rejects.toThrow()
  })

  it('refuses when gitRoot is not a git repo', async () => {
    const result = await schemaPromote('ai@2026-04-16-beta', {
      sourceRoot,
      gitRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.toLowerCase().includes('not a git repository'))).toBe(true)
    await access(join(sourceRoot, 'ai', '2026-04-16-beta'))
  })
})
