<script setup lang="ts">
// Schema version and taxonomy locale. Both live in the URL so any view can be linked.
const { taxonomy } = useTaxonomyContext()
const route = useRoute()
const router = useRouter()
const set = (query: Record<string, string | undefined>) => router.replace({ query: { ...route.query, ...query }, hash: route.hash })

const localeItems = computed(() => (taxonomy.value?.locales ?? []).map((l) => ({ label: dtprLocaleName(l), value: l })))
const versionItems = computed(() => (taxonomy.value?.versions ?? []).map((v) => ({ label: v.id, value: v.id })))
</script>

<template>
  <div v-if="taxonomy" class="flex flex-wrap items-center gap-x-2 gap-y-1.5">
    <TaxonomyConceptLink term="schema-version" class="hidden text-xs text-muted sm:inline">Schema version</TaxonomyConceptLink>
    <USelect
      :items="versionItems" :model-value="taxonomy.version.id" aria-label="Schema version" class="font-code"
      @update:model-value="(v: string) => set({ v })"
    />
    <USelect
      :items="localeItems" :model-value="taxonomy.locale" icon="i-lucide-languages" aria-label="Taxonomy language" class="sm:ml-2"
      @update:model-value="(locale: string) => set({ locale: locale === DTPR_SOURCE_LOCALE ? undefined : locale })"
    />
  </div>
</template>
