/**
 * Shared access to the frozen legacy capture under `api/legacy/`.
 *
 * The worker test pool has no filesystem, so fixtures can only reach a
 * test by being inlined at bundle time. This module does that once, as
 * eager `?raw` globs, and every consuming suite imports from here
 * rather than inventing its own path (KTD11).
 *
 * Everything is exposed as **text**, never as parsed JSON. The whole
 * point of the capture is byte fidelity: `JSON.parse` + `stringify`
 * would silently reformat, and the conformance assertions would then
 * be comparing a normalisation of the bytes against itself. Callers
 * that want objects parse explicitly, at their own risk.
 *
 * Ids match `api/legacy/manifest.json` exactly — `v0/en`,
 * `v1/elements`, `v1/elements/ai`, `v1/categories/device` — so a test
 * can walk the manifest and look up each document by the same string.
 */

import type { LegacyVersion } from '../../src/store/keys.ts'

// The manifest arrives as a single raw import rather than through the
// globs below: it is the index the globs are checked against, so it
// must be reachable by name, and it is the one file here we do parse.
import legacyManifestRaw from '../../legacy/manifest.json?raw'

// Vite resolves these at transform time, so both arguments have to be
// literals — the options object cannot be hoisted into a shared const,
// which is why it repeats.

// Published artifact: icon URLs already rewritten. This is what the
// Worker serves, so it is what U6 uploads and U7 compares against.
const documentModules = import.meta.glob('../../legacy/documents/**/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// Pre-rewrite capture plus the filtered variants, error bodies and
// provenance. One glob, partitioned below, because a single tree walk
// is easier to keep in step with the directory than four
// near-identical patterns.
const rawModules = import.meta.glob('../../legacy/raw/**/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
})

// 148 icons stored once by id. The per-version fan-out to 271 R2
// objects is driven by `legacyManifest.icons.v0` / `.v1`, not by the
// file listing — the two majors share 123 of these ids.
const iconModules = import.meta.glob('../../legacy/icons/*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/**
 * Re-key a glob result by the identity we want, keyed off a path
 * marker rather than the literal glob prefix. Vite's key normalisation
 * (relative vs. root-absolute) is not something worth depending on,
 * and `indexOf` survives either.
 */
function keyBy(
  modules: Record<string, string>,
  marker: string,
  suffix: string,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [path, text] of Object.entries(modules)) {
    const at = path.indexOf(marker)
    if (at === -1) continue
    out[path.slice(at + marker.length, path.length - suffix.length)] = text
  }
  return out
}

/** Shape of `api/legacy/manifest.json`, as U1 emits it. */
export interface LegacyManifest {
  captured_at: string
  source: string
  /** Keyed by document id: `v0/en`, `v1/elements/ai`, … */
  documents: Record<string, { sha256: string; rawSha256: string }>
  icons: {
    /** sha256 per icon id, across both majors. */
    hashes: Record<string, string>
    /** The 123 icon ids v0 references. */
    v0: string[]
    /** The 148 icon ids v1 references. */
    v1: string[]
  }
  errors: Record<string, { status: number; contentType: string }>
}

export const legacyManifest: LegacyManifest = JSON.parse(legacyManifestRaw) as LegacyManifest

/** Published documents by id (`v0/en`, `v1/elements/ai`, …). */
export const legacyDocuments: Readonly<Record<string, string>> = keyBy(
  documentModules,
  '/legacy/documents/',
  '.json',
)

/** Pre-rewrite captures, under the same ids as {@link legacyDocuments}. */
export const legacyRawDocuments: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(keyBy(rawModules, '/legacy/raw/', '.json')).filter(([id]) =>
    id.startsWith('v0/') || id.startsWith('v1/'),
  ),
)

/**
 * Filtered `?locales=…` captures, keyed as
 * `v1_<route>_<type>__<case>` (e.g. `v1_elements_ai__en-fr`). These are
 * the specification for the locale filter, not merely a regression net.
 */
export const legacyVariants: Readonly<Record<string, string>> = keyBy(
  rawModules,
  '/legacy/raw/variants/',
  '.json',
)

/**
 * The nine `?locales=` shapes U1 captured: the exact query string it
 * sent, and the `<case>` slug the resulting variant is keyed under.
 *
 * Kept as literal query text rather than built from an object because
 * two of them — the bare parameter and the encoded space — cannot
 * survive a `URLSearchParams` round trip.
 */
export const LEGACY_LOCALE_VARIANTS = [
  { slug: 'en', query: '?locales=en' },
  { slug: 'en-fr', query: '?locales=en,fr' },
  { slug: 'zz', query: '?locales=zz' },
  { slug: 'empty', query: '?locales=' },
  { slug: 'bare', query: '?locales' },
  { slug: 'commas', query: '?locales=,,,' },
  { slug: 'space', query: '?locales=en,%20fr' },
  { slug: 'repeated', query: '?locales=en&locales=fr' },
  { slug: 'upper', query: '?locales=EN' },
] as const

/** Captured error bodies, keyed as `<route>-<case>-<status>`. */
export const legacyErrorBodies: Readonly<Record<string, string>> = keyBy(
  rawModules,
  '/legacy/raw/errors/',
  '.json',
)

/** Capture provenance: timestamp, source host, counts. */
export const legacyProvenance: string = required(
  keyBy(rawModules, '/legacy/raw/', '.json'),
  'provenance',
  'provenance record',
)

/** Icon SVGs by id, stored once regardless of how many majors use them. */
export const legacyIcons: Readonly<Record<string, string>> = keyBy(
  iconModules,
  '/legacy/icons/',
  '.svg',
)

function required(
  bag: Readonly<Record<string, string>>,
  id: string,
  what: string,
): string {
  const text = bag[id]
  if (text === undefined) {
    // Fail with the available ids rather than `undefined` leaking into
    // an assertion: a typo'd id and a genuinely absent capture look
    // identical downstream otherwise.
    throw new Error(
      `No legacy ${what} fixture for "${id}". Available: ${Object.keys(bag).sort().join(', ')}`,
    )
  }
  return text
}

/** Published bytes for one document id. Throws on an unknown id. */
export function legacyDocument(id: string): string {
  return required(legacyDocuments, id, 'document')
}

/** Pre-rewrite bytes for one document id. Throws on an unknown id. */
export function legacyRawDocument(id: string): string {
  return required(legacyRawDocuments, id, 'raw document')
}

/** Bytes of one captured `?locales=…` variant. Throws on an unknown id. */
export function legacyVariant(id: string): string {
  return required(legacyVariants, id, 'variant')
}

/** Bytes of one captured error body. Throws on an unknown id. */
export function legacyErrorBody(id: string): string {
  return required(legacyErrorBodies, id, 'error body')
}

/** SVG bytes for one icon id. Throws on an unknown id. */
export function legacyIcon(id: string): string {
  return required(legacyIcons, id, 'icon')
}

/** Canonical document ids, in the order U1 captured them. */
export const LEGACY_DOCUMENT_IDS: readonly string[] = Object.keys(legacyManifest.documents)

/**
 * The icon ids one major references. This is the fan-out list: the two
 * arrays overlap by 123 ids, and each id is stored under both prefixes
 * so either major can be retired independently.
 */
export function legacyIconIds(version: LegacyVersion): readonly string[] {
  return legacyManifest.icons[version]
}
