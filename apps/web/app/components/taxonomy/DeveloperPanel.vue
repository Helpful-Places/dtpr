<script setup lang="ts">
// How to fetch what the page shows: REST, MCP, icon URLs and the raw JSON.
// Part of the Developer view, so it is there, open, only while that is on.
defineProps<{ rows: { label: string, value: string }[], json: unknown }>()
const copy = useCopy()
const developer = useDeveloperView()
</script>

<template>
  <section v-if="developer" class="developer-block print:hidden" aria-label="For developers">
    <h3 class="font-code text-xs uppercase tracking-wide text-secondary">For developers</h3>
    <div class="mt-3 space-y-4 font-code text-xs">
      <div v-for="row in rows" :key="row.label + row.value">
        <p class="mb-1 text-muted">{{ row.label }}</p>
        <div class="flex items-start gap-2">
          <code class="min-w-0 flex-1 break-all">{{ row.value }}</code>
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-copy" :aria-label="`Copy ${row.label}`" @click="copy(row.value, row.label)" />
        </div>
      </div>
      <div>
        <div class="mb-1 flex items-center justify-between">
          <p class="text-muted">Raw JSON</p>
          <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-copy" label="Copy" @click="copy(JSON.stringify(json, null, 2), 'JSON')" />
        </div>
        <pre class="max-h-72 overflow-auto whitespace-pre-wrap rounded-sm bg-elevated p-2">{{ JSON.stringify(json, null, 2) }}</pre>
      </div>
    </div>
  </section>
</template>
