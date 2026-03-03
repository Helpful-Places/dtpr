<script setup lang="ts">
const { data: icons, status, refresh } = useIcons()
const toast = useToast()

const search = ref('')
const filterStatus = ref<string>('')
const generating = ref<string | null>(null)

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Has icon', value: 'yes' },
  { label: 'Missing', value: 'missing' },
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
    return true
  })
})

const missingCount = computed(() => {
  if (!icons.value) return 0
  return (icons.value as any[]).filter((item) => !item.hasIcon).length
})

async function generateIcon(elementId: string) {
  generating.value = elementId
  try {
    await $fetch('/api/icons/generate', {
      method: 'POST',
      body: { elementId },
    })
    toast.add({ title: 'Icon generated', description: `Icon created for ${elementId}`, color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Generation failed', description: e.message, color: 'error' })
  } finally {
    generating.value = null
  }
}
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Icons</h1>
      <div class="text-sm text-muted">{{ missingCount }} missing</div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <UInput v-model="search" placeholder="Search..." icon="i-lucide-search" class="w-48" />
      <USelectMenu v-model="filterStatus" :items="statusOptions" value-key="value" class="w-36" />
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading...
    </div>

    <!-- Icon grid -->
    <div v-else class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
      <div
        v-for="item in filteredIcons"
        :key="item.id"
        class="flex flex-col items-center gap-1 p-2 rounded-lg border border-default hover:border-primary transition-colors group"
      >
        <div class="w-10 h-10 flex items-center justify-center">
          <img
            v-if="item.hasIcon"
            :src="item.icon"
            :alt="item.name"
            class="w-8 h-8"
          />
          <div v-else class="w-8 h-8 rounded bg-muted/20 flex items-center justify-center">
            <UIcon name="i-lucide-image-off" class="size-4 text-muted" />
          </div>
        </div>
        <div class="text-xs text-center truncate w-full" :title="item.name">
          {{ item.name }}
        </div>
        <UButton
          v-if="!item.hasIcon"
          label="Generate"
          size="xs"
          variant="outline"
          class="opacity-0 group-hover:opacity-100 transition-opacity"
          :loading="generating === item.id"
          @click="generateIcon(item.id)"
        />
      </div>
    </div>
  </div>
</template>
