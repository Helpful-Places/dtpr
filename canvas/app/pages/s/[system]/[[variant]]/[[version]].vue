<script setup lang="ts">
import { resolveCanvas, tr, type Loc } from '~/canvas-data'
import { buildCanvasMeta } from '~/utils/share-meta'

// SSR canvas page for a deep-linked (system, variant?, version?) (U7 / R15).
// Missing optional segments resolve to the live variant + current version;
// unknown keys 404.
const route = useRoute()
const { locale } = useI18n()
const loc = computed<Loc>(() => locale.value as Loc)

const system = String(route.params.system || '')
const variant = route.params.variant ? String(route.params.variant) : undefined
const version = route.params.version ? String(route.params.version) : undefined

const canvas = resolveCanvas(system, variant, version)
if (!canvas) {
  throw createError({ statusCode: 404, statusMessage: 'Canvas not found', fatal: true })
}

// Absolute deep-link URL for share meta (canonical to the resolved keys).
const reqUrl = useRequestURL()
const shareUrl = `${reqUrl.origin}/s/${canvas.systemKey}/${canvas.variantKey}/${canvas.versionKey}`

useHead(() =>
  buildCanvasMeta({
    title: tr(canvas.content.name, loc.value),
    description: tr(canvas.content.read, loc.value),
    url: shareUrl,
  }),
)
</script>

<template>
  <main class="mx-auto max-w-4xl px-6 py-10">
    <CanvasFeedbackLayer
      :content="canvas.content"
      :system="canvas.systemKey"
      :variant="canvas.variantKey"
      :version="canvas.versionKey"
    />
  </main>
</template>
