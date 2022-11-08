<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<style lang="postcss">
.card {
  @apply py-6 px-8 rounded-2xl mb-8 md:mb-0;

  p:not(:last-child) {
    @apply mb-4;
  }

  h1 {
    @apply md:text-[3rem] text-[2rem] font-[700] leading-tight mb-4
  }

  h2 {
    @apply text-xl font-bold mb-4;
  }
}
</style>