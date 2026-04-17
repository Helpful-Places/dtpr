import { spawn } from 'node:child_process'
import { access, readFile, rename, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { InvalidVersionError, parseVersion } from '../lib/version-parser.ts'
import { SchemaManifestSchema } from '../../src/schema/manifest.ts'
import { validateCmd } from './build.ts'

/** `api/` root computed from this module's location so the CLI works
 * regardless of the caller's cwd. */
const API_ROOT = fileURLToPath(new URL('../..', import.meta.url))

export interface PromoteOptions {
  /** Schema source tree. Defaults to `<api>/schemas/`. */
  sourceRoot?: string
  /** Skip git operations. Tests use this to isolate fs behavior. */
  skipGit?: boolean
  /** Working directory for git ops. Defaults to the repo root above `<api>/`. */
  gitRoot?: string
  /** Sink for human output; defaults to console. */
  log?: (line: string) => void
}

export interface PromoteResult {
  ok: boolean
  betaVersion: string
  stableVersion?: string
  branch?: string
}

/**
 * Promote `<type>@<date>-beta` to `<type>@<date>` (stable). Runs
 * validation first, then renames the directory, rewrites the
 * manifest's status, and commits to a new git branch ready for PR.
 *
 * Fails (without mutating anything) if:
 *   - the target stable directory already exists (stable is immutable)
 *   - semantic validation fails
 *   - the git working tree is dirty
 *   - the directory is not under a git repo
 */
export async function schemaPromote(
  versionArg: string,
  options: PromoteOptions = {},
): Promise<PromoteResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const err = (line: string) =>
    options.log ? options.log(line) : console.error(line)
  const sourceRoot = resolve(options.sourceRoot ?? join(API_ROOT, 'schemas'))
  const gitRoot = resolve(options.gitRoot ?? join(API_ROOT, '..'))

  // Parse + require beta.
  let beta
  try {
    beta = parseVersion(versionArg)
  } catch (e) {
    if (e instanceof InvalidVersionError) {
      err(`error: ${e.message}`)
      return { ok: false, betaVersion: versionArg }
    }
    throw e
  }
  if (!beta.beta) {
    err(
      `error: schema:promote requires a '-beta' version; got '${beta.canonical}'.`,
    )
    return { ok: false, betaVersion: versionArg }
  }

  const betaDir = join(sourceRoot, beta.dir)
  const stableCanonical = `${beta.type}@${beta.date}`
  const stableDir = join(sourceRoot, beta.type, beta.date)

  // Stable is immutable — never clobber.
  try {
    await access(stableDir)
    err(
      `error: stable directory ${stableDir} already exists. Stable versions are immutable.`,
    )
    return { ok: false, betaVersion: beta.canonical }
  } catch {
    // expected: stable does not exist yet
  }

  // Validate the beta. validateCmd prints per-error output itself.
  const validation = await validateCmd(beta.canonical, { sourceRoot, log })
  if (!validation.ok) {
    err(`error: validation failed for ${beta.canonical}; refusing to promote.`)
    return { ok: false, betaVersion: beta.canonical }
  }

  // Git prereqs. Run `rev-parse` first so a non-git dir fails fast
  // with a clear message instead of a surprising status failure.
  if (!options.skipGit) {
    const isRepo = await gitOk(['rev-parse', '--is-inside-work-tree'], gitRoot)
    if (!isRepo) {
      err(`error: ${gitRoot} is not a git repository.`)
      return { ok: false, betaVersion: beta.canonical }
    }
    const status = await gitOutput(['status', '--porcelain'], gitRoot)
    if (status.trim().length > 0) {
      err(
        `error: git working tree is dirty. Commit or stash your changes before promoting.`,
      )
      return { ok: false, betaVersion: beta.canonical }
    }
  }

  // Rename the dir on disk.
  await rename(betaDir, stableDir)

  // Rewrite meta.yaml in the new stable dir.
  const metaPath = join(stableDir, 'meta.yaml')
  const existingRaw = await readFile(metaPath, 'utf8')
  const existing = yaml.load(existingRaw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>

  const manifest = {
    version: stableCanonical,
    status: 'stable' as const,
    created_at: existing.created_at,
    notes: `Promoted from ${beta.canonical}`,
    content_hash: existing.content_hash,
    locales: existing.locales,
  }
  SchemaManifestSchema.parse(manifest)
  await writeFile(metaPath, toYaml(manifest), 'utf8')

  const branch = `schema/promote-${beta.type}-${beta.date}`
  if (!options.skipGit) {
    // Create the branch, stage the rename, commit.
    await gitRun(['checkout', '-b', branch], gitRoot)
    // `git add -A <path>` picks up both the new tree and the removed beta.
    await gitRun(['add', '-A', join('api', 'schemas', beta.type)], gitRoot)
    await gitRun(
      ['commit', '-m', `promote schema ${stableCanonical}`],
      gitRoot,
    )
  }

  log(
    `PR ready: push branch '${branch}' and open a PR titled 'promote schema ${stableCanonical}'`,
  )

  return {
    ok: true,
    betaVersion: beta.canonical,
    stableVersion: stableCanonical,
    branch,
  }
}

function toYaml(value: unknown): string {
  return yaml.dump(value, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false,
  })
}

/** Run `git <args>` and return true on exit 0. */
function gitOk(args: string[], cwd: string): Promise<boolean> {
  return new Promise((resolvePromise) => {
    const proc = spawn('git', args, { cwd, stdio: 'ignore' })
    proc.on('close', (code) => resolvePromise(code === 0))
    proc.on('error', () => resolvePromise(false))
  })
}

/** Run `git <args>`; reject on nonzero exit so callers can bail out. */
function gitRun(args: string[], cwd: string): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn('git', args, { cwd, stdio: 'inherit' })
    proc.on('close', (code) => {
      if (code === 0) resolvePromise()
      else rejectPromise(new Error(`git ${args.join(' ')} exited ${code}`))
    })
    proc.on('error', (e) => rejectPromise(e))
  })
}

/** Run `git <args>` and return stdout as a string. Rejects on nonzero. */
function gitOutput(args: string[], cwd: string): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const proc = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] })
    let out = ''
    proc.stdout.on('data', (chunk) => {
      out += chunk.toString()
    })
    proc.on('close', (code) => {
      if (code === 0) resolvePromise(out)
      else rejectPromise(new Error(`git ${args.join(' ')} exited ${code}`))
    })
    proc.on('error', (e) => rejectPromise(e))
  })
}
