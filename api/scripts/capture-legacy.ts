/**
 * One-shot capture of the legacy DTPR API (v0 + v1) from the live Nuxt
 * service, before that service is switched off.
 *
 * The capture window closes permanently when Render goes away, so this
 * script is deliberately paranoid:
 *
 *   - It fetches everything twice and refuses to emit unless both runs
 *     agree byte-for-byte. Record order in the v1 responses comes from
 *     `Object.values()` over a content query, and the `version` field is
 *     derived from content timestamps; neither is provably stable across
 *     Nitro restarts, so agreement is checked rather than assumed.
 *   - It requests with cache-defeating and identity-encoding headers so
 *     the stored bytes are the origin's, not an edge or transformed copy.
 *   - It captures the filtered `?locales=` variants and the error bodies
 *     as well as the eleven canonical documents. Those are the only
 *     specification the locale filter and the error envelopes will ever
 *     have (plan R4, R10, KTD9).
 *   - It cross-checks the rewrite against the live host while that host
 *     still answers: every changed byte range in a published document
 *     must be an icon URL, and every rewritten icon must resolve to the
 *     same bytes the legacy host served (KTD9).
 *
 * Output layout under `api/legacy/`:
 *
 *   raw/            unmodified capture — the fixtures the conformance
 *                   suite compares against (never served)
 *   raw/variants/   filtered `?locales=` responses
 *   raw/errors/     400 / 500 / 404 envelopes
 *   raw/provenance.json
 *   documents/      published artifact (icon URLs rewritten)
 *   icons/          icon bytes, stored once and keyed by id
 *   manifest.json   per-document sha256 + the per-version icon lists the
 *                   uploader turns into two R2 namespaces
 *
 * `api/legacy/` is deliberately NOT under `api/schemas/`: the deploy
 * workflow enumerates every two-deep directory there as a schema version
 * and runs `schema:build` on it, which hard-fails on frozen JSON (KTD5).
 */

import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const LEGACY_ORIGIN = 'https://dtpr.io'
const LEGACY_BASE = `${LEGACY_ORIGIN}/api/dtpr`

/**
 * Where the frozen surface serves icons from, per version.
 *
 * Absolute, not root-relative. The retired service emitted an absolute
 * URL built from its own `BASE_URL`, and consumers bind `icon` /
 * `icon.url` straight into an `<img src>`. A root-relative value would
 * resolve against the *consumer's* origin instead of ours and 404 —
 * which is the opposite of R7's promise that following the URL in the
 * body needs no extra configuration.
 *
 * The host is fixed rather than derived per request, because these
 * documents are frozen bytes streamed verbatim (KTD1); rewriting them
 * per request would mean re-serialising the largest one on every read.
 * Consequence: the preview deployment serves documents that point at
 * production icons. Those icons are byte-identical to preview's own, so
 * a consumer still resolves correctly; only the host in the string
 * differs.
 */
const PUBLISHED_ORIGIN = 'https://api.dtpr.io'
const ICON_PATH_V0 = `${PUBLISHED_ORIGIN}/api/v0/icons`
const ICON_PATH_V1 = `${PUBLISHED_ORIGIN}/api/v1/icons`

export const V0_LOCALES = ['en', 'fr', 'es', 'pt', 'tl', 'km'] as const
export const DATACHAIN_TYPES = ['ai', 'device'] as const

/** The four v1 endpoints that accept `?locales=`. `/v1/elements` does not — it 500s. */
const TYPED_V1_ENDPOINTS = [
  'v1/elements/ai',
  'v1/elements/device',
  'v1/categories/ai',
  'v1/categories/device',
] as const

/**
 * The `?locales=` shapes the acceptance examples depend on. Each entry is
 * the raw query string appended to a typed endpoint. These are the
 * specification for the ported filter — the legacy parser's quirks
 * (no trimming, no empty-collapse, array branch skips comma-splitting)
 * are only observable here.
 */
const LOCALE_VARIANTS: ReadonlyArray<{ slug: string; query: string }> = [
  { slug: 'en', query: 'locales=en' },
  { slug: 'en-fr', query: 'locales=en,fr' },
  { slug: 'zz', query: 'locales=zz' },
  { slug: 'empty', query: 'locales=' },
  { slug: 'bare', query: 'locales' },
  { slug: 'commas', query: 'locales=,,,' },
  { slug: 'space', query: 'locales=en,%20fr' },
  { slug: 'repeated', query: 'locales=en&locales=fr' },
  { slug: 'upper', query: 'locales=EN' },
]

