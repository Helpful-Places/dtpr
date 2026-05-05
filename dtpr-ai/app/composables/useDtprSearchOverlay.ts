// Boot fetch + synthesis of the synthetic Cmd-K group that exposes
// every DTPR element and category as a searchable item alongside the
// existing prose-doc results. The boot fetch runs client-only after
// hydration (`server: false`) so it never blocks initial paint, and
// re-fires whenever the surface's active version or locale changes.
//
// Counterintuitive but correct rule: Cmd-K results scope to the
// *active* version + locale on whatever surface the user is currently
// viewing. Opening Cmd-K on `/taxonomy?v=ai@2026-04-16-beta` shows
// beta entries; opening it on `/getting-started/...` (no `?v=` →
// alias) shows latest. This intentionally tracks surface state rather
// than introducing a separate Cmd-K state, so synthetic results never
// point outside what the user is viewing.
import { computed, type Ref } from 'vue'
import { deriveElementDisplay, extract } from '@dtpr/ui/core'
import type { Category, Element } from '@dtpr/ui/core'
import {
  DTPR_API_BASE,
  DTPR_FETCH_TIMEOUT_MS,
  useDtprState,
} from './useDtprState'

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: Category[]
}

type ElementApi = Omit<Element, 'category_id'> & {
  category_id?: string
  category_ids?: string[]
}

interface ElementsResponseMeta {
  total?: number
  returned?: number
  next_cursor?: string | null
}

interface ElementsResponse {
  ok: boolean
  version: string
  elements: ElementApi[]
  meta?: ElementsResponseMeta
}

// Schema-version element count cap. The API enforces `limit ≤ 200`,
// so the catalog and Cmd-K boot fetch use the maximum single-page
// size. If a future schema grows past this we'll need to paginate
// (cursor exists), but the warning below will surface the moment the
// count crosses the threshold instead of silently truncating.
const ELEMENTS_PAGE_LIMIT = 200

interface SearchItem {
  label: string
  suffix?: string
  to: string
  prefix?: string
}

interface SearchGroup {
  id: string
  label: string
  items: SearchItem[]
}

// `<UContentSearch>` accepts a `files` prop typed as
// ContentSearchSection[] — items each carry a stable `id` we use to
// dedupe synthetic entries against authored md.
type ContentSearchFile = { id?: string; to?: string; [key: string]: unknown }

function truncate(value: string, max: number): string {
  if (!value) return ''
  return value.length > max ? value.slice(0, max - 1) + '…' : value
}

function pathnameOf(to: string): string {
  // Strip any query string from a synthetic `to` so it dedupes against
  // authored md, which has no `?v=` / `?locale=` pinning in its id.
  const q = to.indexOf('?')
  return q === -1 ? to : to.slice(0, q)
}

export function useDtprSearchOverlay(
  files: Ref<ContentSearchFile[] | null | undefined>,
) {
  const { activeVersion, activeLocale } = useDtprState()

  const queryString = computed(() => {
    const parts: string[] = []
    if (activeVersion.value) parts.push(`v=${encodeURIComponent(activeVersion.value)}`)
    if (activeLocale.value && activeLocale.value !== 'en') {
      parts.push(`locale=${encodeURIComponent(activeLocale.value)}`)
    }
    return parts.length ? `?${parts.join('&')}` : ''
  })

  const { data: overlayData } = useAsyncData(
    'dtpr-search-overlay',
    async () => {
      if (!activeVersion.value) return { categories: [], elements: [] }
      const locale = activeLocale.value
      const [cats, els] = await Promise.all([
        $fetch<CategoriesResponse>(
          `${DTPR_API_BASE}/schemas/${activeVersion.value}/categories?locales=${locale},en`,
          { timeout: DTPR_FETCH_TIMEOUT_MS },
        ).catch(() => ({ ok: false, version: '', categories: [] as Category[] })),
        $fetch<ElementsResponse>(
          `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements?fields=all&limit=${ELEMENTS_PAGE_LIMIT}&locales=${locale},en`,
          { timeout: DTPR_FETCH_TIMEOUT_MS },
        ).catch(() => ({ ok: false, version: '', elements: [] as ElementApi[] })),
      ])
      const total = els.meta?.total
      if (typeof total === 'number' && total > ELEMENTS_PAGE_LIMIT) {
        // Surfaces the moment a schema outgrows the single-page limit so
        // the truncation can't hide unnoticed in production.
        console.warn(
          `[dtpr-search-overlay] Schema ${activeVersion.value} reports ${total} elements but the Cmd-K index only fetched the first ${ELEMENTS_PAGE_LIMIT}. Pagination is needed to cover the remaining ${total - ELEMENTS_PAGE_LIMIT}.`,
        )
      }
      return {
        categories: cats.categories ?? [],
        elements: els.elements ?? [],
      }
    },
    {
      server: false,
      watch: [activeVersion, activeLocale],
      default: () => ({ categories: [] as Category[], elements: [] as ElementApi[] }),
    },
  )

  const dtprGroups = computed<SearchGroup[]>(() => {
    const data = overlayData.value
    if (!data) return []
    const cats = data.categories
    const els = data.elements
    const locale = activeLocale.value

    const existingPaths = new Set<string>()
    for (const f of files.value ?? []) {
      if (typeof f.id === 'string') existingPaths.add(f.id)
      if (typeof f.to === 'string') existingPaths.add(pathnameOf(f.to))
    }

    const categoryById = new Map<string, Category>()
    for (const c of cats) categoryById.set(c.id, c)

    const elementItems: SearchItem[] = []
    for (const raw of els) {
      const catIds = Array.isArray(raw.category_ids)
        ? raw.category_ids
        : raw.category_id
          ? [raw.category_id]
          : []
      const cat = catIds.map((id) => categoryById.get(id)).find(Boolean)
      const display = deriveElementDisplay(raw as Element, undefined, locale, {})
      const to = `/taxonomy/elements/${raw.id}${queryString.value}`
      if (existingPaths.has(`/taxonomy/elements/${raw.id}`)) continue
      const catTitle = cat ? extract(cat.name, locale, 'en') : null
      elementItems.push({
        label: display.title,
        suffix: truncate(display.description, 120),
        to,
        prefix: catTitle ? `${catTitle} · element` : 'element',
      })
    }

    const categoryItems: SearchItem[] = []
    for (const cat of cats) {
      if (existingPaths.has(`/taxonomy/categories/${cat.id}`)) continue
      const title = extract(cat.name, locale, 'en')
      const description = extract(cat.description, locale, 'en')
      categoryItems.push({
        label: title,
        suffix: truncate(description, 120),
        to: `/taxonomy/categories/${cat.id}${queryString.value}`,
        prefix: 'category',
      })
    }

    const groups: SearchGroup[] = []
    if (elementItems.length > 0) {
      groups.push({ id: 'taxonomy-elements', label: 'Elements', items: elementItems })
    }
    if (categoryItems.length > 0) {
      groups.push({
        id: 'taxonomy-categories',
        label: 'Categories',
        items: categoryItems,
      })
    }
    return groups
  })

  return { dtprGroups }
}
