<script setup lang="ts">
// Shown when the taxonomy is being read in a locale that has not had a human review.
const { translation, locale, to } = useTaxonomyContext()
</script>

<template>
  <div v-if="dtprNeedsReview(translation?.status)" class="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-default bg-warning/5 px-4 py-2 text-sm">
    <span class="font-medium text-warning">{{ dtprLocaleName(locale) }}: {{ dtprTranslationStatusLabel(translation!.status).toLowerCase() }} translation.</span>
    <span class="text-muted">It has not been checked by a fluent reviewer.</span>
    <NuxtLink :to="to('/taxonomy/translations', { locale: undefined })" class="text-primary underline">Translation status</NuxtLink>
  </div>
</template>
