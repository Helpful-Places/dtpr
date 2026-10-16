<script setup lang="ts">
// The datachain builder. You edit the datachain itself: one row per category,
// in schema order, with the elements chosen for it.
//   lg and up: element palette | datachain | details, side by side.
//   md to lg:  datachain | details; the palette opens as a panel.
//   below md:  the datachain is the home screen. "+" opens that category's
//              elements full-screen and a chosen element's details slide up.
const { taxonomy, t, icon, locale, version, categoryById, elementById, elementsByCategory } = useTaxonomyContext()
const draft = useDatachainDraft()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const setQuery = (query: Record<string, string | undefined>) => router.replace({ query: { ...route.query, ...query }, hash: route.hash })
const selected = computed(() => route.query.sel as string | undefined)
const slot = computed(() => route.query.slot as string | undefined)

const selectedPlaced = computed(() => (selected.value ? draft.placed(selected.value) : undefined))
const selectedElement = computed(() => elementById.value.get(selected.value ?? ''))
const slotCategory = computed(() => categoryById.value.get(slot.value ?? ''))

const issues = computed(() => (draft.chain.value ? dtprCheckDatachain(taxonomy.value!, draft.chain.value, locale.value) : []))
const issuesFor = (elementId: string) => issues.value.filter((i) => i.elementId === elementId)
const placedIn = (categoryId: string) => draft.elements.value.filter((e) => elementById.value.get(e.element_id)?.category_id === categoryId)
const unknown = computed(() => draft.elements.value.filter((e) => !elementById.value.has(e.element_id)))

const title = computed({
  get: () => (draft.chain.value ? dtprText(draft.chain.value.title, locale.value) : ''),
  set: (text: string) => draft.setTitle(locale.value, text, version.value),
})
const elementTitle = (placed: DtprDatachainElement) => dtprFill(t(elementById.value.get(placed.element_id)!.title), dtprVariableValues(placed, locale.value))
// Accountable and People affected elements carry their own name in a "title" variable.
const placedTitle = (placed: DtprDatachainElement) => dtprVariableValues(placed, locale.value).title || elementTitle(placed)
const placedNote = (placed: DtprDatachainElement) =>
  [dtprVariableValues(placed, locale.value).title ? elementTitle(placed) : '', contextName(placed)].filter(Boolean).join(' · ')
const contextName = (placed: DtprDatachainElement) => {
  const element = elementById.value.get(placed.element_id)
  return t(categoryById.value.get(element?.category_id ?? '')?.element_context?.values.find((v) => v.id === placed.context_type_id)?.name)
}

// Palette
const q = ref('')
const palette = computed(() => {
  const categories = slotCategory.value ? [slotCategory.value] : taxonomy.value!.categories
  const needle = q.value.trim().toLowerCase()
  return categories
    .map((category) => ({
      category,
      elements: (elementsByCategory.value.get(category.id) ?? []).filter((e) => !needle || `${t(e.title)} ${t(e.description)}`.toLowerCase().includes(needle)),
    }))
    .filter((group) => group.elements.length)
})

const isWide = () => window.matchMedia('(min-width: 1024px)').matches

// Read out by screen readers when the datachain changes somewhere else on the page.
const announcement = ref('')
const nameOf = (elementId: string) => dtprFill(t(elementById.value.get(elementId)?.title)) || elementId
watch(selected, (id) => {
  if (id && draft.has(id)) announcement.value = `${nameOf(id)} selected. Its details are in the Element details panel.`
})
const found = computed(() => palette.value.reduce((n, group) => n + group.elements.length, 0))

// Below lg the palette is an overlay, and below md so are the details. While
// they are overlays they behave as modal dialogs.
const overlays = reactive({ palette: false, details: false })
let queries: [MediaQueryList, MediaQueryList] | undefined
const syncOverlays = () => {
  overlays.palette = !queries![0].matches
  overlays.details = !queries![1].matches
}
const paletteEl = ref<HTMLElement>()
const detailsEl = ref<HTMLElement>()
const chainEl = ref<HTMLElement>()
const paletteModal = computed(() => !!slot.value && overlays.palette)
const detailsModal = computed(() => !!selectedPlaced.value && overlays.details)
let lastSelected: string | undefined
watch(selected, (id) => { if (id) lastSelected = id })
useModalFocus(paletteEl, paletteModal)
useModalFocus(detailsEl, detailsModal, () =>
  chainEl.value?.querySelector<HTMLElement>(`[data-element="${CSS.escape(lastSelected ?? '')}"]`) ?? chainEl.value)

function toggle(elementId: string) {
  if (draft.has(elementId)) {
    draft.remove(elementId)
    announcement.value = `${nameOf(elementId)} removed from the datachain.`
    if (selected.value === elementId) setQuery({ sel: undefined })
    return
  }
  if (!draft.add(elementId, version.value)) {
    toast.add({
      title: 'This datachain uses a different schema version',
      description: `It was started on ${draft.chain.value?.schema_version}. Clear it to start again on ${version.value}.`,
      color: 'warning',
    })
    return
  }
  // Where the palette is an overlay, choosing an element closes it and opens the details.
  setQuery({ sel: elementId, ...(isWide() ? {} : { slot: undefined }) })
}

