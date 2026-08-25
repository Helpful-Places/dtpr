/**
 * The retired `dtpr.io` v1 `?locales=` parser and filter, ported.
 *
 * Source: `app/server/api/dtpr/v1/utils.ts` plus the two typed
 * handlers, `elements/[datachain_type].ts` and
 * `categories/[datachain_type].ts`. The port is behavioural, not
 * textual — the legacy code was `any`-typed and assembled its
 * documents from a content query, while this one reads a frozen
 * document out of R2 — but every observable quirk is preserved, and
 * the 36 captured variants under `api/legacy/raw/variants/` are the
 * assertion that says so.
 *
 * Two rules govern everything here:
 *
 *  1. **The capture is the specification.** Not this file, not the
 *     legacy source, and certainly not what a sensible locale filter
 *     would do. Where the two disagree the capture wins, because it is
 *     what consumers parse today.
 *  2. **Nothing is repaired.** `?locales=EN` emptying every array is
 *     the contract. So is `?locales=,,,`. So is the unguarded
 *     `variable.label` access below, which is the whole reason
 *     `/api/v1/elements` answers 500 (R10).
 *
 * Deliberately not reused: `parseLocalesParam` and `deepFilterLocales`
 * from `./responses.ts` (KTD2). The house parser trims whitespace and
 * collapses an all-empty list to "no filter"; the legacy parser does
 * neither. The house filter happens to agree with this one on the
 * captured documents, but it is typed against the v2 `LocaleCode`
 * union and free to change with the v2 surface — and this surface is
 * frozen. Sharing them would make a v2 refactor able to silently
 * rewrite bytes that are supposed to be immutable.
 */

/* ------------------------------------------------------------------ *
 * Document shapes
 *
 * These describe the five captured v1 documents exactly, which is
 * possible because they will never change again. `JSON.parse` returns
 * `unknown` and is asserted into them; the assertion is checked by the
 * byte-equality tests rather than at runtime, since a runtime
 * validator here could only fail on documents that are already frozen
 * and already known to conform.
 *
 * Exported so `test/unit/legacy-locales.test.ts` can read a filtered
 * document back without re-declaring the same shapes.
 * ------------------------------------------------------------------ */

export interface LegacyLocaleValue {
  locale: string
  value: string
}

export interface LegacyVariable {
  id: string
  label: LegacyLocaleValue[]
  required: boolean
}

export interface LegacyContextValue {
  id: string
  name: LegacyLocaleValue[]
  description: LegacyLocaleValue[]
  color: string
}

export interface LegacyContext {
  id: string
  name: LegacyLocaleValue[]
  description: LegacyLocaleValue[]
  values: LegacyContextValue[]
}

export interface LegacySchemaMetadata {
  name: string
  id: string
  version: string
  namespace: string
}

export interface LegacyElementRecord {
  schema: LegacySchemaMetadata
  element: {
    id: string
    category_ids: string[]
    version: string
    icon: { url: string; alt_text: LegacyLocaleValue[]; format: string }
    title: LegacyLocaleValue[]
    description: LegacyLocaleValue[]
    citation: LegacyLocaleValue[]
    variables: LegacyVariable[]
  }
}

export interface LegacyCategoryRecord {
  schema: LegacySchemaMetadata
  category: {
    id: string
    order: number | null
    required: boolean
    name: LegacyLocaleValue[]
    description: LegacyLocaleValue[]
    prompt: LegacyLocaleValue[]
    version: string
    element_variables: LegacyVariable[]
    context?: LegacyContext
  }
}

/* ------------------------------------------------------------------ *
 * The parser
 * ------------------------------------------------------------------ */

