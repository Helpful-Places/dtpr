import type { Category } from '../../src/schema/category.ts'
import type { LocaleValue } from '../../src/schema/locale.ts'
import { mergeCategoryContext, mergeCategoryElementVariables } from './transform-element.ts'
import { MIGRATION_LOCALES, type LocaleBundle, type MigrationWarning } from './types.ts'

function buildField(bundle: LocaleBundle, field: string): LocaleValue[] {
  const out: LocaleValue[] = []
  for (const locale of MIGRATION_LOCALES) {
    const fm = bundle[locale]
    if (!fm) continue
    const raw = fm[field]
    if (typeof raw !== 'string' || raw.length === 0) continue
    out.push({ locale, value: raw.trim() })
  }
  return out
}

/**
 * Transform a per-category locale bundle into the new `Category` shape.
 */
export function transformCategory(
  filename: string,
  bundle: LocaleBundle,
  warnings: MigrationWarning[],
): Category | null {
  const enFm = bundle.en
  if (!enFm) {
    warnings.push({
      code: 'CATEGORY_MISSING_EN',
      filename,
      message: `No English frontmatter; category skipped.`,
    })
    return null
  }
  const id = typeof enFm.id === 'string' ? enFm.id : undefined
  if (!id) {
    warnings.push({
      code: 'CATEGORY_NO_ID',
      filename,
      message: `No 'id' in English frontmatter; category skipped.`,
    })
    return null
  }
  const datachain_type =
    typeof enFm.datachain_type === 'string' ? enFm.datachain_type : 'ai'
  const required = enFm.required === true
  const order =
    typeof enFm.order === 'number' && Number.isFinite(enFm.order) ? enFm.order : 0

  const name = buildField(bundle, 'name')
  const description = buildField(bundle, 'description')
  const prompt = buildField(bundle, 'prompt')

  return {
    id,
    name,
    description,
    prompt,
    required,
    order,
    datachain_type,
    element_variables: mergeCategoryElementVariables(bundle),
    context: mergeCategoryContext(bundle),
  }
}
