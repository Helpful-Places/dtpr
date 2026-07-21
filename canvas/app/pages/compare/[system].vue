<script setup lang="ts">
import { getSystem, tr, type Loc } from '~/canvas-data'
import { aggregateSummary, type SummaryRow } from '~/utils/compare'

// Compare view (U8 / R6): a system's variants/versions side by side with
// audience-segmented feedback, per-seat confusion, and thin-sample flags.
const route = useRoute()
const { t, locale } = useI18n()
const loc = computed<Loc>(() => locale.value as Loc)

const systemKey = String(route.params.system || '')
const system = getSystem(systemKey)
if (!system) {
  throw createError({ statusCode: 404, statusMessage: 'System not found', fatal: true })
}

// Variant key → localized label for the column headers.
const variantLabels = computed(() =>
  Object.fromEntries(system!.variants.map(v => [v.variantKey, tr(v.label, loc.value)])),
)

const { data } = await useFetch<{ system: string, rows: SummaryRow[] }>('/api/feedback/summary', {
  query: { system: systemKey },
  default: () => ({ system: systemKey, rows: [] }),
})

const columns = computed(() => aggregateSummary(data.value?.rows ?? []))

useHead({ title: () => `${t('compare.heading')} · ${tr(system!.variants[0].versions[0].content.name, loc.value)}` })
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-12">
    <NuxtLink :to="`/s/${systemKey}`" class="text-sm font-semibold text-[var(--teal)]">← {{ tr(system.variants[0].versions[0].content.name, loc) }}</NuxtLink>
    <h1 class="mt-2 text-3xl font-bold tracking-tight">{{ t('compare.heading') }}</h1>
    <p class="mt-2 max-w-2xl text-[var(--muted)]">{{ t('compare.sub') }}</p>

    <div v-if="columns.length" class="mt-10 grid gap-5 md:grid-cols-2">
      <VariantColumn
        v-for="c in columns" :key="`${c.variant}-${c.version}`"
        :column="c"
        :label="variantLabels[c.variant]"
      />
    </div>
    <p v-else class="mt-10 rounded-xl border border-[var(--line)] bg-[var(--card)] p-6 text-[var(--muted)]">
      {{ t('compare.thinSample') }}
    </p>
  </main>
</template>
