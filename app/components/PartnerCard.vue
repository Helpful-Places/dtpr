<template>
  <div class="flex flex-col justify-between">
    <div class="h-2/3 flex flex-col justify-around">
      <NuxtLink :to="url">
        <nuxt-img class="max-w-[10rem] max-h-[6rem] mb-2 mx-auto" :src='`/images/${imageFile}`' :alt="imageAlt"/>
      </NuxtLink>
    </div>
    <div class="h-1/3">
      <NuxtLink :to="url">
        <slot></slot>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  url: String,
  title: String,
  imageFile: String,
  imageAlt: String
})
</script>