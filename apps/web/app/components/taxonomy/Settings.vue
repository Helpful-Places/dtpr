<script setup lang="ts">
// Schema version and taxonomy locale. Both live in the URL so any view can be linked.
const { taxonomy } = useTaxonomyContext()
const draft = useDatachainDraft()
const route = useRoute()
const router = useRouter()
const set = (query: Record<string, string | undefined>) => router.replace({ query: { ...route.query, ...query }, hash: route.hash })

const localeItems = computed(() => (taxonomy.value?.locales ?? []).map((l) => ({ label: dtprLocaleName(l), value: l })))
const versionItems = computed(() => (taxonomy.value?.versions ?? []).map((v) => ({ label: v.id, value: v.id })))

// A datachain stays on the schema version it was built on, so in the builder
// the version cannot be changed while the datachain has elements.
const pinned = computed(() =>
  versionItems.value.length > 1
  && route.path.startsWith('/taxonomy/builder')
  && draft.elements.value.length > 0
  && draft.chain.value?.schema_version === taxonomy.value?.version.id,
)
</script>

<template>
  <div v-if="taxonomy" class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
    <TaxonomyConceptLink term="schema-version" class="hidden text-xs text-muted sm:inline">Schema version</TaxonomyConceptLink>
    <USelect
      v-if="!pinned"
      :items="versionItems" :model-value="taxonomy.version.id" aria-label="Schema version" class="font-code"
      @update:model-value="(v: string) => set({ v })"
    />
    <span v-else class="inline-flex items-center gap-1.5 font-code text-xs text-highlighted">
      <UIcon name="i-lucide-lock" class="size-3.5 text-muted" />
      <span class="sr-only sm:hidden">Schema version </span>{{ taxonomy.version.id }}
      <span class="sr-only font-sans text-muted sm:not-sr-only">pinned to your datachain</span>
    </span>
    <USelect
      :items="localeItems" :model-value="taxonomy.locale" icon="i-lucide-languages" aria-label="Taxonomy language" class="sm:ml-2"
      @update:model-value="(locale: string) => set({ locale: locale === DTPR_SOURCE_LOCALE ? undefined : locale })"
    />
  </div>
</template>
