<script setup lang="ts">
// The taxonomy as three cards. On a category they read categories, the category,
// its elements; picking an element slides the list left and the element opens on
// the right, which is the builder's grid, so switching view keeps the frame.
//   lg and up: all three side by side.
//   md to lg:  the entry and the list, with categories in a dropdown.
//   below md:  one pane at a time, drilling down, with a back bar.
// The route decides what is selected, so every category and element has a URL.
const props = defineProps<{ kind?: 'categories' | 'elements', id?: string }>()
const { taxonomy, t, icon, to, categoryById, elementById, elementsByCategory } = useTaxonomyContext()
const draft = useDatachainDraft()
const builder = useFeature('builder')
const router = useRouter()

const element = computed(() => (props.kind === 'elements' ? elementById.value.get(props.id ?? '') : undefined))
const category = computed(() =>
  categoryById.value.get(element.value?.category_id ?? (props.kind === 'categories' ? props.id ?? '' : ''))
  ?? taxonomy.value!.categories[0]!,
)
const missing = computed(() => !!props.kind && !element.value && category.value.id !== props.id)
const categoryElements = computed(() => elementsByCategory.value.get(category.value.id) ?? [])

// Which single pane a phone shows.
const level = computed(() => (props.kind === 'elements' ? 'element' : props.kind === 'categories' ? 'elements' : 'categories'))

// Search filters the list it sits above; matches elsewhere are offered underneath.
const q = ref('')
watch(() => category.value.id, () => { q.value = '' })
const matches = (e: DtprElement) => `${t(e.title)} ${t(e.description)} ${e.id}`.toLowerCase().includes(q.value.trim().toLowerCase())
const list = computed(() => (q.value.trim() ? categoryElements.value.filter(matches) : categoryElements.value))
const elsewhere = computed(() => (q.value.trim() ? taxonomy.value!.elements.filter((e) => e.category_id !== category.value.id && matches(e)) : []))

// What a category or an element is, from the concepts, in a dialog.
const { explain } = useConcept()
const listHeader = 'flex min-h-11 items-center justify-between gap-2 bg-elevated pl-4 pr-1.5 md:pl-3'
const listTitle = 'font-sans text-xs font-semibold uppercase tracking-wider text-primary'

const categoryItems = computed(() => taxonomy.value!.categories.map((c) => ({ label: t(c.name), value: c.id })))

// On a phone each step replaces the pane, so start it from the top.
const root = ref<HTMLElement>()
watch(() => [props.kind, props.id], () => {
  if (window.matchMedia('(max-width: 767px)').matches) root.value?.scrollIntoView({ block: 'start' })
}, { flush: 'post' })

// Opening or closing an element swaps the list and the entry, so the list slides
// from where it was to where it is, and the entry fades in behind it.
const listPane = ref<HTMLElement>()
const entryPane = ref<HTMLElement>()
watch(() => !!element.value, async () => {
  const pane = listPane.value
  if (!pane || !window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)').matches) return
  const before = pane.getBoundingClientRect().left
  await nextTick()
  const dx = before - pane.getBoundingClientRect().left
  const timing = { duration: 300, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  pane.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], timing)
  entryPane.value?.animate([{ opacity: 0 }, { opacity: 1 }], timing)
})
</script>

