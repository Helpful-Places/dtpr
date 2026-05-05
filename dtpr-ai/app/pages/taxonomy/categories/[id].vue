<script setup lang="ts">
import { DtprElement } from '@dtpr/ui/vue'
import '@dtpr/ui/vue/styles.css'
import { deriveElementDisplay, extract } from '@dtpr/ui/core'
import type { Category, Element } from '@dtpr/ui/core'
import {
  DTPR_API_BASE,
  DTPR_FETCH_TIMEOUT_MS,
  useDtprState,
} from '../../../composables/useDtprState'

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: Category[]
}

type ElementApi = Omit<Element, 'category_id'> & {
  category_id?: string
  category_ids?: string[]
}

interface ElementsResponse {
  ok: boolean
  version: string
  elements: ElementApi[]
}

const route = useRoute()
const categoryId = computed(() => String(route.params.id))
const overlayPath = computed(() => `/taxonomy/categories/${categoryId.value}`)

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

// Build forwarded query string from validated state (see element page
// for the same pattern) so an invalid `?locale=xyz` doesn't propagate
// through every link the visitor clicks afterward.
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

const backToTaxonomyHref = computed(() => `/taxonomy${queryString.value}`)

const categoriesUrl = computed(() => {
  if (!activeVersion.value) return null
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/categories?locales=${activeLocale.value},en`
})

const elementsUrl = computed(() => {
  if (!activeVersion.value || !categoryId.value) return null
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements?fields=all&limit=200&locales=${activeLocale.value},en&category_id=${encodeURIComponent(categoryId.value)}`
})

const { data: categoriesData } = await useAsyncData<CategoriesResponse | undefined>(
  'dtpr-category-detail-categories',
  () =>
    categoriesUrl.value
      ? $fetch<CategoriesResponse>(categoriesUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

// Key includes categoryId so SPA navigation between categories drops
// the previous payload immediately rather than leaving the prior
// elements list visible while the new fetch is in flight.
const { data: elementsData } = await useAsyncData<ElementsResponse | undefined>(
  () => `dtpr-category-detail-elements-${categoryId.value}`,
  () =>
    elementsUrl.value
      ? $fetch<ElementsResponse>(elementsUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale, categoryId] },
)

// Optional editorial overlay md file at content/taxonomy/categories/<id>.md.
const { data: overlay } = await useAsyncData(
  () => `dtpr-category-overlay-${categoryId.value}`,
  async () => {
    try {
      const result = await queryCollection('docs').path(overlayPath.value).first()
      return result ?? null
    } catch {
      return null
    }
  },
  { watch: [categoryId] },
)

const category = computed<Category | null>(() => {
  return categoriesData.value?.categories.find((c) => c.id === categoryId.value) ?? null
})

const categoryTitle = computed(() => {
  const c = category.value
  if (!c) return categoryId.value
  return extract(c.name, activeLocale.value, 'en')
})

const categoryDescription = computed(() => {
  const c = category.value
  if (!c) return ''
  return extract(c.description, activeLocale.value, 'en')
})

const contextValues = computed(() => category.value?.context?.values ?? [])

const elements = computed<Array<Element & { category_ids: string[] }>>(() => {
  const raw = elementsData.value?.elements ?? []
  return raw
    .map((el) => {
      const ids: string[] = Array.isArray(el.category_ids)
        ? el.category_ids
        : el.category_id
          ? [el.category_id]
          : []
      return { ...(el as Element), category_ids: ids }
    })
    .filter((el) => el.category_ids.includes(categoryId.value))
})

function iconUrlFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.svg`
}

function iconUrlDarkFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.dark.svg`
}

const decoratedElements = computed(() =>
  elements.value.map((el) => ({
    raw: el,
    display: deriveElementDisplay(el, undefined, activeLocale.value, {
      iconUrl: iconUrlFor(el.id),
      iconUrlDark: iconUrlDarkFor(el.id),
    }),
    href: `/taxonomy/elements/${el.id}${queryString.value}`,
  })),
)

const notFound = computed(() => {
  if (!categoriesData.value) return false
  return !categoriesData.value.categories.some((c) => c.id === categoryId.value)
})

function contextValueName(value: { id: string; name: unknown }): string {
  return extract(value.name as never, activeLocale.value, 'en') || value.id
}

useHead(() => ({
  title: category.value
    ? `${categoryTitle.value} — DTPR Taxonomy`
    : 'Category — DTPR Taxonomy',
}))
</script>

