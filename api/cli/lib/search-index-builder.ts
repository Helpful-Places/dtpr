import MiniSearch from 'minisearch'
import type { Element } from '../../src/schema/element.ts'
import type { LocaleCode } from '../../src/schema/locale.ts'

/**
 * Build a MiniSearch index for elements in a single locale. Title is
 * boosted 3× relative to description so exact name matches rank highest.
 * The index indexes only the locale-specific strings — search queries
 * do not fall back across locales.
 */
export function buildSearchIndex(elements: Element[], locale: LocaleCode): MiniSearch {
  const index = new MiniSearch({
    fields: ['title', 'description'],
    storeFields: ['id', 'title', 'category_ids'],
    searchOptions: {
      boost: { title: 3 },
      fuzzy: 0.2,
      prefix: true,
    },
  })
  const docs = elements.map((el) => ({
    id: el.id,
    title: el.title.find((t) => t.locale === locale)?.value ?? '',
    description: el.description.find((d) => d.locale === locale)?.value ?? '',
    category_ids: el.category_ids,
  }))
  index.addAll(docs)
  return index
}

/**
 * Serialize the index as a JSON string ready for R2 upload or inline
 * embedding. Consumers rehydrate with `MiniSearch.loadJSON(str, opts)`.
 */
export function serializeIndex(index: MiniSearch): string {
  return JSON.stringify(index.toJSON())
}

/**
 * Build one index per locale.
 */
export function buildSearchIndexesByLocale(
  elements: Element[],
  locales: LocaleCode[],
): Record<LocaleCode, string> {
  const result = {} as Record<LocaleCode, string>
  for (const locale of locales) {
    result[locale] = serializeIndex(buildSearchIndex(elements, locale))
  }
  return result
}
