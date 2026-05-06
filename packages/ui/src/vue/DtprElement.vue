<script setup lang="ts">
import { computed, useSlots } from 'vue'
import type { ElementDisplay } from '../core/index.js'
import DtprIcon from './DtprIcon.vue'

interface Props {
  // Pre-derived display data (use `deriveElementDisplay` from `@dtpr/ui/core`).
  display: ElementDisplay
  // Icon size in pixels. Defaults to 48.
  iconSize?: number
  // When true and `display.description` is non-empty, render the description
  // inline beneath the title. Defaults to false to preserve compact icon+title
  // cards for datachain/SSR consumers.
  showDescription?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  iconSize: 48,
  showDescription: false,
})

const slots = useSlots()

const hasDescription = computed(
  () => props.showDescription && props.display.description.length > 0,
)
const hasFooter = computed(() => !!slots.footer)
</script>

<template>
  <article
    class="dtpr-element"
    :class="{ 'dtpr-element--has-footer': hasFooter }"
  >
    <div class="dtpr-element__main">
      <div class="dtpr-element__header">
        <DtprIcon
          class="dtpr-element__icon"
          :src="display.icon.url"
          :dark-src="display.icon.urlDark"
          :alt="display.icon.alt"
          :size="iconSize"
        />
        <span class="dtpr-element__title">{{ display.title }}</span>
      </div>
      <p v-if="hasDescription" class="dtpr-element__description">
        {{ display.description }}
      </p>
    </div>
    <div v-if="hasFooter" class="dtpr-element__footer">
      <slot name="footer" />
    </div>
  </article>
</template>
