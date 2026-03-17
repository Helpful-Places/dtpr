<script setup lang="ts">
const { data: icons, status } = useIcons()
const toast = useToast()

const search = ref('')
const filterStatus = ref<string>('')
const viewMode = ref<'icons' | 'symbols' | 'both'>('both')

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Has icon', value: 'yes' },
  { label: 'Missing icon', value: 'missing' },
  { label: 'Has symbol', value: 'has-symbol' },
  { label: 'Missing symbol', value: 'missing-symbol' },
]

const viewOptions = [
  { label: 'Both', value: 'both' },
  { label: 'Icons', value: 'icons' },
  { label: 'Symbols', value: 'symbols' },
]

const filteredIcons = computed(() => {
  if (!icons.value) return []
  return (icons.value as any[]).filter((item) => {
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

const missingCount = computed(() => {
  if (!icons.value) return 0
  return (icons.value as any[]).filter((item) => !item.hasIcon).length
})

const symbolCount = computed(() => {
  if (!icons.value) return 0
  return (icons.value as any[]).filter((item) => item.hasSymbol).length
})

function symbolUrl(id: string) {
  return `/api/icons/symbol?id=${encodeURIComponent(id)}`
}

function copyId(id: string) {
  navigator.clipboard.writeText(id)
  toast.add({ title: `Copied: ${id}`, color: 'neutral' })
}
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Icons</h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">{{ symbolCount }} symbols | {{ missingCount }} missing icons</span>
        <UButton
          label="Generate"
          icon="i-lucide-sparkles"
          to="/icons/generate"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <UInput v-model="search" placeholder="Search..." icon="i-lucide-search" class="w-48" />
      <USelectMenu v-model="filterStatus" :items="statusOptions" value-key="value" class="w-44" />
      <USelectMenu v-model="viewMode" :items="viewOptions" value-key="value" class="w-32" />
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading...
    </div>

    <!-- Icon grid -->
    <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div
        v-for="item in filteredIcons"
        :key="item.id"
        class="flex flex-col items-center gap-2 p-3 rounded-lg border border-default hover:border-primary transition-colors"
      >
        <div class="flex items-center gap-2">
          <!-- Icon preview -->
          <div
            v-if="viewMode !== 'symbols'"
            class="w-12 h-12 flex items-center justify-center rounded bg-white"
          >
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

          <!-- Symbol preview -->
          <div
            v-if="viewMode !== 'icons'"
            class="w-12 h-12 flex items-center justify-center rounded"
            :class="item.hasSymbol ? 'bg-white' : 'bg-muted/10'"
          >
            <img
              v-if="item.hasSymbol"
              :src="symbolUrl(item.id)"
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
          @click="copyId(item.id)"
        >
          {{ item.id }}
        </button>
      </div>
    </div>
  </div>
</template>
