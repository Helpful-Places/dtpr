<script setup lang="ts">
// The variables a datachain fills in, as ruled rows. A category lists the ones
// every element in it asks for; an element lists its own, which may add more.
defineProps<{ variables: DtprVariable[], lede?: string }>()
const { t } = useTaxonomyContext()
</script>

<template>
  <section>
    <h3 class="font-code text-xs uppercase tracking-wide text-muted">
      <TaxonomyConceptLink term="variable">Variables</TaxonomyConceptLink>
    </h3>
    <p v-if="lede" class="mt-1 text-sm text-muted">{{ lede }}</p>
    <ul class="mt-3 divide-y divide-default rounded-md border border-default bg-elevated text-sm">
      <li v-for="v in variables" :id="`variable-${v.id}`" :key="v.id" class="flex scroll-mt-4 items-center justify-between gap-3 px-3 py-2.5">
        <span>{{ t(v.label) }} <DeveloperId :id="v.id" class="ml-2" /></span>
        <TaxonomyRequiredBadge :required="!!v.required" />
      </li>
    </ul>
  </section>
</template>
