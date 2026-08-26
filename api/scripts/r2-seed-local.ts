/**
 * Seed the *local* R2 simulation (`wrangler dev` / Miniflare) with built
 * schema bundles, so the API can be reviewed locally with versions that
 * are not published to the real bucket.
 *
 * Mirrors `r2-upload.ts` key layout exactly:
 *   1. Every file under dist/schemas/<type>/<version>/ is written to
 *      `schemas/<type>/<version>/<rel>`.
 *   2. `schemas/index.json` is merged last, same entry shape.
 *
 * Writes through wrangler's `getPlatformProxy`, which persists to the
 * same `.wrangler/state/v3` store that `wrangler dev` reads. Seed
 * before starting the dev server: the Worker caches `index.json` for
 * 60 s and per-version manifests for 24 h (`caches.default`), so
 * re-seeding a changed version under a running dev server serves stale
 * data until restart.
 *
 * Usage:
 *   pnpm --filter ./api seed:local                      # seed every version in dist/schemas
 *   pnpm --filter ./api seed:local dtpr@2026-09-01-beta # seed one version
 */
import { readdir, readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPlatformProxy } from 'wrangler'
import { parseVersion, type ParsedVersion } from '../cli/lib/version-parser.ts'
import { contentTypeFor, walkFiles } from './r2-upload.ts'

const API_ROOT = fileURLToPath(new URL('..', import.meta.url))
const DIST_ROOT = join(API_ROOT, 'dist', 'schemas')

interface IndexEntry {
  id: string
  status: 'beta' | 'stable'
  created_at: string
  content_hash: string
}

interface ManifestFile {
  version: string
  status: 'beta' | 'stable'
  created_at: string
  content_hash: string
}

interface SeedEnv {
  CONTENT: {
    put(key: string, value: ArrayBuffer, opts?: { httpMetadata?: { contentType?: string } }): Promise<unknown>
    get(key: string): Promise<{ text(): Promise<string> } | null>
  }
}

/** Every <type>/<date>[-beta] dir under dist/schemas, as version strings. */
async function discoverBuiltVersions(): Promise<string[]> {
  const out: string[] = []
  let types: string[] = []
  try {
    types = await readdir(DIST_ROOT)
  } catch {
    return out
  }
  for (const type of types) {
    const typeDir = join(DIST_ROOT, type)
    if (!(await stat(typeDir)).isDirectory()) continue
    for (const dir of await readdir(typeDir)) {
      out.push(`${type}@${dir}`)
    }
  }
  return out.sort()
}

async function seedVersion(env: SeedEnv, version: ParsedVersion): Promise<IndexEntry> {
  const versionDir = join(DIST_ROOT, version.dir)
  const manifest = JSON.parse(await readFile(join(versionDir, 'manifest.json'), 'utf8')) as ManifestFile

  const files = await walkFiles(versionDir)
  if (files.length === 0) throw new Error(`No files found under ${versionDir}`)
  for (const abs of files) {
    const rel = relative(versionDir, abs).split(/[\\/]/).join('/')
    const body = await readFile(abs)
    await env.CONTENT.put(`schemas/${version.dir}/${rel}`, body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) as ArrayBuffer, {
      httpMetadata: { contentType: contentTypeFor(rel) },
    })
  }
  console.log(`seeded ${version.canonical}: ${files.length} objects (${manifest.content_hash})`)

  return {
    id: manifest.version,
    status: manifest.status,
    created_at: manifest.created_at,
    content_hash: manifest.content_hash,
  }
}

async function main(): Promise<void> {
  const versionArgs = process.argv.slice(2)
  const canonicals = versionArgs.length > 0 ? versionArgs : await discoverBuiltVersions()
  if (canonicals.length === 0) {
    throw new Error(
      `Nothing to seed: no bundles under ${DIST_ROOT}. Run \`pnpm --filter ./api schema:build <version>\` first.`,
    )
  }
  const versions = canonicals.map((v) => parseVersion(v))

  const proxy = await getPlatformProxy<SeedEnv>({
    configPath: join(API_ROOT, 'wrangler.jsonc'),
    persist: { path: join(API_ROOT, '.wrangler', 'state', 'v3') },
  })
  try {
    const entries: IndexEntry[] = []
    for (const version of versions) {
      entries.push(await seedVersion(proxy.env, version))
    }

    // Merge index.json last, mirroring r2-upload's flip-the-index-last order.
    const existingObj = await proxy.env.CONTENT.get('schemas/index.json')
    const index = existingObj
      ? (JSON.parse(await existingObj.text()) as { versions: IndexEntry[] })
      : { versions: [] }
    const seededIds = new Set(entries.map((e) => e.id))
    const next = {
      versions: [...index.versions.filter((v) => !seededIds.has(v.id)), ...entries].sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    }
    const body = new TextEncoder().encode(JSON.stringify(next, null, 2))
    await proxy.env.CONTENT.put('schemas/index.json', body.buffer as ArrayBuffer, {
      httpMetadata: { contentType: 'application/json' },
    })
    console.log(`index.json: ${next.versions.length} version(s) registered in local R2`)
  } finally {
    await proxy.dispose()
  }
}

main().catch((e) => {
  console.error(`r2-seed-local failed: ${e instanceof Error ? e.message : String(e)}`)
  process.exit(1)
})
