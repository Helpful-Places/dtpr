import type { Context } from 'hono'
import type { LocaleCode, LocaleValue } from '../schema/locale.ts'
import type { SchemaManifest } from '../schema/manifest.ts'

/**
 * Parse a `?locales=en,fr` query param into a Set. Returns `null` when
 * the param is absent — callers interpret null as "no filter".
 *
 * Unknown locale codes (e.g. `?locales=zz`) are tolerated here; the
 * filter just removes nothing for them. The schema's locale allow-list
 * lives on the manifest, not the response shape.
 */
export function parseLocalesParam(raw?: string | null): Set<LocaleCode> | null {
  if (!raw) return null
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean) as LocaleCode[]
  return parts.length === 0 ? null : new Set(parts)
}

function isLocaleValue(v: unknown): v is LocaleValue {
  return (
    !!v &&
    typeof v === 'object' &&
    'locale' in (v as object) &&
    'value' in (v as object) &&
    typeof (v as { locale: unknown }).locale === 'string' &&
    typeof (v as { value: unknown }).value === 'string'
  )
}

/**
 * Recursively walk a value and filter every `LocaleValue[]` it
 * contains down to the requested locales. Leaves non-localized data
 * untouched. Pure — does not mutate inputs.
 *
 * The shape detection is deliberately simple: an array whose first
 * element matches `{ locale: string, value: string }`. This mirrors
 * the heuristic in the v1 API's `filterLocaleValues` and keeps the
 * filter independent of any specific Zod schema.
 */
export function deepFilterLocales<T>(value: T, allow: Set<LocaleCode> | null): T {
  if (!allow) return value
  if (Array.isArray(value)) {
    if (value.length > 0 && isLocaleValue(value[0])) {
      return value.filter((entry) =>
        isLocaleValue(entry) ? allow.has(entry.locale as LocaleCode) : true,
      ) as unknown as T
    }
    return value.map((entry) => deepFilterLocales(entry, allow)) as unknown as T
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = deepFilterLocales(v, allow)
    }
    return out as T
  }
  return value
}

/**
 * Cache-Control directive for a version.
 *  - stable → safe to cache for 24h, immutable
 *  - beta   → never cache; agents/devs must always see fresh bytes
 */
export function cacheControlFor(manifest: SchemaManifest): string {
  return manifest.status === 'stable'
    ? 'public, max-age=86400, immutable'
    : 'no-store'
}

/**
 * Stamp the standard pair of response headers — content hash for
 * pinning + cache-control matching the version's mutability.
 */
export function setVersionHeaders(c: Context, manifest: SchemaManifest): void {
  c.header('DTPR-Content-Hash', manifest.content_hash)
  c.header('Cache-Control', cacheControlFor(manifest))
}

/**
 * Project an object down to a subset of its top-level fields. `id` is
 * always retained so callers can correlate compact rows with the full
 * record.
 *
 * The `'all'` sentinel returns the input unchanged. Unknown field
 * names are silently ignored (no error) so callers can write feature-
 * detected projection lists.
 */
export function projectFields<T extends { id: string }>(
  obj: T,
  fields: readonly string[] | 'all',
): Partial<T> & Pick<T, 'id'> {
  if (fields === 'all') return obj
  const out: Record<string, unknown> = { id: obj.id }
  for (const field of fields) {
    if (field === 'id') continue
    if (field in obj) out[field] = (obj as Record<string, unknown>)[field]
  }
  return out as Partial<T> & Pick<T, 'id'>
}

/**
 * Parse a `?fields=a,b,c` query param. Returns `'all'` when the param
 * value is the literal `'all'`. Returns null for missing — the caller
 * picks an endpoint-appropriate default (e.g. `['id', 'title',
 * 'category_id']` for `/elements`).
 */
export function parseFieldsParam(raw?: string | null): readonly string[] | 'all' | null {
  if (raw === undefined || raw === null) return null
  const trimmed = raw.trim()
  if (trimmed === '') return null
  if (trimmed === 'all') return 'all'
  return trimmed
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}
