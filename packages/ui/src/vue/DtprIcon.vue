<script setup lang="ts">
import { computed } from 'vue'
import { HEXAGON_FALLBACK_DATA_URI } from '../core/index.js'

interface Props {
  src?: string
  alt: string
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  size: 48,
})

const effectiveSrc = computed(() => props.src || HEXAGON_FALLBACK_DATA_URI)
</script>

<template>
  <img
    :src="effectiveSrc"
    :alt="alt"
    :width="size"
    :height="size"
    class="dtpr-icon"
  />
</template>

<style>
.dtpr-icon {
  object-fit: contain;
}
</style>
