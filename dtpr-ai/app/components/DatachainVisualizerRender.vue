<script setup lang="ts">
// Wraps DtprDatachain for the visualizer page. Owns the section build
// and the expand-all toggle; the parent provides the resolved instance
// and the active locale.
import { computed, ref, watch } from 'vue'
import {
  DtprDatachain,
  DtprElementDetail,
  DtprElementGrid,
} from '@dtpr/ui/vue'
import '@dtpr/ui/vue/styles.css'
import { buildResolvedSections, extract } from '@dtpr/ui/core'
import type { ResolvedDatachainInstance } from '@dtpr/ui/core'

interface Props {
  resolved: ResolvedDatachainInstance
  locale: string
}

const props = defineProps<Props>()

const expandAll = ref(false)

const sections = computed(() => buildResolvedSections(props.resolved, props.locale))

const title = computed(() => extract(props.resolved.instance.title, props.locale))
const description = computed(() =>
  extract(props.resolved.instance.description, props.locale),
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
