<script setup lang="ts">
import { computed, ref, watch } from 'vue'

interface Props {
  // Stable id for the section (used in aria-controls).
  id: string
  // Heading text for the section header.
  title: string
  // Controlled expanded state (via v-model:expanded).
  expanded?: boolean
  // When true, section is always expanded and the header is rendered as
  // a non-interactive heading (no button, no aria-expanded).
  disableAccordion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  expanded: undefined,
  disableAccordion: false,
})

const emit = defineEmits<{
  (e: 'update:expanded', value: boolean): void
  (e: 'toggle', value: boolean): void
}>()

// Uncontrolled fallback: if no expanded prop passed, manage state locally.
// Collapsed by default per plan Key Technical Decisions.
const internalExpanded = ref(false)

const isExpanded = computed(() => {
  if (props.disableAccordion) return true
  if (props.expanded === undefined) return internalExpanded.value
  return props.expanded
})

watch(
  () => props.expanded,
  (v) => {
    if (v !== undefined) internalExpanded.value = v
  },
)

const buttonId = computed(() => `dtpr-section-${props.id}-button`)
const panelId = computed(() => `dtpr-section-${props.id}-panel`)

function toggle() {
  if (props.disableAccordion) return
  const next = !isExpanded.value
  if (props.expanded === undefined) internalExpanded.value = next
  emit('update:expanded', next)
  emit('toggle', next)
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  }
}
</script>

<template>
  <section
    class="dtpr-category-section"
    :class="{ 'dtpr-category-section--static': disableAccordion }"
    :data-section-id="id"
  >
    <template v-if="disableAccordion">
      <h2 :id="buttonId" class="dtpr-category-section__title">{{ title }}</h2>
      <div
        :id="panelId"
        class="dtpr-category-section__panel"
        role="region"
        :aria-labelledby="buttonId"
      >
        <slot />
      </div>
    </template>
    <template v-else>
      <button
        :id="buttonId"
        type="button"
        class="dtpr-category-section__header"
        :aria-expanded="isExpanded ? 'true' : 'false'"
        :aria-controls="panelId"
        data-dtpr-collapsible
        @click="toggle"
        @keydown="onKeydown"
      >
        <span class="dtpr-category-section__title">{{ title }}</span>
      </button>
      <div
        :id="panelId"
        class="dtpr-category-section__panel"
        role="region"
        :aria-labelledby="buttonId"
        :hidden="!isExpanded"
      >
        <slot />
      </div>
    </template>
  </section>
</template>
