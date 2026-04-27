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

const grouped = computed(() => groupElementsByCategory(elements.value, categories.value))
const sortedCategories = computed(() => sortCategoriesByOrder(grouped.value, categories.value))

function categoryTitle(id: string): string {
  const cat = categories.value.find((c) => c.id === id)
  if (!cat) return id
  return extract(cat.name, 'en', 'en')
}

function iconUrlFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.svg`
}
</script>

<template>
  <div class="taxonomy-page">
    <header class="taxonomy-page__header">
      <div class="taxonomy-page__header-inner">
        <h1 class="taxonomy-page__title">Taxonomy</h1>
        <p class="taxonomy-page__subtitle">
          Browse every element in the
          <code>{{ activeVersion || 'ai' }}</code> schema, grouped by category.
        </p>
      </div>
    </header>

    <main class="taxonomy-page__main">
      <section
        v-for="cat in sortedCategories"
        :key="cat.id"
        :id="`category-${cat.id}`"
        class="taxonomy-category"
      >
        <DtprCategorySection :id="cat.id" :title="categoryTitle(cat.id)" disable-accordion>
          <DtprElementGrid>
            <div
              v-for="el in cat.elements"
              :key="el.id"
              :id="`element-${el.id}`"
              class="taxonomy-element-row"
            >
              <DtprElement
                :display="deriveElementDisplay(el, undefined, 'en', { iconUrl: iconUrlFor(el.id) })"
              />
            </div>
          </DtprElementGrid>
        </DtprCategorySection>
      </section>
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
  padding: 1.5rem 0;
}

.taxonomy-page__header-inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.taxonomy-page__title {
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.taxonomy-page__subtitle {
  margin: 0;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.875rem;
}

.taxonomy-page__subtitle code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
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
  scroll-margin-top: 5rem;
}

.taxonomy-element-row {
  scroll-margin-top: 5rem;
}
</style>
