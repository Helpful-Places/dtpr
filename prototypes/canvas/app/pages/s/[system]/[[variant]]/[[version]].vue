<script setup lang="ts">
import { ref } from 'vue'
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

// View toolbar state (U1 / U2): the board is view-only by default; feedback
// is opt-in, and Sentence view is a separate global density toggle.
const feedbackOn = ref(false)
const sentenceOn = ref(false)
</script>

<template>
  <main class="mx-auto max-w-4xl px-6 py-10">
    <!-- View toolbar: opt-in feedback + Sentence view density toggle. -->
    <div class="mb-6 flex flex-wrap gap-2">
      <button
        type="button"
        class="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
        :class="feedbackOn ? 'border-[var(--teal)] bg-[var(--teal)] text-white' : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'"
        :aria-pressed="feedbackOn"
        @click="feedbackOn = !feedbackOn"
      >{{ feedbackOn ? $t('feedback.done') : $t('feedback.give') }}</button>
      <button
        type="button"
        class="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
        :class="sentenceOn ? 'border-[var(--teal)] bg-[var(--teal)] text-white' : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]'"
        :aria-pressed="sentenceOn"
        @click="sentenceOn = !sentenceOn"
      >{{ $t('canvas.sentenceView') }}</button>
    </div>

    <CanvasFeedbackLayer
      :content="canvas.content"
      :system="canvas.systemKey"
      :variant="canvas.variantKey"
      :version="canvas.versionKey"
      :active="feedbackOn"
      :sentence="sentenceOn"
    />
  </main>
</template>
