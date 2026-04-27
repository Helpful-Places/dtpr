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

const API_BASE = 'https://api.dtpr.io/api/v2'
const DATACHAIN_TYPE = 'ai'

useHead({ title: 'Taxonomy' })

interface SchemaVersion {
  id: string
  status: 'stable' | 'beta'
  created_at: string
  content_hash: string
}

interface SchemasResponse {
  ok: boolean
  versions: SchemaVersion[]
}

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: Category[]
}

// The REST API currently returns a singular `category_id` per element;
// the grouping helper expects `category_ids: string[]`. We normalize on
// load so either shape works if the API gains plural support later.
type ElementApi = Omit<Element, 'category_ids'> & {
  category_id?: string
  category_ids?: string[]
}

interface ElementsResponse {
  ok: boolean
  version: string
  elements: ElementApi[]
}

const { data: schemasData } = await useFetch<SchemasResponse>(`${API_BASE}/schemas`, {
  key: 'dtpr-schemas-index',
})

const aiVersions = computed<SchemaVersion[]>(() => {
  const all = schemasData.value?.versions ?? []
  return all
    .filter((v) => v.id.startsWith(`${DATACHAIN_TYPE}@`))
    .slice()
    .sort((a, b) => {
      // Stable beats beta; within a status, newest first.
      if (a.status === 'stable' && b.status !== 'stable') return -1
      if (a.status !== 'stable' && b.status === 'stable') return 1
      return b.created_at.localeCompare(a.created_at)
    })
})

const activeVersion = computed(() => aiVersions.value[0]?.id ?? '')

const { data: catsData } = await useAsyncData(
  'dtpr-categories',
  () =>
    activeVersion.value
      ? $fetch<CategoriesResponse>(
          `${API_BASE}/schemas/${activeVersion.value}/categories`,
        )
      : Promise.resolve(undefined),
  { watch: [activeVersion] },
)

const { data: elsData } = await useAsyncData(
  'dtpr-elements',
  () =>
    activeVersion.value
      ? $fetch<ElementsResponse>(
          `${API_BASE}/schemas/${activeVersion.value}/elements?fields=all&limit=200`,
        )
      : Promise.resolve(undefined),
  { watch: [activeVersion] },
)

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
  return extract(cat.name, 'en', 'en')
}

function iconUrlFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.svg`
}

// Pre-resolve display strings for every element so search matches what
// the visitor actually sees (locale fallbacks applied) and so renders
// don't recompute per row.
const decoratedElements = computed(() => {
  return elements.value.map((el) => ({
    raw: el,
    display: deriveElementDisplay(el, undefined, 'en', { iconUrl: iconUrlFor(el.id) }),
  }))
})

const searchQuery = ref('')

const filteredDecorated = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return decoratedElements.value
  return decoratedElements.value.filter(({ display }) => {
    const haystack = `${display.title}\n${display.description}`.toLowerCase()
    return haystack.includes(q)
  })
})

const filteredGrouped = computed(() =>
  groupElementsByCategory(
    filteredDecorated.value.map((d) => d.raw),
    categories.value,
  ),
)

const filteredSortedCategories = computed(() =>
  sortCategoriesByOrder(filteredGrouped.value, categories.value).filter(
    (c) => c.elements.length > 0,
  ),
)

const displayById = computed(() => {
  const map = new Map<string, ReturnType<typeof deriveElementDisplay>>()
  for (const d of decoratedElements.value) map.set(d.raw.id, d.display)
  return map
})

const hasResults = computed(() => filteredDecorated.value.length > 0)

function clearSearch() {
  searchQuery.value = ''
}

const targetId = ref<string | null>(null)

function readHashTarget(): string | null {
  if (typeof window === 'undefined') return null
  return window.location.hash ? window.location.hash.slice(1) : null
}

function scrollToTarget(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (!el) return
  // Defer past hydration so layout has settled.
  setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
}

onMounted(() => {
  const initial = readHashTarget()
  if (initial) {
    targetId.value = initial
    scrollToTarget(initial)
  }
  window.addEventListener('hashchange', onHashChange)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('hashchange', onHashChange)
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
  } catch {
    toast.add({
      title: 'Copy failed',
      description: 'Unable to access the clipboard.',
      icon: 'i-heroicons-exclamation-triangle',
      color: 'error',
    })
  }
  // Update the hash so the highlight follows the click and the URL is shareable.
  if (typeof window !== 'undefined' && window.location.hash !== `#${hash}`) {
    history.replaceState(null, '', `#${hash}`)
    targetId.value = hash
  }
}
</script>

