<script setup lang="ts">
// Copies the link to a category or an element, keeping the version and locale.
// It floats at the top right of the entry, beside the title, so both entries put
// it in one place and only the title wraps around it.
const props = defineProps<{ path: string }>()
const { to } = useTaxonomyContext()
const copy = useCopy()
const router = useRouter()
const copyLink = () => copy(window.location.origin + router.resolve(to(props.path)).href)
</script>

<template>
  <UButton
    size="sm" color="neutral" variant="ghost" icon="i-lucide-link" label="Copy link" class="float-right -mt-1 ml-4 print:hidden"
    @click="copyLink"
  />
</template>
