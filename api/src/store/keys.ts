import type { LocaleCode } from '../schema/locale.ts'
import type { ParsedVersion } from '../../cli/lib/version-parser.ts'

/**
 * Object key conventions in R2. Mirrors the layout written by
 * `api/scripts/r2-upload.ts`. Every helper here returns an R2 key
 * (no leading slash). The single source of truth so the upload
 * script and Worker reads stay in lockstep.
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
