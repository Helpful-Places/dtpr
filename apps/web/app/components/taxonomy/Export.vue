<script setup lang="ts">
// Print or download the whole taxonomy, from either Explore view. Printing
// always prints the list: from the panes, the list is loaded out of sight in a
// frame, which says when its icons are in, and printed from there.
const { taxonomy, version, locale, to, elementsByCategory } = useTaxonomyContext()
const route = useRoute()
const router = useRouter()
const toast = useToast()

const printing = ref(false)
let frame: HTMLIFrameElement | undefined
let timer: ReturnType<typeof setTimeout> | undefined

function finishPrint() {
  printing.value = false
  clearTimeout(timer)
  window.removeEventListener('message', onMessage)
  frame?.remove()
  frame = undefined
}

function onMessage(event: MessageEvent) {
  if (event.origin !== window.location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'dtpr:print-ready') return
  const win = frame!.contentWindow!
  win.addEventListener('afterprint', () => setTimeout(finishPrint))
  clearTimeout(timer)
  printing.value = false
  win.focus()
  win.print()
}

function print() {
  if (route.path === '/taxonomy/all') return window.print()
  finishPrint()
  printing.value = true
  frame = document.createElement('iframe')
  frame.title = 'The taxonomy list, prepared for printing'
  frame.tabIndex = -1
  frame.setAttribute('aria-hidden', 'true')
  // Wide enough for the list's two columns; out of sight and out of the layout.
  frame.style.cssText = 'position:fixed;left:-200vw;top:0;width:1100px;height:800px;border:0;'
  frame.src = router.resolve(to('/taxonomy/all', { print: '1' })).href
  window.addEventListener('message', onMessage)
  timer = setTimeout(() => {
    finishPrint()
    toast.add({ title: 'The list could not be prepared for printing', description: 'Open the list and print it from there.', color: 'error' })
  }, 30000)
  document.body.append(frame)
}
onBeforeUnmount(finishPrint)

// Downloads are named for the schema version, and the locale when it is not English.
const fileStem = computed(() => `dtpr-taxonomy-${version.value.replace(/^dtpr@/, '')}${locale.value === DTPR_SOURCE_LOCALE ? '' : `-${locale.value}`}`)
const data = () => {
  const { version: schema, locale: lang, categories, elements } = taxonomy.value!
  return JSON.stringify({ schema_version: schema, locale: lang, categories, elements }, null, 2)
}

const downloading = ref(false)
async function download(withIcons: boolean) {
  downloading.value = true
  try {
    if (!withIcons) {
      dtprSaveBlob(new Blob([data()], { type: 'application/json' }), `${fileStem.value}.json`)
      return
    }
    const files: Record<string, string | Uint8Array> = { 'taxonomy.json': data() }
    // One category at a time, so the icon requests stay inside the API's rate limit.
    for (const c of taxonomy.value!.categories) {
      Object.assign(files, await dtprIconFiles(version.value, (elementsByCategory.value.get(c.id) ?? []).map((element) => ({ element })), `icons/${c.id}`))
    }
    dtprSaveBlob(dtprZip(files), `${fileStem.value}.zip`)
  }
  catch {
    toast.add({ title: 'The taxonomy could not be downloaded', description: 'Try again in a moment.', color: 'error' })
  }
  finally {
    downloading.value = false
  }
}

const downloadItems = [
  { label: 'Data (JSON)', icon: 'i-lucide-braces', onSelect: () => download(false) },
  { label: 'Data and icons (ZIP)', icon: 'i-lucide-folder-archive', onSelect: () => download(true) },
]
</script>

<template>
  <div class="flex items-center gap-1">
    <UButton size="sm" color="neutral" variant="outline" icon="i-lucide-printer" label="Print" :loading="printing" @click="print" />
    <UDropdownMenu :items="downloadItems">
      <UButton
        size="sm" color="neutral" variant="outline" icon="i-lucide-download" label="Download" trailing-icon="i-lucide-chevron-down"
        :loading="downloading"
      />
    </UDropdownMenu>
  </div>
</template>
