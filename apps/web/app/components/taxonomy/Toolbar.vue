<script setup lang="ts">
// The section's two views, and the schema version and locale they share.
// The views are pages, so these are links, not ARIA tabs. Translation status
// has no tab: the notice for an unreviewed locale links to it. Until the
// builder launches there is one view, so no tabs, only the settings.
const { to } = useTaxonomyContext()
const route = useRoute()
const builder = useFeature('builder')

const building = computed(() => route.path.startsWith('/taxonomy/builder'))
const exploring = computed(() => !building.value && !route.path.startsWith('/taxonomy/translations'))

const tab = 'flex min-h-11 items-center rounded-sm px-4 font-sans text-xs font-semibold uppercase tracking-wider transition-colors motion-reduce:transition-none'
const state = (active: boolean) => (active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-secondary/10 hover:text-secondary')
</script>

<template>
  <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md bg-white p-1.5 shadow-sm ring ring-rule print:hidden">
    <nav v-if="builder" aria-label="Taxonomy views" class="flex flex-wrap items-center gap-1">
      <NuxtLink :to="to('/taxonomy')" :class="[tab, state(exploring)]" :aria-current="exploring ? 'page' : undefined">Explore</NuxtLink>
      <NuxtLink :to="to('/taxonomy/builder')" :class="[tab, state(building)]" :aria-current="building ? 'page' : undefined">Build</NuxtLink>
    </nav>
    <TaxonomySettings class="ml-auto justify-end px-2.5 py-1.5" />
  </div>
</template>
