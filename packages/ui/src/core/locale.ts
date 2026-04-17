import type { LocaleValue } from '@dtpr/api/schema'

/**
 * Result of a localized lookup that preserves which locale actually
 * matched (vs. returning just the string). `locale` is `null` only
 * when the input list is empty/undefined.
 */
export interface ExtractWithLocaleResult {
  value: string
  locale: string | null
}

/**
 * Canonical locale-fallback chain for DTPR content:
 *   1. exact match for `locale`
 *   2. exact match for `fallbackLocale` (default `'en'`)
 *   3. first-available entry in the array
 *   4. `''`
 *
 * Deterministic. Empty or undefined input returns `''`. A matched
 * entry whose `value` is an empty string is returned as-is — callers
 * own the "treat empty as fallback" decision.
 */
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

/**
 * Same fallback chain as `extract`, but also reports which locale
 * matched. `locale: null` is returned for empty/undefined input so
 * callers can distinguish "no data" from "matched but empty string".
 */
export function extractWithLocale(
  values: readonly LocaleValue[] | undefined,
  locale: string,
  fallbackLocale: string = 'en',
): ExtractWithLocaleResult {
  if (!values || values.length === 0) return { value: '', locale: null }
  const exact = values.find((v) => v.locale === locale)
  if (exact) return { value: exact.value, locale: exact.locale }
  const fallback = values.find((v) => v.locale === fallbackLocale)
  if (fallback) return { value: fallback.value, locale: fallback.locale }
  const first = values[0]
  if (first) return { value: first.value, locale: first.locale }
  return { value: '', locale: null }
}
