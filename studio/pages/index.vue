<script setup lang="ts">
import { LOCALES } from '~/lib/types'

const { data: elements } = useElements()
const { data: categories } = useCategories()
const { data: gaps } = useGaps()

const stats = computed(() => {
  if (!gaps.value) return []
  const s = gaps.value.summary
  return [
    { label: 'Elements', value: s.totalElements, icon: 'i-lucide-box' },
    { label: 'Categories', value: s.totalCategories, icon: 'i-lucide-folder' },
    { label: 'Locales', value: s.totalLocales, icon: 'i-lucide-globe' },
    { label: 'Icons', value: s.totalIcons, icon: 'i-lucide-image' },
  ]
})

const gapStats = computed(() => {
  if (!gaps.value) return []
  const s = gaps.value.summary
  return [
    { label: 'Missing translations', value: s.missingTranslationCount, color: s.missingTranslationCount > 0 ? 'error' : 'success' },
    { label: 'Missing icons', value: s.missingIconCount, color: s.missingIconCount > 0 ? 'error' : 'success' },
    { label: 'Stale translations', value: s.staleTranslationCount, color: s.staleTranslationCount > 0 ? 'warning' : 'success' },
    { label: 'Validation errors', value: s.validationErrorCount, color: s.validationErrorCount > 0 ? 'error' : 'success' },
  ]
})

// Translation coverage per locale
const coverageByLocale = computed(() => {
  if (!elements.value) return []
  const total = elements.value.length
  return LOCALES.map((locale) => {
    const translated = elements.value!.filter((el) => el.locales[locale]).length
    return {
      locale,
      translated,
      total,
      percent: total > 0 ? Math.round((translated / total) * 100) : 0,
    }
  })
})

// Category balance
const categoryBalance = computed(() => {
  if (!categories.value) return []
  return [...categories.value]
    .sort((a, b) => b.elementCount - a.elementCount)
    .map((cat) => ({
      id: cat.id,
      name: cat.locales.en?.name || cat.id,
      count: cat.elementCount,
      type: cat.datachain_type,
    }))
})
</script>

<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Dashboard</h1>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="border border-default rounded-lg p-4"
      >
        <div class="flex items-center gap-2 text-muted mb-1">
          <UIcon :name="stat.icon" class="size-4" />
          <span class="text-sm">{{ stat.label }}</span>
        </div>
        <div class="text-3xl font-bold">{{ stat.value }}</div>
      </div>
    </div>

    <!-- Gap summary -->
    <div>
      <h2 class="text-lg font-semibold mb-3">Gap Summary</h2>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="gap in gapStats"
          :key="gap.label"
          class="border border-default rounded-lg p-4"
        >
          <div class="text-sm text-muted mb-1">{{ gap.label }}</div>
          <div class="text-2xl font-bold" :class="gap.color === 'error' ? 'text-error' : gap.color === 'warning' ? 'text-warning' : 'text-success'">
            {{ gap.value }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Translation coverage -->
      <div>
        <h2 class="text-lg font-semibold mb-3">Translation Coverage</h2>
        <div class="space-y-3">
          <div v-for="loc in coverageByLocale" :key="loc.locale" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium uppercase">{{ loc.locale }}</span>
              <span class="text-muted">{{ loc.translated }}/{{ loc.total }} ({{ loc.percent }}%)</span>
            </div>
            <div class="h-2 bg-muted/20 rounded-full overflow-hidden">
              <div
                class="h-full rounded-full transition-all"
                :class="loc.percent === 100 ? 'bg-success' : loc.percent > 50 ? 'bg-warning' : 'bg-error'"
                :style="{ width: `${loc.percent}%` }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Category balance -->
      <div>
        <h2 class="text-lg font-semibold mb-3">Category Balance</h2>
        <div class="space-y-2 max-h-80 overflow-y-auto">
          <NuxtLink
            v-for="cat in categoryBalance"
            :key="cat.id"
            :to="`/categories/${cat.id}`"
            class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/10 transition-colors"
          >
            <div class="flex items-center gap-2">
              <UBadge :label="cat.type" :color="cat.type === 'ai' ? 'primary' : 'neutral'" variant="subtle" size="xs" />
              <span class="text-sm">{{ cat.name }}</span>
            </div>
            <span class="text-sm text-muted">{{ cat.count }}</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
