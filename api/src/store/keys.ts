import type { LocaleCode } from '../schema/locale.ts'
import type { ParsedVersion } from '../../cli/lib/version-parser.ts'

/**
 * Object key conventions in R2. Mirrors the layout written by the
 * upload scripts — `api/scripts/r2-upload.ts` for the versioned
 * `schemas/` tree, `api/scripts/r2-upload-legacy.ts` for the frozen
 * `legacy/` tree. Every helper here returns an R2 key (no leading
 * slash). The single source of truth so the upload scripts and Worker
 * reads stay in lockstep.
 *
 * Two families live here and they are parameterised differently:
 *  - `schemas/…` keys take a `ParsedVersion`, because that content is
 *    versioned, promotable, and mutable while in beta.
 *  - `legacy/…` keys take no version object at all. The legacy
 *    snapshot is a frozen capture of the retired `dtpr.io` service; it
 *    has a major (`v0`/`v1`) and nothing else to parse. See the
 *    invalidation caveat on the legacy builders below.
 */

export const INDEX_KEY = 'schemas/index.json'

export function manifestKey(version: ParsedVersion): string {
  return `schemas/${version.dir}/manifest.json`
}

export function datachainTypeKey(version: ParsedVersion): string {
  return `schemas/${version.dir}/datachain-type.json`
}

export function categoriesKey(version: ParsedVersion): string {
  return `schemas/${version.dir}/categories.json`
}

export function elementsKey(version: ParsedVersion): string {
  return `schemas/${version.dir}/elements.json`
}

export function elementKey(version: ParsedVersion, elementId: string): string {
  return `schemas/${version.dir}/elements/${elementId}.json`
}

export function searchIndexKey(version: ParsedVersion, locale: LocaleCode): string {
  return `schemas/${version.dir}/search-index.${locale}.json`
}

export function schemaJsonKey(version: ParsedVersion): string {
  return `schemas/${version.dir}/schema.json`
}

export function symbolKey(version: ParsedVersion, symbolId: string): string {
  return `schemas/${version.dir}/symbols/${symbolId}.svg`
}

export function composedIconKey(
  version: ParsedVersion,
  elementId: string,
  variant: string,
): string {
  return `schemas/${version.dir}/icons/${elementId}/${variant}.svg`
}

/* ------------------------------------------------------------------ *
 * Legacy snapshot keys
 * ------------------------------------------------------------------ */

/**
 * The two frozen majors of the retired `dtpr.io` API. Not a
 * `ParsedVersion`: there is no date, no beta channel, and no promotion
 * path — the content was captured once and will not change again.
 */
export const LEGACY_VERSIONS = ['v0', 'v1'] as const
export type LegacyVersion = (typeof LEGACY_VERSIONS)[number]

/**
 * Cache-invalidation caveat, applying to every builder below.
 *
 * `cache-wrapper.ts` gets its invalidation for free from the version
 * directory embedded in the key: promoting `<type>/<date>-beta/` to
 * `<type>/<date>/` produces a different cache URL, so the old entry is
 * simply never asked for again. Legacy keys have no such segment. If a
 * legacy object is ever overwritten in place, edge caches keep serving
 * the previous bytes for up to the stable TTL (24h) and there is no key
 * change to shake them loose.
 *
 * This is accepted rather than solved because the snapshot is frozen by
 * design (see the plan's "freeze the captured bytes" decision). Should
 * a correction ever be needed, it must be published by purging the
 * cache explicitly or by renaming the `legacy/` prefix — not by a
 * silent overwrite.
 */

/**
 * Key for one captured legacy document.
 *
 * `documentPath` is the document's identity within its major, exactly
 * as `api/legacy/manifest.json` records it minus the leading major:
 * `en` for v0, and `elements`, `elements/ai` or `categories/device`
 * for v1. Mirrors the on-disk layout under `api/legacy/documents/` so
 * the uploader is a straight directory walk.
 *
 * No validation happens here — `elementKey` doesn't validate either.
 * Route handlers check the segment against an allowlist *before*
 * building a key (KTD7), which is also what keeps traversal out.
 */
export function legacyDocumentKey(version: LegacyVersion, documentPath: string): string {
  return `legacy/documents/${version}/${documentPath}.json`
}

/**
 * Key for one captured legacy icon.
 *
 * Each major gets its own icon namespace — v0's 123 ids under `v0/`,
 * v1's 148 under `v1/` — so the 123 ids they share are stored twice.
 * That is deliberate: it buys the ability to drop v0 wholesale later
 * without auditing which of its icons v1 still references. The
 * alternative, one shared namespace holding 148 objects, was rejected
 * because 123 duplicated SVGs are cheaper than that coupling.
 *
 * Note this makes the id space asymmetric: a v1-only icon id under
 * `v0/` is a genuine 404, not a lookup bug.
 */
export function legacyIconKey(version: LegacyVersion, iconId: string): string {
  return `legacy/icons/${version}/${iconId}.svg`
}
