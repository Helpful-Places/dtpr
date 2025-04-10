<script setup>
useHead({
  title: 'Taxonomy'
})

const links = [[
  { label: 'Sensor', to: '/taxonomy/sensor' },
  { label: 'AI / Alogrithm', to: '/taxonomy/ai' },
]];
</script>

<template>
  <div class="app-container">
    <p class="mt-16">The taxonomy is the core of the open-source DTPR standard, providing a structured framework to define key concepts related to digital technology and data governance.</p>
    <LocaleSwitcher class="mt-8" />

    <UHorizontalNavigation :links="links" class="border-b border-gray-200 dark:border-gray-800" />
    
    <NuxtPage />
  </div>
</template>