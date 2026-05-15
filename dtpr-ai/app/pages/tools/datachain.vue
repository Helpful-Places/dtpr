<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ResolvedDatachainInstance } from '@dtpr/ui/core'
import {
  validateAndResolve,
  type ApiError,
} from '../../utils/datachain-visualizer-api'
import {
  collectPresentLocales,
  pickDefaultLocale,
} from '../../utils/datachain-visualizer-locales'
import { SUPPORTED_LOCALES, useDtprState } from '../../composables/useDtprState'

useHead({ title: 'Datachain visualizer' })

const { activeLocale } = useDtprState()

const inputJson = ref('')
const loading = ref(false)
const apiErrors = ref<ApiError[]>([])
const resolvedInstance = ref<ResolvedDatachainInstance | null>(null)
const renderLocale = ref<string>(activeLocale.value)

const availableLocales = computed<string[]>(() => {
  if (!resolvedInstance.value) return []
  return collectPresentLocales(resolvedInstance.value, SUPPORTED_LOCALES)
})

async function onSubmit() {
  if (loading.value || inputJson.value.length === 0) return
  loading.value = true
  apiErrors.value = []
  try {
    const result = await validateAndResolve(inputJson.value)
    if (result.ok) {
      apiErrors.value = []
      resolvedInstance.value = result.resolved
      const present = collectPresentLocales(result.resolved, SUPPORTED_LOCALES)
      renderLocale.value = pickDefaultLocale(present, activeLocale.value)
    } else {
      apiErrors.value = result.errors
      resolvedInstance.value = null
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="datachain-visualizer">
    <header class="datachain-visualizer__header">
      <h1 class="datachain-visualizer__title">Datachain visualizer</h1>
      <p class="datachain-visualizer__subtitle">
        Paste or drop a <code>DatachainInstance</code> JSON to validate and render it
        through the public DTPR API.
      </p>
    </header>

    <div class="datachain-visualizer__layout">
      <main class="datachain-visualizer__main">
        <DatachainVisualizerInput
          v-model:json="inputJson"
          :loading="loading"
          @submit="onSubmit"
        />

        <DatachainVisualizerErrors :errors="apiErrors" />

        <template v-if="resolvedInstance">
          <DatachainVisualizerLocaleSwitcher
            :available="availableLocales"
            :locale="renderLocale"
            @update:locale="renderLocale = $event"
          />
          <DatachainVisualizerRender
            :resolved="resolvedInstance"
            :locale="renderLocale"
          />
        </template>
      </main>
    </div>
  </div>
</template>

<style scoped>
.datachain-visualizer {
  min-height: 100vh;
}

.datachain-visualizer__header {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0.5rem;
}

.datachain-visualizer__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.datachain-visualizer__subtitle {
  margin: 0.25rem 0 0;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.875rem;
}

.datachain-visualizer__subtitle code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
}

.datachain-visualizer__layout {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.datachain-visualizer__main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
</style>
