<script setup lang="ts">
const { data, status } = useIcons()
const toast = useToast()

const search = ref('')

const icons = computed(() => (data.value as any)?.elements || [])
const symbols = computed(() => (data.value as any)?.symbols || [])
const shapes = computed(() => (data.value as any)?.shapes || [])

// --- Symbols tab ---
const filteredSymbols = computed(() => {
  if (!search.value) return symbols.value
  const term = search.value.toLowerCase()
  return symbols.value.filter((s: any) =>
    s.id.toLowerCase().includes(term) ||
    s.elements.some((e: any) => e.name.toLowerCase().includes(term) || e.id.toLowerCase().includes(term)),
  )
})

// --- Icons tab ---
const filterStatus = ref('')
const iconStatusOptions = [
  { label: 'All', value: '' },
  { label: 'Has icon', value: 'yes' },
  { label: 'Missing icon', value: 'missing' },
  { label: 'Has symbol', value: 'has-symbol' },
  { label: 'Missing symbol', value: 'missing-symbol' },
]

const filteredIcons = computed(() => {
  return icons.value.filter((item: any) => {
    if (search.value) {
      const term = search.value.toLowerCase()
      if (!`${item.name} ${item.id}`.toLowerCase().includes(term)) return false
    }
    if (filterStatus.value === 'yes' && !item.hasIcon) return false
    if (filterStatus.value === 'missing' && item.hasIcon) return false
    if (filterStatus.value === 'has-symbol' && !item.hasSymbol) return false
    if (filterStatus.value === 'missing-symbol' && item.hasSymbol) return false
    return true
  })
})

function symbolUrl(fileName: string) {
  return `/api/icons/symbol?id=${encodeURIComponent(fileName)}`
}

function shapeUrl(fileName: string) {
  return `/api/icons/symbol?id=../shapes/${encodeURIComponent(fileName)}`
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  toast.add({ title: `Copied: ${text}`, color: 'neutral' })
}

const tabs = [
  { label: 'Symbols', value: 'symbols', icon: 'i-lucide-shapes' },
  { label: 'Icons', value: 'icons', icon: 'i-lucide-image' },
  { label: 'Shapes', value: 'shapes', icon: 'i-lucide-hexagon' },
]
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Icons</h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">
          {{ symbols.length }} symbols · {{ icons.length }} elements
        </span>
        <UButton
          label="Generate"
          icon="i-lucide-sparkles"
          to="/icons/generate"
        />
      </div>
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading...
    </div>

    <UTabs v-else :items="tabs" default-value="symbols" class="w-full">
      <template #content="{ item }">
        <!-- ============ SYMBOLS TAB ============ -->
        <div v-if="item.value === 'symbols'" class="space-y-4 pt-4">
          <div class="flex flex-wrap gap-3">
            <UInput v-model="search" placeholder="Search symbols..." icon="i-lucide-search" class="w-64" />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div
              v-for="sym in filteredSymbols"
              :key="sym.id"
              class="flex flex-col items-center gap-2 p-3 rounded-lg border border-default hover:border-primary transition-colors"
            >
              <div
                class="w-16 h-16 flex items-center justify-center rounded bg-white"
                style="color: black; --symbol-bg: white"
              >
                <img
                  :src="symbolUrl(sym.fileName)"
                  :alt="sym.id"
                  class="w-14 h-14"
                />
              </div>

              <button
                class="text-xs font-mono text-muted hover:text-primary truncate w-full text-center cursor-pointer"
                :title="`Click to copy: ${sym.id}`"
                @click="copyText(sym.id)"
              >
                {{ sym.id }}
              </button>

              <div v-if="sym.elements.length" class="text-[10px] text-muted text-center w-full">
                <span :title="sym.elements.map((e: any) => e.name).join(', ')">
                  {{ sym.elements.length }} element{{ sym.elements.length === 1 ? '' : 's' }}
                </span>
              </div>
              <div v-else class="text-[10px] text-warning text-center">
                unused
              </div>
            </div>
          </div>
        </div>

        <!-- ============ ICONS TAB ============ -->
        <div v-if="item.value === 'icons'" class="space-y-4 pt-4">
          <div class="flex flex-wrap gap-3">
            <UInput v-model="search" placeholder="Search elements..." icon="i-lucide-search" class="w-48" />
            <USelectMenu v-model="filterStatus" :items="iconStatusOptions" value-key="value" class="w-44" />
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div
              v-for="item in filteredIcons"
              :key="item.id"
              class="flex flex-col items-center gap-2 p-3 rounded-lg border border-default hover:border-primary transition-colors"
            >
              <div class="flex items-center gap-2">
                <div class="w-12 h-12 flex items-center justify-center rounded bg-white">
                  <img
                    v-if="item.hasIcon"
                    :src="useIconUrl(item.icon)"
                    :alt="item.name"
                    class="w-10 h-10"
                  />
                  <div v-else class="w-10 h-10 rounded bg-muted/20 flex items-center justify-center">
                    <UIcon name="i-lucide-image-off" class="size-5 text-muted" />
                  </div>
                </div>

                <div
                  class="w-12 h-12 flex items-center justify-center rounded"
                  :class="item.hasSymbol ? 'bg-white' : 'bg-muted/10'"
                  :style="item.hasSymbol ? 'color: black; --symbol-bg: white' : ''"
                >
                  <img
                    v-if="item.hasSymbol"
                    :src="symbolUrl(item.symbolFileName)"
                    :alt="`${item.name} symbol`"
                    class="w-10 h-10"
                  />
                  <div v-else class="w-10 h-10 rounded bg-muted/20 flex items-center justify-center">
                    <UIcon name="i-lucide-shapes" class="size-5 text-muted" />
                  </div>
                </div>
              </div>

              <div class="text-xs text-center line-clamp-2 w-full" :title="item.name">
                {{ item.name }}
              </div>
              <button
                class="text-[10px] text-muted hover:text-primary font-mono truncate w-full text-center cursor-pointer"
                :title="`Click to copy: ${item.id}`"
                @click="copyText(item.id)"
              >
                {{ item.id }}
              </button>
            </div>
          </div>
        </div>

        <!-- ============ SHAPES TAB ============ -->
        <div v-if="item.value === 'shapes'" class="space-y-4 pt-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div
              v-for="shape in shapes"
              :key="shape.id"
              class="flex flex-col items-center gap-3 p-6 rounded-lg border border-default"
            >
              <div class="text-sm font-medium capitalize">{{ shape.id }}</div>

              <div class="flex gap-4">
                <!-- Light variant -->
                <div class="flex flex-col items-center gap-1">
                  <div class="w-16 h-16 flex items-center justify-center rounded bg-white">
                    <img :src="symbolUrl('../shapes/' + shape.fileName)" :alt="shape.id" class="w-14 h-14" />
                  </div>
                  <span class="text-[10px] text-muted">light</span>
                </div>

                <!-- Dark variant preview -->
                <div class="flex flex-col items-center gap-1">
                  <div class="w-16 h-16 flex items-center justify-center rounded bg-black">
                    <img
                      :src="symbolUrl('../shapes/' + shape.fileName)"
                      :alt="shape.id"
                      class="w-14 h-14 invert"
                    />
                  </div>
                  <span class="text-[10px] text-muted">dark</span>
                </div>
              </div>

              <button
                class="text-[10px] text-muted hover:text-primary font-mono cursor-pointer"
                @click="copyText(shape.id)"
              >
                {{ shape.id }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
