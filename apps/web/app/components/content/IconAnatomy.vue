<script setup lang="ts">
// One icon taken apart into symbol, shape and icon, for the docs:
//   ::icon-anatomy{element-id="input_biometric"}
//   ::
import IconAnatomyFigure from '../guide/IconAnatomyFigure.vue'

defineProps<{ elementId: string, schemaVersion?: string }>()
</script>

<template>
  <IconAnatomyFigure class="my-6" :element-id="elementId" :schema-version="schemaVersion" />
</template>
