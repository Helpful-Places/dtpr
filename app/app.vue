<template>
  <div>
    <NavHeader />

    <NuxtLayout>
      <NuxtPage/>
    </NuxtLayout>

    <AppFooter />
  </div>
</template>

<style lang="postcss">
  body {
    @apply font-sans;
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