/**
 * The legacy `parseLocalesQuery`, reading **all** repeated values.
 *
 * ```js
 * if (!query.locales) return null
 * return Array.isArray(query.locales)
 *   ? query.locales
 *   : query.locales.toString().split(',')
 * ```
 *
 * `values` is what `c.req.queries('locales')` returns — `undefined`
 * when the parameter is absent, otherwise every occurrence in order.
 * `c.req.query()` would be wrong: it yields only the first, and
 * `?locales=en&locales=fr` must apply both (KTD2).
 *
 * Reconstructing h3's `getQuery` shape is the first step, because the
 * two branches below fork on it: one occurrence arrives as a string
 * and gets comma-split, several arrive as an array and do not. That is
 * why `?locales=en,fr` and `?locales=en&locales=fr` agree while
 * `?locales=en,fr&locales=km` keeps a literal `"en,fr"` entry.
 *
 * Three results, and the difference between the last two is the whole
 * of KTD2:
 *   - `null` — no parameter, or a single empty value (`?locales=`,
 *     bare `?locales`). The caller streams the full stored body.
 *   - a non-empty list — the filter runs.
 *   - a list of empty strings (`?locales=,,,`) — also non-empty, so
 *     the filter runs and matches nothing, emptying every locale
 *     array. An empty *string* is falsy; a list containing empty
 *     strings is not.
 */
export function parseLegacyLocalesQuery(values: string[] | undefined): string[] | null {
  // h3 collapses a single occurrence to a bare string; Hono never
  // does. Reproduce the collapse so the branch below forks the same
  // way the legacy handler's did.
  const locales: string | string[] | undefined =
    values === undefined ? undefined : values.length === 1 ? values[0] : values

  if (!locales) return null

  return Array.isArray(locales) ? locales : locales.split(',')
}

/**
 * Whether a parsed value actually filters anything.
 *
 * The legacy handlers each guarded their filter block with
 * `if (requestedLocales && requestedLocales.length > 0)`, so a `null`
 * *or* an empty list means "serve the assembled body untouched". The
 * distinction matters beyond the typed routes: this predicate is also
 * what decides whether `/api/v1/elements` answers 500 (R10).
 *
 * Written as a type guard so the filter call site needs no cast — the
 * one place a cast would be easy to widen by accident.
 */
export function hasEffectiveLocalesFilter(
  requestedLocales: string[] | null,
): requestedLocales is string[] {
  return requestedLocales !== null && requestedLocales.length > 0
}

/* ------------------------------------------------------------------ *
 * The filter
 * ------------------------------------------------------------------ */

/**
 * The legacy `filterLocaleValues`. Case-sensitive membership against
 * the requested locales, with no normalisation of either side.
 * `?locales=EN` therefore matches nothing, and `?locales=en,%20fr`
 * matches `en` but not `fr`, because the second entry is `" fr"`.
 *
 * The legacy source scanned an array with `includes`. This takes a
 * `Set` built once per request instead: `?locales=` is uncapped, so a
 * per-field linear scan is the one place a pathological query could
 * burn the Worker's CPU budget. Membership is order- and
 * duplicate-invariant and the equality is the same strict string
 * compare, so the output is byte-identical either way.
 *
 * The legacy `!requestedLocales` half of the guard is absorbed by the
 * parameter type here; the empty-collection half is kept because
 * callers below rely on it.
 */
function filterLocaleValues(
  values: LegacyLocaleValue[],
  requestedLocales: ReadonlySet<string>,
): LegacyLocaleValue[] {
  if (requestedLocales.size === 0) return values
  return values.filter((item) => requestedLocales.has(item.locale))
}

/**
 * The legacy `filterVariablesByLocale`.
 *
 * `variable.label` is dereferenced without a guard, and that is
 * deliberate. The untyped `/api/v1/elements` handler hardcoded
 * `variables: [{ id, type, required, default }]` — no `label` key —
 * and this line is where its 500 came from (R10). Adding `?? []` here
 * would repair a defect the frozen surface is required to preserve, so
 * the guard lives in `legacy-v1.ts` instead, as an early return that
 * never lets the untyped document reach this function.
 */
function filterVariablesByLocale(
  variables: LegacyVariable[],
  requestedLocales: ReadonlySet<string>,
): LegacyVariable[] {
  if (requestedLocales.size === 0) return variables
  return variables.map((variable) => ({
    ...variable,
    label: filterLocaleValues(variable.label, requestedLocales),
  }))
}

/**
 * The legacy `filterContextByLocale`. Exactly one captured category —
 * `ai__decision` — carries a `context` block, which is why its
 * handling is easy to lose and worth naming.
 *
 * Rebuilding the object rather than spreading it is the legacy shape,
 * and it is safe only because `finalizeContext` emitted these four
 * keys in this order. Reordering them here would change the bytes.
 */
