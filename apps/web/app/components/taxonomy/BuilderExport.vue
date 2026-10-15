<script setup lang="ts">
// What still needs fixing, and the ways out: the package, the JSON, a share link.
const props = defineProps<{ issues: DtprIssue[] }>()
const { taxonomy, locale } = useTaxonomyContext()
const draft = useDatachainDraft()
const copy = useCopy()
const toast = useToast()

interface ApiError { code: string, message: string, fix_hint?: string }

const chain = computed(() => draft.chain.value)
const empty = computed(() => !chain.value?.elements.length)
const fileStem = computed(() => (dtprText(chain.value?.title, locale.value) || 'datachain').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'datachain')

const jsonOpen = ref(false)
const building = ref(false)
const apiErrors = ref<ApiError[]>([])
watch(chain, () => { apiErrors.value = [] }, { deep: true })

// The API has the final say on whether a datachain is valid.
async function downloadPackage() {
  if (!chain.value) return
  building.value = true
  apiErrors.value = []
  try {
    const base = dtprSchemaUrl(chain.value.schema_version)
    const check = await $fetch<{ ok: boolean, errors?: ApiError[] }>(`${base}/validate`, { method: 'POST', body: chain.value })
    if (!check.ok) {
      apiErrors.value = check.errors ?? []
      return
    }
    const resolved = await $fetch(`${base}/resolve`, { method: 'POST', body: chain.value })
    const zip = await dtprBuildPackage({ taxonomy: taxonomy.value!, chain: chain.value, resolved, locale: locale.value })
    dtprSaveBlob(zip, `${fileStem.value}-dtpr.zip`)
  }
  catch {
    toast.add({ title: 'The package could not be built', description: 'The DTPR API did not respond. Try again in a moment.', color: 'error' })
  }
  finally {
    building.value = false
  }
}

const downloadJson = () => dtprSaveBlob(new Blob([JSON.stringify(chain.value, null, 2)], { type: 'application/json' }), `${fileStem.value}.datachain.json`)
const shareLink = () => copy(`${window.location.origin}/taxonomy/builder#data=${dtprEncodeShare(chain.value)}`, 'Share link')
</script>

<template>
  <div class="rounded-md border border-rule bg-elevated p-4 text-sm shadow-sm">
    <h2 class="sr-only">Download and share</h2>
    <p v-if="empty" class="text-muted">Nothing here yet. Start with the three required categories.</p>
    <template v-else>
      <p class="flex items-center gap-1.5 font-medium" :class="issues.length ? 'text-warning' : 'text-success'">
        <UIcon :name="issues.length ? 'i-lucide-circle-alert' : 'i-lucide-circle-check'" />
        {{ issues.length ? `${issues.length} to fix before download` : 'Ready to download' }}
      </p>
      <ul v-if="issues.length" class="mt-2 list-disc space-y-1 pl-5 text-default">
        <li v-for="(issue, n) in issues" :key="n">{{ issue.message }}</li>
      </ul>
    </template>

    <UAlert v-if="apiErrors.length" class="mt-3" color="error" variant="subtle" title="The DTPR API rejected this datachain">
      <template #description>
        <ul class="list-disc space-y-1 pl-4">
          <li v-for="(e, n) in apiErrors" :key="n">{{ e.message }}<span v-if="e.fix_hint" class="block text-xs opacity-80">{{ e.fix_hint }}</span></li>
        </ul>
      </template>
    </UAlert>

    <div class="mt-4 flex flex-wrap gap-2">
      <UButton size="sm" icon="i-lucide-package" label="Download package" :disabled="empty || !!issues.length" :loading="building" @click="downloadPackage" />
      <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-braces" label="JSON" aria-label="View JSON" :disabled="empty" @click="jsonOpen = true" />
      <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-link" label="Share" :disabled="empty" @click="shareLink" />
    </div>
    <p class="mt-3 text-xs text-muted">The package holds the datachain, its icons as SVG and PNG, a printable summary and a licence note.</p>

    <UModal v-model:open="jsonOpen" title="Datachain JSON" description="The datachain in the shape the DTPR API accepts." :ui="{ content: 'max-w-2xl' }">
      <template #body>
        <pre class="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded bg-default p-3 font-code text-xs">{{ JSON.stringify(chain, null, 2) }}</pre>
      </template>
      <template #footer>
        <UButton icon="i-lucide-copy" label="Copy" @click="copy(JSON.stringify(chain, null, 2), 'JSON')" />
        <UButton color="neutral" variant="outline" icon="i-lucide-download" label="Download .json" @click="downloadJson" />
      </template>
    </UModal>
  </div>
</template>
