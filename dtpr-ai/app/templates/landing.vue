<script setup lang="ts">
// Local override of docus's landing template
// (node_modules/docus/app/templates/landing.vue, docus@5.11.0). Mirrors
// the upstream verbatim except the rendered content is wrapped in
// <UContainer> so the homepage matches the top-bar width
// (`--ui-container`, 90rem) instead of stretching to the viewport edge.
//
// On a docus version bump, re-sync this file against the upstream and
// preserve the UContainer wrapper.
import type { Collections } from '@nuxt/content'

const route = useRoute()
const { locale, isEnabled } = useDocusI18n()

const collectionName = computed(() => isEnabled.value ? `landing_${locale.value}` : 'landing')

const { data: page } = await useAsyncData(collectionName.value, () => queryCollection(collectionName.value as keyof Collections).path(route.path).first())
if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const title = page.value.seo?.title || page.value.title
const description = page.value.seo?.description || page.value.description

useSeo({
  title,
  description,
  type: 'website',
  ogImage: page.value?.seo?.ogImage as string | undefined,
})

if (!page.value?.seo?.ogImage) {
  defineOgImage('Landing', {
    title: title?.slice(0, 60),
    description: formatOgDescription(title, description),
  })
}
</script>

<template>
  <UContainer>
    <ContentRenderer
      v-if="page"
      :value="page"
    />
  </UContainer>
</template>
