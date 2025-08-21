<script setup>
useHead({
  title: 'Taxonomy'
})

const links = [[
  { label: 'Devices', to: '/taxonomy/device' },
  { label: 'AI / Algorithms (beta)', to: '/taxonomy/ai' },
]];
</script>

<template>
  <div class="app-container">
    <UCard class="mt-12 mb-8" :ui="{background: 'bg-gray-50 dark:bg-gray-900'}">
      <p class="mb-10">The taxonomy is the core of the open-source DTPR standard, providing a structured framework to define key concepts related to digital technology and data governance. 
      Use this taxonomy as a guide to ensure your DTPR implementation effectively communicates these critical details. 
      The latest version of the taxonomy and its corresponding icons can be directly downloaded by right-clicking on the icons below. 
      </p>
      
      <p>
      For more information on how to use the DTPR standard in practice, check out <a class="u-line border-dtpr-green-lighter" href="https://helpful-places.gitbook.io/a-guide-to-dtpr">our guide</a> 
      </p>
    </UCard>
    
    <UHorizontalNavigation :links="links" class="border-b border-gray-200 dark:border-gray-800 mb-4" />
    
    <NuxtPage />
  </div>
</template>