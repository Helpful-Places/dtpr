import { access, cp, readFile, readdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import yaml from 'js-yaml'
import { InvalidVersionError, parseVersion } from '../lib/version-parser.ts'
import { SchemaManifestSchema } from '../../src/schema/manifest.ts'

/** `api/` root computed from this module's location so the CLI works
 * regardless of the caller's cwd. */
const API_ROOT = fileURLToPath(new URL('../..', import.meta.url))

const CONTENT_HASH_SENTINEL = `sha256-${'0'.repeat(64)}`

export interface NewOptions {
  /** Schema source tree. Defaults to `<api>/schemas/`. */
  sourceRoot?: string
  /** Clock injection for tests. Defaults to `() => new Date()`. */
  now?: () => Date
  /** Sink for human output; defaults to console. */
  log?: (line: string) => void
}

export interface NewResult {
  ok: boolean
  type: string
  sourceVersion?: string
  targetVersion?: string
  targetDir?: string
}

/**
 * Draft a new beta schema version by copying the newest existing
 * version under `<type>/` into `<type>/<target-beta>/` and rewriting
 * `meta.yaml` with beta status, a fresh `created_at`, and a sentinel
 * `content_hash` that `schema:build` will stamp on emit.
 */
export async function schemaNew(
  typeArg: string,
  targetVersionArg: string,
  options: NewOptions = {},
): Promise<NewResult> {
  const log = options.log ?? ((line: string) => console.log(line))
  const err = (line: string) => (options.log ?? ((l: string) => console.error(l)))(line)
  const sourceRoot = resolve(options.sourceRoot ?? join(API_ROOT, 'schemas'))
  const now = options.now ?? (() => new Date())

  // Parse + validate the target. Must be beta.
  let target
  try {
    target = parseVersion(`${typeArg}@${targetVersionArg}`)
  } catch (e) {
    if (e instanceof InvalidVersionError) {
      err(`error: ${e.message}`)
      return { ok: false, type: typeArg }
    }
    throw e
  }
  if (!target.beta) {
    err(
      `error: schema:new requires a '-beta' suffix; got '${target.canonical}'. Drafting always starts from beta.`,
    )
    return { ok: false, type: typeArg }
  }

  // Resolve the newest existing source version under <sourceRoot>/<type>/.
  const typeDir = join(sourceRoot, target.type)
  let entries: string[]
  try {
    entries = await readdir(typeDir)
  } catch {
    err(`error: no schema versions found at ${typeDir}. Unknown type '${target.type}'.`)
    return { ok: false, type: typeArg }
  }
  const sourceDir = pickNewestVersion(entries)
  if (!sourceDir) {
    err(`error: no schema versions found under ${typeDir}.`)
    return { ok: false, type: typeArg }
  }
  const sourceCanonical = dirToCanonical(target.type, sourceDir)
  const targetDir = join(typeDir, `${target.date}-beta`)

  // Refuse to overwrite.
  try {
    await access(targetDir)
    err(`error: target ${targetDir} already exists. Remove it first or pick a new date.`)
    return { ok: false, type: typeArg }
  } catch {
    // expected: target does not exist
  }

  // Copy the source tree verbatim. `cp -r` preserves the full directory.
  await cp(join(typeDir, sourceDir), targetDir, { recursive: true })

  // Rewrite meta.yaml in the target dir.
  const metaPath = join(targetDir, 'meta.yaml')
  const existingRaw = await readFile(metaPath, 'utf8')
  const existing = yaml.load(existingRaw, { schema: yaml.JSON_SCHEMA }) as Record<string, unknown>

  const manifest = {
    version: target.canonical,
    status: 'beta' as const,
    created_at: now().toISOString(),
    notes: `Drafted from ${sourceCanonical}`,
    content_hash: CONTENT_HASH_SENTINEL,
    locales: existing.locales,
  }
  // Validate the new manifest against the schema so we fail fast on
  // an unexpected source-locale shape.
  SchemaManifestSchema.parse(manifest)

  await writeFile(metaPath, toYaml(manifest), 'utf8')

  log(`drafted from ${sourceCanonical}; edit api/schemas/${target.type}/${target.date}-beta/`)
  log(
    `  next: pnpm --filter ./api schema:validate ${target.canonical} ` +
      `(or schema:build to emit)`,
  )

  return {
    ok: true,
    type: target.type,
    sourceVersion: sourceCanonical,
    targetVersion: target.canonical,
    targetDir,
  }
}

/**
 * From a list of directory entries like ["2026-04-16-beta", "2026-05-01-beta", "2026-04-16"],
 * return the newest one. Tie-break by date descending; for the same
 * date, prefer stable (no `-beta` suffix) over beta.
 *
 * Returns undefined when no directory matches the version shape.
 */
function pickNewestVersion(entries: string[]): string | undefined {
  const DATE_RE = /^(\d{4}-\d{2}-\d{2})(-beta)?$/
  const parsed = entries
    .map((name) => {
      const m = name.match(DATE_RE)
      if (!m) return null
      return { name, date: m[1]!, beta: Boolean(m[2]) }
    })
    .filter((x): x is { name: string; date: string; beta: boolean } => x !== null)

  if (parsed.length === 0) return undefined

  parsed.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    // Same date: stable (beta=false) wins.
    return a.beta === b.beta ? 0 : a.beta ? 1 : -1
  })
  return parsed[0]!.name
}

function dirToCanonical(type: string, dir: string): string {
  return `${type}@${dir}`
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
