<script setup lang="ts">
// A responsive grid layout for element collections. Uses CSS @container
// queries so columns adapt to the wrapper's inline-size (not viewport).
// Consumers place their own <DtprElement> (or any content) in the default
// slot — this primitive is layout-only.
</script>

<template>
  <div class="dtpr-element-grid" data-dtpr-element-grid>
    <slot />
  </div>
</template>