/** Error responses R4 promises fidelity to. Nothing else preserves their shape. */
const ERROR_CAPTURES: ReadonlyArray<{ slug: string; url: string }> = [
  { slug: 'elements-bad-type-400', url: `${LEGACY_BASE}/v1/elements/bogus` },
  { slug: 'categories-bad-type-400', url: `${LEGACY_BASE}/v1/categories/bogus` },
  { slug: 'elements-filtered-500', url: `${LEGACY_BASE}/v1/elements?locales=en` },
  { slug: 'icon-missing-404', url: `${LEGACY_ORIGIN}/dtpr-icons/__does_not_exist__.svg` },
]

export interface CapturedResponse {
  url: string
  status: number
  contentType: string | null
  body: string
}

/** Fetch bypassing any edge cache and any content-encoding transform. */
async function fetchRaw(url: string): Promise<CapturedResponse> {
  const res = await fetch(url, {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      'Accept-Encoding': 'identity',
    },
    redirect: 'follow',
  })
  return {
    url,
    status: res.status,
    contentType: res.headers.get('content-type'),
    body: await res.text(),
  }
}

function sha256(text: string): string {
  return `sha256-${createHash('sha256').update(text, 'utf8').digest('hex')}`
}

/** Canonical document ids — the eleven URLs the frozen surface must serve. */
export function canonicalTargets(): Array<{ id: string; url: string }> {
  const out: Array<{ id: string; url: string }> = []
  for (const locale of V0_LOCALES) {
    out.push({ id: `v0/${locale}`, url: `${LEGACY_BASE}/v0/${locale}` })
  }
  out.push({ id: 'v1/elements', url: `${LEGACY_BASE}/v1/elements` })
  for (const type of DATACHAIN_TYPES) {
    out.push({ id: `v1/elements/${type}`, url: `${LEGACY_BASE}/v1/elements/${type}` })
    out.push({ id: `v1/categories/${type}`, url: `${LEGACY_BASE}/v1/categories/${type}` })
  }
  return out
}

/**
 * Every distinct legacy icon URL a document body references.
 *
 * Matches the absolute URL form the handlers emit (`${BASE_URL}${icon}`).
 * Deliberately narrow: a host-level string replace would also rewrite the
 * `schema.namespace` identifiers, which must survive untouched.
 */
const ICON_URL_RE = new RegExp(`${LEGACY_ORIGIN}/dtpr-icons/([A-Za-z0-9_-]+)\\.svg`, 'g')

export function iconIdsIn(body: string): Set<string> {
  const ids = new Set<string>()
  for (const m of body.matchAll(ICON_URL_RE)) ids.add(m[1]!)
  return ids
}

/**
 * The rewrite rule. Replaces only the icon-URL prefix, and only for the
 * version that owns the document. `schema.namespace` strings share the
 * `dtpr.io` host but are identifiers, not locators, and are left alone.
 */
export function rewriteIconUrls(body: string, iconPath: string): string {
  return body.replace(ICON_URL_RE, (_m, id: string) => `${iconPath}/${id}.svg`)
}

/**
 * The absolute icon base a version's documents point at. Exported so the
 * uploader, the sub-apps' tests and the conformance suite all read one
 * value — an earlier revision let each side spell it out and they drifted
 * into a root-relative form that resolved against the consumer's origin.
 */
export function iconBaseFor(version: 'v0' | 'v1'): string {
  return version === 'v0' ? ICON_PATH_V0 : ICON_PATH_V1
}

/** Which icon namespace a document's URLs should point at. */
function iconPathFor(documentId: string): string {
  return iconBaseFor(documentId.startsWith('v0/') ? 'v0' : 'v1')
}

/**
 * Assert that a published document differs from its raw capture only
 * inside icon URLs. This is the guard that stops a broadened rewrite from
 * corrupting the 367 `schema.namespace` occurrences (KTD9).
 */
