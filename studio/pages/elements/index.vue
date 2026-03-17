<script setup lang="ts">
import { LOCALES } from '~/lib/types'

const { data: elements, status } = useElements()
const { data: categories } = useCategories()

const search = ref('')
const selectedCategory = ref<string>('')
const selectedType = ref<string>('')
const iconFilter = ref<string>('')

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return [
    { label: 'All categories', value: '' },
    ...categories.value.map((c) => ({
      label: c.locales.en?.name || c.id,
      value: c.id,
    })),
  ]
})

const typeOptions = [
  { label: 'All types', value: '' },
  { label: 'AI', value: 'ai' },
  { label: 'Device', value: 'device' },
]

const iconOptions = [
  { label: 'All', value: '' },
  { label: 'Has icon', value: 'yes' },
  { label: 'Missing icon', value: 'no' },
]

const filteredElements = computed(() => {
  if (!elements.value) return []
  return elements.value.filter((el) => {
    if (search.value) {
      const term = search.value.toLowerCase()
      const searchable = `${el.locales.en?.name || ''} ${el.locales.en?.description || ''} ${el.id}`.toLowerCase()
      if (!searchable.includes(term)) return false
    }
    if (selectedCategory.value && !el.category.includes(selectedCategory.value)) return false
    if (selectedType.value) {
      const hasType = el.category.some((c) => c.startsWith(selectedType.value + '__'))
      if (!hasType) return false
    }
    if (iconFilter.value === 'yes' && !el.icon) return false
    if (iconFilter.value === 'no' && el.icon) return false
    return true
  })
})

const localeCount = (el: any) => Object.keys(el.locales).length
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Elements</h1>
      <UButton to="/elements/new" icon="i-lucide-plus" label="New Element" />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <UInput v-model="search" placeholder="Search elements..." icon="i-lucide-search" class="w-64" />
      <USelectMenu v-model="selectedCategory" :items="categoryOptions" value-key="value" class="w-48" />
      <USelectMenu v-model="selectedType" :items="typeOptions" value-key="value" class="w-36" />
      <USelectMenu v-model="iconFilter" :items="iconOptions" value-key="value" class="w-36" />
    </div>

    <div class="text-sm text-muted">
      {{ filteredElements.length }} of {{ elements?.length || 0 }} elements
    </div>

    <!-- Element list -->
    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading elements...
    </div>
    <div v-else class="space-y-1">
      <NuxtLink
        v-for="el in filteredElements"
        :key="el.id"
        :to="`/elements/${el.id}`"
        class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/10 transition-colors border border-transparent hover:border-default"
      >
        <div v-if="el.icon" class="w-8 h-8 flex items-center justify-center">
          <img :src="useIconUrl(el.icon)" :alt="el.locales.en?.name" class="w-6 h-6" />
        </div>
        <div v-else class="w-8 h-8 flex items-center justify-center rounded bg-muted/20">
          <UIcon name="i-lucide-image-off" class="size-4 text-muted" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm truncate">{{ el.locales.en?.name || el.id }}</div>
          <div class="text-xs text-muted truncate">{{ el.locales.en?.description }}</div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UBadge
            v-for="cat in el.category.slice(0, 2)"
            :key="cat"
            :label="cat.split('__').pop()"
            variant="subtle"
            size="xs"
          />
          <span v-if="el.category.length > 2" class="text-xs text-muted">+{{ el.category.length - 2 }}</span>
          <UBadge
            :label="`${localeCount(el)}/${LOCALES.length}`"
            :color="localeCount(el) === LOCALES.length ? 'success' : 'warning'"
            variant="subtle"
            size="xs"
          />
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
