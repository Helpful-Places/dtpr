<script setup lang="ts">
import type { ElementDisplay } from '../core/index.js'
import DtprIcon from './DtprIcon.vue'

interface Props {
  // Pre-derived display data (use `deriveElementDisplay` from `@dtpr/ui/core`).
  display: ElementDisplay
  // Icon size in pixels. Defaults to 48.
  iconSize?: number
}

withDefaults(defineProps<Props>(), {
  iconSize: 48,
})
</script>

<template>
  <figure class="dtpr-element">
    <DtprIcon
      class="dtpr-element__icon"
      :src="display.icon.url"
      :alt="display.icon.alt"
      :size="iconSize"
    />
    <figcaption class="dtpr-element__title">{{ display.title }}</figcaption>
  </figure>
</template>
