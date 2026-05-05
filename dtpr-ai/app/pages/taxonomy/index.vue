<script setup lang="ts">
import {
  DtprCategorySection,
  DtprElement,
  DtprElementGrid,
} from '@dtpr/ui/vue'
import '@dtpr/ui/vue/styles.css'
import {
  deriveElementDisplay,
  extract,
  groupElementsByCategory,
  sortCategoriesByOrder,
} from '@dtpr/ui/core'
import type { Category, Element } from '@dtpr/ui/core'
import {
  DTPR_API_BASE,
  DTPR_FETCH_TIMEOUT_MS,
  useDtprState,
} from '../../composables/useDtprState'

useHead({ title: 'Taxonomy' })

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: Category[]
}

// The REST API currently returns a singular `category_id` per element;
// the grouping helper expects `category_ids: string[]`. Relax the
// singular field to optional so either wire shape typechecks at the
// boundary, then normalize to plural before grouping.
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

// Schema-version element count cap. The API enforces `limit ≤ 200`
// per the elements-list contract, so the catalog uses the maximum
// single-page size. Pagination would be needed if a schema grows past
// this; the truncation alert below surfaces the moment that happens.
const ELEMENTS_PAGE_LIMIT = 200

const route = useRoute()

const {
  activeVersion,
  activeLocale,
  selectedVersion,
  selectedLocale,
  requestedVersion,
  versionMissing,
  latestVersion,
  availableVersions,
  availableLocales,
} = useDtprState()

// Build forwarded query string from validated state (see element /
// category pages for the same pattern) so an invalid `?locale=xyz`
// doesn't propagate through every link the visitor clicks afterward.
const queryString = computed(() => {
  const parts: string[] = []
  if (requestedVersion.value && !versionMissing.value) {
    parts.push(`v=${encodeURIComponent(activeVersion.value)}`)
  }
  if (activeLocale.value !== 'en') {
    parts.push(`locale=${encodeURIComponent(activeLocale.value)}`)
  }
  return parts.length ? `?${parts.join('&')}` : ''
})

