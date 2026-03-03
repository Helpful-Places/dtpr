<script setup lang="ts">
import { LOCALES } from '~/lib/types'
import type { Locale } from '~/lib/types'

const route = useRoute()
const id = route.params.id as string

const { data: category, status } = useCategory(id)

const activeLocale = ref<Locale>('en')

const localeData = computed(() => {
  if (!category.value) return null
  return (category.value as any).locales?.[activeLocale.value]
})
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center gap-3">
      <UButton to="/categories" icon="i-lucide-arrow-left" variant="ghost" size="sm" />
      <h1 class="text-2xl font-bold">{{ (category as any)?.locales?.en?.name || id }}</h1>
      <UBadge v-if="category" :label="(category as any).datachain_type" variant="subtle" />
    </div>

    <div v-if="status === 'pending'" class="flex items-center gap-2 text-muted py-8 justify-center">
      <UIcon name="i-lucide-loader" class="size-4 animate-spin" />
      Loading...
    </div>

    <template v-else-if="category">
      <!-- Structural info -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">ID</div>
          <div class="text-sm font-mono">{{ (category as any).id }}</div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">Type</div>
          <div class="text-sm capitalize">{{ (category as any).datachain_type }}</div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">Order</div>
          <div class="text-sm">{{ (category as any).order ?? 'None' }}</div>
        </div>
        <div class="space-y-1">
          <div class="text-xs text-muted uppercase">Required</div>
          <div class="text-sm">{{ (category as any).required ? 'Yes' : 'No' }}</div>
        </div>
      </div>

      <!-- Locale tabs for viewing -->
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
          </button>
        </div>

        <div v-if="localeData" class="space-y-4">
          <div>
            <div class="text-xs text-muted uppercase mb-1">Name</div>
            <div class="text-sm">{{ localeData.name }}</div>
          </div>
          <div>
            <div class="text-xs text-muted uppercase mb-1">Description</div>
            <div class="text-sm">{{ localeData.description }}</div>
          </div>
          <div v-if="localeData.prompt">
            <div class="text-xs text-muted uppercase mb-1">Prompt</div>
            <div class="text-sm">{{ localeData.prompt }}</div>
          </div>
        </div>
        <div v-else class="py-4 text-center text-muted">
          No translation for <span class="font-medium uppercase">{{ activeLocale }}</span>
        </div>
      </div>

      <!-- Element variables -->
      <div v-if="(category as any).element_variables?.length">
        <h2 class="text-lg font-semibold mb-2">Element Variables</h2>
        <div class="space-y-2">
          <div
            v-for="v in (category as any).element_variables"
            :key="v.id"
            class="flex items-center gap-3 py-2 px-3 rounded border border-default"
          >
            <span class="font-mono text-sm">{{ v.id }}</span>
            <span v-if="v.label" class="text-sm text-muted">{{ v.label }}</span>
            <UBadge v-if="v.required" label="required" color="error" variant="subtle" size="xs" />
          </div>
        </div>
      </div>

      <!-- Elements in this category -->
      <div>
        <h2 class="text-lg font-semibold mb-2">Elements ({{ (category as any).elements?.length || 0 }})</h2>
        <div class="space-y-1">
          <NuxtLink
            v-for="el in (category as any).elements"
            :key="el.id"
            :to="`/elements/${el.id}`"
            class="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/10 transition-colors"
          >
            <div v-if="el.icon" class="w-6 h-6 flex items-center justify-center">
              <img :src="el.icon" :alt="el.name" class="w-5 h-5" />
            </div>
            <div v-else class="w-6 h-6 flex items-center justify-center rounded bg-muted/20">
              <UIcon name="i-lucide-image-off" class="size-3 text-muted" />
            </div>
            <span class="text-sm">{{ el.name }}</span>
          </NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>
