<script setup lang="ts">
import '@dtpr/ui/vue/styles.css'
import { deriveElementDisplay, extract } from '@dtpr/ui/core'
import type { Category, Element } from '@dtpr/ui/core'
import {
  DTPR_API_BASE,
  DTPR_FETCH_TIMEOUT_MS,
  useDtprState,
} from '../../../composables/useDtprState'

interface ElementResponse {
  ok: boolean
  version: string
  element: Element & { category_id?: string; category_ids?: string[] }
}

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: Category[]
}

const route = useRoute()
const elementId = computed(() => String(route.params.id))
const overlayPath = computed(() => `/taxonomy/elements/${elementId.value}`)

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

const queryString = computed(() => {
  const parts: string[] = []
  if (route.query.v) parts.push(`v=${encodeURIComponent(String(route.query.v))}`)
  if (route.query.locale) parts.push(`locale=${encodeURIComponent(String(route.query.locale))}`)
  return parts.length ? `?${parts.join('&')}` : ''
})

const backToTaxonomyHref = computed(() => `/taxonomy${queryString.value}`)

const elementUrl = computed(() => {
  if (!activeVersion.value || !elementId.value) return null
  const locale = activeLocale.value
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId.value}?fields=all&locales=${locale},en`
})

const categoriesUrl = computed(() => {
  if (!activeVersion.value) return null
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/categories?locales=${activeLocale.value},en`
})

const { data: elementData, error: elementError } = await useAsyncData<ElementResponse | undefined>(
  'dtpr-element-detail',
  () =>
    elementUrl.value
      ? $fetch<ElementResponse>(elementUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale, elementId] },
)

const { data: categoriesData } = await useAsyncData<CategoriesResponse | undefined>(
  'dtpr-element-detail-categories',
  () =>
    categoriesUrl.value
      ? $fetch<CategoriesResponse>(categoriesUrl.value, { timeout: DTPR_FETCH_TIMEOUT_MS })
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

// Optional editorial overlay md file at content/taxonomy/elements/<id>.md.
// queryCollection on Cloudflare Workers preset can throw for missing
// entries on some setups, so wrap defensively rather than surface a
// fatal hydration error for a page that is fully functional without
// the overlay.
const { data: overlay } = await useAsyncData(
  () => `dtpr-element-overlay-${elementId.value}`,
  async () => {
    try {
      const result = await queryCollection('docs').path(overlayPath.value).first()
      return result ?? null
    } catch {
      return null
    }
  },
  { watch: [elementId] },
)

const element = computed<Element | null>(() => {
  const raw = elementData.value?.element
  if (!raw) return null
  return raw as Element
})

const categoryId = computed<string | null>(() => {
  const raw = elementData.value?.element
  if (!raw) return null
  if (Array.isArray(raw.category_ids) && raw.category_ids.length > 0) {
    return raw.category_ids[0]!
  }
  if (typeof raw.category_id === 'string' && raw.category_id.length > 0) {
    return raw.category_id
  }
  return null
})

const category = computed<Category | null>(() => {
  const id = categoryId.value
  if (!id) return null
  return categoriesData.value?.categories.find((c) => c.id === id) ?? null
})

const iconUrl = computed(() => {
  if (!activeVersion.value || !elementId.value) return ''
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId.value}/icon.svg`
})

const display = computed(() => {
  if (!element.value) return null
  return deriveElementDisplay(element.value, undefined, activeLocale.value, {
    iconUrl: iconUrl.value,
  })
})

const notFound = computed(() => {
  if (elementError.value) return true
  if (elementData.value && !elementData.value.element) return true
  return false
})

const categoryTitle = computed(() => {
  const c = category.value
  if (!c) return ''
  return extract(c.name, activeLocale.value, 'en')
})

const categoryHref = computed(() => {
  const id = categoryId.value
  if (!id) return null
  return `/taxonomy/categories/${id}${queryString.value}`
})

useHead(() => ({
  title: display.value ? `${display.value.title} — DTPR Taxonomy` : 'Element — DTPR Taxonomy',
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
        <h1 class="taxonomy-detail-page__title">
          {{ display ? display.title : elementId }}
        </h1>
        <p class="taxonomy-detail-page__breadcrumb">
          <NuxtLink :to="backToTaxonomyHref" class="taxonomy-detail-page__crumb">Taxonomy</NuxtLink>
          <template v-if="categoryHref">
            <span class="taxonomy-detail-page__crumb-sep">/</span>
            <NuxtLink :to="categoryHref" class="taxonomy-detail-page__crumb">{{ categoryTitle }}</NuxtLink>
          </template>
        </p>
      </template>
    </DtprPageHeader>

    <main class="taxonomy-detail-page__main">
      <UAlert
        v-if="notFound"
        color="warning"
        variant="subtle"
        icon="i-heroicons-exclamation-triangle"
        title="Element not found"
        :description="`No element with id &quot;${elementId}&quot; exists in this schema version.`"
      >
        <template #actions>
          <UButton :to="backToTaxonomyHref" variant="solid" color="primary">
            Back to taxonomy
          </UButton>
        </template>
      </UAlert>

      <article v-else-if="element" class="taxonomy-detail-page__article">
        <DtprPlayground
          :element="element"
          :category="category"
          :locale="activeLocale"
          :base-icon-url="iconUrl"
        />
        <section v-if="overlay" class="taxonomy-detail-page__overlay">
          <ContentRenderer :value="overlay" />
        </section>
      </article>
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
  display: flex;
  gap: 0.375rem;
  align-items: center;
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

.taxonomy-detail-page__crumb-sep {
  opacity: 0.6;
}

.taxonomy-detail-page__main {
  max-width: 64rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.taxonomy-detail-page__article {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.taxonomy-detail-page__overlay {
  border-top: 1px solid var(--ui-border, rgb(229, 231, 235));
  padding-top: 2rem;
}
</style>
