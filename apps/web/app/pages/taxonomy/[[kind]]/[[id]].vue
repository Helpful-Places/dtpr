<script setup lang="ts">
// /taxonomy, /taxonomy/categories/:id and /taxonomy/elements/:id are one page,
// so moving between them keeps the explorer's panes and their scroll positions.
definePageMeta({ key: 'taxonomy-explorer' })

const route = useRoute()
const kind = computed(() => (route.params.kind || undefined) as 'categories' | 'elements' | undefined)
const id = computed(() => (route.params.id || undefined) as string | undefined)

const { t, categoryById, elementById } = useTaxonomyContext()

const { data: intro } = await useAsyncData('taxonomy-intro', () => queryCollection('taxonomy').path('/taxonomy').first())

const known = (kind.value === undefined && id.value === undefined)
  || (kind.value === 'categories' && categoryById.value.has(id.value ?? ''))
  || (kind.value === 'elements' && elementById.value.has(id.value ?? ''))
if (!known) {
  throw createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true })
}

usePageSeo(() => {
  const element = kind.value === 'elements' ? elementById.value.get(id.value ?? '') : undefined
  const category = kind.value === 'categories' ? categoryById.value.get(id.value ?? '') : undefined
  if (element) return { title: `${dtprFill(t(element.title))} · DTPR Taxonomy`, description: dtprFill(t(element.description)) }
  if (category) return { title: `${t(category.name)} · DTPR Taxonomy`, description: `${t(category.prompt)} ${t(category.description)}` }
  return { title: intro.value?.title ?? 'The Taxonomy', description: intro.value?.description }
})
</script>

<template>
  <TaxonomyExplorer :kind="kind" :id="id" />
</template>
