import { emitAllContentSchemas } from '../../src/schema/emit-json-schema.ts'
import type { Category, ShapeType } from '../../src/schema/category.ts'
import type { DatachainType } from '../../src/schema/datachain-type.ts'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode } from '../../src/schema/locale.ts'
import type { SchemaManifest } from '../../src/schema/manifest.ts'
import type { Variable } from '../../src/schema/variable.ts'
import { composeIcon, type ComposeVariant } from '../../src/icons/compositor.ts'
import type { SchemaVersionSource } from '../../src/validator/types.ts'
import { contentHash } from './content-hash.ts'
import { createHash } from 'node:crypto'
import { buildSearchIndexesByLocale } from './search-index-builder.ts'

/**
 * Variant tokens the compositor treats as reserved. The `icon_variants`
 * list starts with these, then appends every `ContextValue.id` for the
 * element's category (guarded by the RESERVED_VARIANT_TOKEN rule).
 */
const RESERVED_VARIANTS = ['default', 'dark'] as const

/**
 * Emitted element shape. The source `Element` type stays author-facing;
 * at emit time we materialize three build-time fields so agents see a
 * flat view without needing to cross-reference the category.
 */
export interface MaterializedElement extends Element {
  /** Shape primitive inherited from the element's category. */
  shape: ShapeType
  /**
   * Variant keys the pre-bake step emits composed SVGs for:
   * `['default', 'dark', ...category.context?.values.map(v => v.id) ?? []]`.
   */
  icon_variants: string[]
}

