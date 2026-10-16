<script setup lang="ts">
import AppFooter from './components/appFooter.vue';

useDotGridSnap()

</script>



<template>
  <UApp>
  <div class="graph-paper bg-default">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-4 focus:py-2 focus:text-primary">Skip to content</a>
    <navHeader/>
    <NuxtRouteAnnouncer />
    <main id="main">
      <NuxtPage />
    </main>
    <AppFooter/>
  </div>
  </UApp>

</template>
