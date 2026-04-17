export interface LocaleValue {
  locale: string
  value: string
}

export function extract(
  values: readonly LocaleValue[] | undefined,
  locale: string,
  fallbackLocale: string = 'en',
): string {
  if (!values || values.length === 0) return ''
  const exact = values.find((v) => v.locale === locale)
  if (exact) return exact.value
  const fallback = values.find((v) => v.locale === fallbackLocale)
  if (fallback) return fallback.value
  return values[0]?.value ?? ''
}

export const HEXAGON_FALLBACK_DATA_URI =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5' fill='%230f5153'/%3E%3C/svg%3E"
