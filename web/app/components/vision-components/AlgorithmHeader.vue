<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  buildElementSnapshotMap,
  buildCategorySnapshotMap,
  findVariableLocalizedValue,
  fetchSchemaSnapshot,
  getContextSummaries,
  getElementIconUrl,
  getLocalizedValue,
  getPrimaryElementByCategory,
  interpolateVariables,
} from '../../setup/dtpr'
import type {
  DtprContextSummaryResolved,
  DtprSchemaSnapshot,
  ResolvedDatachainInstance,
} from '../../setup/dtpr'

// Slidev port of guide-app's `AlgorithmHeader.vue`. Consumes a partial
// `ResolvedDatachainInstance` (the JSON the user has on hand) plus a
// fetched-at-mount `DtprSchemaSnapshot` so the helpers can resolve
// category and context metadata. Headline / subtitle / labels / image
// are slide props because the AI register entry's algorithm-wrapper
// fields don't live inside the datachain payload.

interface Label {
  id?: string
  name: string
}

interface Props {
  src?: string
  datachain?: ResolvedDatachainInstance
  headline?: string
  subtitle?: string
  labels?: Label[]
  imageSrc?: string
  locale?: string
  highlightCategoryId?: string | null
  highlightRow?: 'context' | 'flow' | null
}

const props = withDefaults(defineProps<Props>(), {
  src: undefined,
  datachain: undefined,
  headline: '',
  subtitle: '',
  labels: () => [],
  imageSrc: '',
  locale: 'en',
  highlightCategoryId: null,
  highlightRow: null,
})

const payload = ref<ResolvedDatachainInstance | null>(null)
const snapshot = ref<DtprSchemaSnapshot | null>(null)
const error = ref<string | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  error.value = null
  try {
    let dc: ResolvedDatachainInstance | undefined = props.datachain
    if (!dc && props.src) {
      const res = await fetch(props.src)
      if (!res.ok) throw new Error(`datachain HTTP ${res.status}`)
      dc = (await res.json()) as ResolvedDatachainInstance
    }
    if (!dc) throw new Error('no datachain provided (set `src` or `datachain`)')

    const snap = dc.schema_snapshot ?? (await fetchSchemaSnapshot(dc.schema_version, props.locale))
    snapshot.value = snap
    payload.value = { ...dc, schema_snapshot: snap }
  }
  catch (e) {
    error.value = (e as Error).message
    payload.value = null
    snapshot.value = null
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => [props.src, props.datachain, props.locale], load)

interface PreviewElement {
  title: string
  icon: string
}

function buildPreview(
  categoryId: string,
  options: { preferInstanceTitle?: boolean } = {},
): PreviewElement | null {
  const dc = payload.value
  if (!dc) return null
  const instance = getPrimaryElementByCategory(dc, categoryId)
  if (!instance) return null
  const def = buildElementSnapshotMap(dc.schema_snapshot).get(instance.element_id)

  const titleVar = findVariableLocalizedValue(instance.variables, 'title')
  let title: string
  if (options.preferInstanceTitle && titleVar) {
    title = getLocalizedValue(titleVar, props.locale)
  }
  else if (def) {
    title = interpolateVariables(
      getLocalizedValue(def.title, props.locale),
      instance.variables,
      props.locale,
    )
  }
  else {
    title = instance.element_id
  }

  return {
    title,
    icon: getElementIconUrl(dc.schema_version, instance.element_id, instance.context_type_id),
  }
}

const accountable = computed(() => buildPreview('accountable', { preferInstanceTitle: true }))
const functionalModes = computed(() => buildPreview('functional_modes'))
const purpose = computed(() => buildPreview('purpose'))
const inputDataset = computed(() => buildPreview('input_dataset'))
const processing = computed(() => buildPreview('processing'))
const outputDataset = computed(() => buildPreview('output_dataset'))

const contextSummaries = computed(() =>
  getContextSummaries(payload.value ?? undefined, props.locale),
)

const categoryName = (categoryId: string): string => {
  const cat = buildCategorySnapshotMap(snapshot.value ?? undefined).get(categoryId)
  return cat ? getLocalizedValue(cat.name, props.locale) : ''
}

interface FlowStep {
  key: string
  categoryId: string
  preview: PreviewElement
  pii: DtprContextSummaryResolved | null
}

