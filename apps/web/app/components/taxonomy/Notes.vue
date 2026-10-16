<script setup lang="ts">
// Authoring guidance and sources, where the schema carries them for a category or element.
interface Source { type?: string, title: string, url?: string, citation?: string }
const props = defineProps<{ item: DtprCategory | DtprElement }>()
const { t } = useTaxonomyContext()

const guidance = computed(() => t(props.item.authoring_guidance as DtprLocalized[] | undefined))
const sources = computed(() => (props.item.sources as Source[] | undefined) ?? [])
</script>

<template>
  <div v-if="guidance || sources.length" class="space-y-8">
    <section v-if="guidance">
      <h3 class="font-code text-xs uppercase tracking-wide text-muted">When to use it</h3>
      <p class="mt-2 text-sm text-default">{{ guidance }}</p>
    </section>
    <section v-if="sources.length">
      <h3 class="font-code text-xs uppercase tracking-wide text-muted">Sources</h3>
      <ul class="mt-2 space-y-3 text-sm">
        <li v-for="source in sources" :key="source.title">
          <a v-if="source.url" :href="source.url" target="_blank" rel="noopener" class="font-medium text-primary underline">{{ source.title }}</a>
          <span v-else class="font-medium text-highlighted">{{ source.title }}</span>
          <span v-if="source.citation" class="block text-muted">{{ source.citation }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>
