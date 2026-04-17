import MiniSearch from 'minisearch'
import type { Element } from '../schema/element.ts'
import type { LocaleCode } from '../schema/locale.ts'
import type { ParsedVersion } from '../../cli/lib/version-parser.ts'
import { loadSearchIndex, type LoadContext } from '../store/index.ts'

/**
 * Match the option shape that `cli/lib/search-index-builder.ts` used
 * when building the index. The serialized index does not record its
 * options, so the loader must pass them back in for `loadJSON` to
 * rehydrate correctly.
 */
const REHYDRATE_OPTIONS = {
  fields: ['title', 'description'],
  storeFields: ['id', 'title', 'category_ids'],
  searchOptions: {
    boost: { title: 3 },
    fuzzy: 0.2,
    prefix: true,
  },
}

/**
 * Run the BM25 query against the version's per-locale index and return
 * the matching element ids in rank order. Returns the input order if
 * no index has been built for that locale (degraded but working).
 *
 * The full elements list is passed in as the source of truth: the
 * search index only stores the projection fields; the route still
 * needs the full record to apply the `fields=` projection.
 */
export async function searchElementIds(opts: {
  ctx: LoadContext
  version: ParsedVersion
  locale: LocaleCode
  query: string
}): Promise<string[]> {
  const { ctx, version, locale, query } = opts
  const serialized = await loadSearchIndex(ctx, version, locale)
  if (!serialized) return []
  const index = MiniSearch.loadJSON(serialized, REHYDRATE_OPTIONS)
  return index.search(query).map((hit) => hit.id as string)
}

/**
 * Filter an `Element[]` to ids in `order`, preserving the order. Used
 * after `searchElementIds` returns ranked ids — the caller has the
 * full element list and just needs to project the relevant ones.
 */
export function reorderByIds(elements: Element[], order: string[]): Element[] {
  const byId = new Map(elements.map((e) => [e.id, e] as const))
  const out: Element[] = []
  for (const id of order) {
    const el = byId.get(id)
    if (el) out.push(el)
  }
  return out
}
