<script setup lang="ts">
// One category: the question it answers and the rules its elements follow.
const props = defineProps<{ category: DtprCategory, elements: DtprElement[] }>()
const { t, version, locale } = useTaxonomyContext()
const toast = useToast()

const busy = ref(false)
async function downloadIcons() {
  busy.value = true
  try {
    const files = await dtprIconFiles(version.value, props.elements.map((element) => ({ element })), props.category.id)
    dtprSaveBlob(dtprZip(files), `dtpr-${props.category.id}-icons.zip`)
  }
  catch {
    toast.add({ title: 'The icons could not be downloaded', description: 'Try again in a moment.', color: 'error' })
  }
  finally {
    busy.value = false
  }
}

// The reasons are written in English on the Concepts page, against the source names.
const { data: reasons } = await useConceptReasons()
const englishName = computed(() => dtprText(props.category.name).toLowerCase())
const shapeReason = computed(() => {
  const reason = reasons.value?.shape[props.category.shape.replaceAll('-', ' ')]
  return reason && !reason.endsWith('.') ? `${reason}.` : reason
})
const rowLabel = 'block font-code text-xs uppercase tracking-wide text-muted'

const localeQuery = computed(() => (locale.value === DTPR_SOURCE_LOCALE ? '' : `&locales=${locale.value}`))
const developerRows = computed(() => [
  { label: 'REST, this category\'s elements', value: `GET ${dtprSchemaUrl(version.value)}/elements?category_id=${props.category.id}&fields=all${localeQuery.value}` },
  { label: 'REST, all categories', value: `GET ${dtprSchemaUrl(version.value)}/categories${localeQuery.value.replace('&', '?')}` },
  { label: 'MCP', value: `list_elements({ "version": "${version.value}", "category_id": "${props.category.id}" })` },
  { label: 'Shape', value: dtprShapeUrl(props.category.shape) },
])
</script>

<template>
  <article>
    <TaxonomyCopyLink :path="`/taxonomy/categories/${category.id}`" />
    <h2 class="font-serif text-3xl font-semibold text-highlighted">{{ t(category.name) }}</h2>
    <DeveloperId :id="category.id" class="mt-1 block" />
    <p class="mt-2 font-serif text-xl text-default">{{ t(category.prompt) }}</p>
    <p class="mt-3 text-default">{{ t(category.description) }}</p>

    <div class="mt-5 flex flex-wrap gap-2 print:hidden">
      <UButton size="sm" icon="i-lucide-download" :label="`${elements.length} icons (zip)`" :loading="busy" @click="downloadIcons" />
    </div>

    <!-- What the category asks of a datachain, and why, in the Concepts page's words. -->
    <section class="mt-8">
      <h3 class="font-code text-xs uppercase tracking-wide text-muted">
        <TaxonomyConceptLink term="datachain">Datachain</TaxonomyConceptLink>
      </h3>
      <dl class="mt-3 divide-y divide-default rounded-md border border-default bg-elevated text-sm">
        <div class="grid gap-x-4 gap-y-2 px-3 py-3 sm:grid-cols-[8.5rem_1fr]">
          <dt>
            <span :class="rowLabel">Answer</span>
            <TaxonomyRequiredBadge :required="category.required" term="required-category" class="mt-1.5" />
          </dt>
          <dd class="text-default">{{ reasons?.required[englishName] }}</dd>
        </div>
        <div class="grid gap-x-4 gap-y-2 px-3 py-3 sm:grid-cols-[8.5rem_1fr]">
          <dt>
            <span :class="rowLabel">Icon shape</span>
            <TaxonomyShapeBadge :shape="category.shape" term="shape" class="mt-1.5" />
          </dt>
          <dd class="text-default">{{ shapeReason }}</dd>
        </div>
      </dl>
    </section>

    <TaxonomyContextList v-if="category.element_context" class="mt-8" :context="category.element_context" />

    <TaxonomyVariableList v-if="category.element_variables.length" class="mt-8" :variables="category.element_variables" />

    <TaxonomyNotes class="mt-8" :item="category" />

    <TaxonomyDeveloperPanel class="mt-8" :rows="developerRows" :json="category" />
  </article>
</template>
