<script setup lang="ts">
import PageAssembler from '~/components/pageAssembler.vue'

const route = useRoute()

const { data: page } = await useAsyncData('page-' + route.path, () =>
  queryCollection('pages').path(route.path).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

usePageSeo(page)
</script>

<template>
  <PageAssembler v-if="page" :sections="page.sections" />
</template>
