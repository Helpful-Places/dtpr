<script setup lang="ts">
// A pill badge for a taxonomy fact, such as Required or Hexagon. Given a concept
// term, the badge itself is a button that opens that concept's definition.
// Every badge is the same height, with or without an image or icon inside.
const props = defineProps<{ color: 'warning' | 'neutral', variant: 'subtle' | 'outline', term?: string, label: string }>()
const { explain } = useConcept()
</script>

<template>
  <button
    v-if="term" type="button" aria-haspopup="dialog" :aria-label="`${label}: what does this mean?`"
    class="inline-flex shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-80"
    @click="explain(props.term!)"
  >
    <UBadge :color="color" :variant="variant" size="sm" class="h-6 rounded-full">
      <slot />{{ label }}
    </UBadge>
  </button>
  <UBadge v-else :color="color" :variant="variant" size="sm" class="h-6 shrink-0 rounded-full">
    <slot />{{ label }}
  </UBadge>
</template>
