import type { LocaleValue } from '../../src/schema/locale.ts'
import type { Element } from '../../src/schema/element.ts'
import { MIGRATION_LOCALES, type LocaleBundle, type MigrationWarning } from './types.ts'

/**
 * Build a `LocaleValue[]` from a locale bundle, reading a specified
 * frontmatter field per locale. Empty/missing values are skipped; the
 * caller deals with "must have at least one" semantics.
 */
function buildLocaleValues(
  bundle: LocaleBundle,
  field: string,
  transform: (raw: string) => string = (s) => s,
): LocaleValue[] {
  const out: LocaleValue[] = []
  for (const locale of MIGRATION_LOCALES) {
    const fm = bundle[locale]
    if (!fm) continue
    const raw = fm[field]
    if (typeof raw !== 'string') continue
    const value = transform(raw)
    if (value.length === 0) continue
    out.push({ locale, value })
  }
  return out
}

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string')
  return []
}

/**
 * Transform a per-element locale bundle into the new `Element` shape.
 *
 * Field transformations applied:
 *  - name → title (trimmed)
 *  - category list (plural `category_ids`) → singular `category_id`,
 *    picking the first `ai__*` entry (device__* references are skipped)
 *  - updated_at, element-level context_type_id, legacy `icon` block: dropped
 *  - v1 `symbol: /dtpr-icons/symbols/<name>.svg` → `symbol_id: <name>`
 *    (basename without extension)
 *  - citation: seeded as empty array (optional authored field)
 *
 * Returns `null` when the element has no `ai__*` category reference or
 * lacks required fields (e.g. missing id/title/symbol).
 */
export function transformElement(
  filename: string,
  bundle: LocaleBundle,
  warnings: MigrationWarning[],
): Element | null {
  const enFm = bundle.en
  if (!enFm) {
    warnings.push({
      code: 'ELEMENT_MISSING_EN',
      filename,
      message: `No English frontmatter found; element skipped.`,
    })
    return null
  }

  const id = typeof enFm.id === 'string' ? enFm.id : undefined
  if (!id) {
    warnings.push({
      code: 'ELEMENT_NO_ID',
      filename,
      message: `No 'id' in English frontmatter; element skipped.`,
    })
    return null
  }

  const rawCategories = asStringArray(enFm.category)
  const aiCategories = rawCategories.filter((c) => c.startsWith('ai__'))
  if (aiCategories.length === 0) return null // device-only; skip

  const title = buildLocaleValues(bundle, 'name', (s) => s.trim())
  if (title.length === 0) {
    warnings.push({
      code: 'ELEMENT_NO_TITLE',
      filename,
      message: `Element '${id}' has no non-empty 'name' across any locale; skipped.`,
    })
    return null
  }

  const description = buildLocaleValues(bundle, 'description', (s) => s.trim())

  // Symbol: v1 carries `symbol: /dtpr-icons/symbols/<name>.svg`. Derive
  // the library id as the basename without extension. No symbol = skip.
  const rawSymbol = enFm.symbol
  if (typeof rawSymbol !== 'string' || rawSymbol.length === 0) {
    warnings.push({
      code: 'ELEMENT_NO_SYMBOL',
      filename,
      message: `Element '${id}' has no 'symbol' path; skipped.`,
    })
    return null
  }
  const symbolId = rawSymbol.replace(/^.*\//, '').replace(/\.svg$/, '')
  if (symbolId.length === 0) {
    warnings.push({
      code: 'ELEMENT_NO_SYMBOL',
      filename,
      message: `Element '${id}' has empty symbol id derived from '${rawSymbol}'; skipped.`,
    })
    return null
  }

  return {
    id,
    category_id: aiCategories[0]!,
    title,
    description,
    citation: [],
    symbol_id: symbolId,
    variables: [],
  }
}

/**
 * Merge per-locale variable labels on a category. The v1 `element_variables`
 * structure carries `label: <plain string>` in each locale file (not a
 * LocaleValue[]), so the merger accumulates labels across all locales.
 */
export function mergeCategoryElementVariables(
  bundle: LocaleBundle,
): Array<{ id: string; label: LocaleValue[]; required: boolean }> {
  const byId = new Map<string, { id: string; label: LocaleValue[]; required: boolean }>()
  for (const locale of MIGRATION_LOCALES) {
    const fm = bundle[locale]
    const raw = fm?.element_variables
    if (!Array.isArray(raw)) continue
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue
      const id = (item as Record<string, unknown>).id
      if (typeof id !== 'string') continue
      const label = (item as Record<string, unknown>).label
      const required = (item as Record<string, unknown>).required
      let current = byId.get(id)
      if (!current) {
        current = { id, label: [], required: required === true }
        byId.set(id, current)
      }
      if (typeof label === 'string' && label.length > 0) {
        if (!current.label.some((l) => l.locale === locale)) {
          current.label.push({ locale, value: label.trim() })
        }
      }
      if (required === true) current.required = true
    }
  }
  return [...byId.values()]
}

/**
 * Merge per-locale context blocks on a category. `id` / `values[].id` /
 * `values[].color` are not localized; name / description accumulate
 * across locales.
 */
export function mergeCategoryContext(bundle: LocaleBundle):
  | {
      id: string
      name: LocaleValue[]
      description: LocaleValue[]
      values: Array<{
        id: string
        name: LocaleValue[]
        description: LocaleValue[]
        color: string
      }>
    }
  | undefined {
  // Identify a canonical source (prefer en) for ids + colors.
  const enFm = bundle.en
  const enCtx = enFm?.context as Record<string, unknown> | undefined
  if (!enCtx || typeof enCtx !== 'object') return undefined
  const ctxId = enCtx.id
  if (typeof ctxId !== 'string') return undefined

  const valuesTemplate = Array.isArray(enCtx.values) ? (enCtx.values as unknown[]) : []
  const values = valuesTemplate
    .map((v) => v as Record<string, unknown>)
    .filter((v) => typeof v?.id === 'string' && typeof v?.color === 'string')
    .map((v) => ({
      id: v.id as string,
      color: v.color as string,
      name: [] as LocaleValue[],
      description: [] as LocaleValue[],
    }))

  const name: LocaleValue[] = []
  const description: LocaleValue[] = []

  for (const locale of MIGRATION_LOCALES) {
    const fm = bundle[locale]
    const ctx = fm?.context as Record<string, unknown> | undefined
    if (!ctx) continue
    if (typeof ctx.name === 'string') name.push({ locale, value: ctx.name.trim() })
    if (typeof ctx.description === 'string')
      description.push({ locale, value: ctx.description.trim() })
    const localizedValues = Array.isArray(ctx.values) ? (ctx.values as unknown[]) : []
    for (const lv of localizedValues) {
      const cast = lv as Record<string, unknown>
      if (typeof cast?.id !== 'string') continue
      const match = values.find((x) => x.id === cast.id)
      if (!match) continue
      if (typeof cast.name === 'string') match.name.push({ locale, value: cast.name.trim() })
      if (typeof cast.description === 'string')
        match.description.push({ locale, value: cast.description.trim() })
    }
  }

  return { id: ctxId, name, description, values }
}