<template>
  <div ref="root" class="scroll-mt-4">
    <TaxonomyViewBar class="mb-4" :anchor="element ? `#element-${element.id}` : kind ? `#category-${category.id}` : undefined" />

    <TaxonomyTranslationNotice class="mb-4 rounded-md border print:hidden" />

    <!-- Back bar: phones only -->
    <NuxtLink
      v-if="level !== 'categories'"
      :to="to(level === 'element' && element ? `/taxonomy/categories/${category.id}` : '/taxonomy')"
      class="mb-3 flex min-h-11 w-full items-center gap-2 rounded-md bg-white px-4 text-sm text-primary shadow-sm ring ring-rule md:hidden print:hidden"
    >
      <span aria-hidden="true">←</span>
      {{ level === 'element' && element ? t(category.name) : 'All categories' }}
    </NuxtLink>

    <!-- Printed from the panes, the page is the entry alone. The Print button prints the list. -->
    <div
      class="md:grid md:h-[78vh] md:min-h-[32rem] md:gap-4 print:block! print:h-auto! print:min-h-0!"
      :class="element ? 'md:grid-cols-[19rem_1fr] lg:grid-cols-[16rem_20rem_1fr]' : 'md:grid-cols-[1fr_19rem] lg:grid-cols-[16rem_1fr_20rem]'"
    >
      <!-- Categories. Phones and large screens. -->
      <nav aria-label="Categories" class="rounded-md bg-elevated pb-2 text-sm shadow-sm ring ring-rule lg:block lg:overflow-y-auto print:hidden!" :class="level === 'categories' ? 'block md:hidden' : 'hidden'">
        <div :class="[listHeader, 'sticky top-0 z-10 border-b border-default']">
          <h2 :class="listTitle">Categories</h2>
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-info" square aria-label="What is a category?" @click="explain('category')" />
        </div>
        <NuxtLink
          v-for="c in taxonomy!.categories" :key="c.id" :to="to(`/taxonomy/categories/${c.id}`)"
          class="flex w-full items-start gap-3 px-4 py-3 hover:bg-accented lg:gap-2 lg:px-3 lg:py-2"
          :class="category.id === c.id && 'lg:bg-accented'"
          :aria-current="kind && category.id === c.id ? 'true' : undefined"
        >
          <img :src="dtprShapeUrl(c.shape)" alt="" class="mt-0.5 size-5 shrink-0 lg:size-4">
          <span class="min-w-0 flex-1">
            <span class="block font-medium text-highlighted">{{ t(c.name) }}</span>
            <span class="block text-sm text-muted lg:hidden">{{ t(c.prompt) }}</span>
            <span class="block text-xs text-muted">{{ elementsByCategory.get(c.id)?.length ?? 0 }} {{ elementsByCategory.get(c.id)?.length === 1 ? 'element' : 'elements' }}<span v-if="c.required" class="text-warning"> · required</span></span>
          </span>
          <span class="self-center text-muted lg:hidden" aria-hidden="true">›</span>
        </NuxtLink>
      </nav>

      <!-- The category's elements: after the category, before an element. Above the entry while it slides. -->
      <div
        ref="listPane" class="overflow-hidden rounded-md bg-elevated shadow-sm ring ring-rule md:relative md:z-10 md:block md:overflow-y-auto print:hidden!"
        :class="[level === 'elements' ? 'block' : 'hidden', element ? 'md:order-1' : 'md:order-2']"
      >
        <div :class="[listHeader, 'sticky top-0 z-20 border-b border-default']">
          <h2 :class="listTitle">
            Elements <span class="ml-1 font-code font-normal tracking-normal text-muted">{{ categoryElements.length }}</span>
          </h2>
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-info" square aria-label="What is an element?" @click="explain('element')" />
        </div>
        <div class="hidden border-b border-default p-2 md:block lg:hidden">
          <USelect
            :items="categoryItems" :model-value="category.id" class="w-full" aria-label="Category"
            @update:model-value="(id: string) => router.push(to(`/taxonomy/categories/${id}`))"
          />
        </div>
        <!-- Phones only: from md the category has its own card beside the list. -->
        <div class="border-b border-default bg-default p-4 md:hidden">
          <p class="font-serif text-2xl font-semibold leading-snug text-highlighted">{{ t(category.prompt) }}</p>
          <p class="mt-1 text-sm text-muted">{{ t(category.description) }}</p>
          <details class="mt-3">
            <summary class="cursor-pointer font-code text-xs text-primary">About this category</summary>
            <TaxonomyCategoryOverview class="mt-4" :category="category" :elements="categoryElements" />
          </details>
        </div>
        <!-- Sits under the 44px list header. -->
        <div class="sticky top-11 z-10 border-b border-default bg-elevated p-2">
          <UInput v-model="q" type="search" icon="i-lucide-search" placeholder="Search elements" size="sm" class="w-full" aria-label="Search elements" />
        </div>

        <p class="sr-only" role="status">{{ q.trim() ? `${list.length} in ${t(category.name)}, ${elsewhere.length} in other categories` : '' }}</p>
        <p v-if="q.trim() && !list.length" class="border-b border-default px-4 py-3 text-sm text-muted md:px-3">No matches in {{ t(category.name) }}.</p>
        <NuxtLink
          v-for="e in list" :key="e.id" :to="to(`/taxonomy/elements/${e.id}`)"
          class="flex w-full items-center gap-3 border-b border-default px-4 py-2.5 hover:bg-white md:px-3 md:py-2"
          :class="element?.id === e.id && 'bg-white shadow-[inset_3px_0_0_var(--ui-primary)]'"
          :aria-current="element?.id === e.id ? 'page' : undefined"
        >
          <img :src="icon(e)" alt="" class="size-11 shrink-0 md:size-9" width="44" height="44" loading="lazy">
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-medium text-highlighted md:truncate">{{ dtprFill(t(e.title)) }}</span>
            <span class="line-clamp-2 text-xs text-muted md:hidden">{{ dtprFill(t(e.description)) }}</span>
          </span>
          <UIcon v-if="builder && draft.has(e.id)" name="i-lucide-check" class="shrink-0 text-primary" aria-label="In your datachain" />
          <span class="text-muted md:hidden" aria-hidden="true">›</span>
        </NuxtLink>

        <template v-if="elsewhere.length">
          <p class="border-b border-default bg-default px-4 py-2 font-code text-xs text-muted md:px-3">{{ elsewhere.length }} in other categories</p>
          <NuxtLink
            v-for="e in elsewhere" :key="e.id" :to="to(`/taxonomy/elements/${e.id}`)"
            class="flex w-full items-center gap-3 border-b border-default px-4 py-2 hover:bg-white md:px-3"
          >
            <img :src="icon(e)" alt="" class="size-9 shrink-0" width="36" height="36" loading="lazy">
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-highlighted">{{ dtprFill(t(e.title)) }}</span>
              <span class="block font-code text-xs text-muted">{{ t(categoryById.get(e.category_id)?.name) }}</span>
            </span>
          </NuxtLink>
        </template>
      </div>

      <!-- The entry: the element on the right, or the category in the middle when no element is selected -->
      <div
        ref="entryPane" class="rounded-md bg-white p-4 shadow-sm ring ring-rule sm:p-6 md:block md:overflow-y-auto print:block! print:overflow-visible! print:p-0! print:shadow-none! print:ring-0!"
        :class="[level === 'element' ? 'block' : 'hidden', element ? 'md:order-2' : 'md:order-1']"
      >
        <div v-if="missing" class="max-w-xl">
          <h2 class="font-serif text-2xl font-semibold text-highlighted">Not in this schema version</h2>
          <p class="mt-2 text-muted">
            <code class="font-code text-sm">{{ id }}</code> is not {{ kind === 'elements' ? 'an element' : 'a category' }} in {{ taxonomy!.version.id }}.
            It may have been renamed or retired.
          </p>
        </div>
        <TaxonomyElementDetail v-else-if="element" :element="element" :category="category" />
        <TaxonomyCategoryOverview v-else :category="category" :elements="categoryElements" />
      </div>
    </div>
  </div>
</template>
