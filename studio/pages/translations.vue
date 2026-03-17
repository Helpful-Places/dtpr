<script setup lang="ts">
import { LOCALES } from '~/lib/types'
import type { Locale } from '~/lib/types'

const { data: elements, status } = useElements()
const toast = useToast()

const search = ref('')
const filterStatus = ref<string>('')
const selectedLocale = ref<Locale | ''>('')
const selectedIds = ref<Set<string>>(new Set())
const translating = ref(false)

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Missing', value: 'missing' },
  { label: 'Complete', value: 'complete' },
]

const localeOptions = [
  { label: 'All locales', value: '' },
  ...LOCALES.filter((l) => l !== 'en').map((l) => ({ label: l.toUpperCase(), value: l })),
]

const matrix = computed(() => {
  if (!elements.value) return []
  return elements.value
    .filter((el) => {
      if (search.value) {
        const term = search.value.toLowerCase()
        if (!`${el.locales.en?.name || ''} ${el.id}`.toLowerCase().includes(term)) return false
      }
      if (filterStatus.value === 'missing') {
        const targetLocales = selectedLocale.value ? [selectedLocale.value] : LOCALES.filter((l) => l !== 'en')
        return targetLocales.some((l) => !el.locales[l])
      }
      if (filterStatus.value === 'complete') {
        return LOCALES.every((l) => el.locales[l])
      }
      return true
    })
    .map((el) => ({
      id: el.id,
      name: el.locales.en?.name || el.id,
      locales: LOCALES.reduce((acc, l) => {
        acc[l] = !!el.locales[l]
        return acc
      }, {} as Record<string, boolean>),
    }))
})

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function selectAllMissing() {
  const target = selectedLocale.value || 'es'
  for (const row of matrix.value) {
    if (!row.locales[target]) {
      selectedIds.value.add(row.id)
    }
  }
  selectedIds.value = new Set(selectedIds.value)
}

async function translateSelected() {
  const target = selectedLocale.value
  if (!target) {
    toast.add({ title: 'Select a target locale', color: 'warning' })
    return
  }
  if (selectedIds.value.size === 0) {
    toast.add({ title: 'Select elements to translate', color: 'warning' })
    return
  }

  translating.value = true
  try {
    const result = await $fetch('/api/translate/batch', {
      method: 'POST',
      body: {
        elementIds: [...selectedIds.value],
        targetLocale: target,
      },
    })
    toast.add({
      title: 'Translation complete',
      description: `Translated ${(result as any).translated} elements to ${target}`,
      color: 'success',
    })
    selectedIds.value.clear()
  } catch (e: any) {
    toast.add({ title: 'Translation failed', description: e.message, color: 'error' })
  } finally {
    translating.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Translations</h1>
      <div class="flex gap-2">
        <UButton
          v-if="selectedIds.size > 0"
          :label="`Translate ${selectedIds.size} with Claude`"
          icon="i-lucide-sparkles"
          :loading="translating"
          @click="translateSelected"
        />
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <UInput v-model="search" placeholder="Search..." icon="i-lucide-search" class="w-48" />
      <USelectMenu v-model="filterStatus" :items="statusOptions" value-key="value" class="w-36" />
      <USelectMenu v-model="selectedLocale" :items="localeOptions" value-key="value" class="w-36" />
      <UButton label="Select missing" variant="outline" size="sm" @click="selectAllMissing" />
    </div>

    <div class="text-sm text-muted">
      {{ matrix.length }} elements shown, {{ selectedIds.size }} selected
    </div>

    <!-- Matrix -->
    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading...
    </div>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-default">
            <th class="py-2 px-2 text-left w-8" />
            <th class="py-2 px-2 text-left">Element</th>
            <th
              v-for="locale in LOCALES"
              :key="locale"
              class="py-2 px-2 text-center uppercase"
            >
              {{ locale }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in matrix"
            :key="row.id"
            class="border-b border-default/50 hover:bg-muted/5"
          >
            <td class="py-1.5 px-2">
              <input
                type="checkbox"
                :checked="selectedIds.has(row.id)"
                class="rounded"
                @change="toggleSelect(row.id)"
              />
            </td>
            <td class="py-1.5 px-2">
              <NuxtLink :to="`/elements/${row.id}`" class="hover:text-primary">
                {{ row.name }}
              </NuxtLink>
            </td>
            <td
              v-for="locale in LOCALES"
              :key="locale"
              class="py-1.5 px-2 text-center"
            >
              <UIcon
                v-if="row.locales[locale]"
                name="i-lucide-check-circle"
                class="size-4 text-success"
              />
              <UIcon
                v-else
                name="i-lucide-x-circle"
                class="size-4 text-error"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