const flowSteps = computed<FlowStep[]>(() => {
  const steps: FlowStep[] = []
  if (inputDataset.value)
    steps.push({ key: 'input', categoryId: 'input_dataset', preview: inputDataset.value, pii: contextSummaries.value.inputPii })
  if (processing.value)
    steps.push({ key: 'processing', categoryId: 'processing', preview: processing.value, pii: null })
  if (outputDataset.value)
    steps.push({ key: 'output', categoryId: 'output_dataset', preview: outputDataset.value, pii: contextSummaries.value.outputPii })
  return steps
})

const hasContextRow = computed(() => !!(accountable.value || functionalModes.value || purpose.value))
</script>
<!-- 
<template>
  <div class="alg-header">
    <div class="alg-header__main" :class="{ 'alg-header__main--with-image': imageSrc }">
      <div class="alg-header__card">
        <div v-if="labels && labels.length" class="alg-header__labels">
          <span v-for="(label, i) in labels" :key="label.id ?? i" class="alg-header__label">{{ label.name }}</span>
        </div>
        <h1 v-if="headline" class="alg-header__headline">{{ headline }}</h1>
        <p v-if="subtitle" class="alg-header__subtitle">{{ subtitle }}</p>

        <div v-if="loading" class="alg-header__status">Loading datachain…</div>
        <div v-else-if="error" class="alg-header__status alg-header__status--err">Failed to load: {{ error }}</div>

        <div v-else-if="hasContextRow" class="alg-header__panel" :class="{ 'alg-header__panel--highlighted': highlightRow === 'context' }">
          <div class="alg-header__row">
            <div v-if="accountable" class="alg-header__cell" :class="{ 'alg-header__cell--highlighted': highlightCategoryId === 'accountable' }">
              <div class="alg-header__label-eyebrow">{{ categoryName('accountable') }}</div>
              <img :src="accountable.icon" alt="" aria-hidden="true" class="alg-header__icon" />
              <div class="alg-header__cell-title">{{ accountable.title }}</div>
            </div>
            <div v-if="functionalModes" class="alg-header__cell" :class="{ 'alg-header__cell--highlighted': highlightCategoryId === 'functional_modes' }">
              <div class="alg-header__label-eyebrow">{{ categoryName('functional_modes') }}</div>
              <img :src="functionalModes.icon" alt="" aria-hidden="true" class="alg-header__icon" />
              <div class="alg-header__cell-title">{{ functionalModes.title }}</div>
              <span v-if="contextSummaries.autonomy" class="alg-header__chip">
                <span class="alg-header__chip-dot" :style="contextSummaries.autonomy.color ? { backgroundColor: contextSummaries.autonomy.color } : {}" />
                {{ contextSummaries.autonomy.title }}
              </span>
            </div>
            <div v-if="purpose" class="alg-header__cell" :class="{ 'alg-header__cell--highlighted': highlightCategoryId === 'purpose' }">
              <div class="alg-header__label-eyebrow">{{ categoryName('purpose') }}</div>
              <img :src="purpose.icon" alt="" aria-hidden="true" class="alg-header__icon" />
              <div class="alg-header__cell-title">{{ purpose.title }}</div>
            </div>
          </div>
        </div>

        <div v-if="!loading && !error && flowSteps.length" class="alg-header__panel" :class="{ 'alg-header__panel--highlighted': highlightRow === 'flow' }">
          <div class="alg-header__row">
            <div v-for="step in flowSteps" :key="step.key" class="alg-header__cell" :class="{ 'alg-header__cell--highlighted': highlightCategoryId === step.categoryId }">
              <div class="alg-header__label-eyebrow">{{ categoryName(step.categoryId) }}</div>
              <img :src="step.preview.icon" alt="" aria-hidden="true" class="alg-header__icon" />
              <div class="alg-header__cell-title">{{ step.preview.title }}</div>
              <span v-if="step.pii" class="alg-header__chip">
                <span class="alg-header__chip-dot" :style="step.pii.color ? { backgroundColor: step.pii.color } : {}" />
                {{ step.pii.title }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <figure v-if="imageSrc" class="alg-header__figure">
      <img :src="imageSrc" alt="" />
    </figure>
  </div>
</template>

<style scoped>
.alg-header {
  display: flex;
  flex-direction: row;
  gap: 1.5rem;
  align-items: stretch;
}
.alg-header__main {
  flex: 1 1 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.alg-header__main--with-image { flex-basis: 60%; }

.alg-header__card {
  text-align: center;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 1.25rem;
  padding: 1.5rem 2rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.alg-header__labels {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.alg-header__label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.6rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
}

.alg-header__headline {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}
.alg-header__subtitle {
  font-size: 1rem;
  color: rgba(0, 0, 0, 0.65);
  max-width: 38rem;
  margin: 0 auto 1.25rem;
}

.alg-header__status {
  font-size: 0.85rem;
  opacity: 0.6;
  padding: 1rem;
}
.alg-header__status--err {
  color: #b91c1c;
  opacity: 1;
}

.alg-header__panel {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 1rem;
  padding: 1rem 1.25rem;
}
.alg-header__panel + .alg-header__panel { margin-top: 0.75rem; }

.alg-header__row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 3rem;
}

.alg-header__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  width: 9rem;
  text-align: center;
  border-radius: 12px;
  padding: 0.75rem 0.5rem;
  box-shadow: 0 0 0 0 transparent;
  transition: box-shadow 250ms ease, background-color 250ms ease;
}

.alg-header__cell--highlighted {
  box-shadow: 0 0 0 3px #dc2626;
  background: rgba(220, 38, 38, 0.04);
}

.alg-header__panel {
  border-radius: 14px;
  transition: box-shadow 250ms ease, background-color 250ms ease;
}

.alg-header__panel--highlighted {
  box-shadow: 0 0 0 3px #dc2626;
  background: rgba(220, 38, 38, 0.04);
}

.alg-header__label-eyebrow {
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.5;
  min-height: 1.5rem;
  display: flex;
  align-items: flex-end;
  margin-bottom: 0.4rem;
}

.alg-header__icon {
  width: 3rem;
  height: 3rem;
  object-fit: contain;
  flex-shrink: 0;
}

.alg-header__cell-title {
  font-size: 0.85rem;
  line-height: 1.25;
  margin-top: 0.4rem;
  word-break: break-word;
}

.alg-header__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
  font-size: 0.7rem;
  padding: 0.15rem 0.6rem;
  margin-top: 0.5rem;
}
.alg-header__chip-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.2);
  display: inline-block;
}

