import type { LocaleMap } from './types'
export { parseLocalesQuery, calculateLatestVersion } from '../v1/utils'

/**
 * Filters a locale map to only include requested locales.
 * Returns the full map if no locales are requested.
 */
export function filterLocaleMap(map: LocaleMap, requestedLocales: string[] | null): LocaleMap {
  if (!requestedLocales || requestedLocales.length === 0) return map
  const filtered: LocaleMap = {}
  for (const locale of requestedLocales) {
    if (locale in map) {
      filtered[locale] = map[locale]
    }
  }
  return filtered
}
