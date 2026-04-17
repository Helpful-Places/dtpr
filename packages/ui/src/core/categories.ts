import type { Category } from '@dtpr/api/schema'

/**
 * Group elements by each of their `category_ids`. Every category in
 * the provided `categories` list becomes a key in the output — even
 * categories with no matching elements get an empty array — so callers
 * can iterate `Object.entries(grouped)` without missing empty slots.
 *
 * An element whose `category_ids` includes a category id not present
 * in `categories` is silently skipped for that id (it will still be
 * grouped under any recognised category it declares). Structural
 * validation of category references is the semantic validator's job;
 * this helper is purely presentational.
 *
 * Elements with multiple category_ids appear in each of their groups
 * (copied by reference — the display layer treats the groups as
 * read-only).
 */
export function groupElementsByCategory<E extends { category_ids: string[] }>(
  elements: readonly E[],
  categories: readonly { id: string }[],
): Record<string, E[]> {
  const grouped: Record<string, E[]> = {}
  for (const cat of categories) {
    grouped[cat.id] = []
  }
  for (const el of elements) {
    for (const catId of el.category_ids) {
      const bucket = grouped[catId]
      if (bucket) bucket.push(el)
    }
  }
  return grouped
}

/**
 * Sort the categories represented in `grouped` by their definition
 * `order` (ascending). Categories without an `order` field go last,
 * themselves ordered lexicographically by id. Ties in `order` are
 * also broken lexicographically by id so the output is deterministic
 * across platforms.
 */
export function sortCategoriesByOrder<E>(
  grouped: Record<string, E[]>,
  categories: readonly { id: string; order?: number }[],
): Array<{ id: string; elements: E[] }> {
  const byId = new Map(categories.map((c) => [c.id, c]))
  const ids = Object.keys(grouped).filter((id) => byId.has(id))
  ids.sort((a, b) => {
    const oa = byId.get(a)?.order
    const ob = byId.get(b)?.order
    const aMissing = oa === undefined
    const bMissing = ob === undefined
    if (aMissing && bMissing) return a < b ? -1 : a > b ? 1 : 0
    if (aMissing) return 1
    if (bMissing) return -1
    if (oa! < ob!) return -1
    if (oa! > ob!) return 1
    return a < b ? -1 : a > b ? 1 : 0
  })
  return ids.map((id) => ({ id, elements: grouped[id] ?? [] }))
}

/**
 * Find a full category definition by id. Returns `undefined` when no
 * match is present — callers fall back to rendering just the id or
 * skipping a section.
 */
export function findCategoryDefinition(
  id: string,
  categories: readonly Category[],
): Category | undefined {
  return categories.find((c) => c.id === id)
}
