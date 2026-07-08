// Vendored from apps/guide-app/app/utils/dtpr.ts so the deck has the same
// ResolvedDatachainInstance helpers without pulling in Nuxt-only imports.
// Also folds in the two `useDtprLocale` helpers (getLocalizedValue,
// interpolateVariables) as plain functions parameterised by locale.

export interface DtprLocalizedContent {
  locale: string
  value: string
}

export interface DtprVariableDefinition {
  id: string
  label: DtprLocalizedContent[]
  required?: boolean
}

export interface DtprVariableValue {
  id: string
  value: DtprLocalizedContent[]
}

export interface DtprElementInstance {
  element_id: string
  priority?: number
  context_type_id?: string
  variables?: DtprVariableValue[]
}

export interface DtprSchemaSnapshotElement {
  id: string
  category_id: string
  title: DtprLocalizedContent[]
  description: DtprLocalizedContent[]
  variables?: DtprVariableDefinition[]
}

export interface DtprElementContextValue {
  id: string
  name: DtprLocalizedContent[]
  description?: DtprLocalizedContent[]
  color?: string | null
}

export interface DtprElementContext {
  id: string
  name?: DtprLocalizedContent[]
  description?: DtprLocalizedContent[]
  values: DtprElementContextValue[]
}

export interface DtprSchemaSnapshotCategory {
  id: string
  name: DtprLocalizedContent[]
  description?: DtprLocalizedContent[]
  order?: number
  element_context?: DtprElementContext
}

export interface DtprSchemaSnapshotDatachainType {
  id: string
  name: DtprLocalizedContent[]
  categories: string[]
}

export interface DtprSchemaSnapshot {
  datachain_type?: DtprSchemaSnapshotDatachainType
  categories: DtprSchemaSnapshotCategory[]
  elements: DtprSchemaSnapshotElement[]
}

export interface ResolvedDatachainInstance {
  id: string
  schema_version: string
  schema_snapshot?: DtprSchemaSnapshot
  elements: DtprElementInstance[]
  title?: DtprLocalizedContent[]
  description?: DtprLocalizedContent[]
}

export const getLocalizedValue = (
  items: DtprLocalizedContent[] | undefined,
  locale: string,
  fallbackLocale = 'en',
): string => {
  if (!items || items.length === 0) return ''
  return (
    items.find((i) => i.locale === locale)?.value
    ?? items.find((i) => i.locale === fallbackLocale)?.value
    ?? items[0]?.value
    ?? ''
  )
}

export const interpolateVariables = (
  text: string,
  variables: DtprVariableValue[] | undefined,
  locale: string,
  fallbackLocale = 'en',
): string => {
  if (!text || !variables || variables.length === 0) return text
  let result = text
  for (const variable of variables) {
    const localized = getLocalizedValue(variable.value, locale, fallbackLocale)
    result = result.replace(new RegExp(`\\{\\{\\{${variable.id}\\}\\}\\}`, 'g'), localized)
    result = result.replace(new RegExp(`\\{\\{${variable.id}\\}\\}`, 'g'), localized)
  }
  return result
}

export const findVariableLocalizedValue = (
  variables: DtprVariableValue[] | undefined,
  id: string,
): DtprLocalizedContent[] | undefined => {
  if (!variables) return undefined
  return variables.find((v) => v.id === id)?.value
}

export const buildElementSnapshotMap = (
  snapshot: DtprSchemaSnapshot | undefined,
): Map<string, DtprSchemaSnapshotElement> => {
  const map = new Map<string, DtprSchemaSnapshotElement>()
  if (!snapshot?.elements) return map
  for (const el of snapshot.elements) map.set(el.id, el)
  return map
}

export const buildCategorySnapshotMap = (
  snapshot: DtprSchemaSnapshot | undefined,
): Map<string, DtprSchemaSnapshotCategory> => {
  const map = new Map<string, DtprSchemaSnapshotCategory>()
  if (!snapshot?.categories) return map
  for (const cat of snapshot.categories) map.set(cat.id, cat)
  return map
}

const DTPR_API_V2_BASE = 'https://api.dtpr.io/api/v2'

export const getElementIconUrl = (
  schemaVersion: string | undefined,
  elementId: string,
  variant?: string,
): string => {
  if (!schemaVersion || !elementId) return ''
  const suffix = variant && variant !== 'default' ? `.${variant}` : ''
  return `${DTPR_API_V2_BASE}/schemas/${encodeURIComponent(schemaVersion)}/elements/${encodeURIComponent(elementId)}/icon${suffix}.svg`
}

export interface DtprContextSummaryResolved {
  id: string
  title: string
  color: string | null
}

