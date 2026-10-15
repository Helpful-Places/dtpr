// Types and pure helpers for the DTPR API (https://api.dtpr.io). The API is the
// only source of taxonomy content; see docs/adr/0001-api-as-only-taxonomy-source.md.

export const DTPR_API_BASE = 'https://api.dtpr.io/api/v2'
export const DTPR_DATACHAIN_TYPE = 'dtpr'
export const DTPR_SOURCE_LOCALE = 'en'

export interface DtprLocalized {
  locale: string
  value: string
}

export interface DtprVariable {
  id: string
  label: DtprLocalized[]
  required?: boolean
  kind?: string
}

export interface DtprContextValue {
  id: string
  name: DtprLocalized[]
  description?: DtprLocalized[]
  color: string | null
}

export interface DtprContext {
  id: string
  name: DtprLocalized[]
  description?: DtprLocalized[]
  required?: boolean
  values: DtprContextValue[]
}

export interface DtprCategory {
  id: string
  name: DtprLocalized[]
  description: DtprLocalized[]
  prompt: DtprLocalized[]
  required: boolean
  order: number
  shape: string
  element_variables: DtprVariable[]
  element_context?: DtprContext
  [key: string]: unknown
}

export interface DtprElement {
  id: string
  category_id: string
  title: DtprLocalized[]
  description: DtprLocalized[]
  symbol_id: string
  shape: string
  variables: DtprVariable[]
  icon_variants: string[]
  [key: string]: unknown
}

export interface DtprSchemaVersion {
  id: string
  status: 'beta' | 'stable'
  created_at: string
  content_hash: string
}

export type DtprTranslationStatus = 'source' | 'unverified' | 'machine_draft' | 'machine_reviewed' | 'human_reviewed'

export interface DtprTranslationLocale {
  locale: string
  status: DtprTranslationStatus
  register?: string
  translated_by?: string
  reviewed_by?: string
  updated_at: string | null
  summary: string
  flag_counts: { open: number, resolved: number, wontfix: number }
}

export interface DtprTranslationFlag {
  id: string
  locale: string
  kind: 'term_choice' | 'native_review' | 'divergence' | 'source_issue' | 'layout'
  status: 'open' | 'resolved' | 'wontfix'
  raised_by: string
  note: string
  targets: { type: 'element' | 'category' | 'datachain_type', id: string, field: string }[]
}

export interface DtprTranslations {
  source_locale: string
  locales: DtprTranslationLocale[]
  flags: DtprTranslationFlag[]
}

const TRANSLATION_STATUS_LABELS: Record<DtprTranslationStatus, string> = {
  source: 'Source text',
  unverified: 'Unverified',
  machine_draft: 'Machine draft',
  machine_reviewed: 'Machine reviewed',
  human_reviewed: 'Human reviewed',
}
export const dtprTranslationStatusLabel = (status: DtprTranslationStatus) => TRANSLATION_STATUS_LABELS[status] ?? status

/** Whether readers should be told the text has not had a human review. */
export const dtprNeedsReview = (status?: DtprTranslationStatus) => !!status && status !== 'source' && status !== 'human_reviewed'

export interface DtprTaxonomy {
  version: DtprSchemaVersion
  versions: DtprSchemaVersion[]
  // Set when the request asked for a version the API does not list.
  missingVersion?: string
  locale: string
  locales: string[]
  // Review status of each locale. Empty if the API did not report it.
  translations: DtprTranslationLocale[]
  categories: DtprCategory[]
  elements: DtprElement[]
}

export interface DtprVariableValue {
  id: string
  value: DtprLocalized[] | string[]
}

export interface DtprDatachainElement {
  element_id: string
  priority: number
  context_type_id?: string
  variables: DtprVariableValue[]
  [key: string]: unknown
}

export interface DtprDatachain {
  id: string
  schema_version: string
  title: DtprLocalized[]
  description?: DtprLocalized[]
  created_at: string
  updated_at?: string
  elements: DtprDatachainElement[]
  [key: string]: unknown
}

export interface DtprIssue {
  message: string
  categoryId?: string
  elementId?: string
}

/** The text for `locale`, falling back to English, then to whatever exists. */
export function dtprText(values: DtprLocalized[] | undefined, locale = DTPR_SOURCE_LOCALE): string {
  if (!values?.length) return ''
  return (
    values.find((v) => v.locale === locale)?.value
    ?? values.find((v) => v.locale === DTPR_SOURCE_LOCALE)?.value
    ?? values[0]!.value
  )
}

