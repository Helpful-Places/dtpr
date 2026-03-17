<script setup lang="ts">
const props = defineProps<{
  modelValue: string[]
  max?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const maxSymbols = computed(() => props.max ?? 5)

const { data: icons } = useIcons()
const search = ref('')

const symbols = computed(() => {
  if (!icons.value) return []
  const list = (icons.value as any).symbols || []
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter((s: any) =>
    s.id.toLowerCase().includes(q) ||
    s.elements.some((e: any) => e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q)),
  )
})

function isSelected(id: string): boolean {
  return props.modelValue.includes(id)
}

function toggle(id: string) {
  if (isSelected(id)) {
    emit('update:modelValue', props.modelValue.filter((s) => s !== id))
  } else if (props.modelValue.length < maxSymbols.value) {
    emit('update:modelValue', [...props.modelValue, id])
  }
}

function symbolUrl(fileName: string): string {
  return `/api/icons/symbol?id=${encodeURIComponent(fileName)}`
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium">Reference Symbols</label>
      <span class="text-xs text-muted">{{ modelValue.length }}/{{ maxSymbols }} selected</span>
    </div>

    <UInput
      v-model="search"
      placeholder="Search symbols..."
      icon="i-lucide-search"
      class="w-64"
    />

    <!-- Selected chips -->
    <div v-if="modelValue.length > 0" class="flex flex-wrap gap-1.5">
      <UBadge
        v-for="id in modelValue"
        :key="id"
        variant="subtle"
        size="sm"
        class="gap-1"
      >
        {{ id }}
        <button type="button" class="hover:text-foreground cursor-pointer" @click="toggle(id)">
          <UIcon name="i-lucide-x" class="size-3" />
        </button>
      </UBadge>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
      <button
        v-for="sym in symbols"
        :key="sym.id"
        type="button"
        class="flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer"
        :class="[
          isSelected(sym.id)
            ? 'border-primary bg-primary/10 ring-2 ring-primary'
            : 'border-default hover:border-primary',
          !isSelected(sym.id) && modelValue.length >= maxSymbols ? 'opacity-40 cursor-not-allowed' : ''
        ]"
        @click="toggle(sym.id)"
      >
        <div
          class="w-16 h-16 flex items-center justify-center rounded bg-white relative"
          style="color: black"
        >
          <img
            :src="symbolUrl(sym.fileName)"
            :alt="sym.id"
            class="w-14 h-14"
          />
          <div
            v-if="isSelected(sym.id)"
            class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          >
            <UIcon name="i-lucide-check" class="size-3" />
          </div>
        </div>

        <span class="text-xs font-mono text-muted truncate w-full text-center">
          {{ sym.id }}
        </span>

        <span v-if="sym.elements.length" class="text-[10px] text-muted">
          {{ sym.elements.length }} element{{ sym.elements.length === 1 ? '' : 's' }}
        </span>
      </button>
    </div>
  </div>
</template>