<template>
  <div class="taxonomy-page">
    <header class="taxonomy-page__header">
      <div class="taxonomy-page__header-inner">
        <div class="taxonomy-page__heading">
          <h1 class="taxonomy-page__title">Taxonomy</h1>
          <p class="taxonomy-page__subtitle">
            Browse every element in the
            <code>{{ activeVersion || 'ai' }}</code> schema.
          </p>
        </div>
        <div class="taxonomy-page__search">
          <UInput
            v-model="searchQuery"
            placeholder="Search elements…"
            icon="i-heroicons-magnifying-glass"
            size="md"
            class="w-full"
          >
            <template #trailing>
              <UButton
                v-show="searchQuery"
                color="neutral"
                variant="link"
                icon="i-heroicons-x-mark-20-solid"
                aria-label="Clear search"
                @click="clearSearch"
              />
            </template>
          </UInput>
        </div>
      </div>
    </header>

    <main class="taxonomy-page__main">
      <section
        v-for="cat in filteredSortedCategories"
        :key="cat.id"
        :id="`category-${cat.id}`"
        class="taxonomy-category"
        :class="{ 'taxonomy-category--active': targetId === `category-${cat.id}` }"
      >
        <UButton
          class="taxonomy-category__copy"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-link"
          :aria-label="`Copy link to ${categoryTitle(cat.id)} category`"
          @click="copyHash(`category-${cat.id}`, categoryTitle(cat.id))"
        />
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
              <UButton
                class="taxonomy-element-row__copy"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-link"
                :aria-label="`Copy link to ${displayById.get(el.id)?.title ?? el.id}`"
                @click="copyHash(`element-${el.id}`, displayById.get(el.id)?.title ?? el.id)"
              />
            </div>
          </DtprElementGrid>
        </DtprCategorySection>
      </section>

      <div v-if="searchQuery && !hasResults" class="taxonomy-empty">
        <UIcon name="i-heroicons-magnifying-glass" class="taxonomy-empty__icon" />
        <h2 class="taxonomy-empty__title">No results found</h2>
        <p class="taxonomy-empty__hint">Try adjusting your search terms.</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.taxonomy-page {
  min-height: 100vh;
}

.taxonomy-page__header {
  border-bottom: 1px solid var(--ui-border, rgb(229, 231, 235));
  background: var(--ui-bg, white);
  padding: 1rem 0;
  position: sticky;
  top: var(--ui-header-height, 0);
  z-index: 30;
  backdrop-filter: blur(8px);
}

.taxonomy-page__header-inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 2rem;
}

.taxonomy-page__heading {
  flex: 0 0 auto;
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

.taxonomy-page__search {
  flex: 1 1 16rem;
  min-width: 12rem;
  max-width: 28rem;
}

.taxonomy-page__main {
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.taxonomy-category {
  scroll-margin-top: 6rem;
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

.taxonomy-category__copy {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  z-index: 1;
  opacity: 0.55;
}

.taxonomy-category__copy:hover,
.taxonomy-category__copy:focus-visible {
  opacity: 1;
}

.taxonomy-element-row {
  scroll-margin-top: 6rem;
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

.taxonomy-element-row__copy {
  position: absolute;
  top: 0.125rem;
  right: 0.125rem;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.taxonomy-element-row:hover .taxonomy-element-row__copy,
.taxonomy-element-row:focus-within .taxonomy-element-row__copy,
.taxonomy-element-row--active .taxonomy-element-row__copy {
  opacity: 0.85;
}

.taxonomy-empty {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.taxonomy-empty__icon {
  width: 3rem;
  height: 3rem;
  margin: 0 auto 1rem auto;
  display: block;
  opacity: 0.5;
}

.taxonomy-empty__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--ui-text, inherit);
}

.taxonomy-empty__hint {
  margin: 0;
  font-size: 0.875rem;
}
</style>
