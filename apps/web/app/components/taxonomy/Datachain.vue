<script setup lang="ts">
// Your datachain: the elements added in Explore. A drawer over the panes, so
// adding and reviewing happen in one view. Nothing here is required. A name, a context value and the variables can be filled in if
// wanted; otherwise the download is the elements and their icons.
const { taxonomy, t, icon, to, locale, version, categoryById, elementById } = useTaxonomyContext()
const draft = useDatachainDraft()
const { open, building, offVersion, downloadPackage, downloadJson, shareLink } = useDatachainPanel()
const copy = useCopy()
const toast = useToast()
const route = useRoute()
const router = useRouter()

const elements = computed(() => draft.elements.value)
const groups = computed(() => taxonomy.value!.categories
  .map((category) => ({ category, placed: elements.value.filter((e) => elementById.value.get(e.element_id)?.category_id === category.id) }))
  .filter((group) => group.placed.length))
const unknown = computed(() => elements.value.filter((e) => !elementById.value.has(e.element_id)))

const title = computed({
  get: () => (draft.chain.value ? dtprText(draft.chain.value.title, locale.value) : ''),
  set: (text: string) => draft.setTitle(locale.value, text, version.value),
})
const elementTitle = (placed: DtprDatachainElement) => dtprFill(t(elementById.value.get(placed.element_id)!.title), dtprVariableValues(placed, locale.value))
// Accountable and People affected elements carry their own name in a "title" variable.
const placedTitle = (placed: DtprDatachainElement) => dtprVariableValues(placed, locale.value).title || elementTitle(placed)
const placedNote = (placed: DtprDatachainElement) => {
  const element = elementById.value.get(placed.element_id)
  const context = t(categoryById.value.get(element?.category_id ?? '')?.element_context?.values.find((v) => v.id === placed.context_type_id)?.name)
  return [dtprVariableValues(placed, locale.value).title ? elementTitle(placed) : '', context].filter(Boolean).join(' · ')
}
const hasFields = (element: DtprElement) => !!categoryById.value.get(element.category_id)?.element_context || element.variables.length > 0

// Elements can be moved up and down within their category. The order is the
// datachain's priority, which is what the package and the summary follow.
const moved = ref('')
async function move(group: { placed: DtprDatachainElement[] }, placed: DtprDatachainElement, by: -1 | 1) {
  const at = group.placed.indexOf(placed)
  const other = group.placed[at + by]
  if (!other) return
  draft.swap(placed.element_id, other.element_id)
  moved.value = `${placedTitle(placed)} moved ${by < 0 ? 'up' : 'down'}, now ${at + by + 1} of ${group.placed.length}.`
  // Moving the card moves its DOM node, which drops focus. Put it back on the
  // same arrow, or the other one once the card has reached an end.
  await nextTick()
  const arrow = (dir: 'up' | 'down') => document.querySelector<HTMLButtonElement>(`[data-move="${placed.element_id}:${dir}"]`)
  const same = arrow(by < 0 ? 'up' : 'down')
  ;(same && !same.disabled ? same : arrow(by < 0 ? 'down' : 'up'))?.focus()
}

// Which elements show their context and variables.
const expanded = ref(new Set<string>())
const toggleExpanded = (id: string) => { expanded.value.has(id) ? expanded.value.delete(id) : expanded.value.add(id) }

// The datachain stays on the schema version it was started on.
const chainVersion = computed(() => draft.chain.value?.schema_version)
const otherVersion = computed(() => !!elements.value.length && !!chainVersion.value && chainVersion.value !== version.value)
const listedVersion = computed(() => taxonomy.value!.versions.some((v) => v.id === chainVersion.value))
const switchVersion = () => router.replace({ query: { ...route.query, v: chainVersion.value }, hash: '' })

/** Replace the datachain with another and show it on its schema version. Returns whether that navigated. */
function openChain(input: unknown) {
  draft.load(input)
  open.value = true
  if (!listedVersion.value || chainVersion.value === version.value) return false
  switchVersion()
  return true
}

