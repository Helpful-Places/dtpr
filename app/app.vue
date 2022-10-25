<template>
  <div>
    <NavHeader />

    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>
  </div>
</template>

<style lang="postcss">
  body {
    @apply font-sans;
  }
  
  .app-container {
    @apply container mx-auto px-4;
  }
  </style>