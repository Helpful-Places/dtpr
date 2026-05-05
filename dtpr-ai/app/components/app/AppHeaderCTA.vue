<script setup lang="ts">
// Local shadow of docus's AppHeaderCTA (see node_modules/docus/app/
// components/app/AppHeaderCTA.vue, which is an empty `<div />` by
// default). This is docus's canonical extension point for right-side
// header buttons — it renders left of UColorModeButton and the
// GitHub link.
</script>

<template>
  <UButton
    to="/taxonomy"
    label="Taxonomy"
    color="neutral"
    variant="ghost"
    icon="i-heroicons-rectangle-stack"
  />
</template>
