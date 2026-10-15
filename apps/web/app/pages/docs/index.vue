<script setup lang="ts">
// The docs chooser is a Studio page (content/pages/docs.yaml). Without this,
// the docs catch-all beside it would claim /docs.
import PageAssembler from '~/components/pageAssembler.vue'

const { data: page } = await useAsyncData('page-/docs', () =>
  queryCollection('pages').path('/docs').first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

usePageSeo(page)
</script>

<template>
  <PageAssembler v-if="page" :sections="page.sections" />
</template>
