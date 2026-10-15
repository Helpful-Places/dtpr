<script setup lang="ts">
// Markdown for developers, shown only in the Developer view, set off by a thin
// blue rule so it reads as an addition to the page:
//   ::dev
//   In the API, a category has an `id`…
//   ::
const developer = useDeveloperView()
</script>

<template>
  <div v-if="developer" class="developer-block my-5">
    <slot />
  </div>
</template>
