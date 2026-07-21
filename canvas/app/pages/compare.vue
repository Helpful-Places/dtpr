<script setup lang="ts">
import { liveCanvases } from '~/canvas-data'

// The systems matrix (U3): the four live systems side by side, view-only.
// Replaces the dropped per-variant feedback-stats compare.
const { t } = useI18n()
const canvases = liveCanvases()

useHead({ title: () => `${t('compare.heading')} · ${t('app.title')}` })
</script>

<template>
  <main class="mx-auto max-w-6xl px-6 py-12">
    <h1 class="text-3xl font-bold tracking-tight">{{ t('compare.heading') }}</h1>
    <p class="mt-2 max-w-2xl text-[var(--muted)]">{{ t('compare.sub') }}</p>
    <CanvasMatrix :canvases="canvases" class="mt-10" />
  </main>
</template>