export interface EmittedBundle {
  manifest: SchemaManifest
  datachainType: DatachainType
  categories: Category[]
  /** Elements with `variables`, `shape`, and `icon_variants` materialized. */
  elements: MaterializedElement[]
  /** JSON Schema documents keyed by schema name (Element, Category, etc.). */
  schemaJson: Record<string, Record<string, unknown>>
  /** Serialized MiniSearch index per locale. */
  searchIndexesByLocale: Record<LocaleCode, string>
  /** Per-symbol SVG source, keyed by `symbol_id`. */
  symbols: Record<string, string>
  /** Pre-baked composed icons keyed by `"<element_id>/<variant>"`. */
  composedIcons: Record<string, string>
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
 * Resolve the effective context for an element: element-level override
 * takes full precedence over category-level (no merge), per the v2
 * hybrid context model.
 */
function effectiveContext(
  element: Element,
  category: Category | undefined,
): Category['context'] | undefined {
  return element.context ?? category?.context
}

/**
 * Build the list of variant keys for an element given its category.
 * Reserved tokens come first in stable order, followed by context
 * value ids whose colors are non-null (null-color values are tag-style
 * and don't get a baked-in colored icon). Callers should have run the
 * `RESERVED_VARIANT_TOKEN` rule first so collisions are surfaced as
 * errors, not silently dropped.
 */
export function iconVariantsFor(category: Category | undefined): string[] {
  const extras =
    category?.context?.values.filter((v) => v.color !== null).map((v) => v.id) ?? []
  return [...RESERVED_VARIANTS, ...extras]
}

/**
 * Variant list for a fully resolved element — uses the effective
 * context (element override or category default) and skips null-color
 * values (rendered as tags, not colored icons).
 */
function iconVariantsForElement(element: Element, category: Category | undefined): string[] {
  const ctx = effectiveContext(element, category)
  const extras = ctx?.values.filter((v) => v.color !== null).map((v) => v.id) ?? []
  return [...RESERVED_VARIANTS, ...extras]
}

/**
 * Materialize the full `(element + shape + icon_variants + variables)`
 * view ready for emission.
 */
function materializeElement(element: Element, categories: Category[]): MaterializedElement {
  const catById = new Map(categories.map((c) => [c.id, c] as const))
  const cat = catById.get(element.category_id)
  if (!cat) {
    // Validation (category-refs rule) should catch this upstream. If it
    // somehow slips through, fail loudly rather than emit broken JSON.
    throw new Error(
      `materializeElement: element '${element.id}' references unknown category '${element.category_id}'`,
    )
  }
  return {
    ...element,
    variables: materializeVariables(element, categories),
    shape: cat.shape,
    icon_variants: iconVariantsForElement(element, cat),
  }
}

/**
 * Convert a variant token (entry in `icon_variants`) into the
 * `ComposeVariant` discriminated union. The reserved `'default'` and
 * `'dark'` tokens map through directly; any other token is looked up
 * in the element's effective context (element override or category
 * default) and emitted as a colored variant.
 */
function toComposeVariant(
  variant: string,
  element: Element,
  category: Category,
): ComposeVariant {
  if (variant === 'default' || variant === 'dark') return variant
  const ctx = effectiveContext(element, category)
  const hit = ctx?.values.find((v) => v.id === variant)
  if (!hit) {
    // Guarded by iconVariantsForElement + RESERVED_VARIANT_TOKEN rule;
    // hitting this means someone passed a hand-built variant list.
    throw new Error(
      `toComposeVariant: variant '${variant}' not found in element '${element.id}' effective context`,
    )
  }
  if (hit.color === null) {
    // Null-color values are tag-style and should be skipped before
    // reaching the compositor. Filter at iconVariantsForElement; if we
    // get here someone bypassed it.
    throw new Error(
      `toComposeVariant: variant '${variant}' on element '${element.id}' has null color (tag-style; not composable)`,
    )
  }
  return { kind: 'colored', color: hit.color }
}

/**
 * Compose every `(element × variant)` SVG. Returned map is keyed by
 * `"<element_id>/<variant>"` — the same path used to write pre-baked
 * icons to disk. Identical inputs produce byte-identical output.
 */
export function bundleComposedIcons(
  source: SchemaVersionSource,
  elements: MaterializedElement[],
): Record<string, string> {
  const catById = new Map(source.categories.map((c) => [c.id, c] as const))
  const composed: Record<string, string> = {}
  for (const el of elements) {
    const cat = catById.get(el.category_id)
    if (!cat) {
      // Validation should catch this; if not, fail loudly.
      throw new Error(
        `bundleComposedIcons: element '${el.id}' references unknown category '${el.category_id}'`,
      )
    }
    const symbolSvg = source.symbols[el.symbol_id]
    if (symbolSvg === undefined) {
      throw new Error(
        `bundleComposedIcons: element '${el.id}' references unknown symbol '${el.symbol_id}'`,
      )
    }
    for (const variant of el.icon_variants) {
      const key = `${el.id}/${variant}`
      composed[key] = composeIcon({
        shape: el.shape,
        symbolSvg,
        variant: toComposeVariant(variant, el, cat),
      })
    }
  }
  return composed
}

/**
 * Sha256 hex digest of a UTF-8 string — used for per-symbol and
 * per-composed-icon hashes in the content-hash payload.
 */
function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

/**
 * Build the in-memory emitted bundle from a parsed schema version.
 * Computes the content hash over the canonicalized bundle — including
 * per-symbol and per-composed-icon hashes — and stamps it back onto
 * the manifest.
 */
export function buildBundle(source: SchemaVersionSource): EmittedBundle {
  const materializedElements: MaterializedElement[] = source.elements.map((el) =>
    materializeElement(el, source.categories),
  )

  const composedIcons = bundleComposedIcons(source, materializedElements)

  const schemaJson = emitAllContentSchemas()
  const searchIndexesByLocale = buildSearchIndexesByLocale(
    materializedElements,
    source.manifest.locales,
  )

  // Per-symbol hashes (sorted by id). Editing a symbol SVG without any
  // YAML change should still bump `content_hash`.
  const symbolHashes: Record<string, string> = {}
  for (const id of Object.keys(source.symbols).sort()) {
    symbolHashes[id] = sha256Hex(source.symbols[id]!)
  }

  // Per-composed-icon hashes (sorted by key). Changing a context color
  // or the compositor algorithm should bump `content_hash`.
  const composedIconHashes: Record<string, string> = {}
  for (const key of Object.keys(composedIcons).sort()) {
    composedIconHashes[key.replace('/', '__')] = sha256Hex(composedIcons[key]!)
  }

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
    symbolHashes,
    composedIconHashes,
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
    symbols: source.symbols,
    composedIcons,
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
  // Copy symbol SVGs verbatim into the emitted tree so a release bundle
  // is self-contained (no need to reach back into `schemas/` at serve
  // time).
  for (const [id, svg] of Object.entries(bundle.symbols)) {
    files[`symbols/${id}.svg`] = svg
  }
  // Pre-baked composed icons, one per `(element × variant)` pair.
  for (const [key, svg] of Object.entries(bundle.composedIcons)) {
    files[`icons/${key}.svg`] = svg
  }
  return files
}
