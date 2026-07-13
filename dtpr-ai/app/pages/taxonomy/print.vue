<script setup lang="ts">
import {
  deriveElementDisplay,
  extract,
  groupElementsByCategory,
  sortCategoriesByOrder,
} from '@dtpr/ui/core'
import type { Category, Element } from '@dtpr/ui/core'
import '@dtpr/ui/vue/styles.css'
import {
  DTPR_API_BASE,
  DTPR_FETCH_TIMEOUT_MS,
  useDtprState,
} from '../../composables/useDtprState'

useHead({
  title: 'Taxonomy — Print',
  // Inject a print-only style that hides the docus shell chrome (site
  // header, sub-navigation, footer) when this page is printed. Lives in
  // useHead so it only applies while the print page is mounted — other
  // surfaces keep their shells intact. Selector targets top-level
  // `<header>` / `<footer>` siblings of `main` inside the app shell;
  // the print page's own `.print-category > header` elements are nested
  // deeper and unaffected.
  style: [
    {
      key: 'dtpr-print-hide-shell',
      innerHTML: `
        @media print {
          header:not(.print-category__header),
          footer,
          aside { display: none !important; }
        }
      `,
    },
  ],
})

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

const ELEMENTS_PAGE_LIMIT = 200

const { activeVersion, activeLocale } = useDtprState()

const { data: catsData } = await useAsyncData(
  'dtpr-print-categories',
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
  'dtpr-print-elements',
  () =>
    activeVersion.value
      ? $fetch<ElementsResponse>(
          `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements?fields=all&limit=${ELEMENTS_PAGE_LIMIT}&locales=${activeLocale.value},en`,
          { timeout: DTPR_FETCH_TIMEOUT_MS },
        )
      : Promise.resolve(undefined),
  { watch: [activeVersion, activeLocale] },
)

const categories = computed<Category[]>(() => catsData.value?.categories ?? [])

// Mirror the index page's truncation guard: the elements endpoint caps at
// ELEMENTS_PAGE_LIMIT and this page ignores `meta.next_cursor`, so a schema
// with more elements would silently print an incomplete reference. Surface
// the shortfall — and keep it visible in the printed output (not `.no-print`)
// so a reader of the paper copy knows categories may be missing elements.
const elementsTotal = computed(() => elsData.value?.meta?.total ?? 0)

const elementsTruncated = computed(() => {
  const total = elsData.value?.meta?.total
  return typeof total === 'number' && total > ELEMENTS_PAGE_LIMIT
})

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

function iconUrlFor(elementId: string): string {
  if (!activeVersion.value) return ''
  return `${DTPR_API_BASE}/schemas/${activeVersion.value}/elements/${elementId}/icon.svg`
}

const grouped = computed(() =>
  groupElementsByCategory(elements.value, categories.value),
)

const sortedCategories = computed(() =>
  sortCategoriesByOrder(grouped.value, categories.value),
)

function localized(values: Parameters<typeof extract>[0]): string {
  return extract(values, activeLocale.value, 'en')
}

interface PrintCategorySection {
  id: string
  title: string
  description: string
  prompt: string
  required: boolean
  contextName: string
  contextDescription: string
  contextValues: Array<{ id: string; name: string; description: string; color: string | null }>
  elements: Array<ReturnType<typeof deriveElementDisplay> & { id: string }>
}

const sections = computed<PrintCategorySection[]>(() => {
  return sortedCategories.value.map((group) => {
    const cat = categories.value.find((c) => c.id === group.id)
    const ctx = cat?.element_context
    return {
      id: group.id,
      title: localized(cat?.name),
      description: localized(cat?.description),
      prompt: localized(cat?.prompt),
      required: cat?.required ?? false,
      contextName: ctx ? localized(ctx.name) : '',
      contextDescription: ctx ? localized(ctx.description) : '',
      contextValues: ctx
        ? ctx.values.map((v) => ({
            id: v.id,
            name: localized(v.name),
            description: localized(v.description),
            color: v.color ?? null,
          }))
        : [],
      elements: group.elements.map((el) => ({
        ...deriveElementDisplay(el, undefined, activeLocale.value, {
          iconUrl: iconUrlFor(el.id),
        }),
        // Carry the element id through as a stable, unique v-for key —
        // titles can collide within a category.
        id: el.id,
      })),
    }
  })
})

function triggerPrint() {
  if (typeof window !== 'undefined') window.print()
}
</script>

