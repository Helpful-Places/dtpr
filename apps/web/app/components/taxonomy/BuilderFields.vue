<script setup lang="ts">
// The context value and variables for one element placed on the datachain.
const props = defineProps<{ placed: DtprDatachainElement, element: DtprElement, category: DtprCategory }>()
const { t, locale } = useTaxonomyContext()
const draft = useDatachainDraft()

const context = computed(() => props.category.element_context)
const chosen = computed(() => context.value?.values.find((v) => v.id === props.placed.context_type_id))
const isLong = (variable: DtprVariable) => variable.id.includes('description') || variable.id === 'rights' || variable.id === 'risk'
</script>

<template>
  <div class="space-y-4">
    <fieldset v-if="context">
      <legend class="mb-1.5 text-xs text-muted">
        {{ t(context.name) }}<template v-if="context.required !== false"><span class="text-warning" aria-hidden="true"> *</span><span class="sr-only"> (required)</span></template>
      </legend>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="v in context.values" :key="v.id" type="button"
          class="flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
          :class="placed.context_type_id === v.id ? 'border-primary bg-accented text-primary' : 'border-default bg-white hover:border-primary/50'"
          :aria-pressed="placed.context_type_id === v.id"
          @click="draft.setContext(element.id, placed.context_type_id === v.id ? null : v.id)"
        >
          <span v-if="v.color" class="size-2.5 rounded-full" :style="{ background: v.color }" />{{ t(v.name) }}
        </button>
      </div>
      <p v-if="chosen" class="mt-2 text-xs text-muted">{{ t(chosen.description) }}</p>
    </fieldset>

    <label v-for="v in element.variables" :key="v.id" class="block">
      <span class="mb-1 block text-xs text-muted">
        {{ t(v.label) }}<template v-if="v.required"><span class="text-warning" aria-hidden="true"> *</span><span class="sr-only"> (required)</span></template>
      </span>
      <UTextarea
        v-if="isLong(v)" :model-value="dtprVariableText(placed, v.id, locale)" :rows="2" autoresize class="w-full"
        @update:model-value="(text: string) => draft.setVariable(element.id, v.id, locale, text)"
      />
      <UInput
        v-else :model-value="dtprVariableText(placed, v.id, locale)" class="w-full"
        @update:model-value="(text: string) => draft.setVariable(element.id, v.id, locale, text)"
      />
    </label>
  </div>
</template>
