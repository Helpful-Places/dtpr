<script setup lang="ts">
definePageMeta({
  // Not launched yet: a 404 until the builder feature is on.
  middleware: () => {
    if (!useFeature('builder')) return abortNavigation(createError({ statusCode: 404, statusMessage: 'Page Not Found', fatal: true }))
  },
})

const { taxonomy } = useTaxonomyContext()

usePageSeo({
  title: 'Datachain builder',
  description: 'Compose a DTPR datachain from the taxonomy, then download it with its icons or share it as a link.',
})

const draft = useDatachainDraft()
const toast = useToast()
const route = useRoute()
const router = useRouter()

// A datachain stays on the schema version it was built on.
const pinned = computed(() => draft.chain.value?.schema_version)
const unlistedVersion = computed(() => !!pinned.value && !taxonomy.value!.versions.some((v) => v.id === pinned.value))
watch(pinned, (version) => {
  if (!import.meta.client || !version || version === taxonomy.value!.version.id || unlistedVersion.value) return
  router.replace({ query: { ...route.query, v: version }, hash: route.hash })
}, { immediate: true })

// A beta schema version can change under a saved datachain. Say so once.
const schemaChanged = ref(false)
watch([() => taxonomy.value!.version.content_hash, pinned], ([hash]) => {
  if (!import.meta.client || !pinned.value || pinned.value !== taxonomy.value!.version.id) return
  if (!draft.savedHash.value) draft.save(hash)
  else if (draft.savedHash.value !== hash) schemaChanged.value = true
}, { immediate: true })
const acknowledgeChange = () => {
  draft.save(taxonomy.value!.version.content_hash)
  schemaChanged.value = false
}

// A share link carries a datachain in the URL fragment.
const shared = ref<unknown>(null)
const openShared = () => {
  try {
    draft.load(shared.value)
  }
  catch (error: any) {
    toast.add({ title: 'The shared datachain could not be opened', description: error.message, color: 'error' })
  }
  shared.value = null
  router.replace({ query: route.query, hash: '' })
}
onMounted(() => {
  if (!window.location.hash.includes('data=')) return
  try {
    shared.value = dtprDecodeShare(window.location.hash)
  }
  catch {
    toast.add({ title: 'This share link is damaged', description: 'Ask for it to be sent again.', color: 'error' })
    return
  }
  // Nothing to lose: open it straight away. Otherwise ask first.
  if (shared.value && !draft.elements.value.length) openShared()
})

const examples = [
  { label: 'NYPD facial recognition', src: '/data/nypd-facial-recognition.datachain.json' },
  { label: 'Long Beach mobility sensor', src: '/data/long-beach-numina-mobility-sensor.datachain.json' },
]
async function loadExample(src: string) {
  try {
    draft.load(await $fetch(src))
    router.replace({ query: { v: route.query.v, locale: route.query.locale } })
  }
  catch {
    toast.add({ title: 'The example could not be loaded', color: 'error' })
  }
}
const exampleItems = examples.map((e) => ({ label: e.label, onSelect: () => loadExample(e.src) }))

const pasteOpen = ref(false)
const pasted = ref('')
const pasteError = ref('')
function loadPasted() {
  try {
    draft.load(JSON.parse(pasted.value))
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

function clear() {
  draft.clear()
  router.replace({ query: { locale: route.query.locale } })
}
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <TaxonomyIntro view="build" class="min-w-0 flex-1 basis-72" />
      <div class="ml-auto flex items-center gap-2">
        <UDropdownMenu :items="exampleItems">
          <UButton color="neutral" variant="outline" size="sm" label="Load example" trailing-icon="i-lucide-chevron-down" />
        </UDropdownMenu>
        <UButton color="neutral" variant="outline" size="sm" label="Open JSON" @click="pasteOpen = true" />
        <span class="h-5 w-px bg-rule" aria-hidden="true" />
        <UButton color="neutral" variant="ghost" size="sm" label="Clear" :disabled="!draft.chain.value" @click="clear" />
      </div>
    </div>

    <div class="mb-4 space-y-2 empty:hidden">
      <UAlert
        v-if="shared" color="info" variant="subtle" title="This link carries a shared datachain"
        description="Opening it replaces the one you have been working on in this browser."
        :actions="[{ label: 'Open shared datachain', onClick: openShared }, { label: 'Keep mine', color: 'neutral', variant: 'outline', onClick: () => { shared = null } }]"
      />
      <UAlert
        v-if="unlistedVersion" color="warning" variant="subtle"
        :title="`This datachain was built on ${pinned}, which the DTPR API no longer lists`"
        :description="`It is shown against ${taxonomy!.version.id}. Elements that no longer exist are marked.`"
      />
      <UAlert
        v-if="schemaChanged" color="warning" variant="subtle"
        :title="`${taxonomy!.version.id} has changed since you last saved`"
        description="Beta schema versions can change. Your datachain has been checked again against the current version."
        :actions="[{ label: 'OK', onClick: acknowledgeChange }]"
      />
    </div>

    <TaxonomyTranslationNotice class="mb-4 rounded-md border" />

    <TaxonomyBuilder />

    <UModal v-model:open="pasteOpen" title="Open a datachain" description="Paste datachain JSON or choose a file. It replaces the datachain in the builder.">
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
  </div>
</template>
