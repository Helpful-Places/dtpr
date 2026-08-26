/**
 * DTPR API client surface — URL builders and the response shapes the
 * plugin actually reads.
 *
 * The API is public (no auth, `Access-Control-Allow-Origin: *`), so
 * the UI iframe can call it directly. See `api/src/middleware/cors.ts`.
 */

export const DEFAULT_API_BASE = 'https://api.dtpr.io'

/**
 * Sent on every request. The API buckets rate limits by IP + this
 * header (`api/src/middleware/rate-limit.ts`), so identifying
 * ourselves keeps the plugin out of the shared anonymous pool — which
 * matters, because a full library build is ~470 requests.
 */
export const CLIENT_HEADER = 'DTPR-Client'
export const CLIENT_ID = 'dtpr-figma-plugin/0.2.0'

/**
 * `RL_READ` in `api/wrangler.jsonc`: 300 requests per 60s. Governs the
 * JSON metadata reads (versions, categories, elements) only.
 */
export const READ_LIMIT_PER_MINUTE = 300

/**
 * `RL_ICONS` in `api/wrangler.jsonc`: 1200 requests per 60s. The
 * icon-serving routes consume this bucket instead of `RL_READ`, and it
 * is sized so a whole-library sweep clears inside one window — which is
 * why a build no longer has to spread itself across two minutes.
 */
export const ICON_LIMIT_PER_MINUTE = 1200

/** Elements endpoint caps `?limit=` at 200; 137 elements fit in one page. */
export const MAX_PAGE_SIZE = 200

export interface LocalizedValue {
  locale: string
  value: string
}

export interface SchemaVersionSummary {
  id: string
  status: string
  created_at: string
  content_hash: string
}

export interface Category {
  id: string
  name: LocalizedValue[]
  description: LocalizedValue[]
  order: number
  shape: string
}

export interface Element {
  id: string
  category_id: string
  title: LocalizedValue[]
  description: LocalizedValue[]
  symbol_id: string
  shape: string
  icon_variants: string[]
}

/** Pick a locale out of a localized-value list, falling back to `en`. */
export function localized(
  values: readonly LocalizedValue[] | undefined,
  locale: string,
): string {
  if (!values || values.length === 0) return ''
  const exact = values.find((v) => v.locale === locale)
  if (exact) return exact.value
  const english = values.find((v) => v.locale === 'en')
  if (english) return english.value
  return values[0]?.value ?? ''
}

const encode = encodeURIComponent

export function versionsUrl(base: string): string {
  return `${base}/api/v2/schemas`
}

export function categoriesUrl(base: string, version: string, locale: string): string {
  return `${base}/api/v2/schemas/${encode(version)}/categories?locales=${encode(locale)}`
}

export function elementsUrl(
  base: string,
  version: string,
  locale: string,
  cursor?: string,
): string {
  const fields = 'id,category_id,title,description,symbol_id,shape,icon_variants'
  const params = [
    `limit=${MAX_PAGE_SIZE}`,
    `fields=${encode(fields)}`,
    `locales=${encode(locale)}`,
  ]
  if (cursor) params.push(`cursor=${encode(cursor)}`)
  return `${base}/api/v2/schemas/${encode(version)}/elements?${params.join('&')}`
}

/**
 * Composed-icon URL. `default` is spelled `icon.svg`; every other
 * token — `dark`, `vendor`, `vendor.dark` — is `icon.<token>.svg`.
 */
export function iconUrl(
  base: string,
  version: string,
  elementId: string,
  variantToken: string,
): string {
  const leaf = variantToken === 'default' ? 'icon.svg' : `icon.${variantToken}.svg`
  return `${base}/api/v2/schemas/${encode(version)}/elements/${encode(elementId)}/${leaf}`
}
