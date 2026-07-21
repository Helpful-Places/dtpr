<script setup lang="ts">
import type { Mark } from '~/canvas-data/grammar'

// One highlighter marker — the single mark type from v6. A palette colour
// (PII / autonomy) renders a coloured swipe; `null` renders neutral grey.
const props = defineProps<{ mark: Mark }>()
</script>

<template>
  <span
    class="mk"
    :class="props.mark.color ? 'mk-color' : 'mk-neutral'"
    :style="props.mark.color ? { '--mkc': props.mark.color } : undefined"
  >{{ props.mark.text }}</span>
</template>
