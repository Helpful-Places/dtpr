<script setup lang="ts">
// Override docus's default landing template (node_modules/docus/app/templates/
// landing.vue) so the homepage content is constrained by the same `UContainer`
// max-width that wraps every docs page. Without this override the rendered
// markdown stretches edge-to-edge while the rest of the site is centered.
const route = useRoute()

const { data: page } = await useAsyncData('landing', () =>
  queryCollection('landing').path(route.path).first(),
)

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
