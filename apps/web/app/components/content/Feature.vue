<script setup lang="ts">
// Markdown that only shows while a feature is on:
//   ::feature{name="builder"}
//   Compose a datachain in the [builder](/taxonomy/builder).
//   ::
const props = defineProps<{ name: FeatureName }>()
const on = useFeature(props.name)
</script>

<template>
  <slot v-if="on" />
</template>