<template>
  <div class="taxonomy-detail-page">
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
        <h1 class="taxonomy-detail-page__title">{{ categoryTitle }}</h1>
        <p class="taxonomy-detail-page__breadcrumb">
          <NuxtLink :to="backToTaxonomyHref" class="taxonomy-detail-page__crumb">Taxonomy</NuxtLink>
        </p>
      </template>
    </DtprPageHeader>

    <main class="taxonomy-detail-page__main">
      <UAlert
        v-if="notFound"
        color="warning"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        title="Category not found"
        :description="`No category with id &quot;${categoryId}&quot; exists in this schema version.`"
      >
        <template #actions>
          <UButton :to="backToTaxonomyHref" variant="solid" color="primary">
            Back to taxonomy
          </UButton>
        </template>
      </UAlert>

      <template v-else-if="category">
        <section class="taxonomy-detail-page__hero">
          <p v-if="categoryDescription" class="taxonomy-detail-page__description">
            {{ categoryDescription }}
          </p>

          <div
            v-if="contextValues.length > 0"
            class="taxonomy-context-palette"
            aria-label="Context palette"
          >
            <h2 class="taxonomy-context-palette__heading">Context palette</h2>
            <ul class="taxonomy-context-palette__list">
              <li
                v-for="cv in contextValues"
                :key="cv.id"
                class="taxonomy-context-palette__item"
              >
                <span
                  class="taxonomy-context-palette__swatch"
                  :style="cv.color ? { backgroundColor: cv.color } : {}"
                  aria-hidden="true"
                />
                <span class="taxonomy-context-palette__label">{{ contextValueName(cv) }}</span>
              </li>
            </ul>
          </div>
        </section>

        <section class="taxonomy-detail-page__elements">
          <h2 class="taxonomy-detail-page__elements-heading">Elements</h2>
          <ul v-if="decoratedElements.length > 0" class="taxonomy-detail-page__elements-list">
            <li
              v-for="d in decoratedElements"
              :key="d.raw.id"
              class="taxonomy-detail-page__element-row"
            >
              <NuxtLink :to="d.href" class="taxonomy-detail-page__element-link">
                <DtprElement :display="d.display" />
                <UIcon name="i-heroicons-arrow-top-right-on-square" class="taxonomy-detail-page__element-icon" />
              </NuxtLink>
            </li>
          </ul>
          <p v-else class="taxonomy-detail-page__empty">
            No elements declared in this category for the active version.
          </p>
        </section>

        <section v-if="overlay" class="taxonomy-detail-page__overlay">
          <ContentRenderer :value="overlay" />
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.taxonomy-detail-page {
  min-height: 100vh;
}

.taxonomy-detail-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.taxonomy-detail-page__breadcrumb {
  margin: 0.125rem 0 0 0;
  font-size: 0.8125rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.taxonomy-detail-page__crumb {
  color: inherit;
  text-decoration: none;
}

.taxonomy-detail-page__crumb:hover,
.taxonomy-detail-page__crumb:focus-visible {
  color: var(--ui-primary, #10b981);
  text-decoration: underline;
}

.taxonomy-detail-page__main {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.taxonomy-detail-page__hero {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.taxonomy-detail-page__description {
  margin: 0;
  font-size: 1.125rem;
  color: var(--ui-text, inherit);
  max-width: 56rem;
}

.taxonomy-context-palette {
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.75rem;
  padding: 1.25rem;
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
}

.taxonomy-context-palette__heading {
  margin: 0 0 0.75rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.taxonomy-context-palette__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.taxonomy-context-palette__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.375rem;
  min-width: 4rem;
}

.taxonomy-context-palette__swatch {
  display: block;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  background: var(--ui-text-dimmed, rgb(107, 114, 128));
  border: 1px solid rgb(0 0 0 / 0.08);
}

.taxonomy-context-palette__label {
  font-size: 0.75rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  text-align: center;
}

.taxonomy-detail-page__elements {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.taxonomy-detail-page__elements-heading {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  margin: 0;
}

.taxonomy-detail-page__elements-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.75rem;
}

.taxonomy-detail-page__element-link {
  position: relative;
  display: block;
  padding: 1rem;
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.5rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, background-color 0.15s ease;
}

.taxonomy-detail-page__element-link:hover,
.taxonomy-detail-page__element-link:focus-visible {
  border-color: var(--ui-primary, #10b981);
  background: color-mix(in srgb, var(--ui-primary, #10b981) 4%, transparent);
}

.taxonomy-detail-page__element-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1rem;
  height: 1rem;
  opacity: 0.5;
}

.taxonomy-detail-page__element-link:hover .taxonomy-detail-page__element-icon,
.taxonomy-detail-page__element-link:focus-visible .taxonomy-detail-page__element-icon {
  opacity: 1;
}

.taxonomy-detail-page__empty {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.taxonomy-detail-page__overlay {
  border-top: 1px solid var(--ui-border, rgb(229, 231, 235));
  padding-top: 2rem;
}
</style>
