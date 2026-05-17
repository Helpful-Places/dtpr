<script setup>
useHead({
  title: "Taxonomy",
});

const links = [[{ label: "Devices", to: "/taxonomy/device" }]];
</script>

<template>
  <div class="app-container">
    <UCard
      class="mt-12 mb-8"
      :ui="{ background: 'bg-gray-50 dark:bg-gray-900' }"
    >
      <p class="mb-10">
        The taxonomy is the core of the open-source DTPR standard, providing a
        structured framework to define key concepts related to digital
        technology and data governance. Use this taxonomy as a guide to ensure
        your DTPR implementation effectively communicates these critical
        details. The latest version of the taxonomy and its corresponding icons
        can be directly downloaded by right-clicking on the icons below.
      </p>

      <UButton
        to="https://dtpr.ai/en/taxonomy"
        target="_blank"
        size="lg"
        color="dtpr-blue"
        trailing-icon="i-heroicons-arrow-top-right-on-square"
      >
        View the AI / Algorithms taxonomy at dtpr.ai
      </UButton>
    </UCard>

    <UHorizontalNavigation
      :links="links"
      class="border-b border-gray-200 dark:border-gray-800 mb-4"
    />

    <NuxtPage />
  </div>
</template>
