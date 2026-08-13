<script setup lang="ts">
// Root shell. NuxtLayout applies the default chrome; UApp provides
// @nuxt/ui's overlay/toast context used by the feedback layer.
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
