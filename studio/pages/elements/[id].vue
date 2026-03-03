<script setup lang="ts">
import { LOCALES } from '~/lib/types'
import type { Locale } from '~/lib/types'

const route = useRoute()
const id = route.params.id as string
const toast = useToast()

const { data: element, refresh, status } = useElement(id)

const activeLocale = ref<Locale>('en')
const saving = ref(false)

// Editable form state per locale
const edits = ref<Record<string, { name: string; description: string }>>({})

watch(element, (el) => {
  if (!el) return
  const locales = (el as any).locales || {}
  for (const [locale, data] of Object.entries(locales) as [string, any][]) {
    if (!edits.value[locale]) {
      edits.value[locale] = {
        name: data.name || '',
        description: data.description || '',
      }
    }
  }
}, { immediate: true })

const currentEdit = computed(() => edits.value[activeLocale.value])
const hasChanges = computed(() => {
  if (!element.value || !currentEdit.value) return false
  const original = (element.value as any).locales?.[activeLocale.value]
  if (!original) return true // New locale
  return currentEdit.value.name !== original.name || currentEdit.value.description !== original.description
})

async function save() {
  if (!hasChanges.value) return
  saving.value = true
  try {
    await $fetch(`/api/elements/${id}`, {
      method: 'PUT',
      body: {
        locale: activeLocale.value,
        name: currentEdit.value!.name,
        description: currentEdit.value!.description,
      },
    })
    toast.add({ title: 'Saved', description: `Element updated for ${activeLocale.value}`, color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

const localeStatus = computed(() => {
  if (!element.value) return {}
  const locales = (element.value as any).locales || {}
  const result: Record<string, 'translated' | 'missing'> = {}
  for (const locale of LOCALES) {
    result[locale] = locales[locale] ? 'translated' : 'missing'
  }
  return result
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center gap-3">
      <UButton to="/elements" icon="i-lucide-arrow-left" variant="ghost" size="sm" />
      <h1 class="text-2xl font-bold">{{ (element as any)?.locales?.en?.name || id }}</h1>
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading...
    </div>

    <template v-else-if="element">
      <!-- Structural info -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">ID</div>
          <div class="text-sm font-mono">{{ (element as any).id }}</div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">Categories</div>
          <div class="flex flex-wrap gap-1">
            <UBadge v-for="cat in (element as any).category" :key="cat" :label="cat" variant="subtle" size="xs" />
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">Icon</div>
          <div v-if="(element as any).icon" class="flex items-center gap-2">
            <img :src="(element as any).icon" class="w-8 h-8" />
            <span class="text-xs text-muted">{{ (element as any).icon }}</span>
          </div>
          <div v-else class="text-sm text-muted">No icon</div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">Updated</div>
          <div class="text-sm">{{ (element as any).updated_at }}</div>
        </div>
      </div>

      <!-- Locale tabs -->
      <div>
        <div class="flex gap-1 border-b border-default mb-4">
          <button
            v-for="locale in LOCALES"
            :key="locale"
            class="px-3 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeLocale === locale
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-default'"
            @click="activeLocale = locale"
          >
            <span class="uppercase">{{ locale }}</span>
            <UIcon
              v-if="localeStatus[locale] === 'missing'"
              name="i-lucide-alert-circle"
              class="size-3 ml-1 text-error"
            />
          </button>
        </div>

        <div v-if="currentEdit" class="space-y-4">
          <div>
            <label class="text-sm font-medium mb-1 block">Name</label>
            <UInput v-model="currentEdit.name" />
          </div>
          <div>
            <label class="text-sm font-medium mb-1 block">Description</label>
            <UTextarea v-model="currentEdit.description" :rows="4" />
          </div>
          <div class="flex gap-2">
            <UButton
              label="Save"
              icon="i-lucide-save"
              :loading="saving"
              :disabled="!hasChanges"
              @click="save"
            />
          </div>
        </div>
        <div v-else class="py-4 text-center text-muted">
          <p>No translation for <span class="font-medium uppercase">{{ activeLocale }}</span></p>
          <UButton
            label="Create translation"
            variant="outline"
            size="sm"
            class="mt-2"
            @click="edits[activeLocale] = { name: '', description: '' }"
          />
        </div>
      </div>
    </template>
  </div>
</template>
