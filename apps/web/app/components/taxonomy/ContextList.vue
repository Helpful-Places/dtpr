<script setup lang="ts">
// A category's context and its values, as ruled rows. On an element, the values
// that have an icon of their own can be chosen: the rows are the preview selector.
// `across` sets the values side by side, up to three a row, where space is short.
const props = defineProps<{ context: DtprContext, choices?: string[], across?: boolean }>()
const selected = defineModel<string | null>({ default: null })
const { t } = useTaxonomyContext()

const choosing = computed(() => !!props.choices?.length)
// Colour dots only where the values have colours; an empty one reads as a radio button.
const coloured = computed(() => props.context.values.some((v) => v.color))
const row = 'flex w-full scroll-mt-4 items-start gap-3 px-3 py-2.5 text-left'
// Side by side, the rule between cells is the border colour showing through a 1px gap.
const columns = computed(() => Math.min(props.context.values.length + (choosing.value ? 1 : 0), 3))
const choice = (on: boolean) => [row, 'cursor-pointer', on ? 'bg-white shadow-[inset_3px_0_0_var(--ui-primary)]' : 'bg-elevated hover:bg-white']
</script>

<template>
  <!-- One card: the context's name and meaning as a full-width header strip, its values beneath. -->
  <section class="overflow-hidden rounded-md border border-default text-sm">
    <header class="border-b border-default bg-white px-3 py-2.5">
      <h3 class="font-code text-xs uppercase tracking-wide text-muted">
        <TaxonomyConceptLink term="context">Context</TaxonomyConceptLink>: {{ t(context.name) }}
      </h3>
      <p class="mt-1 text-muted">
        {{ t(context.description) }}<template v-if="choosing"> Choose a value to see its icon.</template>
      </p>
    </header>
    <div
      :class="across ? 'grid gap-px bg-(--ui-border) max-sm:grid-cols-1!' : 'divide-y divide-default'"
      :style="across ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` } : undefined"
      :role="choosing ? 'group' : undefined" :aria-label="choosing ? `Icon for each ${t(context.name).toLowerCase()} value` : undefined"
    >
      <button v-if="choosing" type="button" :class="choice(selected === null)" :aria-pressed="selected === null" @click="selected = null">
        <span class="mt-1 size-3 shrink-0 rounded-full border border-default" />
        <span><strong class="block font-medium text-highlighted">Plain</strong><span class="text-muted">The icon without a context value.</span></span>
      </button>
      <component
        :is="choices?.includes(v.id) ? 'button' : 'div'"
        v-for="v in context.values" :id="`context-${v.id}`" :key="v.id"
        v-bind="choices?.includes(v.id) ? { type: 'button', 'aria-pressed': selected === v.id } : {}"
        :class="choices?.includes(v.id) ? choice(selected === v.id) : [row, 'bg-elevated']"
        @click="choices?.includes(v.id) && (selected = v.id)"
      >
        <span v-if="coloured" class="mt-1 size-3 shrink-0 rounded-full border border-default" :style="{ background: v.color || 'transparent' }" />
        <span><strong class="block font-medium text-highlighted">{{ t(v.name) }}</strong><span class="text-muted">{{ t(v.description) }}</span></span>
      </component>
    </div>
  </section>
</template>
