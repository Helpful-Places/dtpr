<script setup lang="ts">
// A term's definition, taken from its own section of the Concepts page, so the
// taxonomy explains itself in the same words as the docs. Loaded on first open.
// One per section, opened through useConcept.
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

const { term, open } = useConcept()

const { data: page, status, execute } = useAsyncData(
  'concepts-page',
  () => queryCollection('docs').path('/docs/concepts').first(),
  { server: false, immediate: false },
)
watch(open, (isOpen) => {
  if (isOpen && !page.value && status.value !== 'pending') execute()
})

// In-page links in the section point back into the Concepts page.
const relink = (node: MinimarkNode): MinimarkNode => {
  if (typeof node === 'string') return node
  const [tag, attrs, ...children] = node
  const href = attrs.href
  return [tag, tag === 'a' && typeof href === 'string' && href.startsWith('#') ? { ...attrs, href: `/docs/concepts${href}` } : attrs, ...children.map(relink)]
}

const text = (node: MinimarkNode): string => (typeof node === 'string' ? node : node.slice(2).map((n) => text(n as MinimarkNode)).join(''))

// Everything between the term's heading and the next heading, titled by the heading.
const section = computed(() => {
  const body = page.value?.body as { type: string, value: MinimarkNode[] } | undefined
  if (!body) return null
  const isHeading = (node: MinimarkNode) => Array.isArray(node) && (node[0] === 'h2' || node[0] === 'h3')
  const start = body.value.findIndex((node) => Array.isArray(node) && node[0] === 'h3' && node[1].id === term.value)
  if (start < 0) return null
  const end = body.value.findIndex((node, i) => i > start && isHeading(node))
  return {
    title: text(body.value[start]!),
    page: { ...page.value!, body: { ...body, value: body.value.slice(start + 1, end < 0 ? undefined : end).map(relink), toc: undefined } },
  }
})

// A link to another concept opens that one here, caught before the link navigates.
// Leaving the section closes the dialog.
function follow(event: MouseEvent) {
  const link = (event.target as Element).closest('a')
  const match = link?.getAttribute('href')?.match(/^\/docs\/concepts#(.+)$/)
  if (!match || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  term.value = match[1]!
  link!.closest('[data-slot="body"]')?.scrollTo({ top: 0 })
}
onBeforeUnmount(() => { open.value = false })

// Until the page loads, the title comes from the id: `schema-version` reads "Schema version".
const title = computed(() => section.value?.title ?? term.value.charAt(0).toUpperCase() + term.value.slice(1).replaceAll('-', ' '))
</script>

<template>
  <UModal v-model:open="open" :title="title" description="From the DTPR concepts" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div v-if="section" @click.capture="follow"><ContentRenderer :value="section.page" class="wrap-anywhere" /></div>
      <p v-else-if="status === 'error' || status === 'success'" class="text-sm text-muted">
        This definition could not be loaded. It is on the
        <NuxtLink :to="`/docs/concepts#${term}`" class="text-primary underline underline-offset-2">concepts page</NuxtLink>.
      </p>
      <p v-else class="text-sm text-muted" role="status">Loading the definition…</p>
    </template>
    <template #footer>
      <UButton
        :to="`/docs/concepts#${term}`" color="neutral" variant="outline" label="All concepts" trailing-icon="i-lucide-arrow-right"
        @click="open = false"
      />
    </template>
  </UModal>
</template>