.alg-header__figure {
  flex: 0 0 40%;
  margin: 0;
  border-radius: 1.25rem;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.alg-header__figure img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> -->
<template>
  <div class="flex flex-row items-stretch gap-6 font-handwritten text-default">
    <div
      class="flex flex-1 flex-col justify-center"
      :class="imageSrc ? 'basis-[60%]' : ''"
    >
      <div
        class="-rotate-[0.2deg] rounded-[20px_6px_22px_5px/6px_20px_5px_22px] border-2 border-dashed border-primary bg-elevated px-8 py-6 text-center shadow-[2px_3px_0_rgba(0,0,0,0.04)]"
      >
        <div v-if="labels && labels.length" class="mb-3 flex flex-wrap justify-center gap-2">
          <span
            v-for="(label, i) in labels"
            :key="label.id ?? i"
            class="-rotate-[1deg] inline-block rounded-[40%_60%_58%_42%/55%_45%_55%_45%] border-[1.5px] border-dashed border-primary px-2.5 py-1 text-[0.75rem] font-bold"
          >{{ label.name }}</span>
        </div>

        <h1 v-if="headline" class="mb-2 text-[2rem] font-bold">{{ headline }}</h1>
        <p v-if="subtitle" class="mx-auto mb-5 max-w-[38rem] text-base text-default/65">{{ subtitle }}</p>

        <div v-if="loading" class="p-4 text-[0.85rem] text-default/60">Loading datachain…</div>
        <div v-else-if="error" class="p-4 text-[0.85rem] text-red-700">Failed to load: {{ error }}</div>

        <div
          v-else-if="hasContextRow"
          class="rounded-[16px_5px_18px_4px/5px_16px_4px_18px] border-2 border-dashed border-primary bg-elevated px-5 py-4 transition-[box-shadow,background-color] duration-300"
          :class="highlightRow === 'context' ? 'shadow-[0_0_0_3px_#dc2626] bg-red-600/5' : ''"
        >
          <div class="flex flex-row items-start justify-center gap-12">
            <div
              v-if="accountable"
              class="flex w-36 min-w-0 flex-col items-center rounded-xl px-2 py-3 text-center transition-[box-shadow,background-color] duration-300"
              :class="highlightCategoryId === 'accountable' ? 'shadow-[0_0_0_3px_#dc2626] bg-red-600/5' : ''"
            >
              <div class="mb-1.5 flex min-h-[1.5rem] items-end text-[0.7rem] text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">{{ categoryName('accountable') }}</div>
              <img :src="accountable.icon" alt="" aria-hidden="true" class="h-12 w-12 shrink-0 object-contain" />
              <div class="mt-1.5 break-words text-[0.85rem] leading-tight">{{ accountable.title }}</div>
            </div>
            <div
              v-if="functionalModes"
              class="flex w-36 min-w-0 flex-col items-center rounded-xl px-2 py-3 text-center transition-[box-shadow,background-color] duration-300"
              :class="highlightCategoryId === 'functional_modes' ? 'shadow-[0_0_0_3px_#dc2626] bg-red-600/5' : ''"
            >
              <div class="mb-1.5 flex min-h-[1.5rem] items-end text-[0.7rem] text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">{{ categoryName('functional_modes') }}</div>
              <img :src="functionalModes.icon" alt="" aria-hidden="true" class="h-12 w-12 shrink-0 object-contain" />
              <div class="mt-1.5 break-words text-[0.85rem] leading-tight">{{ functionalModes.title }}</div>
              <span
                v-if="contextSummaries.autonomy"
                class="mt-2 inline-flex items-center gap-1.5 rounded-[999px] border-[1.5px] border-dashed border-primary px-2.5 py-0.5 text-[0.7rem]"
              >
                <span
                  class="h-2 w-2 shrink-0 rounded-full bg-default/20"
                  :style="contextSummaries.autonomy.color ? { backgroundColor: contextSummaries.autonomy.color } : {}"
                />
                {{ contextSummaries.autonomy.title }}
              </span>
            </div>
            <div
              v-if="purpose"
              class="flex w-36 min-w-0 flex-col items-center rounded-xl px-2 py-3 text-center transition-[box-shadow,background-color] duration-300"
              :class="highlightCategoryId === 'purpose' ? 'shadow-[0_0_0_3px_#dc2626] bg-red-600/5' : ''"
            >
              <div class="mb-1.5 flex min-h-[1.5rem] items-end text-[0.7rem] text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">{{ categoryName('purpose') }}</div>
              <img :src="purpose.icon" alt="" aria-hidden="true" class="h-12 w-12 shrink-0 object-contain" />
              <div class="mt-1.5 break-words text-[0.85rem] leading-tight">{{ purpose.title }}</div>
            </div>
          </div>
        </div>

        <div
          v-if="!loading && !error && flowSteps.length"
          class="mt-3 rotate-[0.2deg] rounded-[16px_5px_18px_4px/5px_16px_4px_18px] border-2 border-dashed border-primary bg-elevated px-5 py-4 transition-[box-shadow,background-color] duration-300"
          :class="highlightRow === 'flow' ? 'shadow-[0_0_0_3px_#dc2626] bg-red-600/5' : ''"
        >
          <div class="flex flex-row items-start justify-center gap-12">
            <div
              v-for="step in flowSteps"
              :key="step.key"
              class="flex w-36 min-w-0 flex-col items-center rounded-xl px-2 py-3 text-center transition-[box-shadow,background-color] duration-300"
              :class="highlightCategoryId === step.categoryId ? 'shadow-[0_0_0_3px_#dc2626] bg-red-600/5' : ''"
            >
              <div class="mb-1.5 flex min-h-[1.5rem] items-end text-[0.7rem] text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">{{ categoryName(step.categoryId) }}</div>
              <img :src="step.preview.icon" alt="" aria-hidden="true" class="h-12 w-12 shrink-0 object-contain" />
              <div class="mt-1.5 break-words text-[0.85rem] leading-tight">{{ step.preview.title }}</div>
              <span
                v-if="step.pii"
                class="mt-2 inline-flex items-center gap-1.5 rounded-[999px] border-[1.5px] border-dashed border-primary px-2.5 py-0.5 text-[0.7rem]"
              >
                <span
                  class="h-2 w-2 shrink-0 rounded-full bg-default/20"
                  :style="step.pii.color ? { backgroundColor: step.pii.color } : {}"
                />
                {{ step.pii.title }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <figure v-if="imageSrc" class="m-0 basis-[40%] overflow-hidden rounded-[20px_6px_22px_5px/6px_20px_5px_22px] border-2 border-dashed border-primary">
      <img :src="imageSrc" alt="" class="h-full w-full object-cover" />
    </figure>
  </div>
</template>