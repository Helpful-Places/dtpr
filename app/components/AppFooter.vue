<template>
  <footer class="mt-16 bg-gray-100 py-16">
    <div class="app-container">
      <p class="text-gray-600 my-4 text-sm">
        The Icons, Design Guide and Taxonomy for DTPR are licensed by the Digital Trust for Places and Routines contributors under the 
        <NuxtLink to="https://creativecommons.org/licenses/by/4.0/" class="u-line">
          Creative Commons Attribution 4.0 International (CC BY 4.0)
        </NuxtLink>
        <NuxtLink to="https://creativecommons.org/licenses/by/4.0/">
          <Icon icon="fa6-brands:creative-commons" class="icon" />
          <Icon icon="fa6-brands:creative-commons-by" class="icon" />
        </NuxtLink>.
      </p>

      <p class="text-gray-600 my-4 text-sm">
        Portions of the DTPR Icons incorporate elements of, or are derived from, <NuxtLink to="https://fonts.google.com/icons?icon.set=Material+Icons" class="u-line">Material Icons</NuxtLink>.
        They are available under the <NuxtLink to="https://www.apache.org/licenses/LICENSE-2.0" class="u-line">Apache License 2.0</NuxtLink>.
        The source code for this website and the Digital Channel Prototype is licensed under <NuxtLink to="https://www.apache.org/licenses/LICENSE-2.0" class="u-line">Apache License 2.0</NuxtLink>.
      </p>
    </div>

    <div class="app-container mt-8">
      <NuxtLink to="https://github.com/Helpful-Places/dtpr">
        <Icon icon="fa6-brands:github" class="icon" />
      </NuxtLink>
    </div>
  </footer>
</template>


<style lang="postcss" scoped>
.icon {
  font-size: 1.5rem;
  @apply inline text-gray-600;
}
</style>

<script setup>
import { Icon } from '@iconify/vue';
</script>