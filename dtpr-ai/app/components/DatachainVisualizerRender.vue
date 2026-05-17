<script setup lang="ts">
// Wraps DtprDatachain for the visualizer page. Owns the section build
// and the expand-all toggle; the parent provides the resolved instance
// and the active locale.
import { computed, ref, watch, watchEffect } from 'vue'
import {
  DtprDatachain,
  DtprElementDetail,
  DtprElementGrid,
} from '@dtpr/ui/vue'
import '@dtpr/ui/vue/styles.css'
import { buildResolvedSections, extract } from '@dtpr/ui/core'
import type {
  Category,
  Element,
  InstanceElement,
  ResolvedDatachainInstance,
} from '@dtpr/ui/core'
import { DTPR_API_BASE, DTPR_FETCH_TIMEOUT_MS } from '../utils/dtpr-api-config'

interface CategoriesResponse {
  ok: boolean
  version: string
  categories: Category[]
}

interface Props {
  resolved: ResolvedDatachainInstance
  locale: string
}

const props = defineProps<Props>()

// Default to all-expanded — the visualizer is a debugging surface,
// so seeing the whole resolved chain at a glance is the common case.
// The "Collapse to one" button still drops back to single-section
// accordion behavior.
const expandAll = ref(true)

// Empty / unreferenced categories aren't pinned into `schema_snapshot.categories`
// (R6 — the resolver only freezes referenced + required categories), so
// `buildResolvedSections` falls back to the bare category id for the
// section title. Fetch the full category list for the pinned
// `schema_version` and use it to backfill those titles. Kept as a
// best-effort enrichment: on fetch failure the section just keeps its
// id-fallback title rather than blocking the whole render.
const liveCategories = ref<Category[]>([])

watchEffect(async () => {
  const version = props.resolved.schema_version
  const locale = props.locale
  try {
    const res = await $fetch<CategoriesResponse>(
      `${DTPR_API_BASE}/schemas/${encodeURIComponent(version)}/categories?locales=${encodeURIComponent(locale)},en`,
      { timeout: DTPR_FETCH_TIMEOUT_MS },
    )
    liveCategories.value = res.categories ?? []
  } catch {
    liveCategories.value = []
  }
})

const categoryTitleById = computed<Map<string, string>>(() => {
  const map = new Map<string, string>()
  for (const c of liveCategories.value) {
    const name = extract(c.name, props.locale, 'en')
    if (name) map.set(c.id, name)
  }
  return map
})

// Compose the composed-icon URLs served by the public DTPR API. The
// resolved instance pins `schema_version`, so the URL stays stable
// even if the live schema evolves. The composed-icon route accepts a
// variant token of `{base}[.dark]` (parseVariantToken in api/src/rest
// — `icon.vendor.dark.svg` is a real, served variant), so a placement
// with `context_type_id` gets the colored icon in both light and dark
// modes rather than dropping the dark counterpart when context is
// active.
const iconBase = computed(
  () =>
    `${DTPR_API_BASE}/schemas/${encodeURIComponent(props.resolved.schema_version)}/elements`,
)

function iconUrlFor(element: Element, placement: InstanceElement): string {
  const ctx = placement.context_type_id
  const variant = ctx ? `icon.${encodeURIComponent(ctx)}` : 'icon'
  return `${iconBase.value}/${encodeURIComponent(element.id)}/${variant}.svg`
}

function iconUrlDarkFor(
  element: Element,
  placement: InstanceElement,
): string {
  const ctx = placement.context_type_id
  const variant = ctx ? `icon.${encodeURIComponent(ctx)}.dark` : 'icon.dark'
  return `${iconBase.value}/${encodeURIComponent(element.id)}/${variant}.svg`
}

const sections = computed(() => {
  const built = buildResolvedSections(props.resolved, props.locale, {
    iconUrlFor,
    iconUrlDarkFor,
  })
  // `buildResolvedSections` returns the bare id as title for any
  // declared category whose definition isn't pinned in the snapshot
  // (R6 keeps the snapshot to referenced + required categories).
  // Swap in the live category name when available.
  const titleMap = categoryTitleById.value
  if (titleMap.size === 0) return built
  return built.map((s) => {
    if (s.title !== s.id) return s
    const live = titleMap.get(s.id)
    return live ? { ...s, title: live } : s
  })
})

const title = computed(() => extract(props.resolved.title, props.locale))
const description = computed(() =>
  extract(props.resolved.description, props.locale),
)

// Keep the accordion's open id stable as long as that section still
// exists in the rebuilt sections list (e.g. after a locale switch).
// Falls back to the first section when the previously open id is gone
// or when no section was open yet.
const openSectionId = ref<string | null>(null)

watch(
  sections,
  (next) => {
    if (next.length === 0) {
      openSectionId.value = null
      return
    }
    if (!openSectionId.value || !next.some((s) => s.id === openSectionId.value)) {
      openSectionId.value = next[0].id
    }
  },
  { immediate: true },
)

function toggleExpandAll() {
  expandAll.value = !expandAll.value
}
</script>

<template>
  <section class="dcv-render">
    <div class="dcv-render__toolbar">
      <span class="dcv-render__sections-count">
        {{ sections.length }} {{ sections.length === 1 ? 'section' : 'sections' }}
      </span>
      <UButton
        size="xs"
        color="neutral"
        variant="subtle"
        :icon="expandAll ? 'i-heroicons-arrows-pointing-in' : 'i-heroicons-arrows-pointing-out'"
        @click="toggleExpandAll"
      >
        {{ expandAll ? 'Collapse to one' : 'Expand all' }}
      </UButton>
    </div>

    <DtprDatachain
      v-model:open-section-id="openSectionId"
      :sections="sections"
      :title="title || undefined"
      :description="description || undefined"
      :disable-accordion="expandAll"
    >
      <template
        v-for="section in sections"
        :key="section.id"
        #[`section-${section.id}`]
      >
        <DtprElementGrid v-if="section.elements.length > 0">
          <DtprElementDetail
            v-for="display in section.elements"
            :key="display.title + display.icon.url"
            :display="display"
          />
        </DtprElementGrid>
        <p v-else class="dcv-render__empty-section">
          No elements placed in this category.
        </p>
      </template>
      <template #empty>
        <p class="dcv-render__empty">
          The resolved chain has no sections to render.
        </p>
      </template>
    </DtprDatachain>
  </section>
</template>

<style scoped>
.dcv-render {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dcv-render__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.dcv-render__sections-count {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dcv-render__empty,
.dcv-render__empty-section {
  margin: 0;
  padding: 1rem 0;
  font-size: 0.875rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-style: italic;
}
</style>
