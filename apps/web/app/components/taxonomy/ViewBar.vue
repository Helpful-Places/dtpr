<script setup lang="ts">
// Explore shows the same content two ways: panes for looking something up,
// and one list for reading end to end or printing. `anchor` is where the list
// should open, so switching view keeps your place. The Developer switch sits
// with them: it too changes how the view reads, not what it is about.
const props = defineProps<{ anchor?: string }>()
const { to } = useTaxonomyContext()
const route = useRoute()
const list = computed(() => route.path === '/taxonomy/all')
</script>

<template>
  <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3 print:hidden">
    <TaxonomyIntro view="explore" class="min-w-0 flex-1 basis-72" />
    <div class="ml-auto flex items-center gap-2">
      <nav aria-label="View" class="flex items-center gap-1">
        <UButton
          :to="to('/taxonomy')" size="sm" color="neutral" variant="outline" icon="i-lucide-columns-3" label="Panes"
          :class="!list && 'bg-accented text-primary'" :aria-current="list ? undefined : 'true'"
        />
        <UButton
          :to="{ ...to('/taxonomy/all'), hash: props.anchor }" size="sm" color="neutral" variant="outline" icon="i-lucide-list" label="List"
          :class="list && 'bg-accented text-primary'" :aria-current="list ? 'true' : undefined"
        />
      </nav>
      <span class="h-5 w-px bg-rule" aria-hidden="true" />
      <DeveloperToggle />
      <span class="h-5 w-px bg-rule" aria-hidden="true" />
      <TaxonomyExport />
    </div>
  </div>
</template>
