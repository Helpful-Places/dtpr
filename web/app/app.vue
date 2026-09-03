<script setup lang="ts">
import AppFooter from './components/appFooter.vue';

</script>



<template>
  <UApp>
  <div class="bg-default" style="background-image: linear-gradient(rgba(65, 105, 225, 0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(65, 105, 225, 0.11) 1px, transparent 1px); background-size: 20px 20px;">
    <navHeader/>
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <AppFooter/>
  </div>
  </UApp>

</template>