/** Replace `{{variable}}` blanks. Unfilled blanks read as "[variable name]". */
export function dtprFill(text: string, values: Record<string, string> = {}): string {
  return text.replace(/\{\{\{?(\w+)\}?\}\}/g, (_, id: string) => values[id] || `[${id.replace(/_/g, ' ')}]`)
}

export const dtprSchemaUrl = (version: string) => `${DTPR_API_BASE}/schemas/${encodeURIComponent(version)}`

/** `variant` is one of the element's `icon_variants`, e.g. "dark" or "identifiable.dark". */
export function dtprIconUrl(version: string, elementId: string, variant?: string | null): string {
  const suffix = variant && variant !== 'default' ? `.${variant}` : ''
  return `${dtprSchemaUrl(version)}/elements/${encodeURIComponent(elementId)}/icon${suffix}.svg`
}

export const dtprShapeUrl = (shape: string) => `${DTPR_API_BASE}/shapes/${shape}.svg`

/**
 * The icon variant for a context value and background. Only context values with
 * a colour have their own icon; the rest fall back to the plain or dark icon.
 */
export function dtprIconVariant(element: Pick<DtprElement, 'icon_variants'>, contextValueId?: string | null, dark = false): string {
  const variants = element.icon_variants ?? []
  const wanted = [contextValueId, dark ? 'dark' : null].filter(Boolean).join('.')
  if (wanted && variants.includes(wanted)) return wanted
  return dark && variants.includes('dark') ? 'dark' : 'default'
}

/** Stable versions first, then newest. The API has no "latest" alias. */
export function dtprSortVersions(versions: DtprSchemaVersion[]): DtprSchemaVersion[] {
  return [...versions].sort((a, b) =>
    Number(b.status === 'stable') - Number(a.status === 'stable')
    || b.created_at.localeCompare(a.created_at),
  )
}

/** A datachain's value for one variable in one locale. */
export function dtprVariableText(element: DtprDatachainElement, variableId: string, locale: string): string {
  const value = element.variables?.find((v) => v.id === variableId)?.value
  if (!value?.length || typeof value[0] === 'string') return ''
  return (value as DtprLocalized[]).find((v) => v.locale === locale)?.value ?? ''
}

/** Variable values for one locale, falling back to English, for filling blanks. */
export function dtprVariableValues(element: DtprDatachainElement, locale: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const v of element.variables ?? []) {
    if (!v.value?.length || typeof v.value[0] === 'string') continue
    out[v.id] = dtprText(v.value as DtprLocalized[], locale)
  }
  return out
}

/**
 * Checks a datachain against the taxonomy it was built on. This mirrors the
 * API's rules closely enough for instant feedback; the API's validate endpoint
 * remains the authority.
 */
export function dtprCheckDatachain(taxonomy: Pick<DtprTaxonomy, 'categories' | 'elements'>, chain: DtprDatachain, locale: string): DtprIssue[] {
  const issues: DtprIssue[] = []
  const elements = new Map(taxonomy.elements.map((e) => [e.id, e]))
  const categories = new Map(taxonomy.categories.map((c) => [c.id, c]))
  const used = new Set(chain.elements.map((e) => elements.get(e.element_id)?.category_id))

  if (!dtprText(chain.title, locale).trim()) issues.push({ message: 'Give the datachain a name' })

  for (const category of taxonomy.categories) {
    if (category.required && !used.has(category.id)) {
      issues.push({ categoryId: category.id, message: `${dtprText(category.name, locale)} needs at least one element` })
    }
  }

  for (const placed of chain.elements) {
    const element = elements.get(placed.element_id)
    if (!element) {
      issues.push({ elementId: placed.element_id, message: `"${placed.element_id}" is not in this schema version` })
      continue
    }
    const category = categories.get(element.category_id)!
    const where = `${dtprText(category.name, locale)}, ${dtprFill(dtprText(element.title, locale), dtprVariableValues(placed, locale))}`
    const context = category.element_context
    if (context) {
      const known = context.values.some((v) => v.id === placed.context_type_id)
      if (placed.context_type_id && !known) {
        issues.push({ categoryId: category.id, elementId: element.id, message: `${where}: unknown ${dtprText(context.name, locale).toLowerCase()}` })
      }
      else if (!placed.context_type_id && context.required !== false) {
        issues.push({ categoryId: category.id, elementId: element.id, message: `${where}: choose ${dtprText(context.name, locale).toLowerCase()}` })
      }
    }
    for (const variable of element.variables) {
      if (variable.required && !dtprVariableValues(placed, locale)[variable.id]) {
        issues.push({ categoryId: category.id, elementId: element.id, message: `${where}: fill in ${dtprText(variable.label, locale).toLowerCase()}` })
      }
    }
  }
  return issues
}
