<script setup lang="ts">
const { data: categories, status } = useCategories()

const selectedType = ref<string>('')

const typeOptions = [
  { label: 'All types', value: '' },
  { label: 'AI', value: 'ai' },
  { label: 'Device', value: 'device' },
]

const filteredCategories = computed(() => {
  if (!categories.value) return []
  const sorted = [...categories.value].sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
  if (selectedType.value) {
    return sorted.filter((c) => c.datachain_type === selectedType.value)
  }
  return sorted
})

const groupedByType = computed(() => {
  const groups: Record<string, typeof filteredCategories.value> = {}
  for (const cat of filteredCategories.value) {
    const type = cat.datachain_type
    if (!groups[type]) groups[type] = []
    groups[type].push(cat)
  }
  return groups
})
</script>

<template>
  <div class="p-6 space-y-4">
    <h1 class="text-2xl font-bold">Categories</h1>

    <div class="flex gap-3">
      <USelectMenu v-model="selectedType" :items="typeOptions" value-key="value" class="w-36" />
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading categories...
    </div>
    <div v-else class="space-y-6">
      <div v-for="(cats, type) in groupedByType" :key="type">
        <h2 class="text-lg font-semibold mb-3 capitalize">{{ type }} Datachain</h2>
        <div class="grid gap-2">
          <NuxtLink
            v-for="cat in cats"
            :key="cat.id"
            :to="`/categories/${cat.id}`"
            class="flex items-center justify-between py-3 px-4 rounded-lg border border-default hover:border-primary transition-colors"
          >
            <div>
              <div class="font-medium">{{ cat.locales.en?.name || cat.id }}</div>
              <div class="text-sm text-muted">{{ cat.locales.en?.description }}</div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <UBadge :label="`${cat.elementCount} elements`" variant="subtle" size="xs" />
              <span v-if="cat.order !== undefined" class="text-xs text-muted">#{{ cat.order }}</span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
