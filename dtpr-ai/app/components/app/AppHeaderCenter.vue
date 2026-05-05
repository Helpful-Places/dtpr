<script setup lang="ts">
// Local shadow of docus's AppHeaderCenter (see node_modules/docus/app/
// components/app/AppHeaderCenter.vue). docus has no first-class
// header.links config in 5.10.0, so the convention is to shadow this
// component to add top-nav links alongside the search button.
</script>

<template>
  <div class="flex items-center gap-2 w-full">
    <UButton
      to="/taxonomy"
      label="Taxonomy"
      color="neutral"
      variant="ghost"
      icon="i-heroicons-rectangle-stack"
      class="shrink-0"
    />
    <UContentSearchButton
      :collapsed="false"
      class="flex-1"
      variant="soft"
      :ui="{
        leadingIcon: 'size-4 mr-1',
      }"
    />
  </div>
</template>
