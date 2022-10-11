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
  
  h1 {
    @apply text-3xl;
  }
  
  a {
    @apply text-blue-300;
  }
  
  .dtpr-container {
    @apply container mx-auto px-4;
  }
  </style>