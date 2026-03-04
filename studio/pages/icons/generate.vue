<script setup lang="ts">
import type { ShapeType } from '~/lib/icon-shapes'
import { RECRAFT_STYLES, buildDefaultPrompt } from '~/lib/recraft-config'

const toast = useToast()

// API key status
const { data: iconConfig } = await useFetch('/api/icons/config')

// Elements list for selection
const { data: elements } = await useFetch<any[]>('/api/elements')

// Icons list for reference context
const { data: icons } = useIcons()

const selectedElementId = ref<string>('')
const selectedShape = ref<ShapeType>('hexagon')
const selectedStyle = ref('vector_illustration/line_art')
const prompt = ref('')
const generating = ref(false)
const saving = ref(false)

// Preview state
const previewVariants = ref<{ light: string; dark: string; colored: string } | null>(null)

const shapeOptions = [
  { label: 'Hexagon', value: 'hexagon' as ShapeType },
  { label: 'Circle', value: 'circle' as ShapeType },
  { label: 'Rounded Square', value: 'rounded-square' as ShapeType },
  { label: 'Octagon', value: 'octagon' as ShapeType },
]

const styleOptions = RECRAFT_STYLES.map((s) => ({
  label: s.label,
  value: s.id as string,
}))

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

function getElementName(el: any): string {
  return el?.locales?.en?.name || el?.id || ''
}

// Existing icons with images for reference context
const existingIcons = computed(() => {
  if (!icons.value) return []
  return (icons.value as any[]).filter((item) => item.hasIcon).slice(0, 12)
})

// Auto-populate shape and prompt when element changes
watch(selectedElementId, async (id) => {
  if (!id) return
  try {
    const el = await $fetch<any>(`/api/elements/${id}`)
    const en = el.locales?.en
    if (!en) return

    // Set shape from category
    const categories: string[] = el.category || []
    if (categories.length > 0) {
      const categoryShapeMap: Record<string, ShapeType> = {
        device__tech: 'hexagon', device__purpose: 'hexagon', device__process: 'hexagon',
        ai__purpose: 'hexagon', ai__processing: 'hexagon', ai__decision: 'hexagon',
        device__data: 'circle', ai__input_dataset: 'circle', ai__output_dataset: 'circle',
        device__access: 'rounded-square', ai__access: 'rounded-square',
        device__storage: 'rounded-square', ai__storage: 'rounded-square',
        device__retention: 'rounded-square', ai__retention: 'rounded-square',
        device__accountable: 'rounded-square', ai__accountable: 'rounded-square',
        ai__rights: 'octagon', ai__risks_mitigation: 'octagon',
      }
      const first = categories[0]
      if (first && categoryShapeMap[first]) {
        selectedShape.value = categoryShapeMap[first]
      }
    }

    // Build default prompt
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

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

async function generate() {
  if (!selectedElementId.value) {
    toast.add({ title: 'Select an element', color: 'warning' })
    return
  }
  if (!prompt.value.trim()) {
    toast.add({ title: 'Enter a prompt', color: 'warning' })
    return
  }

  generating.value = true
  previewVariants.value = null
  try {
    const result = await $fetch<{
      success: boolean
      elementId: string
      shape: string
      innerSvg: string
      variants: { light: string; dark: string; colored: string }
    }>('/api/icons/generate', {
      method: 'POST',
      body: {
        elementId: selectedElementId.value,
        shape: selectedShape.value,
        style: selectedStyle.value,
        prompt: prompt.value,
      },
    })

    previewVariants.value = result.variants
  } catch (e: any) {
    toast.add({ title: 'Generation failed', description: e.data?.message || e.message, color: 'error' })
  } finally {
    generating.value = false
  }
}

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
    toast.add({ title: 'Icon saved', description: `Saved icon for ${getElementName(selectedElement.value)}`, color: 'success' })
    previewVariants.value = null
  } catch (e: any) {
    toast.add({ title: 'Save failed', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-4xl">
    <div class="flex items-center gap-3">
      <UButton icon="i-lucide-arrow-left" variant="ghost" to="/icons" />
      <h1 class="text-2xl font-bold">Generate Icon</h1>
    </div>

    <!-- API key warning -->
    <div v-if="iconConfig && !iconConfig.hasRecraftKey" class="p-4 rounded-lg border border-yellow-500/50 bg-yellow-500/10 text-sm">
      <div class="flex items-center gap-2 font-medium">
        <UIcon name="i-lucide-triangle-alert" class="size-4" />
        Recraft API key not configured
      </div>
      <p class="mt-1 text-muted">
        Set <code class="bg-muted/30 px-1 rounded">RECRAFT_API_KEY</code> in your <code class="bg-muted/30 px-1 rounded">.env</code> file to enable icon generation.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left: Configuration -->
      <div class="space-y-4">
        <!-- Element selector -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Element</label>
          <USelectMenu
            v-model="selectedElementId"
            :items="elementOptions"
            value-key="value"
            placeholder="Choose an element..."
            searchable
            class="w-full"
          />
        </div>

        <!-- Shape selector -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Shape</label>
          <USelectMenu
            v-model="selectedShape"
            :items="shapeOptions"
            value-key="value"
            class="w-full"
          />
          <p class="text-xs text-muted">Auto-set from element category. Override if needed.</p>
        </div>

        <!-- Style selector -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Recraft Style</label>
          <USelectMenu
            v-model="selectedStyle"
            :items="styleOptions"
            value-key="value"
            class="w-full"
          />
        </div>

        <!-- Prompt -->
        <div class="space-y-1.5">
          <label class="text-sm font-medium">Prompt</label>
          <UTextarea
            v-model="prompt"
            :rows="5"
            placeholder="Describe the icon to generate..."
            class="w-full"
          />
          <p class="text-xs text-muted">Auto-generated from element name and description. Edit freely.</p>
        </div>

        <!-- Generate button -->
        <UButton
          label="Generate"
          icon="i-lucide-sparkles"
          size="lg"
          :loading="generating"
          :disabled="!selectedElementId || !prompt.trim() || (iconConfig && !iconConfig.hasRecraftKey)"
          class="w-full"
          @click="generate"
        />
      </div>

      <!-- Right: Preview + Reference -->
      <div class="space-y-6">
        <!-- Preview -->
        <div v-if="previewVariants" class="space-y-4">
          <h2 class="text-sm font-medium">Preview</h2>
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
              class="flex-1"
              @click="approveAndSave"
            />
          </div>
        </div>

        <div v-else-if="generating" class="flex items-center justify-center py-16 text-muted">
          <UIcon name="i-lucide-loader" class="size-5 animate-spin mr-2" />
          Generating...
        </div>

        <!-- Reference icons -->
        <div class="space-y-2">
          <h2 class="text-sm font-medium">Existing Icons (Reference)</h2>
          <p class="text-xs text-muted">These are the current DTPR icons. Use as style reference when crafting your prompt.</p>
          <div class="grid grid-cols-6 gap-2">
            <div
              v-for="item in existingIcons"
              :key="item.id"
              class="flex flex-col items-center gap-1 p-2 rounded border border-default"
            >
              <div class="w-8 h-8 flex items-center justify-center bg-white rounded">
                <img :src="useIconUrl(item.icon)" :alt="item.name" class="w-7 h-7" />
              </div>
              <span class="text-[10px] text-center line-clamp-1 w-full text-muted">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
