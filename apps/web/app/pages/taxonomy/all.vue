<script setup lang="ts">
// The whole taxonomy as one plain page, for printing and for reading end to end.
const { taxonomy, version, t, icon, to, elementsByCategory } = useTaxonomyContext()
const route = useRoute()

// A category's elements in rows of two, the printed card sheet's width.
const rows = (categoryId: string) => {
  const elements = elementsByCategory.value.get(categoryId) ?? []
  return Array.from({ length: Math.ceil(elements.length / 2) }, (_, i) => elements.slice(i * 2, i * 2 + 2))
}

usePageSeo({ title: 'Full list · DTPR Taxonomy', description: 'Every category and element in the DTPR taxonomy on one page.' })

// ?print: loaded to be printed, usually in a hidden frame from the panes.
// Every icon loads at once, and the page says when it is ready.
const printMode = route.query.print !== undefined
onMounted(async () => {
  if (!printMode) {
    // Arriving from the panes with a category or element in the hash: open there.
    if (route.hash) document.getElementById(route.hash.slice(1))?.scrollIntoView()
    return
  }
  await Promise.all([...document.images].map((img) => img.complete || new Promise((resolve) => { img.onload = img.onerror = resolve })))
  await document.fonts.ready
  if (window.parent !== window) window.parent.postMessage({ type: 'dtpr:print-ready' }, window.location.origin)
  else window.print()
})
</script>

<template>
  <div>
    <TaxonomyViewBar class="mb-4" />
    <TaxonomyTranslationNotice class="mb-4 rounded-md border print:hidden" />

    <div class="rounded-md bg-white p-5 shadow-sm ring ring-rule sm:p-10 print:rounded-none print:p-0 print:shadow-none print:ring-0 [&>section:last-child]:mb-0">
    <!-- The printed title: what this is and which schema version it shows. -->
    <header class="mb-8 hidden border-b border-rule pb-4 print:block">
      <p class="font-sans text-3xl font-semibold">DTPR Taxonomy</p>
      <p class="mt-1 font-code text-xs text-muted">{{ version }}</p>
    </header>

    <!-- Each category reads as its card in the panes: name, question, description,
         then how it sits in a datachain. Its elements follow as a grid of cards,
         printed with dashed cut lines so they can be cut out and used. -->
    <section v-for="c in taxonomy!.categories" :id="`category-${c.id}`" :key="c.id" class="mb-10 scroll-mt-6 border-t border-rule pt-6 first-of-type:border-0 first-of-type:pt-0 print:mb-8">
      <div class="print:break-inside-avoid print:break-after-avoid">
        <h2 class="font-serif text-2xl font-semibold text-highlighted print:text-xl">
          <NuxtLink :to="to(`/taxonomy/categories/${c.id}`)" class="hover:text-primary">{{ t(c.name) }}</NuxtLink>
        </h2>
        <DeveloperId :id="c.id" class="mt-0.5 block" />
        <p class="mt-1 font-serif text-lg text-default print:text-base">{{ t(c.prompt) }}</p>
        <p class="mt-1 max-w-3xl text-muted print:text-sm">{{ t(c.description) }}</p>
        <div class="mt-3 flex items-center gap-1.5">
          <TaxonomyRequiredBadge :required="c.required" term="required-category" />
          <TaxonomyShapeBadge :shape="c.shape" term="shape" />
        </div>
        <TaxonomyContextList v-if="c.element_context" class="mt-5 print:break-inside-avoid" :context="c.element_context" across />
      </div>
      <!-- On screen the rows dissolve into one responsive grid. In print each row of
           two is kept whole, so a card never splits and the cut lines stay closed. -->
      <div role="list" class="mt-6 grid gap-3 sm:grid-cols-2 print:mt-5 print:block print:pl-px print:pt-px">
        <div v-for="(row, i) in rows(c.id)" :key="i" class="contents print:-mt-px print:grid print:break-inside-avoid print:grid-cols-2" :class="i === 0 && 'print:break-before-avoid'">
          <div
            v-for="e in row" role="listitem" :id="`element-${e.id}`" :key="e.id"
            class="scroll-mt-6 print:-ml-px print:border print:border-dashed print:border-neutral-400"
          >
            <NuxtLink
              :to="to(`/taxonomy/elements/${e.id}`)"
              class="flex h-full gap-3 rounded-md p-3 ring ring-rule transition-colors hover:bg-elevated print:flex-col print:items-start print:gap-2 print:rounded-none print:p-4 print:ring-0"
            >
              <img :src="icon(e)" alt="" class="size-11 shrink-0 print:size-12" width="44" height="44" :loading="printMode ? 'eager' : 'lazy'">
              <span class="min-w-0">
                <span class="block font-medium text-highlighted">{{ dtprFill(t(e.title)) }}</span>
                <DeveloperId :id="e.id" class="block" />
                <span class="mt-0.5 block text-sm text-muted print:text-xs">{{ dtprFill(t(e.description)) }}</span>
              </span>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>
