<script setup lang="ts">
import type { Tag } from '~/canvas-data/grammar'

// A right-aligned classification pill — the counterpart to Marker. Where a
// Marker highlights a value *inside* the reading line, a Tag sits at the far
// end of a row so the published classification (PII / autonomy) never breaks
// the sentence. A palette colour tints the pill and its dot; `null` is muted.
const props = defineProps<{ tag: Tag }>()
</script>

<template>
  <span
    class="tag"
    :class="{ 'tag-neutral': !props.tag.color }"
    :style="props.tag.color ? { '--tagc': props.tag.color } : undefined"
  >{{ props.tag.text }}</span>
</template>
