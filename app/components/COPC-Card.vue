<template>
  <div class="flex flex-col justify-start">
    <div class="h-6rem flex flex-col justify-around mb-5">
      <NuxtLink :to="url">
        <NuxtImg class="rounded max-w-[10rem] max-h-[6rem] mb-2 mx-auto" :src='`/images/${imageFile}`' :alt="imageAlt"/>
      </NuxtLink>
    </div>
    <div class="">
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