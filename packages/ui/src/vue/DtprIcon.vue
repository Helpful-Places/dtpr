<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { HEXAGON_FALLBACK_DATA_URI } from '../core/index.js'
import { useDtprDarkMode } from './use-dark-mode.js'

interface Props {
  src?: string
  // Optional dark-mode src. When set, the component swaps to it when
  // the host is in dark mode (html.dark / prefers-color-scheme). Omit
  // and `src` is used in both modes.
  darkSrc?: string
  // Required. Pass '' for a decorative icon (role will be suppressed).
  alt: string
  // Square dimension in pixels for width + height.
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  darkSrc: '',
  size: 48,
})

const emit = defineEmits<{ (e: 'error', event: Event): void }>()

const failed = ref(false)
const isDark = useDtprDarkMode()

// Reset failed state when either src changes so consumers can retry
// with a new url, and so a dark-mode swap retries cleanly after an
// earlier light-url 404.
watch(
  () => [props.src, props.darkSrc, isDark.value],
  () => {
    failed.value = false
  },
)

const effectiveSrc = computed(() => {
  if (failed.value) return HEXAGON_FALLBACK_DATA_URI
  const preferred = isDark.value && props.darkSrc ? props.darkSrc : props.src
  return preferred || HEXAGON_FALLBACK_DATA_URI
})

// Decorative mode: alt === '' means the image is purely presentational;
// suppress assistive-tech announcement via role='presentation'.
const isDecorative = computed(() => props.alt === '')

function onError(event: Event) {
  failed.value = true
  emit('error', event)
}
</script>

<template>
  <img
    :src="effectiveSrc"
    :alt="alt"
    :width="size"
    :height="size"
    :role="isDecorative ? 'presentation' : undefined"
    class="dtpr-icon"
    @error="onError"
  />
</template>
