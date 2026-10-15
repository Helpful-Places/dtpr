<script setup lang="ts">
// An id, shown only in the Developer view, in the developer ink.
defineProps<{ id: string }>()
const developer = useDeveloperView()
</script>

<template>
  <code v-if="developer" class="font-code text-xs text-secondary">{{ id }}</code>
</template>
