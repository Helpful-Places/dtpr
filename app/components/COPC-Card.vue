<template>
  <div class="flex flex-col">
    <NuxtImg
      v-if="imageFile"
      class="rounded-full mx-auto mb-4"
      :src='`/images/${imageFile}`'
      :alt="imageAlt"
      height="100"
      width="100"
      fit="cover"
    />

    <slot />
  </div>
</template>

<script setup>
const props = defineProps({
  title: String,
  imageFile: String,
  imageAlt: String
})
</script>