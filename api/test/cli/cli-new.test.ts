import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { schemaNew } from '../../cli/commands/new.ts'

/**
 * Exercises `schema:new` end-to-end against a scratch copy of the
 * committed 2-category / 2-element fixture. Every test writes to a
 * fresh tmpdir so runs are independent.
 */

const fixtureRoot = fileURLToPath(new URL('../fixtures/schemas', import.meta.url))

const logs: string[] = []
const captureLog = (line: string) => {
  logs.push(line)
}

let scratch: string

beforeEach(async () => {
  logs.length = 0
  scratch = await mkdtemp(join(tmpdir(), 'dtpr-cli-new-'))
  // Copy the whole schemas fixture tree into scratch so mutations stay local.
  await cp(fixtureRoot, scratch, { recursive: true })
})

afterEach(async () => {
  if (scratch) await rm(scratch, { recursive: true, force: true })
})

describe('schema:new', () => {
  it('drafts a new beta from the newest existing version', async () => {
    const result = await schemaNew('ai', '2026-05-01-beta', {
      sourceRoot: scratch,
      log: captureLog,
      now: () => new Date('2026-05-01T12:00:00.000Z'),
    })
    expect(result.ok).toBe(true)
    expect(result.sourceVersion).toBe('ai@2026-04-16-beta')
    expect(result.targetVersion).toBe('ai@2026-05-01-beta')

    const newDir = join(scratch, 'ai', '2026-05-01-beta')
    const entries = await readdir(newDir)
    expect(entries.sort()).toEqual(
      ['categories', 'datachain-type.yaml', 'elements', 'meta.yaml'].sort(),
    )

    const metaRaw = await readFile(join(newDir, 'meta.yaml'), 'utf8')
    const meta = yaml.load(metaRaw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>
    expect(meta.version).toBe('ai@2026-05-01-beta')
    expect(meta.status).toBe('beta')
    expect(meta.created_at).toBe('2026-05-01T12:00:00.000Z')
    expect(meta.notes).toBe('Drafted from ai@2026-04-16-beta')
    expect(meta.content_hash).toBe(`sha256-${'0'.repeat(64)}`)
    expect(meta.locales).toEqual(['en'])

    // Element and category files should be copied verbatim.
    const elements = await readdir(join(newDir, 'elements'))
    expect(elements.sort()).toEqual(['accept_deny.yaml', 'cloud_storage.yaml'])
  })

  it('prefers stable over beta when resolving the newest same-date source', async () => {
    // Promote the fixture beta to stable by copying it.
    await cp(
      join(scratch, 'ai', '2026-04-16-beta'),
      join(scratch, 'ai', '2026-04-16'),
      { recursive: true },
    )

    const result = await schemaNew('ai', '2026-05-01-beta', {
      sourceRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(true)
    expect(result.sourceVersion).toBe('ai@2026-04-16')
  })

  it('rejects a target without a -beta suffix', async () => {
    const result = await schemaNew('ai', '2026-05-01', {
      sourceRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('-beta'))).toBe(true)
  })

  it('refuses to overwrite an existing target directory', async () => {
    // Pre-create the target.
    await cp(
      join(scratch, 'ai', '2026-04-16-beta'),
      join(scratch, 'ai', '2026-05-01-beta'),
      { recursive: true },
    )
    const result = await schemaNew('ai', '2026-05-01-beta', {
      sourceRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.toLowerCase().includes('already exists'))).toBe(true)
  })

  it('errors clearly when the type has no existing versions', async () => {
    const result = await schemaNew('nonexistent', '2026-05-01-beta', {
      sourceRoot: scratch,
      log: captureLog,
    })
    expect(result.ok).toBe(false)
    expect(logs.some((l) => l.includes('nonexistent'))).toBe(true)
  })
})