const { data: catsData } = await useAsyncData(
  'dtpr-categories',
  () =>
    activeVersion.value
      ? $fetch<CategoriesResponse>(
          `${DTPR_API_BASE}/schemas/${activeVersion.value}/categories?locales=${activeLocale.value},en`,
          { timeout: DTPR_FETCH_TIMEOUT_MS },
        )
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

const { data: elsData } = await useAsyncData(
  'dtpr-elements',
  () =>
    activeVersion.value
      ? $fetch<ElementsResponse>(
          `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements?fields=all&limit=${ELEMENTS_PAGE_LIMIT}&locales=${activeLocale.value},en`,
          { timeout: DTPR_FETCH_TIMEOUT_MS },
        )
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

const elementsTruncated = computed(() => {
  const total = elsData.value?.meta?.total
  return typeof total === 'number' && total > ELEMENTS_PAGE_LIMIT
})

const elementsTotal = computed(() => elsData.value?.meta?.total ?? 0)

const categories = computed<Category[]>(() => catsData.value?.categories ?? [])

const elements = computed<Array<Element & { category_ids: string[] }>>(() => {
  const raw = elsData.value?.elements ?? []
  return raw.map((el) => {
    const ids: string[] = Array.isArray(el.category_ids)
      ? el.category_ids
      : el.category_id
        ? [el.category_id]
        : []
    return { ...(el as Element), category_ids: ids }
  })
})

function categoryTitle(id: string): string {
  const cat = categories.value.find((c) => c.id === id)
  if (!cat) return id
  return extract(cat.name, activeLocale.value, 'en')
}

function iconUrlFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.svg`
}

function iconUrlDarkFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.dark.svg`
}

function elementHrefFor(elementId: string): string {
  return `/taxonomy/elements/${elementId}${queryString.value}`
}

function categoryHrefFor(categoryId: string): string {
  return `/taxonomy/categories/${categoryId}${queryString.value}`
}

// Pre-resolve display strings for every element so search matches what
// the visitor actually sees (locale fallbacks applied) and so renders
// don't recompute per row.
const decoratedElements = computed(() => {
  return elements.value.map((el) => ({
    raw: el,
    display: deriveElementDisplay(el, undefined, activeLocale.value, {
      iconUrl: iconUrlFor(el.id),
      iconUrlDark: iconUrlDarkFor(el.id),
    }),
  }))
})

const grouped = computed(() =>
  groupElementsByCategory(
    decoratedElements.value.map((d) => d.raw),
    categories.value,
  ),
)

const sortedCategories = computed(() =>
  sortCategoriesByOrder(grouped.value, categories.value).filter(
    (c) => c.elements.length > 0,
  ),
)

const displayById = computed(() => {
  const map = new Map<string, ReturnType<typeof deriveElementDisplay>>()
  for (const d of decoratedElements.value) map.set(d.raw.id, d.display)
  return map
})

const targetId = ref<string | null>(null)

function readHashTarget(): string | null {
  if (typeof window === 'undefined') return null
  return window.location.hash ? window.location.hash.slice(1) : null
}

let scrollTimer: ReturnType<typeof setTimeout> | null = null
let scrollFrame: number | null = null
// Suppress the scroll-spy listener while a programmatic smooth scroll is
// running so the sidebar highlight doesn't flicker through every section
// the page passes on its way to the target.
let programmaticScrollSuppressUntil = 0

function scrollToTarget(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  if (scrollTimer !== null) clearTimeout(scrollTimer)
  // Defer past hydration so layout has settled.
  scrollTimer = setTimeout(() => {
    scrollTimer = null
    programmaticScrollSuppressUntil = Date.now() + 800
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, 100)
}

onMounted(() => {
  const initial = readHashTarget()
  if (initial) {
    targetId.value = initial
    scrollToTarget(initial)
  }
  window.addEventListener('hashchange', onHashChange)
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('hashchange', onHashChange)
    window.removeEventListener('scroll', handleScroll)
  }
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer)
    scrollTimer = null
  }
  if (scrollFrame !== null) {
    cancelAnimationFrame(scrollFrame)
    scrollFrame = null
  }
})

function onHashChange() {
  const next = readHashTarget()
  targetId.value = next
  if (next) scrollToTarget(next)
}

const toast = useToast()

function buildHashUrl(hash: string): string {
  if (typeof window === 'undefined') return `#${hash}`
  return `${window.location.origin}${window.location.pathname}${window.location.search}#${hash}`
}

const activeCategory = ref<string | null>(null)

const sidebarItems = computed(() => {
  return sortedCategories.value.map((cat) => ({
    label: categoryTitle(cat.id),
    badge: cat.elements.length,
    to: `#category-${cat.id}`,
    active: activeCategory.value === cat.id,
    onSelect: (e: Event) => {
      e.preventDefault()
      const id = `category-${cat.id}`
      activeCategory.value = cat.id
      // Update history without reload so the URL is shareable.
      if (typeof window !== 'undefined' && window.location.hash !== `#${id}`) {
        history.replaceState(null, '', `#${id}`)
      }
      targetId.value = id
      scrollToTarget(id)
    },
  }))
})

function computeActiveCategory() {
  scrollFrame = null
  if (typeof document === 'undefined') return
  if (Date.now() < programmaticScrollSuppressUntil) return
  const candidates = sortedCategories.value
    .map((c) => ({ id: c.id, el: document.getElementById(`category-${c.id}`) }))
    .filter((c): c is { id: string; el: HTMLElement } => c.el !== null)

  // Scroll-spy threshold mirrors the CSS scroll-margin-top on each
  // section so the active highlight flips when the section's title
  // crosses the bottom edge of the sticky headers, not 100px above.
  const scrollPosition = window.scrollY + 140
  for (let i = candidates.length - 1; i >= 0; i--) {
    if (candidates[i].el.offsetTop <= scrollPosition) {
      activeCategory.value = candidates[i].id
      return
    }
  }
  activeCategory.value = candidates[0]?.id ?? null
}

