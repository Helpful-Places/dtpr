import type { DatachainType } from '../../src/schema/datachain-type.ts'
import type { LocaleCode, LocaleValue } from '../../src/schema/locale.ts'
import { MIGRATION_LOCALES, type LocaleBundle } from './types.ts'

/**
 * Build `datachain-type.yaml` from the v1 `datachain_types/<locale>/ai.md`
 * files plus the ordered list of migrated categories.
 */
export function transformDatachainType(
  bundle: LocaleBundle,
  orderedCategoryIds: string[],
  locales: LocaleCode[] = MIGRATION_LOCALES,
): DatachainType {
  const enFm = bundle.en ?? {}
  const id = typeof enFm.id === 'string' ? enFm.id : 'ai'

  const name: LocaleValue[] = []
  const description: LocaleValue[] = []
  for (const locale of MIGRATION_LOCALES) {
    const fm = bundle[locale]
    if (!fm) continue
    if (typeof fm.name === 'string' && fm.name.length > 0) {
      name.push({ locale, value: fm.name.trim() })
    }
    if (typeof fm.description === 'string' && fm.description.length > 0) {
      description.push({ locale, value: fm.description.trim() })
    }
  }

  return {
    id,
    name,
    description,
    categories: orderedCategoryIds,
    locales,
  }
}
