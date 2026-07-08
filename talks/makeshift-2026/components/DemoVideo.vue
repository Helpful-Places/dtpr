<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  src: string
  label?: string
}>()

const errored = ref(false)
</script>

<template>
  <video
    v-if="!errored"
    :src="src"
    controls
    autoplay
    muted
    loop
    class="w-full max-w-5xl"
    @error="errored = true"
  />
  <div
    v-else
    class="w-full max-w-5xl p-16 border-2 border-dashed border-gray-400 rounded text-center opacity-70"
  >
    <div class="text-3xl font-semibold">Demo video TBD</div>
    <div class="mt-3 text-sm font-mono opacity-80">{{ src }}</div>
    <div v-if="label" class="mt-2 text-base opacity-80">{{ label }}</div>
  </div>
</template>