export function assertOnlyIconUrlsChanged(raw: string, published: string, iconPath: string): void {
  const escaped = iconPath.replaceAll('.', '\\.')
  const restored = published.replaceAll(
    new RegExp(`${escaped}/([A-Za-z0-9_-]+)\\.svg`, 'g'),
    (_m, id: string) => `${LEGACY_ORIGIN}/dtpr-icons/${id}.svg`,
  )
  if (restored !== raw) {
    throw new Error(
      'Rewrite changed bytes outside icon URLs — refusing to publish. ' +
        'Reversing the rewrite did not reproduce the raw capture.',
    )
  }
}

async function writeFileEnsuringDir(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, contents, 'utf8')
}

async function captureTwiceAndAgree(url: string, label: string): Promise<CapturedResponse> {
  const first = await fetchRaw(url)
  const second = await fetchRaw(url)
  if (first.body !== second.body || first.status !== second.status) {
    throw new Error(
      `Capture is not deterministic for ${label} (${url}). Two fetches disagreed, ` +
        'so the snapshot is not canonical. Stop and investigate before publishing.',
    )
  }
  return first
}

export async function capture(legacyRoot: string): Promise<void> {
  await rm(legacyRoot, { recursive: true, force: true })

  const rawDir = join(legacyRoot, 'raw')
  const docsDir = join(legacyRoot, 'documents')
  const iconsDir = join(legacyRoot, 'icons')

  const documents: Record<string, { sha256: string; rawSha256: string }> = {}
  const iconIdsByVersion: Record<'v0' | 'v1', Set<string>> = { v0: new Set(), v1: new Set() }

  // ---- canonical documents -------------------------------------------------
  for (const { id, url } of canonicalTargets()) {
    const captured = await captureTwiceAndAgree(url, id)
    if (captured.status !== 200) {
      throw new Error(`Expected 200 for ${id}, got ${captured.status}`)
    }
    await writeFileEnsuringDir(join(rawDir, `${id}.json`), captured.body)

    const version = id.startsWith('v0/') ? 'v0' : 'v1'
    for (const iconId of iconIdsIn(captured.body)) iconIdsByVersion[version].add(iconId)

    const iconPath = iconPathFor(id)
    const published = rewriteIconUrls(captured.body, iconPath)
    assertOnlyIconUrlsChanged(captured.body, published, iconPath)
    await writeFileEnsuringDir(join(docsDir, `${id}.json`), published)

    documents[id] = { sha256: sha256(published), rawSha256: sha256(captured.body) }
    console.log(`captured ${id} (${captured.body.length} bytes)`)
  }

  // ---- filtered variants ---------------------------------------------------
  // U4 writes the locale filter against these; U7 asserts byte-equality.
  for (const endpoint of TYPED_V1_ENDPOINTS) {
    for (const { slug, query } of LOCALE_VARIANTS) {
      const url = `${LEGACY_BASE}/${endpoint}?${query}`
      const captured = await captureTwiceAndAgree(url, `${endpoint}?${slug}`)
      const name = `${endpoint.replaceAll('/', '_')}__${slug}.json`
      await writeFileEnsuringDir(join(rawDir, 'variants', name), captured.body)
    }
    console.log(`captured ${LOCALE_VARIANTS.length} variants for ${endpoint}`)
  }

  // ---- error envelopes -----------------------------------------------------
  const errors: Record<string, { status: number; contentType: string | null }> = {}
  for (const { slug, url } of ERROR_CAPTURES) {
    const captured = await fetchRaw(url)
    await writeFileEnsuringDir(join(rawDir, 'errors', `${slug}.json`), captured.body)
    errors[slug] = { status: captured.status, contentType: captured.contentType }
    console.log(`captured error ${slug} (${captured.status})`)
  }

  // ---- icons ---------------------------------------------------------------
  // Stored once, keyed by id. The uploader fans them out into the two R2
  // namespaces the per-version lists below describe, so R6's isolation holds
  // at the serving layer without 123 duplicate blobs in git.
  const allIconIds = new Set([...iconIdsByVersion.v0, ...iconIdsByVersion.v1])
  const iconHashes: Record<string, string> = {}
  for (const iconId of [...allIconIds].sort()) {
    const url = `${LEGACY_ORIGIN}/dtpr-icons/${iconId}.svg`
    const captured = await fetchRaw(url)
    if (captured.status !== 200) {
      throw new Error(`Icon ${iconId} referenced by a document but returned ${captured.status}`)
    }
    await writeFileEnsuringDir(join(iconsDir, `${iconId}.svg`), captured.body)
    iconHashes[iconId] = sha256(captured.body)
  }
  console.log(`captured ${allIconIds.size} icons (v0: ${iconIdsByVersion.v0.size}, v1: ${iconIdsByVersion.v1.size})`)

  // ---- manifest + provenance ----------------------------------------------
  const manifest = {
    captured_at: new Date().toISOString(),
    source: LEGACY_BASE,
    documents,
    icons: {
      hashes: iconHashes,
      v0: [...iconIdsByVersion.v0].sort(),
      v1: [...iconIdsByVersion.v1].sort(),
    },
    errors,
  }
  await writeFileEnsuringDir(join(legacyRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

  const provenance = {
    captured_at: manifest.captured_at,
    source: LEGACY_BASE,
    note:
      'Captured from the live Nuxt service before shutdown. Every document was fetched ' +
      'twice and both runs agreed. The rewrite was reversed and compared against the raw ' +
      'capture to prove only icon URLs changed.',
    document_count: Object.keys(documents).length,
    variant_count: TYPED_V1_ENDPOINTS.length * LOCALE_VARIANTS.length,
    error_count: ERROR_CAPTURES.length,
    icon_count: allIconIds.size,
  }
  await writeFileEnsuringDir(join(rawDir, 'provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`)

  // ---- live cross-check ----------------------------------------------------
  // The only term in the conformance identity that does not come from the
  // rewrite function itself. Possible now; impossible after shutdown.
  for (const iconId of [...allIconIds].sort()) {
    const stored = await readFile(join(iconsDir, `${iconId}.svg`), 'utf8')
    const live = await fetchRaw(`${LEGACY_ORIGIN}/dtpr-icons/${iconId}.svg`)
    if (live.body !== stored) {
      throw new Error(`Stored icon ${iconId} does not match the live host`)
    }
  }
  console.log('live cross-check passed for every icon')
}

/**
 * Regenerate the published documents and their manifest hashes from the
 * committed raw captures, without touching the network.
 *
 * `capture()` can only ever run once — it reads a service that is being
 * switched off. But the rewrite rule it applies is ordinary code and can
 * be wrong, as it was: the first published artifact carried root-relative
 * icon URLs that resolved against the consumer's origin rather than ours.
 * Fixing that must not require re-reading a host that may already be gone,
 * so the raw captures under `raw/` are the durable input and this is the
 * replay.
 *
 * Icons and their hashes are untouched — the rewrite never altered them.
 */
export async function republish(legacyRoot: string): Promise<void> {
  const rawDir = join(legacyRoot, 'raw')
  const docsDir = join(legacyRoot, 'documents')
  const manifestPath = join(legacyRoot, 'manifest.json')

  const manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as {
    documents: Record<string, { sha256: string; rawSha256: string }>
    [key: string]: unknown
  }

  for (const { id } of canonicalTargets()) {
    const raw = await readFile(join(rawDir, `${id}.json`), 'utf8')

    const entry = manifest.documents[id]
    if (!entry) throw new Error(`Manifest has no entry for ${id}`)
    if (entry.rawSha256 !== sha256(raw)) {
      throw new Error(
        `Raw capture for ${id} does not match its recorded hash — refusing to republish ` +
          'from a capture that has been edited since it was taken.',
      )
    }

    const iconPath = iconPathFor(id)
    const published = rewriteIconUrls(raw, iconPath)
    assertOnlyIconUrlsChanged(raw, published, iconPath)
    await writeFileEnsuringDir(join(docsDir, `${id}.json`), published)

    entry.sha256 = sha256(published)
    console.log(`republished ${id}`)
  }

  await writeFileEnsuringDir(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

const isCli = import.meta.url === `file://${process.argv[1]}`
if (isCli) {
  const root = join(process.cwd(), 'legacy')
  // `--republish` replays the rewrite over the committed captures; the
  // bare form re-reads the live service and can only run while it is up.
  const run = process.argv.includes('--republish') ? republish : capture
  run(root).catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err)
    process.exitCode = 1
  })
}
