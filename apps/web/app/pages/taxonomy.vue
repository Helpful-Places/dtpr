<script setup lang="ts">
// The Taxonomy section: one title, one toolbar for the view, schema version and
// locale, and the view itself underneath. Exploring and building are two views
// of the same taxonomy, so they share everything above the fold.
definePageMeta({
  // Switching view, category or element keeps the page where it is.
  scrollToTop: (to, from) => !from.path.startsWith('/taxonomy'),
})

const context = await useTaxonomy()
provideTaxonomy(context)
const { taxonomy } = context

if (!taxonomy.value) {
  throw createError({ statusCode: 502, statusMessage: 'The taxonomy could not be loaded', fatal: true })
}

// The hero's words come from content/taxonomy/index.md, so they can be edited in Studio.
const { data: intro } = await useAsyncData('taxonomy-hero', () => queryCollection('taxonomy').path('/taxonomy').first())
</script>

<template>
  <!-- The same hero as every other page. Printing the list sets its own title. -->
  <Hero :eyebrow="intro?.title ?? 'The Taxonomy'" :heading="intro?.heading ?? intro?.title ?? 'The Taxonomy'" class="print:hidden" />
  <UContainer class="pb-8 sm:pb-10">
    <TaxonomyToolbar />

    <UAlert
      v-if="taxonomy!.missingVersion" color="warning" variant="subtle" class="mt-4 print:hidden"
      :title="`Schema version ${taxonomy!.missingVersion} is not available`"
      :description="`Showing ${taxonomy!.version.id} instead.`"
    />

    <div class="mt-6">
      <NuxtPage />
    </div>

    <TaxonomyConceptModal />
  </UContainer>
</template>
