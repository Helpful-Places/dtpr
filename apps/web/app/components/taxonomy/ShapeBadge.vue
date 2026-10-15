<script setup lang="ts">
// The outline a category gives its icons, as a badge beside Required or Optional.
const props = defineProps<{ shape: string, term?: string }>()
// Shape ids read as words: `rounded-square` is "Rounded square".
const name = computed(() => {
  const words = props.shape.replaceAll('-', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
})
</script>

<template>
  <TaxonomyConceptBadge :label="name" color="neutral" variant="outline" :term="term">
    <img :src="dtprShapeUrl(shape)" alt="" class="size-3.5 shrink-0">
  </TaxonomyConceptBadge>
</template>
