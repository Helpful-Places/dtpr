<script setup lang="ts">
import type { ShapeType } from '~/lib/icon-shapes'
import { RECRAFT_MODELS, buildDefaultPrompt } from '~/lib/recraft-config'

const toast = useToast()

// API key status
const { data: iconConfig } = await useFetch('/api/icons/config')

// Elements list for selection
const { data: elements } = await useFetch<any[]>('/api/elements')

const selectedElementId = ref<string>('')
const referenceSymbols = ref<string[]>([])
const selectedModel = ref(RECRAFT_MODELS[0].id)
const prompt = ref('')
const suggestedColors = ref<[number, number, number][]>([])
const generating = ref(false)
const saving = ref(false)
const brainstormOpen = ref(false)

// Multi-result preview state
interface GeneratedResult {
  innerSvg: string
  light: string
}
const generatedResults = ref<GeneratedResult[]>([])
const selectedResultIndex = ref(0)
const previewShape = ref<ShapeType>('hexagon')
const compositing = ref(false)

// Full variant preview for the selected result
const previewVariants = ref<{ light: string; dark: string; colored: string } | null>(null)

const modelOptions = RECRAFT_MODELS.map((m) => ({
  label: m.label,
  value: m.id,
}))

const shapeOptions = [
  { label: 'Hexagon', value: 'hexagon' as ShapeType },
  { label: 'Circle', value: 'circle' as ShapeType },
  { label: 'Rounded Square', value: 'rounded-square' as ShapeType },
  { label: 'Octagon', value: 'octagon' as ShapeType },
]

// Sort elements alphabetically by English name
const sortedElements = computed(() => {
  if (!elements.value) return []
  return [...elements.value].sort((a, b) => {
    const nameA = a.locales?.en?.name || a.id
    const nameB = b.locales?.en?.name || b.id
    return nameA.localeCompare(nameB)
  })
})

const elementOptions = computed(() =>
  sortedElements.value.map((el) => ({
    label: el.locales?.en?.name || el.id,
    value: el.id,
  })),
)

// Selected element details
const selectedElement = computed(() => {
  if (!selectedElementId.value || !elements.value) return null
  return elements.value.find((el: any) => el.id === selectedElementId.value)
})

const elementName = computed(() => {
  const el = selectedElement.value
  return el?.locales?.en?.name || el?.id || ''
})

const elementDescription = computed(() => {
  const el = selectedElement.value
  return el?.locales?.en?.description || ''
})

// Auto-build default prompt when element changes
watch(selectedElementId, async (id, oldId) => {
  if (!id) return

  // Reset state
  generatedResults.value = []
  selectedResultIndex.value = 0
  previewVariants.value = null
  suggestedColors.value = []

  // Clear old element's brainstorm chat
  if (oldId) clearBrainstormChat(oldId)

  try {
    const el = await $fetch<any>(`/api/elements/${id}`)
    const en = el.locales?.en
    if (!en) return

    prompt.value = buildDefaultPrompt({
      elementId: id,
      elementName: en.name,
      elementDescription: en.description,
      categories: el.category || [],
    })
  } catch {
    // Element fetch failed — keep defaults
  }
})

