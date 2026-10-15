<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { DtprElement } from '@dtpr/ui/vue'
import { deriveElementDisplay } from '@dtpr/ui/core'
import type { Element, ElementDisplay } from '@dtpr/ui/core'

// Fetches all elements for a given category id from the live dtpr.ai
// REST API and renders them as a fixed-column grid of <DtprElement>
// cards. Icon URLs use the canonical `/elements/:id/icon.svg` endpoint,
// with a dark-mode variant for hosts that flip themes.
interface Props {
  categoryId: string
  schemaVersion?: string
  locale?: string
  iconSize?: number
  showDescription?: boolean
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  schemaVersion: 'ai@2026-05-06-beta',
  locale: 'en',
  iconSize: 48,
  showDescription: false,
  columns: 3,
})

const API_BASE = 'https://api.dtpr.io/api/v2'

const elements = ref<Element[]>([])
const error = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = null
  try {
    const url = `${API_BASE}/schemas/${props.schemaVersion}/elements?category_id=${encodeURIComponent(props.categoryId)}&locales=${encodeURIComponent(props.locale)}&fields=all`
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = (await res.json()) as { ok: boolean; elements: Element[] }
    if (!json.ok) throw new Error('API returned ok=false')
    elements.value = json.elements
  } catch (e) {
    error.value = (e as Error).message
    elements.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [props.categoryId, props.schemaVersion, props.locale], load)

function iconUrl(id: string, variant: 'default' | 'dark' = 'default') {
  const ext = variant === 'dark' ? 'icon.dark.svg' : 'icon.svg'
  return `${API_BASE}/schemas/${props.schemaVersion}/elements/${id}/${ext}`
}

const displays = computed<{ id: string; display: ElementDisplay }[]>(() =>
  elements.value.map((el) => ({
    id: el.id,
    display: deriveElementDisplay(el, undefined, props.locale, {
      iconUrl: iconUrl(el.id, 'default'),
      iconUrlDark: iconUrl(el.id, 'dark'),
    }),
  })),
)
</script>

<template>
  <div class="dtpr-category-grid-wrap">
    <div v-if="loading" class="dtpr-category-grid-wrap__status">
      Loading {{ categoryId }} elements from dtpr.ai…
    </div>
    <div v-else-if="error" class="dtpr-category-grid-wrap__status dtpr-category-grid-wrap__status--err">
      Failed to load: {{ error }}
    </div>
    <div
      v-else
      class="dtpr-category-grid"
      :style="{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }"
    >
      <DtprElement
        v-for="entry in displays"
        :key="entry.id"
        :display="entry.display"
        :icon-size="iconSize"
        :show-description="showDescription"
      />
    </div>
  </div>
</template>

<style scoped>
.dtpr-category-grid-wrap {
  width: 100%;
}
.dtpr-category-grid {
  display: grid;
  gap: 0.6rem;
  width: 100%;
}
/* Tighten card padding so 9 items in a 3×3 grid fit the slide without
   scrolling. <DtprElement> defaults to 1rem padding + 0.5rem gap. */
.dtpr-category-grid :deep(.dtpr-element) {
  padding: 0.45rem 0.6rem;
  gap: 0.25rem;
}
.dtpr-category-grid :deep(.dtpr-element__header) {
  gap: 0.6rem;
}
.dtpr-category-grid :deep(.dtpr-element__title) {
  font-size: 0.95rem;
  line-height: 1.2;
}
.dtpr-category-grid-wrap__status {
  font-size: 0.9rem;
  opacity: 0.6;
  padding: 1rem;
  text-align: center;
}
.dtpr-category-grid-wrap__status--err {
  color: var(--dtpr-color-warning, #f04a4a);
  opacity: 1;
}
</style>
