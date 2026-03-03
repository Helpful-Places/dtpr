<script setup lang="ts">
const router = useRouter()
const toast = useToast()
const { data: categories } = useCategories()

const form = reactive({
  id: '',
  name: '',
  description: '',
  categories: [] as string[],
  icon: '',
})

const saving = ref(false)

const categoryOptions = computed(() => {
  if (!categories.value) return []
  return categories.value.map((c) => ({
    label: `${c.locales.en?.name || c.id} (${c.datachain_type})`,
    value: c.id,
  }))
})

// Auto-generate ID from name
watch(() => form.name, (name) => {
  if (!form.id || form.id === slugify(form.name)) {
    form.id = slugify(name)
  }
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

async function create() {
  if (!form.id || !form.name || form.categories.length === 0) {
    toast.add({ title: 'Validation error', description: 'ID, name, and at least one category are required', color: 'error' })
    return
  }

  saving.value = true
  try {
    await $fetch('/api/elements', {
      method: 'POST',
      body: {
        id: form.id,
        name: form.name,
        description: form.description,
        category: form.categories,
        icon: form.icon || `/dtpr-icons/${form.id}.svg`,
      },
    })
    toast.add({ title: 'Created', description: `Element "${form.name}" created`, color: 'success' })
    router.push(`/elements/${form.id}`)
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="p-6 space-y-6 max-w-2xl">
    <div class="flex items-center gap-3">
      <UButton to="/elements" icon="i-lucide-arrow-left" variant="ghost" size="sm" />
      <h1 class="text-2xl font-bold">New Element</h1>
    </div>

    <div class="space-y-4">
      <div>
        <label class="text-sm font-medium mb-1 block">Name (English)</label>
        <UInput v-model="form.name" placeholder="e.g. Facial Recognition" />
      </div>

      <div>
        <label class="text-sm font-medium mb-1 block">ID</label>
        <UInput v-model="form.id" placeholder="auto-generated from name" />
        <p class="text-xs text-muted mt-1">Used as unique identifier and file name</p>
      </div>

      <div>
        <label class="text-sm font-medium mb-1 block">Description (English)</label>
        <UTextarea v-model="form.description" :rows="4" placeholder="Describe what this element represents..." />
      </div>

      <div>
        <label class="text-sm font-medium mb-1 block">Categories</label>
        <USelectMenu
          v-model="form.categories"
          :items="categoryOptions"
          value-key="value"
          multiple
          placeholder="Select categories..."
        />
      </div>

      <div>
        <label class="text-sm font-medium mb-1 block">Icon path</label>
        <UInput v-model="form.icon" :placeholder="`/dtpr-icons/${form.id || 'element_name'}.svg`" />
      </div>

      <div class="flex gap-2 pt-2">
        <UButton label="Create Element" icon="i-lucide-plus" :loading="saving" @click="create" />
        <UButton label="Cancel" variant="outline" to="/elements" />
      </div>
    </div>
  </div>
</template>