// A share link carries a datachain in the URL fragment. With nothing to lose it
// opens straight away; otherwise it waits to be chosen over the current one.
const shared = ref<unknown>(null)
function openShared() {
  let switched = false
  try {
    switched = openChain(shared.value)
  }
  catch (error: any) {
    toast.add({ title: 'The shared datachain could not be opened', description: error.message, color: 'error' })
  }
  shared.value = null
  // A version switch already drops the fragment; a second replace would cancel it.
  if (!switched) router.replace({ query: route.query, hash: '' })
}
onMounted(() => {
  if (!window.location.hash.startsWith('#data=')) return
  try {
    shared.value = dtprDecodeShare(window.location.hash)
  }
  catch {
    toast.add({ title: 'This share link is damaged', description: 'Ask for it to be sent again.', color: 'error' })
    return
  }
  if (!shared.value) return
  if (!elements.value.length) openShared()
  else open.value = true
})

const examples = [
  { label: 'NYPD facial recognition', src: '/data/nypd-facial-recognition.datachain.json' },
  { label: 'Long Beach mobility sensor', src: '/data/long-beach-numina-mobility-sensor.datachain.json' },
]
async function loadExample(src: string) {
  try {
    openChain(await $fetch(src))
  }
  catch {
    toast.add({ title: 'The example could not be loaded', color: 'error' })
  }
}

const jsonOpen = ref(false)
const pasteOpen = ref(false)
const pasted = ref('')
const pasteError = ref('')
function loadPasted() {
  try {
    openChain(JSON.parse(pasted.value))
    pasteOpen.value = false
    pasted.value = ''
    pasteError.value = ''
  }
  catch (error: any) {
    pasteError.value = error instanceof SyntaxError ? 'This is not valid JSON.' : error.message
  }
}
async function onFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) pasted.value = await file.text()
}

const moreItems = computed(() => [
  [{ label: 'View JSON', icon: 'i-lucide-braces', disabled: !elements.value.length, onSelect: () => { jsonOpen.value = true } }],
  [
    ...examples.map((e) => ({ label: `Example: ${e.label}`, icon: 'i-lucide-file-text', onSelect: () => loadExample(e.src) })),
    { label: 'Open a datachain…', icon: 'i-lucide-folder-open', onSelect: () => { pasteOpen.value = true } },
  ],
  [{ label: 'Clear the datachain', icon: 'i-lucide-trash-2', color: 'error' as const, disabled: !draft.chain.value, onSelect: () => draft.clear() }],
])
</script>

