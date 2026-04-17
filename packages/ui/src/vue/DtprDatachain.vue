<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DtprCategorySection from './DtprCategorySection.vue'

interface SectionDescriptor {
  id: string
  title: string
}

interface Props {
  // Ordered list of sections. The parent renders a CategorySection per
  // entry and slots content via the dynamic `#section-<id>` slot.
  sections: readonly SectionDescriptor[]
  // Controlled open-section id (via v-model:openSectionId).
  openSectionId?: string | null
  // When true, every section is always expanded and accordion coordination
  // is bypassed (prop cascades to each child section).
  disableAccordion?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  openSectionId: undefined,
  disableAccordion: false,
})

const emit = defineEmits<{
  (e: 'update:openSectionId', value: string | null): void
}>()

// Uncontrolled fallback: all sections collapsed by default.
const internalOpenId = ref<string | null>(null)

const currentOpenId = computed(() => {
  if (props.openSectionId === undefined) return internalOpenId.value
  return props.openSectionId
})

watch(
  () => props.openSectionId,
  (v) => {
    if (v !== undefined) internalOpenId.value = v ?? null
  },
)

function onSectionToggle(sectionId: string, nextExpanded: boolean) {
  const nextId = nextExpanded ? sectionId : null
  if (props.openSectionId === undefined) internalOpenId.value = nextId
  emit('update:openSectionId', nextId)
}
</script>

<template>
  <div class="dtpr-datachain">
    <template v-if="sections.length > 0">
      <DtprCategorySection
        v-for="section in sections"
        :key="section.id"
        :id="section.id"
        :title="section.title"
        :expanded="disableAccordion ? true : currentOpenId === section.id"
        :disable-accordion="disableAccordion"
        @update:expanded="(v) => onSectionToggle(section.id, v)"
      >
        <slot :name="`section-${section.id}`" :section="section" />
      </DtprCategorySection>
    </template>
    <template v-else>
      <slot name="empty" />
    </template>
  </div>
</template>
