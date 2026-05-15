<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { ResolvedDatachainInstance } from '@dtpr/ui/core'
import { extract } from '@dtpr/ui/core'
import {
  validateAndResolve,
  type ApiError,
} from '../../utils/datachain-visualizer-api'
import {
  collectPresentLocales,
  pickDefaultLocale,
} from '../../utils/datachain-visualizer-locales'
import {
  CollectionFullError,
  CollectionUnavailableError,
  deleteEntry as deleteCollectionEntry,
  loadCollection,
  renameEntry as renameCollectionEntry,
  saveEntry as saveCollectionEntry,
  type CollectionEntry,
} from '../../utils/datachain-visualizer-collection'
import { SUPPORTED_LOCALES, useDtprState } from '../../composables/useDtprState'

useHead({ title: 'Datachain visualizer' })

const { activeLocale } = useDtprState()

const inputJson = ref('')
const loading = ref(false)
const apiErrors = ref<ApiError[]>([])
const resolvedInstance = ref<ResolvedDatachainInstance | null>(null)
const renderLocale = ref<string>(activeLocale.value)

const collection = ref<CollectionEntry[]>([])
const collectionUnavailable = ref(false)
const collectionMessage = ref<string | null>(null)
const selectedEntryId = ref<string | null>(null)

const availableLocales = computed<string[]>(() => {
  if (!resolvedInstance.value) return []
  return collectPresentLocales(resolvedInstance.value, SUPPORTED_LOCALES)
})

function refreshCollection() {
  try {
    collection.value = loadCollection().entries
    collectionUnavailable.value = false
  } catch (err) {
    if (err instanceof CollectionUnavailableError) {
      collection.value = []
      collectionUnavailable.value = true
    } else {
      throw err
    }
  }
}

onMounted(() => {
  refreshCollection()
})

async function runValidatePipeline(jsonText: string) {
  loading.value = true
  apiErrors.value = []
  try {
    const result = await validateAndResolve(jsonText)
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

async function onSubmit() {
  if (loading.value || inputJson.value.length === 0) return
  selectedEntryId.value = null
  await runValidatePipeline(inputJson.value)
}

function onSave() {
  if (!resolvedInstance.value) return
  collectionMessage.value = null
  const fallbackName =
    extract(resolvedInstance.value.instance.title, activeLocale.value) ||
    resolvedInstance.value.instance.id ||
    'Untitled chain'
  try {
    const entry = saveCollectionEntry({ name: fallbackName, json: inputJson.value })
    selectedEntryId.value = entry.id
    refreshCollection()
  } catch (err) {
    if (err instanceof CollectionFullError) {
      collectionMessage.value = err.message
    } else if (err instanceof CollectionUnavailableError) {
      collectionUnavailable.value = true
      collectionMessage.value = err.message
    } else {
      throw err
    }
  }
}

function onSelectEntry(id: string) {
  const entry = collection.value.find((e) => e.id === id)
  if (!entry) return
  selectedEntryId.value = id
  inputJson.value = entry.json
  void runValidatePipeline(entry.json)
}

function onRenameEntry(id: string, name: string) {
  try {
    collection.value = renameCollectionEntry(id, name).entries
  } catch (err) {
    if (err instanceof CollectionUnavailableError) {
      collectionUnavailable.value = true
    } else {
      throw err
    }
  }
}

function onDeleteEntry(id: string) {
  try {
    collection.value = deleteCollectionEntry(id).entries
    if (selectedEntryId.value === id) selectedEntryId.value = null
  } catch (err) {
    if (err instanceof CollectionUnavailableError) {
      collectionUnavailable.value = true
    } else {
      throw err
    }
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
          <div class="datachain-visualizer__post-render">
            <DatachainVisualizerLocaleSwitcher
              :available="availableLocales"
              :locale="renderLocale"
              @update:locale="renderLocale = $event"
            />
            <UButton
              size="sm"
              color="neutral"
              variant="subtle"
              icon="i-heroicons-bookmark"
              :disabled="collectionUnavailable"
              @click="onSave"
            >
              Save to my collection
            </UButton>
          </div>
          <p v-if="collectionMessage" class="datachain-visualizer__collection-message">
            {{ collectionMessage }}
          </p>
          <DatachainVisualizerRender
            :resolved="resolvedInstance"
            :locale="renderLocale"
          />
        </template>
      </main>

      <DatachainVisualizerCollection
        :entries="collection"
        :selected-id="selectedEntryId"
        :unavailable="collectionUnavailable"
        @select="onSelectEntry"
        @rename="onRenameEntry"
        @delete="onDeleteEntry"
      />
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
  display: grid;
  grid-template-columns: minmax(0, 1fr) 18rem;
  gap: 2rem;
  align-items: flex-start;
}

@media (max-width: 1023px) {
  .datachain-visualizer__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.datachain-visualizer__main {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.datachain-visualizer__post-render {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.5rem;
  align-items: center;
  justify-content: space-between;
}

.datachain-visualizer__collection-message {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ui-warning, #d97706);
}
</style>