<template>
  <div class="print-taxonomy">
    <div class="print-taxonomy__toolbar no-print">
      <div>
        <h1 class="print-taxonomy__title">DTPR Taxonomy — Print Layout</h1>
        <p class="print-taxonomy__subtitle">
          <code>{{ activeVersion || 'ai' }}</code> · locale
          <code>{{ activeLocale }}</code> ·
          {{ sections.length }} categories
        </p>
      </div>
      <div class="print-taxonomy__toolbar-actions">
        <UButton color="primary" icon="i-heroicons-printer" @click="triggerPrint">
          Print
        </UButton>
        <p class="print-taxonomy__hint">
          Tip: print to PDF at A4 / Letter, margins “Default”, background graphics on.
        </p>
      </div>
    </div>

    <div v-if="elementsTruncated" class="print-truncation" role="alert">
      <strong>Incomplete taxonomy.</strong>
      This schema declares {{ elementsTotal }} elements but this layout renders
      only the first {{ ELEMENTS_PAGE_LIMIT }}. The remaining
      {{ elementsTotal - ELEMENTS_PAGE_LIMIT }} are not shown — pagination is
      needed to surface them.
    </div>

    <article
      v-for="section in sections"
      :key="section.id"
      class="print-category"
    >
      <header class="print-category__header">
        <p class="print-category__eyebrow">
          {{ section.required ? 'Required category' : 'Optional category' }}
        </p>
        <h2 class="print-category__title">{{ section.title }}</h2>
        <p v-if="section.prompt" class="print-category__prompt">
          {{ section.prompt }}
        </p>
        <p v-if="section.description" class="print-category__description">
          {{ section.description }}
        </p>
      </header>

      <section v-if="section.contextValues.length > 0" class="print-context">
        <h3 class="print-context__heading">
          Context — {{ section.contextName }}
        </h3>
        <p v-if="section.contextDescription" class="print-context__description">
          {{ section.contextDescription }}
        </p>
        <table class="print-context__values">
          <tbody>
            <tr
              v-for="v in section.contextValues"
              :key="v.id"
              class="print-context__value"
            >
              <td class="print-context__value-cell print-context__value-cell--chip">
                <span
                  class="print-context__chip"
                  :style="v.color ? { backgroundColor: v.color, color: '#fff' } : undefined"
                >{{ v.name }}</span>
              </td>
              <td class="print-context__value-cell print-context__value-cell--desc">
                {{ v.description }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="section.elements.length > 0" class="print-elements">
        <div
          v-for="el in section.elements"
          :key="el.id"
          class="print-element"
        >
          <img
            v-if="el.icon.url"
            class="print-element__icon"
            :src="el.icon.url"
            :alt="el.icon.alt"
            width="40"
            height="40"
          />
          <div class="print-element__body">
            <h4 class="print-element__title">{{ el.title }}</h4>
            <p v-if="el.description" class="print-element__description">
              {{ el.description }}
            </p>
          </div>
        </div>
      </section>
      <p v-else class="print-elements__empty">
        No elements in this category.
      </p>
    </article>
  </div>
</template>

<style scoped>
.print-taxonomy {
  max-width: 60rem;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  color: #111827;
  background: #ffffff;
}

.print-taxonomy__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.print-taxonomy__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.print-taxonomy__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.print-taxonomy__subtitle code {
  font-family: ui-monospace, SFMono-Regular, monospace;
}

.print-taxonomy__toolbar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.print-taxonomy__hint {
  margin: 0;
  font-size: 0.75rem;
  color: #6b7280;
  max-width: 18rem;
  text-align: right;
}

.print-truncation {
  margin: 0 0 2rem;
  padding: 0.75rem 1rem;
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 0.375rem;
  color: #92400e;
  font-size: 0.85rem;
  line-height: 1.4;
  /* Keep the warning on the first page and never split it across pages. */
  break-inside: avoid;
  page-break-inside: avoid;
  break-after: avoid;
  page-break-after: avoid;
}

.print-category {
  padding-bottom: 1.5rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid #e5e7eb;
  /* Each category starts on a new physical page when printed. */
  break-before: page;
  page-break-before: always;
}

.print-category:first-of-type {
  break-before: auto;
  page-break-before: auto;
}

.print-category__header {
  margin-bottom: 1.25rem;
}

.print-category__eyebrow {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6b7280;
  margin: 0 0 0.25rem;
}

.print-category__title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  line-height: 1.15;
}

.print-category__prompt {
  font-size: 1.05rem;
  font-weight: 500;
  font-style: italic;
  margin: 0.5rem 0 0.5rem;
  padding: 0.625rem 0.875rem;
  background: #f3f4f6;
  border-left: 3px solid #111827;
  border-radius: 0.25rem;
  color: #111827;
}

.print-category__description {
  margin: 0.5rem 0 0;
  color: #374151;
  font-size: 0.95rem;
  line-height: 1.45;
}

.print-context {
  margin: 0 0 1.25rem;
  padding: 0.75rem 0.875rem;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
}

.print-context__heading {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #374151;
  margin: 0 0 0.25rem;
}

.print-context__description {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  color: #4b5563;
}

.print-context__values {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.85rem;
  color: #1f2937;
}

.print-context__value-cell {
  vertical-align: top;
  padding: 0.1875rem 0.5rem 0.1875rem 0;
}

.print-context__value-cell--chip {
  /* Auto-size to the widest chip so every description column starts on
     the same x-coordinate, regardless of tag-name length. */
  width: 1%;
  white-space: nowrap;
}

.print-context__value-cell--desc {
  color: #374151;
  padding-right: 0;
}

.print-context__chip {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: #e5e7eb;
  color: #111827;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.75rem;
  white-space: nowrap;
}

.print-elements {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.875rem 1rem;
}

.print-elements__empty {
  font-style: italic;
  color: #6b7280;
  margin: 0;
}

.print-element {
  display: flex;
  gap: 0.625rem;
  align-items: flex-start;
  padding: 0.625rem 0.625rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  background: #ffffff;
  /* Avoid splitting a single element card across pages when printed. */
  break-inside: avoid;
  page-break-inside: avoid;
}

.print-element__icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
}

.print-element__body {
  min-width: 0;
}

.print-element__title {
  margin: 0 0 0.25rem;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.2;
  color: #111827;
}

.print-element__description {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #374151;
}

@media (max-width: 768px) {
  .print-elements {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .print-elements {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media print {
  :global(body) {
    background: #ffffff !important;
  }

  .no-print {
    display: none !important;
  }

  .print-taxonomy {
    max-width: none;
    padding: 0;
    margin: 0;
  }

  .print-category {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }

  /* Keep the 3-column density even on narrow physical pages. */
  .print-elements {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem 0.5rem;
  }

  .print-category__title {
    font-size: 1.5rem;
  }

  .print-element {
    border-color: #d1d5db;
  }
}

@page {
  size: A4;
  margin: 14mm 12mm;
}
</style>
