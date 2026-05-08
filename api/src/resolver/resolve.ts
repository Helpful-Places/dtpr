import type { Category } from '../schema/category.ts'
import type { DatachainInstance } from '../schema/datachain-instance.ts'
import type { DatachainType } from '../schema/datachain-type.ts'
import type { Element } from '../schema/element.ts'
import type { LocaleCode, LocaleValue } from '../schema/locale.ts'
import type { SchemaManifest } from '../schema/manifest.ts'
import type { ResolvedDatachainInstance, SchemaSnapshot } from '../schema/datachain-instance-resolved.ts'

/**
 * The pinned schema-version slice the resolver reads from. Structurally
 * compatible with the validator's `SchemaVersionSource` (minus the
 * `symbols` map, which the resolver never reads). Defining a dedicated
 * alias keeps the resolver decoupled from validator types and makes the
 * REST/MCP entry points (U5/U6) wire only what resolve needs.
 */
export interface SchemaContext {
  manifest: SchemaManifest
  datachain_type: DatachainType
  categories: Category[]
  elements: Element[]
}

/**
 * Sort `LocaleValue[]` by the locale code's position in
 * `manifest.locales`. Locales not in the manifest fall to the end in
 * their original order (defensive — semantic rule 11 already rejects
 * unlisted locales, but resolve must not crash on a violating input).
 */
function sortLocales<T extends { locale: LocaleCode }>(
  arr: ReadonlyArray<T>,
  manifestLocales: ReadonlyArray<LocaleCode>,
): T[] {
  const order = new Map<string, number>()
  manifestLocales.forEach((l, i) => order.set(l, i))
  const max = manifestLocales.length
  return [...arr].sort((a, b) => {
    const ai = order.has(a.locale) ? (order.get(a.locale) as number) : max
    const bi = order.has(b.locale) ? (order.get(b.locale) as number) : max
    return ai - bi
  })
}

/**
 * Apply `sortLocales` to every `LocaleValue[]` reachable on a Category
 * (name, description, prompt, authoring_guidance, plus context.values
 * and context.name/description if present).
 */
export function normalizeCategoryLocales(cat: Category, locales: ReadonlyArray<LocaleCode>): Category {
  const next: Category = {
    ...cat,
    name: sortLocales<LocaleValue>(cat.name, locales),
    description: sortLocales<LocaleValue>(cat.description, locales),
    prompt: sortLocales<LocaleValue>(cat.prompt, locales),
    authoring_guidance: sortLocales<LocaleValue>(cat.authoring_guidance, locales),
    element_variables: cat.element_variables.map((v) => ({
      ...v,
      label: sortLocales<LocaleValue>(v.label, locales),
    })),
  }
  if (cat.context) {
    next.context = {
      ...cat.context,
      name: sortLocales<LocaleValue>(cat.context.name, locales),
      description: sortLocales<LocaleValue>(cat.context.description, locales),
      values: cat.context.values.map((v) => ({
        ...v,
        name: sortLocales<LocaleValue>(v.name, locales),
        description: sortLocales<LocaleValue>(v.description, locales),
      })),
    }
  }
  return next
}

export function normalizeElementLocales(el: Element, locales: ReadonlyArray<LocaleCode>): Element {
  const next: Element = {
    ...el,
    title: sortLocales<LocaleValue>(el.title, locales),
    description: sortLocales<LocaleValue>(el.description, locales),
    citation: sortLocales<LocaleValue>(el.citation, locales),
    authoring_guidance: sortLocales<LocaleValue>(el.authoring_guidance, locales),
    variables: el.variables.map((v) => ({
      ...v,
      label: sortLocales<LocaleValue>(v.label, locales),
    })),
  }
  if (el.context) {
    next.context = {
      ...el.context,
      name: sortLocales<LocaleValue>(el.context.name, locales),
      description: sortLocales<LocaleValue>(el.context.description, locales),
      values: el.context.values.map((v) => ({
        ...v,
        name: sortLocales<LocaleValue>(v.name, locales),
        description: sortLocales<LocaleValue>(v.description, locales),
      })),
    }
  }
  return next
}

export function normalizeDatachainTypeLocales(
  dt: DatachainType,
  locales: ReadonlyArray<LocaleCode>,
): DatachainType {
  return {
    ...dt,
    name: sortLocales<LocaleValue>(dt.name, locales),
    description: sortLocales<LocaleValue>(dt.description, locales),
    subchains: dt.subchains.map((s) => ({
      ...s,
      name: sortLocales<LocaleValue>(s.name, locales),
    })),
  }
}

/**
 * Pure, deterministic snapshot assembler.
 *
 * Trust contract (R7): the input `instance` is already Zod-parsed and
 * has passed semantic validation. REST/MCP entry points (U5/U6) enforce
 * that ordering — `resolve` itself does not run the validator.
 *
 * Subset rule (R6, mirrors `checkInstance` at
 * `api/src/validator/rules/instance.ts:39-58`): a category is in the
 * snapshot iff at least one placement's element points at it OR the
 * category's `required` flag is `true`. Elements are subset by
 * placement membership only.
 *
 * Sort rule: categories ascending by id, elements ascending by id,
 * locales by manifest order. Object-key ordering happens at
 * `canonicalStringify` time (consumers wanting byte-stable output run
 * the bundle through it).
 *
 * `suggested_elements` is always `[]` (R7); `authoring_provenance` is
 * never set by resolve (it only enters a `ResolvedDatachainInstance` from
 * authoring tools).
 */
export function resolve(thin: DatachainInstance, schema: SchemaContext): ResolvedDatachainInstance {
  const elementById = new Map(schema.elements.map((e) => [e.id, e] as const))

  // Compute referenced ids from placements.
  const referencedElementIds = new Set<string>()
  const referencedCategoryIds = new Set<string>()
  for (const placement of thin.elements) {
    const el = elementById.get(placement.element_id)
    if (!el) {
      // Defensive guard for the programming-error case (R7): callers must
      // run validate first. If we get here something upstream skipped that.
      throw new Error(
        `resolve: instance references unknown element '${placement.element_id}' — caller must run validate before resolve (R7)`,
      )
    }
    referencedElementIds.add(el.id)
    referencedCategoryIds.add(el.category_id)
  }

  // R6: every required category lands in the snapshot, even if no placement
  // covers it (parallel to checkInstance's REQUIRED_CATEGORY_MISSING rule).
  for (const cat of schema.categories) {
    if (cat.required) referencedCategoryIds.add(cat.id)
  }

  const locales = schema.manifest.locales

  // Subset + locale-normalize + sort by id ascending.
  const snapshotCategories: Category[] = schema.categories
    .filter((c) => referencedCategoryIds.has(c.id))
    .map((c) => normalizeCategoryLocales(c, locales))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const snapshotElements: Element[] = schema.elements
    .filter((e) => referencedElementIds.has(e.id))
    .map((e) => normalizeElementLocales(e, locales))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  const snapshot: SchemaSnapshot = {
    datachain_type: normalizeDatachainTypeLocales(schema.datachain_type, locales),
    categories: snapshotCategories,
    elements: snapshotElements,
  }

  // Spread the parsed thin instance verbatim — Zod defaults are already
  // populated, so determinism for elided-default inputs holds. Locale
  // arrays on instance-level fields (title, description) are normalized
  // to manifest order, matching the schema-snapshot policy.
  const resolved: ResolvedDatachainInstance = {
    ...thin,
    title: sortLocales<LocaleValue>(thin.title, locales),
    description: sortLocales<LocaleValue>(thin.description, locales),
    schema_snapshot: snapshot,
    suggested_elements: [],
  }

  return resolved
}