function handleScroll() {
  if (scrollFrame !== null) return
  scrollFrame = requestAnimationFrame(computeActiveCategory)
}

async function copyHash(hash: string, label: string) {
  const url = buildHashUrl(hash)
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      title: 'Link copied',
      description: `${label} link copied to clipboard.`,
      icon: 'i-heroicons-check-circle',
      color: 'success',
    })
    // Only update the hash on a successful copy so the URL doesn't
    // diverge from what landed on the user's clipboard.
    if (typeof window !== 'undefined' && window.location.hash !== `#${hash}`) {
      history.replaceState(null, '', `#${hash}`)
      targetId.value = hash
    }
  } catch {
    toast.add({
      title: 'Copy failed',
      description: 'Unable to access the clipboard.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="taxonomy-page">
    <DtprPageHeader
      :active-version="activeVersion"
      :active-locale="activeLocale"
      :selected-version="selectedVersion"
      :selected-locale="selectedLocale"
      :available-versions="availableVersions"
      :available-locales="availableLocales"
      :version-missing="versionMissing"
      :requested-version="requestedVersion"
      :latest-version="latestVersion"
      @update:selected-version="selectedVersion = $event"
      @update:selected-locale="selectedLocale = $event"
    >
      <template #heading>
        <h1 class="taxonomy-page__title">Taxonomy</h1>
        <p class="taxonomy-page__subtitle">
          Browse every element in the
          <code>{{ activeVersion || 'ai' }}</code> schema.
        </p>
      </template>
    </DtprPageHeader>

    <div class="taxonomy-page__layout">
      <aside class="taxonomy-page__sidebar">
        <div class="taxonomy-page__sidebar-inner">
          <h2 class="taxonomy-page__sidebar-heading">Categories</h2>
          <UNavigationMenu
            v-if="sidebarItems.length > 0"
            :items="sidebarItems"
            orientation="vertical"
          />
          <p v-else class="taxonomy-page__sidebar-empty">No categories match.</p>
        </div>
      </aside>

      <main class="taxonomy-page__main">
      <UAlert
        v-if="elementsTruncated"
        class="taxonomy-page__truncation-alert"
        color="warning"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        title="Catalog truncated"
        :description="`This schema declares ${elementsTotal} elements but the catalog only renders the first ${ELEMENTS_PAGE_LIMIT}. Pagination is needed to surface the remaining ${elementsTotal - ELEMENTS_PAGE_LIMIT}.`"
      />
      <section
        v-for="cat in sortedCategories"
        :key="cat.id"
        :id="`category-${cat.id}`"
        class="taxonomy-category"
        :class="{ 'taxonomy-category--active': targetId === `category-${cat.id}` }"
      >
        <div class="taxonomy-category__actions">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-link"
            :aria-label="`Copy link to ${categoryTitle(cat.id)} category`"
            @click="copyHash(`category-${cat.id}`, categoryTitle(cat.id))"
          />
          <UButton
            :to="categoryHrefFor(cat.id)"
            color="neutral"
            variant="ghost"
            size="xs"
            icon="i-heroicons-arrow-top-right-on-square"
            :aria-label="`Open ${categoryTitle(cat.id)} category page`"
          />
        </div>
        <DtprCategorySection :id="cat.id" :title="categoryTitle(cat.id)" disable-accordion>
          <DtprElementGrid>
            <div
              v-for="el in cat.elements"
              :key="el.id"
              :id="`element-${el.id}`"
              class="taxonomy-element-row"
              :class="{ 'taxonomy-element-row--active': targetId === `element-${el.id}` }"
            >
              <DtprElement :display="displayById.get(el.id)!" />
              <div class="taxonomy-element-row__actions">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-link"
                  :aria-label="`Copy link to ${displayById.get(el.id)?.title ?? el.id}`"
                  @click="copyHash(`element-${el.id}`, displayById.get(el.id)?.title ?? el.id)"
                />
                <UButton
                  :to="elementHrefFor(el.id)"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-arrow-top-right-on-square"
                  :aria-label="`Open ${displayById.get(el.id)?.title ?? el.id} page`"
                />
              </div>
            </div>
          </DtprElementGrid>
        </DtprCategorySection>
      </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.taxonomy-page {
  min-height: 100vh;
}

.taxonomy-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.taxonomy-page__subtitle {
  margin: 0;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.8125rem;
}

.taxonomy-page__subtitle code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
}

.taxonomy-page__layout {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 2rem;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.taxonomy-page__sidebar {
  flex: 0 0 16rem;
  position: sticky;
  /*
   * Sticky offset matches the sidebar's natural position at scroll=0:
   * docus header (--ui-header-height) + DtprPageHeader (~4.5rem) +
   * layout padding-top (1.5rem) ≈ --ui-header-height + 6rem. The
   * sidebar locks the moment scrolling begins instead of inching up
   * before catching its sticky offset.
   */
  top: calc(var(--ui-header-height, 0) + 6rem);
  align-self: flex-start;
}

.taxonomy-page__sidebar-inner {
  max-height: calc(100vh - var(--ui-header-height, 0) - 7rem);
  overflow-y: auto;
  padding-right: 0.5rem;
}

.taxonomy-page__sidebar-heading {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  margin: 0 0 0.75rem 0;
  padding-left: 0.75rem;
}

.taxonomy-page__sidebar-empty {
  margin: 0;
  padding: 0.5rem 0.75rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.8125rem;
}

@media (max-width: 1023px) {
  /*
   * Below 1024px the sidebar is hidden — categories are still
   * accessible by scrolling through the page, and the previous
   * slide-in drawer + hamburger toggle were more friction than they
   * were worth on this small a surface.
   */
  .taxonomy-page__sidebar {
    display: none;
  }
}

.taxonomy-page__main {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.taxonomy-category {
  scroll-margin-top: calc(var(--ui-header-height, 4rem) + 5.5rem);
  position: relative;
  border-radius: 0.5rem;
  transition: outline-color 0.4s ease, background-color 0.4s ease;
  outline: 2px solid transparent;
  outline-offset: 4px;
}

.taxonomy-category--active {
  outline-color: var(--ui-primary, #10b981);
  background-color: color-mix(in srgb, var(--ui-primary, #10b981) 4%, transparent);
}

.taxonomy-category__actions {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  z-index: 1;
  display: flex;
  gap: 0.125rem;
  opacity: 0.55;
}

.taxonomy-category__actions:hover,
.taxonomy-category__actions:focus-within {
  opacity: 1;
}

.taxonomy-element-row {
  scroll-margin-top: calc(var(--ui-header-height, 4rem) + 5.5rem);
  position: relative;
  border-radius: 0.5rem;
  transition: outline-color 0.4s ease, background-color 0.4s ease;
  outline: 2px solid transparent;
  outline-offset: 4px;
}

.taxonomy-element-row--active {
  outline-color: var(--ui-primary, #10b981);
  background-color: color-mix(in srgb, var(--ui-primary, #10b981) 6%, transparent);
}

.taxonomy-element-row__actions {
  position: absolute;
  top: 0.125rem;
  right: 0.125rem;
  z-index: 1;
  display: flex;
  gap: 0.125rem;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.taxonomy-element-row:hover .taxonomy-element-row__actions,
.taxonomy-element-row:focus-within .taxonomy-element-row__actions,
.taxonomy-element-row--active .taxonomy-element-row__actions {
  opacity: 0.85;
}

</style>
