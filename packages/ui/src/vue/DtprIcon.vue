<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { HEXAGON_FALLBACK_DATA_URI } from '../core/index.js'

interface Props {
  src?: string
  // Required. Pass '' for a decorative icon (role will be suppressed).
  alt: string
  // Square dimension in pixels for width + height.
  size?: number
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  size: 48,
})

const emit = defineEmits<{ (e: 'error', event: Event): void }>()

const failed = ref(false)

// Reset failed state when src changes so consumers can retry with a new url.
watch(
  () => props.src,
  () => {
    failed.value = false
  },
)

const effectiveSrc = computed(() =>
  failed.value || !props.src ? HEXAGON_FALLBACK_DATA_URI : props.src,
)

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
