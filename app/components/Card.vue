<template>
  <div class="card">
    <slot></slot>
  </div>
</template>

<style lang="postcss">
.card {
  @apply py-6 px-8 rounded-2xl;

  p:not(:last-child) {
    @apply mb-4;
  }

  h2 {
    @apply text-xl font-bold mb-4;
  }
}
</style>