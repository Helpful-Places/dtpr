<script setup lang="ts">
// Local shadow of docus's AppFooterLeft (see node_modules/docus/app/
// components/app/AppFooterLeft.vue), which prints "Copyright ©". DTPR
// for AI is CC BY 4.0, with AIAAIC-derived risk content under CC BY-SA
// 4.0 — see /attribution for the full breakdown.
const localePath = useLocalePath()
</script>

<template>
  <div class="text-sm text-muted">
    Licensed
    <ULink
      to="https://creativecommons.org/licenses/by/4.0/"
      target="_blank"
      rel="license noopener"
      class="underline decoration-dotted underline-offset-2 hover:text-default"
    >
      CC BY 4.0
    </ULink>
    ·
    <ULink
      :to="localePath('/attribution')"
      class="underline decoration-dotted underline-offset-2 hover:text-default"
    >
      Attribution
    </ULink>
  </div>
</template>