function onPromptReady(generatedPrompt: string, colors?: [number, number, number][]) {
  prompt.value = generatedPrompt
  suggestedColors.value = colors || []
  brainstormOpen.value = false
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

async function generate() {
  if (!selectedElementId.value || !prompt.value.trim()) {
    toast.add({ title: 'Enter a prompt', color: 'warning' })
    return
  }

  generating.value = true
  generatedResults.value = []
  selectedResultIndex.value = 0
  previewVariants.value = null
  try {
    // Create a Recraft style from reference symbols if any are selected
    let styleId: string | undefined
    if (referenceSymbols.value.length > 0) {
      try {
        const styleResult = await $fetch<{ styleId: string }>('/api/icons/style', {
          method: 'POST',
          body: { symbolIds: referenceSymbols.value },
        })
        styleId = styleResult.styleId
      } catch (e: any) {
        toast.add({
          title: 'Style creation failed',
          description: `Generating without style reference. ${e.data?.message || e.message}`,
          color: 'warning',
        })
      }
    }

    const result = await $fetch<{
      success: boolean
      elementId: string
      shape: ShapeType
      results: GeneratedResult[]
    }>('/api/icons/generate', {
      method: 'POST',
      body: {
        elementId: selectedElementId.value,
        model: selectedModel.value,
        prompt: prompt.value,
        colors: suggestedColors.value.length > 0 ? suggestedColors.value : undefined,
        styleId,
      },
    })

    generatedResults.value = result.results
    previewShape.value = result.shape

    // Auto-select first and load full variants
    if (result.results.length > 0) {
      await selectResult(0)
    }
  } catch (e: any) {
    toast.add({ title: 'Generation failed', description: e.data?.message || e.message, color: 'error' })
  } finally {
    generating.value = false
  }
}

async function selectResult(index: number) {
  selectedResultIndex.value = index
  await compositeWithShape(generatedResults.value[index].innerSvg, previewShape.value)
}

async function compositeWithShape(innerSvg: string, shape: ShapeType) {
  compositing.value = true
  try {
    const result = await $fetch<{ light: string; dark: string; colored: string }>('/api/icons/composite', {
      method: 'POST',
      body: { innerSvg, shape },
    })
    previewVariants.value = result
  } catch (e: any) {
    toast.add({ title: 'Composite failed', description: e.message, color: 'error' })
  } finally {
    compositing.value = false
  }
}

// Re-composite when shape changes
watch(previewShape, async (shape) => {
  const result = generatedResults.value[selectedResultIndex.value]
  if (result) {
    await compositeWithShape(result.innerSvg, shape)
  }
})

async function approveAndSave() {
  if (!previewVariants.value || !selectedElementId.value) return
  saving.value = true
  try {
    await $fetch('/api/icons/save', {
      method: 'POST',
      body: {
        elementId: selectedElementId.value,
        svg: previewVariants.value.light,
      },
    })
    toast.add({ title: 'Icon saved', description: `Saved icon for ${elementName.value}`, color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Save failed', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-5xl">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <UButton icon="i-lucide-arrow-left" variant="ghost" to="/icons" />
        <h1 class="text-2xl font-bold">Generate Symbol</h1>
      </div>

      <UButton
        v-if="selectedElementId && iconConfig?.hasAnthropicKey"
        label="Brainstorm with Claude"
        icon="i-lucide-bot"
        variant="outline"
        color="neutral"
        @click="brainstormOpen = true"
      />
    </div>

    <!-- API key warnings -->
    <div v-if="iconConfig && !iconConfig.hasRecraftKey" class="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-sm">
      <div class="flex items-center gap-2 font-medium">
        <UIcon name="i-lucide-triangle-alert" class="size-4" />
        Recraft API key not configured
      </div>
      <p class="mt-1 text-muted">
        Set <code class="bg-muted/30 px-1 rounded">RECRAFT_API_KEY</code> in your <code class="bg-muted/30 px-1 rounded">.env</code> file.
      </p>
    </div>

    <!-- Element selector -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium">Element</label>
      <USelectMenu
        v-model="selectedElementId"
        :items="elementOptions"
        value-key="value"
        placeholder="Choose an element..."
        searchable
        class="w-full max-w-sm"
      />
      <p v-if="selectedElement" class="text-xs text-muted">{{ elementDescription }}</p>
    </div>

    <!-- Reference symbol picker -->
    <IconsSymbolPicker v-model="referenceSymbols" />

    <!-- Prompt & Generate -->
    <div v-if="selectedElementId" class="space-y-4">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Prompt editing -->
        <div class="space-y-4">
          <!-- Model selector -->
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Model</label>
            <USelectMenu
              v-model="selectedModel"
              :items="modelOptions"
              value-key="value"
              class="w-full"
            />
          </div>

          <!-- Prompt -->
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Recraft Prompt</label>
            <UTextarea
              v-model="prompt"
              :rows="8"
              placeholder="Describe the symbol to generate..."
              class="w-full"
            />
            <p class="text-xs text-muted">Edit the prompt or use "Brainstorm with Claude" for help.</p>
          </div>

          <!-- Suggested colors -->
          <div v-if="suggestedColors.length > 0" class="space-y-1.5">
            <label class="text-sm font-medium">Suggested Colors</label>
            <div class="flex gap-2 items-center">
              <div
                v-for="(color, i) in suggestedColors"
                :key="i"
                class="w-8 h-8 rounded border border-default"
                :style="{ backgroundColor: `rgb(${color[0]}, ${color[1]}, ${color[2]})` }"
                :title="`rgb(${color.join(', ')})`"
              />
              <button class="text-xs text-muted hover:text-foreground cursor-pointer" @click="suggestedColors = []">
                clear
              </button>
            </div>
          </div>

          <!-- Generate button -->
          <UButton
            label="Generate 3 Variations"
            icon="i-lucide-sparkles"
            size="lg"
            :loading="generating"
            :disabled="!prompt.trim() || (iconConfig && !iconConfig.hasRecraftKey)"
            class="w-full"
            @click="generate"
          />
        </div>

        <!-- Right: Preview -->
        <div class="space-y-4">
          <!-- Pick from 3 generated options -->
          <div v-if="generatedResults.length > 0" class="space-y-4">
            <h3 class="text-sm font-medium">Choose a Symbol</h3>
            <div class="flex gap-3 justify-center">
              <button
                v-for="(result, i) in generatedResults"
                :key="i"
                type="button"
                class="flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all cursor-pointer"
                :class="selectedResultIndex === i
                  ? 'border-primary bg-primary/5'
                  : 'border-default hover:border-muted-foreground/30'"
                @click="selectResult(i)"
              >
                <div class="w-20 h-20 flex items-center justify-center rounded bg-white">
                  <img :src="svgToDataUrl(result.light)" class="w-16 h-16" />
                </div>
                <span class="text-xs text-muted">Option {{ i + 1 }}</span>
              </button>
            </div>

            <!-- Shape selector for preview -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium">Preview Shape</label>
              <USelectMenu
                v-model="previewShape"
                :items="shapeOptions"
                value-key="value"
                class="w-full"
              />
            </div>

            <!-- Full variant preview -->
            <div v-if="previewVariants && !compositing" class="space-y-3">
              <h3 class="text-sm font-medium">Variants</h3>
              <div class="flex gap-4 justify-center py-4 rounded-lg border border-default">
                <div class="flex flex-col items-center gap-2">
                  <div class="w-20 h-20 flex items-center justify-center rounded-lg border border-default bg-white">
                    <img :src="svgToDataUrl(previewVariants.light)" class="w-16 h-16" />
                  </div>
                  <span class="text-xs text-muted">Light</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="w-20 h-20 flex items-center justify-center rounded-lg border border-default bg-gray-900">
                    <img :src="svgToDataUrl(previewVariants.dark)" class="w-16 h-16" />
                  </div>
                  <span class="text-xs text-muted">Dark</span>
                </div>
                <div class="flex flex-col items-center gap-2">
                  <div class="w-20 h-20 flex items-center justify-center rounded-lg border border-default bg-white">
                    <img :src="svgToDataUrl(previewVariants.colored)" class="w-16 h-16" />
                  </div>
                  <span class="text-xs text-muted">Colored</span>
                </div>
              </div>
            </div>

            <div v-else-if="compositing" class="flex items-center justify-center py-8 text-muted">
              <UIcon name="i-lucide-loader" class="size-4 animate-spin mr-2" />
              Compositing...
            </div>

            <div class="flex gap-2">
              <UButton
                label="Regenerate"
                icon="i-lucide-refresh-cw"
                variant="outline"
                color="neutral"
                :loading="generating"
                class="flex-1"
                @click="generate"
              />
              <UButton
                label="Approve & Save"
                icon="i-lucide-check"
                color="primary"
                :loading="saving"
                :disabled="!previewVariants"
                class="flex-1"
                @click="approveAndSave"
              />
            </div>
          </div>

          <div v-else-if="generating" class="flex items-center justify-center py-16 text-muted">
            <UIcon name="i-lucide-loader" class="size-5 animate-spin mr-2" />
            Generating 3 variations...
          </div>

          <div v-else class="flex items-center justify-center py-16 text-muted border border-dashed border-default rounded-lg">
            <p class="text-sm">Preview will appear here after generation</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Brainstorm Slideover -->
    <USlideover
      v-model:open="brainstormOpen"
      title="Brainstorm with Claude"
      description="Chat with Claude to explore visual metaphors for this symbol."
      side="right"
      :ui="{ content: 'sm:max-w-lg', body: 'flex flex-col min-h-0 overflow-hidden' }"
    >
      <template #body>
        <IconsBrainstormChat
          v-if="selectedElementId"
          :key="selectedElementId"
          :element-id="selectedElementId"
          :element-name="elementName"
          :element-description="elementDescription"
          :reference-symbols="referenceSymbols"
          @prompt-ready="onPromptReady"
        />
      </template>
    </USlideover>
  </div>
</template>