function removeSelected() {
  if (selected.value) {
    draft.remove(selected.value)
    announcement.value = `${nameOf(selected.value)} removed from the datachain.`
  }
  setQuery({ sel: undefined })
}

const onKey = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (slot.value && !isWide()) setQuery({ slot: undefined })
  else if (selected.value) setQuery({ sel: undefined })
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  queries = [window.matchMedia('(min-width: 1024px)'), window.matchMedia('(min-width: 768px)')]
  queries.forEach((query) => query.addEventListener('change', syncOverlays))
  syncOverlays()
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
  queries?.forEach((query) => query.removeEventListener('change', syncOverlays))
})
</script>

<template>
  <div class="grid gap-4 md:grid-cols-[1fr_19rem] lg:grid-cols-[16rem_1fr_19rem]">
    <p class="sr-only" role="status">{{ announcement }}</p>
    <!-- Palette -->
    <div v-if="slot" class="fixed inset-0 z-30 hidden bg-black/30 md:block lg:hidden" @click="setQuery({ slot: undefined })" />
    <aside
      ref="paletteEl" tabindex="-1"
      class="overflow-y-auto border-rule bg-elevated outline-none lg:static lg:z-auto lg:block lg:h-[78vh] lg:w-auto lg:rounded-md lg:border lg:shadow-sm"
      :class="slot ? 'fixed inset-0 z-40 block md:right-auto md:w-96 md:border-r md:shadow-2xl' : 'hidden'"
      :role="paletteModal ? 'dialog' : undefined" :aria-modal="paletteModal ? 'true' : undefined" :aria-label="slotCategory ? `Add to ${t(slotCategory.name)}` : 'Elements'"
    >
      <h2 class="sr-only">Elements</h2>
      <div class="sticky top-0 z-10 space-y-2 border-b border-default bg-elevated p-3 lg:p-2">
        <div v-if="slotCategory" class="flex items-start justify-between gap-3 lg:hidden">
          <div>
            <p class="font-code text-xs text-primary">Add to {{ t(slotCategory.name) }}</p>
            <p class="font-serif text-xl font-semibold leading-snug text-highlighted">{{ t(slotCategory.prompt) }}</p>
          </div>
          <UButton color="neutral" variant="outline" size="sm" label="Done" @click="setQuery({ slot: undefined })" />
        </div>
        <UInput v-model="q" type="search" icon="i-lucide-search" placeholder="Find an element" size="sm" class="w-full" aria-label="Find an element" />
        <button v-if="slot" class="hidden font-code text-xs text-primary underline lg:block" @click="setQuery({ slot: undefined })">Show all categories</button>
        <p class="sr-only" role="status">{{ q.trim() ? `${found} ${found === 1 ? 'element matches' : 'elements match'}` : '' }}</p>
      </div>
      <p v-if="!palette.length" class="p-4 text-sm text-muted">No elements match.</p>
      <div v-for="group in palette" :key="group.category.id" class="p-2">
        <h3 class="hidden px-1 pb-1 font-code text-xs uppercase tracking-wide text-muted lg:block">{{ t(group.category.name) }}</h3>
        <button
          v-for="e in group.elements" :key="e.id" type="button"
          class="flex w-full items-center gap-3 rounded px-2 py-2 text-left text-sm hover:bg-white lg:gap-2 lg:px-1 lg:py-1"
          :class="draft.has(e.id) && 'text-primary'" :aria-pressed="draft.has(e.id)"
          @click="toggle(e.id)"
        >
          <img :src="icon(e)" alt="" class="size-11 shrink-0 lg:size-7" loading="lazy">
          <span class="min-w-0 flex-1">
            <span class="block font-medium lg:truncate lg:font-normal">{{ dtprFill(t(e.title)) }}</span>
            <span class="line-clamp-2 text-xs text-muted lg:hidden">{{ dtprFill(t(e.description)) }}</span>
          </span>
          <UIcon :name="draft.has(e.id) ? 'i-lucide-check' : 'i-lucide-plus'" class="shrink-0" />
        </button>
      </div>
    </aside>

    <!-- The datachain -->
    <div ref="chainEl" tabindex="-1" class="rounded-md border border-rule bg-white p-4 shadow-sm outline-none sm:p-6">
      <h2 class="sr-only">Your datachain</h2>
      <textarea
        v-model="title" rows="1" placeholder="Name this system" aria-label="Datachain name"
        class="field-sizing-content w-full resize-none border-b border-dashed border-default bg-transparent pb-2 font-serif text-2xl font-semibold text-highlighted outline-offset-4 outline-primary placeholder:text-muted focus:border-primary focus-visible:outline-2"
      />
      <div class="mt-3 divide-y divide-default">
        <div v-for="c in taxonomy!.categories" :key="c.id" class="grid items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[11rem_1fr]">
          <div>
            <h3 class="text-sm font-medium leading-tight text-highlighted">
              {{ t(c.name) }}
              <span v-if="c.required && !placedIn(c.id).length" class="ml-1 font-code text-xs font-normal text-warning">required</span>
            </h3>
            <p v-if="!placedIn(c.id).length" class="mt-0.5 text-xs leading-snug text-muted">{{ t(c.prompt) }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="p in placedIn(c.id)" :key="p.element_id" type="button"
              class="flex items-center gap-2 rounded-md border py-1 pl-1 pr-3 text-left text-sm"
              :class="selected === p.element_id ? 'border-primary bg-accented' : issuesFor(p.element_id).length ? 'border-warning/60 bg-warning/5' : 'border-default hover:border-primary/50'"
              :aria-pressed="selected === p.element_id" :data-element="p.element_id"
              @click="setQuery({ sel: p.element_id })"
            >
              <img :src="icon(elementById.get(p.element_id)!, p.context_type_id)" alt="" class="size-10 shrink-0">
              <span class="max-w-40 leading-tight">
                <span class="block">{{ placedTitle(p) }}</span>
                <span v-if="issuesFor(p.element_id).length" class="flex items-center gap-1 text-xs text-warning">
                  <UIcon name="i-lucide-circle-alert" class="shrink-0" />Needs details
                </span>
                <span v-else-if="placedNote(p)" class="block text-xs text-muted">{{ placedNote(p) }}</span>
              </span>
            </button>
            <button
              type="button"
              class="flex size-11 items-center justify-center rounded-md border border-dashed"
              :class="[c.required && !placedIn(c.id).length ? 'border-warning text-warning' : 'border-default text-muted hover:border-primary hover:text-primary', slot === c.id && 'bg-accented']"
              :aria-label="`Add to ${t(c.name)}`"
              @click="setQuery({ slot: c.id })"
            ><UIcon name="i-lucide-plus" /></button>
          </div>
        </div>

        <div v-if="unknown.length" class="py-3">
          <p class="text-sm font-medium text-warning">Not in {{ version }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="p in unknown" :key="p.element_id" class="flex items-center gap-2 rounded-md border border-warning/60 px-2 py-1 font-code text-xs">
              {{ p.element_id }}
              <button type="button" class="-my-1 -mr-1 flex size-6 items-center justify-center rounded-sm hover:bg-warning/10" :aria-label="`Remove ${p.element_id}`" @click="draft.remove(p.element_id)"><UIcon name="i-lucide-x" /></button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <aside class="space-y-4">
      <!-- Details: a column from md up, a bottom sheet below -->
      <div v-if="selectedPlaced" class="fixed inset-0 z-30 bg-black/30 md:hidden" @click="setQuery({ sel: undefined })" />
      <div
        ref="detailsEl" tabindex="-1"
        class="border-rule bg-elevated p-4 outline-none md:static md:z-auto md:block md:max-h-none md:rounded-md md:border md:shadow-sm"
        :class="selectedPlaced ? 'fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto rounded-t-xl border-t shadow-2xl' : 'hidden'"
        :role="detailsModal ? 'dialog' : 'region'" :aria-modal="detailsModal ? 'true' : undefined" aria-label="Element details"
      >
        <h2 class="sr-only">Element details</h2>
        <template v-if="selectedPlaced && selectedElement">
          <div class="flex items-start gap-3">
            <img :src="icon(selectedElement, selectedPlaced.context_type_id)" alt="" class="size-14 shrink-0">
            <div class="min-w-0 flex-1">
              <p class="font-code text-xs text-primary">{{ t(categoryById.get(selectedElement.category_id)!.name) }}</p>
              <p class="font-medium leading-tight text-highlighted">{{ placedTitle(selectedPlaced) }}</p>
            </div>
            <UButton class="md:hidden" color="neutral" variant="outline" size="sm" label="Done" @click="setQuery({ sel: undefined })" />
          </div>
          <p class="my-3 text-sm text-muted">{{ dtprFill(t(selectedElement.description), dtprVariableValues(selectedPlaced, locale)) }}</p>
          <TaxonomyBuilderFields :placed="selectedPlaced" :element="selectedElement" :category="categoryById.get(selectedElement.category_id)!" />
          <UButton class="mt-4" size="xs" color="error" variant="ghost" icon="i-lucide-trash-2" label="Remove from datachain" @click="removeSelected" />
        </template>
        <p v-else class="text-sm text-muted">Select an element on the datachain to choose its context and fill in its details.</p>
      </div>

      <TaxonomyBuilderExport :issues="issues" />
    </aside>
  </div>
</template>
