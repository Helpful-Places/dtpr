<script setup lang="ts">
// A sentence of orientation for a view. It can be put away once it is no longer
// needed, which leaves a button to bring it back. Remembered per view.
const props = defineProps<{ view: 'explore' | 'build' }>()
const route = useRoute()

const STORAGE_KEY = 'dtpr.taxonomy-intro'
const hidden = useState<Record<string, boolean>>('taxonomy-intro-hidden', () => ({}))
onMounted(() => {
  try {
    hidden.value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  }
  catch {
    // An unreadable preference is dropped.
  }
})
function set(value: boolean) {
  hidden.value = { ...hidden.value, [props.view]: value }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden.value))
}
</script>

<template>
  <div class="print:hidden">
    <UButton
      v-if="hidden[view]" size="sm" color="neutral" variant="ghost" icon="i-lucide-info" label="About this view"
      @click="set(false)"
    />
    <!-- On a phone, a category or element replaces the pane, so the sentence steps aside. -->
    <p v-else class="max-w-2xl text-sm text-pretty text-muted" :class="view === 'explore' && route.params.kind && 'hidden md:block'">
      <template v-if="view === 'build'">
        Describe a system by answering each question with elements from the taxonomy.
        Your work is saved in this browser only.
      </template>
      <template v-else>
        Each category is a question people ask about a technology, and its elements are the answers.
        Choose a category, then an element, to see its icon and what it means.
      </template>
      New to the terms? Read the
      <NuxtLink to="/docs/concepts" class="text-primary underline underline-offset-2">concepts</NuxtLink>.
      <button type="button" class="cursor-pointer text-primary underline underline-offset-2" @click="set(true)">Hide this</button>
    </p>
  </div>
</template>
