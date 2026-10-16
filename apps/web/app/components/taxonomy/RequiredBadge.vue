<script setup lang="ts">
// Required or optional: a category in a datachain, or a variable in an element.
defineProps<{ required: boolean, term?: string }>()
</script>

<template>
  <TaxonomyConceptBadge :label="required ? 'Required' : 'Optional'" :color="required ? 'warning' : 'neutral'" variant="subtle" :term="term" />
</template>
