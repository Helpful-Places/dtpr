<script setup lang="ts">
import { liveCanvases, tr, type Loc } from '~/canvas-data'
import { iconUrl } from '~/canvas-data/grammar'

// The register (R1): live systems only (R16), each linking to its SSR
// canvas page. Content is authored in-repo; this just lists it.
const { t, locale } = useI18n()
const loc = computed<Loc>(() => locale.value as Loc)
const canvases = liveCanvases()

useHead({ title: () => `${t('register.heading')} · ${t('app.title')}` })
</script>

<template>
  <main class="mx-auto max-w-5xl px-6 py-12">
    <h1 class="text-3xl font-bold tracking-tight">{{ t('register.heading') }}</h1>
    <p class="mt-2 max-w-2xl text-[var(--muted)]">{{ t('register.sub') }}</p>

    <ul class="mt-10 grid gap-5 sm:grid-cols-2">
      <li
        v-for="c in canvases" :key="`${c.systemKey}-${c.variantKey}-${c.versionKey}`"
        class="flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{{ c.content.ref }}</div>
            <h2 class="mt-1 text-lg font-bold leading-tight">{{ tr(c.content.name, loc) }}</h2>
          </div>
          <img
            :src="iconUrl(c.content.purpose.id)" :alt="tr(c.content.purpose.t, loc)"
            width="28" height="28" loading="lazy" style="object-fit:contain"
          >
        </div>
        <p class="mt-3 flex-1 text-sm text-[var(--muted)]">{{ tr(c.content.read, loc) }}</p>
        <NuxtLink
          :to="`/s/${c.systemKey}`"
          class="mt-4 inline-flex w-fit items-center gap-1 rounded-full border border-[var(--teal)]/40 px-4 py-1.5 text-sm font-semibold text-[var(--teal)] no-underline transition hover:bg-[var(--teal)] hover:text-white"
        >
          {{ t('register.open') }} →
        </NuxtLink>
      </li>
    </ul>
  </main>
</template>
