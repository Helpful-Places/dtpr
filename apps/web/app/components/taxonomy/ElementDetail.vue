<script setup lang="ts">
// One element: its icon in every variant, plain-language text, downloads, and
// the developer details underneath.
const props = defineProps<{ element: DtprElement, category: DtprCategory }>()
const { t, icon, version, locale } = useTaxonomyContext()
const draft = useDatachainDraft()
const builder = useFeature('builder')
const toast = useToast()

// Which icon variant is on show: a coloured context value, on a light or dark background.
const previewContext = ref<string | null>(null)
const dark = ref(false)
watch(() => props.element.id, () => { previewContext.value = null; dark.value = false })

const context = computed(() => props.category.element_context)
const backgrounds = [{ dark: false, label: 'Light', icon: 'i-lucide-sun' }, { dark: true, label: 'Dark', icon: 'i-lucide-moon' }]
// Context values that change this element's icon, so the context rows choose
// between them. A value with no colour has a variant too, but it is the plain icon.
const choices = computed(() => context.value?.values.filter((v) => v.color && props.element.icon_variants.includes(v.id)).map((v) => v.id) ?? [])
const variant = computed(() => dtprIconVariant(props.element, previewContext.value, dark.value))
const iconSrc = computed(() => dtprIconUrl(version.value, props.element.id, variant.value))
const title = computed(() => dtprFill(t(props.element.title)))
const fileName = computed(() => `${props.element.id}${variant.value === 'default' ? '' : `.${variant.value}`}`)

const busy = ref<string | null>(null)
async function download(format: 'svg' | 'png') {
  busy.value = format
  try {
    const svg = await dtprFetchSvg(iconSrc.value)
    const blob = format === 'svg'
      ? new Blob([svg], { type: 'image/svg+xml' })
      : new Blob([await dtprSvgToPng(svg) as BlobPart], { type: 'image/png' })
    dtprSaveBlob(blob, `${fileName.value}.${format}`)
  }
  catch {
    toast.add({ title: 'The icon could not be downloaded', description: 'Try again in a moment.', color: 'error' })
  }
  finally {
    busy.value = null
  }
}
// PNG opens in anything, so it is the button; SVG is a step away for print and design.
const formatItems = [
  { label: 'PNG, 512 × 512', icon: 'i-lucide-image', onSelect: () => download('png') },
  { label: 'SVG, for print and design', icon: 'i-lucide-pen-tool', onSelect: () => download('svg') },
]

// Read out by screen readers; the button's own label changes silently.
const draftStatus = ref('')
watch(() => props.element.id, () => { draftStatus.value = '' })

function toggleDraft() {
  if (draft.has(props.element.id)) {
    draft.remove(props.element.id)
    draftStatus.value = `${title.value} removed from your datachain.`
    return
  }
  if (draft.add(props.element.id, version.value)) {
    draftStatus.value = `${title.value} added to your datachain.`
  }
  else {
    toast.add({
      title: 'Your datachain uses a different schema version',
      description: `It was started on ${draft.chain.value?.schema_version}. Switch to that version or clear it in the builder.`,
      color: 'warning',
    })
  }
}

const developerRows = computed(() => [
  { label: 'REST', value: `GET ${dtprSchemaUrl(version.value)}/elements/${props.element.id}${locale.value === DTPR_SOURCE_LOCALE ? '' : `?locales=${locale.value}`}` },
  { label: 'MCP', value: `get_element({ "version": "${version.value}", "element_id": "${props.element.id}" })` },
  ...props.element.icon_variants.map((v) => ({ label: `Icon, ${v}`, value: dtprIconUrl(version.value, props.element.id, v) })),
])
</script>

<template>
  <article>
    <!-- The title across the top; the icon below it, level with the description. -->
    <TaxonomyCopyLink :path="`/taxonomy/elements/${element.id}`" />
    <h2 class="font-serif text-3xl font-semibold text-highlighted">{{ title }}</h2>
    <DeveloperId :id="element.id" class="mt-1 block" />
    <div class="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
      <!-- The icon, the background it is drawn for, and its download, which takes the variant on show. -->
      <div class="w-40 shrink-0">
        <div class="flex size-40 items-center justify-center rounded-md border border-default transition-colors" :class="dark ? 'bg-inverted' : 'bg-white'">
          <img :src="iconSrc" :alt="`${title} icon`" class="size-32" width="128" height="128">
        </div>
        <!-- The same two outline buttons as Panes and List, the current one on cool paper. -->
        <UFieldGroup class="mt-2 flex w-full print:hidden" role="group" aria-label="Background">
          <UButton
            v-for="option in backgrounds" :key="option.label"
            size="sm" color="neutral" variant="outline" :icon="option.icon" :label="option.label" class="flex-1 justify-center"
            :class="dark === option.dark && 'bg-accented text-primary'" :aria-pressed="dark === option.dark" @click="dark = option.dark"
          />
        </UFieldGroup>
        <UFieldGroup class="mt-2 flex w-full print:hidden">
          <UButton size="sm" icon="i-lucide-download" label="Download PNG" class="flex-1 justify-center" :loading="busy !== null" @click="download('png')" />
          <UDropdownMenu :items="formatItems" :content="{ align: 'end' }">
            <UButton size="sm" icon="i-lucide-chevron-down" square aria-label="Other formats" class="border-l border-white/30" />
          </UDropdownMenu>
        </UFieldGroup>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-default">{{ dtprFill(t(element.description)) }}</p>
        <UButton
          v-if="builder"
          size="sm" color="neutral" variant="outline" class="mt-4 print:hidden"
          :icon="draft.has(element.id) ? 'i-lucide-check' : 'i-lucide-plus'"
          :label="draft.has(element.id) ? 'In your datachain' : 'Add to datachain'"
          @click="toggleDraft"
        />
        <p class="sr-only" role="status">{{ draftStatus }}</p>
      </div>
    </div>


    <TaxonomyContextList v-if="context" v-model="previewContext" class="mt-8" :context="context" :choices="choices" />

    <TaxonomyVariableList v-if="element.variables.length" class="mt-8" :variables="element.variables" />

    <TaxonomyNotes class="mt-8" :item="element" />

    <TaxonomyDeveloperPanel class="mt-8" :rows="developerRows" :json="element" />
  </article>
</template>
