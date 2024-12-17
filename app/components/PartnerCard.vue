<template>
  <div class="flex flex-col justify-between" v-if="url">
    <NuxtLink :to="url">
      <NuxtImg 
        v-if="imageFile"
        class="max-w-[10rem] max-h-[6rem] mb-2 mx-auto"
        :src='`/images/${imageFile}`'
        :alt="imageAlt"
      />
    </NuxtLink>
    <NuxtLink :to="url">
      <slot></slot>
    </NuxtLink>
  </div>
  <div v-else>
    <NuxtImg 
      v-if="imageFile"
      class="max-w-[10rem] max-h-[6rem] mb-2 mx-auto"
      :src='`/images/${imageFile}`'
      :alt="imageAlt"
    />
    <slot></slot>
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