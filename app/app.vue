<template>
  <div>
    <NavHeader />

    <NuxtPage/>

    <AppFooter />
  </div>
</template>

<script setup>
  useHead({
    titleTemplate: (titleChunk) => {
      return titleChunk ? `${titleChunk} - Digital Trust for Places & Routines` : 'Digital Trust for Places & Routines';
    },
    meta: [
      { name: 'description', content: 'Open-source communication standard to bring transparency, legibility, and accountability to technology.' },
      { name: 'og:image', content: 'https://dtpr.io/og-image.png' }
    ],
    script: [
      { defer: true, 'data-domain': "dtpr.io", src: "https://plausible.io/js/script.js" }
    ]
  })
</script>

<style lang="postcss">
  body {
    @apply font-sans dark:bg-white dark:text-black;
  }
  
  .app-container {
    @apply container mx-auto px-4;
  }

  a.u-line {
    @apply border-b-2 transition ease-in-out;

    &:hover {
      @apply border-b-4;
    }
  }
</style>