const AUTONOMY_SEVERITY: Record<string, number> = {
  autonomous: 3,
  human_executes: 2,
  human_decides: 1,
}

const PII_SEVERITY: Record<string, number> = {
  identifiable: 3,
  pseudonymous: 2,
  de_identified: 1,
}

const pickMoreSevere = (
  current: string | null,
  candidate: string | undefined,
  table: Record<string, number>,
): string | null => {
  if (!candidate) return current
  if (!current) return candidate
  return (table[candidate] ?? 0) > (table[current] ?? 0) ? candidate : current
}

export const resolveContextValue = (
  category: DtprSchemaSnapshotCategory | undefined,
  contextId: string | null | undefined,
  locale: string,
  fallbackLocale = 'en',
): DtprContextSummaryResolved | null => {
  if (!contextId || !category?.element_context) return null
  const value = category.element_context.values.find((v) => v.id === contextId)
  if (!value) return null
  return {
    id: contextId,
    title: getLocalizedValue(value.name, locale, fallbackLocale) || contextId,
    color: value.color ?? null,
  }
}

export interface DtprContextSummaries {
  autonomy: DtprContextSummaryResolved | null
  inputPii: DtprContextSummaryResolved | null
  outputPii: DtprContextSummaryResolved | null
}

export const getContextSummaries = (
  payload: ResolvedDatachainInstance | undefined,
  locale: string,
  fallbackLocale = 'en',
): DtprContextSummaries => {
  const empty: DtprContextSummaries = { autonomy: null, inputPii: null, outputPii: null }
  if (!payload?.elements) return empty
  const elementMap = buildElementSnapshotMap(payload.schema_snapshot)
  const categoryMap = buildCategorySnapshotMap(payload.schema_snapshot)

  let autonomyId: string | null = null
  let inputPiiId: string | null = null
  let outputPiiId: string | null = null

  for (const instance of payload.elements) {
    const def = elementMap.get(instance.element_id)
    if (!def) continue
    if (def.category_id === 'functional_modes') {
      autonomyId = pickMoreSevere(autonomyId, instance.context_type_id, AUTONOMY_SEVERITY)
    }
    else if (def.category_id === 'input_dataset') {
      inputPiiId = pickMoreSevere(inputPiiId, instance.context_type_id, PII_SEVERITY)
    }
    else if (def.category_id === 'output_dataset') {
      outputPiiId = pickMoreSevere(outputPiiId, instance.context_type_id, PII_SEVERITY)
    }
  }

  return {
    autonomy: resolveContextValue(categoryMap.get('functional_modes'), autonomyId, locale, fallbackLocale),
    inputPii: resolveContextValue(categoryMap.get('input_dataset'), inputPiiId, locale, fallbackLocale),
    outputPii: resolveContextValue(categoryMap.get('output_dataset'), outputPiiId, locale, fallbackLocale),
  }
}

export const getPrimaryElementByCategory = (
  payload: ResolvedDatachainInstance | undefined,
  categoryId: string,
): DtprElementInstance | undefined => {
  if (!payload?.elements || payload.elements.length === 0) return undefined
  const elementMap = buildElementSnapshotMap(payload.schema_snapshot)
  const matches = payload.elements.filter((instance) => {
    const def = elementMap.get(instance.element_id)
    return def?.category_id === categoryId
  })
  if (matches.length === 0) return undefined
  return [...matches].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))[0]
}

// Fetch categories + elements for a schema version and synthesize a
// `DtprSchemaSnapshot`. Use this when the datachain payload didn't
// carry a snapshot of its own.
export async function fetchSchemaSnapshot(
  schemaVersion: string,
  locale = 'en',
): Promise<DtprSchemaSnapshot> {
  const base = `${DTPR_API_V2_BASE}/schemas/${encodeURIComponent(schemaVersion)}`
  const [catsRes, elsRes] = await Promise.all([
    fetch(`${base}/categories?locales=${encodeURIComponent(locale)}`),
    // The list endpoint paginates (default 50, max 200). The schema currently
    // ships ~108 elements; without a high `limit` we lose half of them and
    // category_id lookups fall through.
    fetch(`${base}/elements?locales=${encodeURIComponent(locale)}&fields=all&limit=200`),
  ])
  if (!catsRes.ok) throw new Error(`categories HTTP ${catsRes.status}`)
  if (!elsRes.ok) throw new Error(`elements HTTP ${elsRes.status}`)
  const catsJson = (await catsRes.json()) as { ok: boolean; categories: DtprSchemaSnapshotCategory[] }
  const elsJson = (await elsRes.json()) as { ok: boolean; elements: DtprSchemaSnapshotElement[] }
  return {
    categories: catsJson.categories ?? [],
    elements: elsJson.elements ?? [],
  }
}
