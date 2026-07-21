<script setup lang="ts">
import type { VariantColumn, AudienceClarity } from '~/utils/compare'

// A single (variant, version) column: overall clarity segmented by
// audience, plus where confusion clusters per seat. A thin sample is
// flagged rather than presented as decidable.
const props = defineProps<{ column: VariantColumn, label?: string }>()
const { t } = useI18n()

const audiences = computed<Array<{ key: 'public' | 'professional', label: string, clarity: AudienceClarity }>>(() => [
  { key: 'public', label: t('compare.public'), clarity: props.column.canvas.public },
  { key: 'professional', label: t('compare.professional'), clarity: props.column.canvas.professional },
])
</script>

<template>
  <div class="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
    <div class="flex items-center justify-between gap-2">
      <div>
        <div class="font-bold">{{ label || column.variant }}</div>
        <div class="text-xs text-[var(--muted)]">v{{ column.version }} · {{ column.total }} {{ column.total === 1 ? 'response' : 'responses' }}</div>
      </div>
      <span
        v-if="column.thin"
        class="rounded-full bg-[color-mix(in_srgb,var(--signal)_12%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--signal)]"
      >{{ t('compare.thinSample') }}</span>
    </div>

    <!-- Overall clarity, segmented — never merged into one number (AE3). -->
    <div class="grid grid-cols-2 gap-3">
      <div v-for="a in audiences" :key="a.key" class="rounded-lg border border-[var(--line)] bg-[var(--paper)] p-3">
        <div class="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{{ a.label }}</div>
        <dl class="mt-2 space-y-1 text-sm">
          <div class="flex justify-between"><dt>{{ t('feedback.clear') }}</dt><dd class="font-semibold">{{ a.clarity.clear }}</dd></div>
          <div class="flex justify-between"><dt>{{ t('feedback.confusing') }}</dt><dd class="font-semibold">{{ a.clarity.confusing }}</dd></div>
          <div class="flex justify-between"><dt>{{ t('feedback.unsure') }}</dt><dd class="font-semibold">{{ a.clarity.unsure }}</dd></div>
        </dl>
      </div>
    </div>

    <!-- Per-seat confusion. -->
    <div>
      <div class="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{{ t('compare.seatConfusion') }}</div>
      <div v-if="column.seats.length" class="flex flex-col gap-2">
        <SeatConfusion v-for="s in column.seats" :key="s.seat" :seat="s" />
      </div>
      <p v-else class="text-sm text-[var(--muted)]">{{ t('compare.noSeatData') }}</p>
    </div>
  </div>
</template>