<template>
  <USlideover
    v-model:open="open" title="Your datachain"
    description="The elements you have added. Download them with their icons, or share the link."
    :ui="{ content: 'max-w-md' }"
  >
    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="shared" color="info" variant="subtle" title="This link carries a datachain"
          description="Opening it replaces your datachain."
          :actions="[{ label: 'Open it', onClick: openShared }, { label: 'Keep mine', color: 'neutral', variant: 'outline', onClick: () => { shared = null } }]"
        />
        <UAlert
          v-if="otherVersion" color="warning" variant="subtle"
          :title="`This datachain is on ${chainVersion}`"
          :description="listedVersion ? `You are looking at ${version}. A datachain uses one schema version.` : `The DTPR API no longer lists that version. It is shown against ${version}; elements that no longer exist are marked.`"
          :actions="listedVersion ? [{ label: `Switch to ${chainVersion}`, onClick: switchVersion }, { label: `Start over on ${version}`, color: 'neutral', variant: 'outline', onClick: () => draft.clear() }] : []"
        />

        <p class="sr-only" role="status">{{ moved }}</p>
        <p v-if="!elements.length" class="text-sm text-muted">
          Nothing added yet. Press <UIcon name="i-lucide-plus" class="inline size-4 align-text-bottom" aria-label="plus" /> on an element to add it to your datachain.
        </p>
        <template v-else>
          <UInput v-model="title" placeholder="Name this datachain" aria-label="Datachain name" class="w-full" />

          <section v-for="group in groups" :key="group.category.id">
            <h3 class="font-code text-xs uppercase tracking-wide text-muted">{{ t(group.category.name) }}</h3>
            <div v-for="p in group.placed" :key="p.element_id" class="mt-2 rounded-md border border-default bg-white">
              <div class="flex items-center gap-2 p-2">
                <img :src="icon(elementById.get(p.element_id)!, p.context_type_id)" alt="" class="size-10 shrink-0">
                <NuxtLink :to="to(`/taxonomy/elements/${p.element_id}`)" class="min-w-0 flex-1 leading-tight hover:text-primary" @click="open = false">
                  <span class="block text-sm font-medium">{{ placedTitle(p) }}</span>
                  <span v-if="placedNote(p)" class="block text-xs text-muted">{{ placedNote(p) }}</span>
                </NuxtLink>
                <span v-if="group.placed.length > 1" class="flex flex-col">
                  <UButton
                    size="xs" color="neutral" variant="ghost" square icon="i-lucide-chevron-up" class="h-4 min-h-0"
                    :disabled="group.placed.indexOf(p) === 0" :aria-label="`Move ${placedTitle(p)} up`" :data-move="`${p.element_id}:up`" @click="move(group, p, -1)"
                  />
                  <UButton
                    size="xs" color="neutral" variant="ghost" square icon="i-lucide-chevron-down" class="h-4 min-h-0"
                    :disabled="group.placed.indexOf(p) === group.placed.length - 1" :aria-label="`Move ${placedTitle(p)} down`" :data-move="`${p.element_id}:down`" @click="move(group, p, 1)"
                  />
                </span>
                <UButton
                  v-if="hasFields(elementById.get(p.element_id)!)"
                  size="xs" color="neutral" variant="ghost" square
                  :icon="expanded.has(p.element_id) ? 'i-lucide-chevron-up' : 'i-lucide-sliders-horizontal'"
                  :aria-expanded="expanded.has(p.element_id)" :aria-label="`Details for ${placedTitle(p)}`"
                  @click="toggleExpanded(p.element_id)"
                />
                <UButton size="xs" color="neutral" variant="ghost" square icon="i-lucide-x" :aria-label="`Remove ${placedTitle(p)}`" @click="draft.remove(p.element_id)" />
              </div>
              <TaxonomyDatachainFields
                v-if="expanded.has(p.element_id)" class="border-t border-default p-3"
                :placed="p" :element="elementById.get(p.element_id)!" :category="group.category"
              />
            </div>
          </section>

          <section v-if="unknown.length">
            <h3 class="font-code text-xs uppercase tracking-wide text-warning">Not in {{ version }}</h3>
            <div class="mt-2 flex flex-wrap gap-2">
              <span v-for="p in unknown" :key="p.element_id" class="flex items-center gap-2 rounded-md border border-warning/60 px-2 py-1 font-code text-xs">
                {{ p.element_id }}
                <button type="button" class="-my-1 -mr-1 flex size-6 items-center justify-center rounded-sm hover:bg-warning/10" :aria-label="`Remove ${p.element_id}`" @click="draft.remove(p.element_id)"><UIcon name="i-lucide-x" /></button>
              </span>
            </div>
          </section>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center gap-2">
        <UButton size="sm" icon="i-lucide-package" label="Download" :disabled="!elements.length || offVersion" :loading="building" @click="downloadPackage" />
        <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-link" label="Share" :disabled="!elements.length" @click="shareLink" />
        <UDropdownMenu :items="moreItems" :content="{ align: 'end' }">
          <UButton size="sm" color="neutral" variant="ghost" icon="i-lucide-ellipsis" square aria-label="More" class="ml-auto" />
        </UDropdownMenu>
        <p class="basis-full text-xs text-muted">The download holds the datachain, its icons as SVG and PNG, and a printable summary.</p>
      </div>
    </template>
  </USlideover>

  <UModal v-model:open="jsonOpen" title="Datachain JSON" description="The datachain in the shape the DTPR API accepts." :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <pre class="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded bg-default p-3 font-code text-xs">{{ JSON.stringify(draft.chain.value, null, 2) }}</pre>
    </template>
    <template #footer>
      <UButton icon="i-lucide-copy" label="Copy" @click="copy(JSON.stringify(draft.chain.value, null, 2), 'JSON')" />
      <UButton color="neutral" variant="outline" icon="i-lucide-download" label="Download .json" @click="downloadJson" />
    </template>
  </UModal>

  <UModal v-model:open="pasteOpen" title="Open a datachain" description="Paste datachain JSON or choose a file. It replaces your datachain.">
    <template #body>
      <UTextarea v-model="pasted" :rows="10" class="w-full font-code" placeholder="{ &quot;schema_version&quot;: &quot;dtpr@…&quot;, &quot;elements&quot;: [ … ] }" aria-label="Datachain JSON" />
      <input type="file" accept="application/json,.json" class="mt-3 block text-sm" aria-label="Datachain file" @change="onFile">
      <p v-if="pasteError" class="mt-3 text-sm text-error" role="alert">{{ pasteError }}</p>
    </template>
    <template #footer>
      <UButton label="Open" :disabled="!pasted.trim()" @click="loadPasted" />
      <UButton color="neutral" variant="outline" label="Cancel" @click="pasteOpen = false" />
    </template>
  </UModal>
</template>
