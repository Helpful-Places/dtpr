<script setup lang="ts">
import { seatLabel, type SeatConfusion } from '~/utils/compare'

// One seat's confusion read, segmented by audience (never merged). Shows
// confusing/unsure counts per audience so "which seat confuses whom" is
// legible at a glance.
const props = defineProps<{ seat: SeatConfusion }>()
const { t } = useI18n()

const label = computed(() => seatLabel(props.seat.seat))
</script>

<template>
  <div class="rounded-lg border border-[var(--line)] bg-[var(--paper)] px-3 py-2">
    <div class="font-mono text-xs text-[var(--signal)]">{{ label }}</div>
    <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      <span class="text-[var(--muted)]">
        {{ t('compare.public') }}:
        <span class="font-semibold text-[var(--ink)]">{{ seat.public.confusing + seat.public.unsure }}</span>
        / {{ seat.public.total }}
      </span>
      <span class="text-[var(--muted)]">
        {{ t('compare.professional') }}:
        <span class="font-semibold text-[var(--ink)]">{{ seat.professional.confusing + seat.professional.unsure }}</span>
        / {{ seat.professional.total }}
      </span>
    </div>
  </div>
</template>
