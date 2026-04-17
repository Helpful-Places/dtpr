import { emitAllContentSchemas } from '../../src/schema/emit-json-schema.ts'
import type { Category } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode } from '../../src/schema/locale.ts'
import type { SchemaManifest } from '../../src/schema/manifest.ts'
import type { Variable } from '../../src/schema/variable.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'
import { contentHash } from './content-hash.ts'
import { buildSearchIndexesByLocale } from './search-index-builder.ts'

export interface EmittedBundle {
  manifest: SchemaManifest
  datachainType: DatachainType
  categories: Category[]
  /** Elements with inherited `variables` materialized onto each entry. */
  elements: Element[]
  /** JSON Schema documents keyed by schema name (Element, Category, etc.). */
  schemaJson: Record<string, Record<string, unknown>>
  /** Serialized MiniSearch index per locale. */
  searchIndexesByLocale: Record<LocaleCode, string>
  /** Size in bytes of the largest emitted artifact's JSON representation. */
  approximateBundleBytes: number
}

/**
 * Merge element_variables from the element's category. First-seen wins
 * when an element author duplicates an id already declared on the
 * category.
 */
export function materializeVariables(element: Element, categories: Category[]): Variable[] {
  const byId = new Map<string, Variable>(element.variables.map((v) => [v.id, v] as const))
  const catById = new Map(categories.map((c) => [c.id, c] as const))
  const cat = catById.get(element.category_id)
  if (cat) {
    for (const v of cat.element_variables) {
      if (!byId.has(v.id)) byId.set(v.id, v)
    }
  }
  return [...byId.values()]
}

/**
 * Build the in-memory emitted bundle from a parsed schema version.
 * Computes the content hash over the canonicalized bundle and stamps
 * it back onto the manifest.
 */
export function buildBundle(source: SchemaVersionSource): EmittedBundle {
  // Materialize variables from categories onto elements.
  const materializedElements: Element[] = source.elements.map((el) => ({
    ...el,
    variables: materializeVariables(el, source.categories),
  }))

  const schemaJson = emitAllContentSchemas()
  const searchIndexesByLocale = buildSearchIndexesByLocale(
    materializedElements,
    source.manifest.locales,
  )

  // Compute the content hash over the canonicalized data (hash excludes
  // itself — we replace content_hash in the manifest with a sentinel
  // value before hashing, then stamp the real hash on after).
  const manifestForHash: SchemaManifest = {
    ...source.manifest,
    content_hash: `sha256-${'0'.repeat(64)}`,
  }
  const payloadForHash = {
    manifest: manifestForHash,
    datachainType: source.datachainType,
    categories: source.categories,
    elements: materializedElements,
    schemaJson,
    searchIndexesByLocale,
  }
  const hash = contentHash(payloadForHash)
  const manifest: SchemaManifest = { ...source.manifest, content_hash: hash }

  // Rough size signal (per-file; the largest tends to be elements.json
  // or the search index). The Worker bundle ceiling concerns are
  // addressed at deploy time by `wrangler deploy --dry-run` reporting.
  const elementsBytes = JSON.stringify(materializedElements).length
  const searchBytes = Object.values(searchIndexesByLocale).reduce((n, s) => n + s.length, 0)
  const approximateBundleBytes = elementsBytes + searchBytes

  return {
    manifest,
    datachainType: source.datachainType,
    categories: source.categories,
    elements: materializedElements,
    schemaJson,
    searchIndexesByLocale,
    approximateBundleBytes,
  }
}

/**
 * Map a bundle to a flat `{ path: content }` map ready for fs write
 * or R2 upload. Keys are relative to the version directory.
 */
export function bundleToFiles(bundle: EmittedBundle): Record<string, string> {
  const files: Record<string, string> = {
    'manifest.json': JSON.stringify(bundle.manifest, null, 2),
    'datachain-type.json': JSON.stringify(bundle.datachainType, null, 2),
    'categories.json': JSON.stringify(bundle.categories, null, 2),
    'elements.json': JSON.stringify(bundle.elements, null, 2),
    'schema.json': JSON.stringify(bundle.schemaJson, null, 2),
  }
  for (const el of bundle.elements) {
    files[`elements/${el.id}.json`] = JSON.stringify(el, null, 2)
  }
  for (const [locale, serialized] of Object.entries(bundle.searchIndexesByLocale)) {
    files[`search-index.${locale}.json`] = serialized
  }
  return files
}