function filterContextByLocale(
  context: LegacyContext,
  requestedLocales: ReadonlySet<string>,
): LegacyContext {
  return {
    id: context.id,
    name: filterLocaleValues(context.name, requestedLocales),
    description: filterLocaleValues(context.description, requestedLocales),
    values: context.values.map((value) => ({
      ...value,
      name: filterLocaleValues(value.name, requestedLocales),
      description: filterLocaleValues(value.description, requestedLocales),
    })),
  }
}

/**
 * Re-serialise with `JSON.stringify`'s default separators — no spaces,
 * no indentation. Verified against the captured variants: this
 * reproduces the live bytes exactly, so the only transformation a
 * filtered response undergoes is the removal of locale entries.
 *
 * Key order survives because every filter below spreads the original
 * object and then reassigns existing keys, which leaves insertion
 * order alone, and because `JSON.stringify` follows insertion order
 * for string keys.
 */
function serialise(records: unknown): string {
  return JSON.stringify(records)
}

/**
 * Filter a stored `/api/v1/elements/{ai,device}` document.
 *
 * Filters exactly the five arrays the legacy element handler filtered
 * — `title`, `description`, `icon.alt_text`, `citation` and each
 * variable's `label` — and touches nothing else. `schema`,
 * `category_ids`, `version`, `icon.url`, `icon.format` and each
 * variable's `id`/`required` pass through untouched, and no record is
 * ever dropped (R3): a locale the content lacks leaves the record in
 * place with empty arrays.
 *
 * The `citation.length > 0` check mirrors the legacy source. It is a
 * no-op — filtering an empty array yields an empty array — and is kept
 * only so this reads as the same code.
 */
export function filterLegacyElementsDocument(
  document: string,
  requestedLocales: string[],
): string {
  const records = JSON.parse(document) as LegacyElementRecord[]
  // One Set per request rather than a linear scan per locale-bearing
  // field: `?locales=` is uncapped, so `requestedLocales` is
  // attacker-sized. Membership is order- and duplicate-invariant, so
  // this is byte-identical to the legacy array scan.
  const requested = new Set(requestedLocales)

  return serialise(
    records.map((record) => {
      const element = { ...record.element }
      element.title = filterLocaleValues(record.element.title, requested)
      element.description = filterLocaleValues(record.element.description, requested)
      element.icon = {
        ...record.element.icon,
        alt_text: filterLocaleValues(record.element.icon.alt_text, requested),
      }
      if (record.element.citation && record.element.citation.length > 0) {
        element.citation = filterLocaleValues(record.element.citation, requested)
      }
      element.variables = filterVariablesByLocale(record.element.variables, requested)
      return { ...record, element }
    }),
  )
}

/**
 * Filter a stored `/api/v1/categories/{ai,device}` document.
 *
 * Same contract as the elements filter, over `name`, `description`,
 * `prompt`, each element variable's `label`, and the optional
 * `context` block's own locale arrays.
 *
 * The legacy handler re-sorted by `category.order` after filtering.
 * That sort is not repeated here: it is a pure function of `order`,
 * which no filter touches, and the stored document is already its
 * output. Repeating it would be a second chance to get the ordering
 * wrong for no gain — and the captured variants would catch it either
 * way.
 */
export function filterLegacyCategoriesDocument(
  document: string,
  requestedLocales: string[],
): string {
  const records = JSON.parse(document) as LegacyCategoryRecord[]
  // Same reasoning as the elements filter above.
  const requested = new Set(requestedLocales)

  return serialise(
    records.map((record) => {
      const category = { ...record.category }
      category.name = filterLocaleValues(record.category.name, requested)
      category.description = filterLocaleValues(record.category.description, requested)
      if (record.category.prompt && record.category.prompt.length > 0) {
        category.prompt = filterLocaleValues(record.category.prompt, requested)
      }
      if (record.category.element_variables && record.category.element_variables.length > 0) {
        category.element_variables = filterVariablesByLocale(
          record.category.element_variables,
          requested,
        )
      }
      if (record.category.context) {
        category.context = filterContextByLocale(record.category.context, requested)
      }
      return { ...record, category }
    }),
  )
}

/**
 * The signature the two filters share, so `legacy-v1.ts` can register
 * its typed routes from one helper instead of two near-identical
 * handlers.
 */
export type LegacyV1DocumentFilter = (document: string, requestedLocales: string[]) => string
