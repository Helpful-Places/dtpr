// Locale-presence walker for a `ResolvedDatachainInstance`.
//
// Walks every reachable value and collects locale codes from any array
// shaped like `LocaleValue[]` — `{ locale: string, value: string }`.
// This is intentionally schema-shape-agnostic: the resolved instance
// carries `LocaleValueArray` fields across instance, schema_snapshot,
// element titles/descriptions, variable labels/values, category names,
// element_context value names, and several other places. A structural
// walk catches them all without hard-coding a path list that drifts.
//
// Returns the union of locale codes seen, deduplicated. Order is
// stable: the optional `siteLocaleOrder` (e.g. `['en','fr']` from
// `useDtprState`) wins first, then any other locales sort alphabetically.
// An empty walk returns `['en']` so the locale switcher is never empty.

import type { ResolvedDatachainInstance } from '@dtpr/ui/core'

interface LocaleValueLike {
  locale: string
  value: string
}

function isLocaleValueLike(v: unknown): v is LocaleValueLike {
  if (typeof v !== 'object' || v === null) return false
  const rec = v as Record<string, unknown>
  return typeof rec.locale === 'string' && typeof rec.value === 'string'
}

function isLocaleValueArray(v: unknown): v is LocaleValueLike[] {
  if (!Array.isArray(v) || v.length === 0) return false
  return v.every(isLocaleValueLike)
}

function walk(value: unknown, found: Set<string>, seen: WeakSet<object>): void {
  if (value === null || typeof value !== 'object') return
  if (seen.has(value as object)) return
  seen.add(value as object)

  if (Array.isArray(value)) {
    if (isLocaleValueArray(value)) {
      for (const entry of value) {
        if (entry.locale.length > 0) found.add(entry.locale)
      }
      // Don't recurse into LocaleValueLike entries; their `value` is a
      // plain string and `locale` already captured.
      return
    }
    for (const item of value) walk(item, found, seen)
    return
  }

  for (const child of Object.values(value as Record<string, unknown>)) {
    walk(child, found, seen)
  }
}

/**
 * Return the union of locale codes that appear anywhere in the
 * resolved instance, sorted by `siteLocaleOrder` first (when supplied)
 * then alphabetically. Empty walks return `['en']` so the switcher
 * always has at least one selectable locale.
 */
export function collectPresentLocales(
  resolved: ResolvedDatachainInstance,
  siteLocaleOrder: readonly string[] = [],
): string[] {
  const found = new Set<string>()
  walk(resolved, found, new WeakSet())
  if (found.size === 0) return ['en']

  const orderIndex = new Map<string, number>()
  siteLocaleOrder.forEach((code, i) => orderIndex.set(code, i))

  return [...found].sort((a, b) => {
    const ai = orderIndex.has(a) ? orderIndex.get(a)! : Number.POSITIVE_INFINITY
    const bi = orderIndex.has(b) ? orderIndex.get(b)! : Number.POSITIVE_INFINITY
    if (ai !== bi) return ai - bi
    return a.localeCompare(b)
  })
}

/**
 * Pick the best initial render locale: the active site locale if the
 * chain has content for it; otherwise the first entry from the
 * present-locale list (which is already sorted by site-config order).
 */
export function pickDefaultLocale(present: readonly string[], siteLocale: string): string {
  if (present.includes(siteLocale)) return siteLocale
  return present[0] ?? 'en'
}
