<script setup lang="ts">
// Interactive playground that owns the element hero + a Variables form,
// a Context chip row (when the parent category declares a context), and
// a Default/Dark style toggle. Form state drives the rendered hero
// live: title and description re-interpolate, the icon URL swaps to a
// variant suffix when one is selected.
import { reactive, computed } from 'vue'
import { DtprElementDetail } from '@dtpr/ui/vue'
import { deriveElementDisplay, extract } from '@dtpr/ui/core'
import type { Category, Element, InstanceElement } from '@dtpr/ui/core'
import type { SupportedLocale } from '../composables/useDtprState'

interface Props {
  element: Element
  category: Category | null
  locale: SupportedLocale
  // Base icon URL without variant suffix. The playground appends
  // `.${variant}` between the path stem and `.svg` when a non-default
  // variant is active.
  baseIconUrl: string
}

const props = defineProps<Props>()

const declaredVariables = computed(() => props.element.variables ?? [])

const variableValues = reactive<Record<string, string>>(
  Object.fromEntries(declaredVariables.value.map((v) => [v.id, ''])),
)

// Reset values when the element changes (different declared ids).
watch(
  () => props.element.id,
  () => {
    for (const k of Object.keys(variableValues)) delete variableValues[k]
    for (const v of declaredVariables.value) variableValues[v.id] = ''
  },
)

const contextId = ref<string | null>(null)
const styleMode = ref<'default' | 'dark'>('default')

const contextValues = computed(() => props.category?.context?.values ?? [])
const hasContext = computed(() => contextValues.value.length > 0)

watch(
  () => props.category?.id,
  () => {
    contextId.value = null
  },
)

const variant = computed<string>(() => {
  if (styleMode.value === 'dark') return 'dark'
  if (contextId.value) return contextId.value
  return 'default'
})

// Dark mode takes precedence over context for the rendered icon, but
// keeping a chip visually selected while it has no effect is
// confusing. `effectiveContextId` is null whenever dark mode is
// active, so chip styling and aria state reflect what's actually
// driving the hero. The underlying `contextId` is preserved so a
// switch back to default restores the visitor's selection.
const effectiveContextId = computed<string | null>(() =>
  styleMode.value === 'dark' ? null : contextId.value,
)
const chipsLocked = computed(() => styleMode.value === 'dark')

const iconUrl = computed(() => {
  const v = variant.value
  if (v === 'default') return props.baseIconUrl
  // Insert `.${variant}` before the trailing `.svg`.
  return props.baseIconUrl.replace(/\.svg$/, `.${v}.svg`)
})

// Surface a dark-mode counterpart only when the visitor has not picked
// an explicit override. Selecting "Dark" or a context chip is a
// preview-the-variant action — auto-swap would mask what the toggle is
// supposed to demonstrate.
const iconUrlDark = computed(() => {
  if (variant.value !== 'default') return undefined
  return props.baseIconUrl.replace(/\.svg$/, `.dark.svg`)
})

const instance = computed<InstanceElement>(() => ({
  id: props.element.id,
  variables: declaredVariables.value.map((v) => ({
    id: v.id,
    value: variableValues[v.id] ?? '',
  })),
}))

const display = computed(() =>
  deriveElementDisplay(props.element, instance.value, props.locale, {
    iconUrl: iconUrl.value,
    iconUrlDark: iconUrlDark.value,
  }),
)

function variableLabel(varId: string): string {
  const decl = declaredVariables.value.find((v) => v.id === varId)
  if (!decl) return varId
  return extract(decl.label, props.locale, 'en')
}

function contextValueName(id: string): string {
  const v = contextValues.value.find((cv) => cv.id === id)
  if (!v) return id
  return extract(v.name, props.locale, 'en')
}

function toggleContext(id: string) {
  contextId.value = contextId.value === id ? null : id
}

const styleItems = [
  { label: 'Default', value: 'default' as const },
  { label: 'Dark', value: 'dark' as const },
]

const showVariablesSection = computed(() => declaredVariables.value.length > 0)
const showPlaygroundForm = computed(
  () => showVariablesSection.value || hasContext.value,
)
</script>

<template>
  <div class="dtpr-playground">
    <article class="dtpr-playground__hero">
      <DtprElementDetail :display="display" :locale="locale" />
    </article>

    <section class="dtpr-playground__panel" aria-labelledby="dtpr-playground-heading">
      <header class="dtpr-playground__panel-header">
        <h2 id="dtpr-playground-heading" class="dtpr-playground__panel-title">
          Playground
        </h2>
        <p class="dtpr-playground__panel-hint">
          Try the element with your own values, contexts, and color modes.
        </p>
      </header>

      <div v-if="showVariablesSection" class="dtpr-playground__variables">
        <UFormField
          v-for="v in declaredVariables"
          :key="v.id"
          :label="variableLabel(v.id)"
          :required="v.required ?? false"
          :name="v.id"
        >
          <UInput
            v-model="variableValues[v.id]"
            :placeholder="variableLabel(v.id)"
            class="w-full"
          />
        </UFormField>
      </div>

      <div
        v-if="hasContext"
        class="dtpr-playground__chips"
        :class="{ 'dtpr-playground__chips--dark': styleMode === 'dark' }"
        role="group"
        aria-label="Context"
      >
        <span class="dtpr-playground__chips-label">Context</span>
        <UButton
          v-for="cv in contextValues"
          :key="cv.id"
          type="button"
          size="xs"
          :variant="effectiveContextId === cv.id ? 'solid' : 'outline'"
          :disabled="chipsLocked"
          :style="
            cv.color
              ? {
                  '--chip-color': cv.color,
                  borderColor: cv.color,
                  backgroundColor: effectiveContextId === cv.id ? cv.color : 'transparent',
                  color: effectiveContextId === cv.id ? '#fff' : cv.color,
                }
              : {}
          "
          class="dtpr-playground__chip"
          :aria-pressed="effectiveContextId === cv.id"
          @click="toggleContext(cv.id)"
        >
          {{ contextValueName(cv.id) }}
        </UButton>
      </div>

      <div class="dtpr-playground__style">
        <span class="dtpr-playground__chips-label">Style</span>
        <URadioGroup
          v-model="styleMode"
          :items="styleItems"
          orientation="horizontal"
          aria-label="Color mode"
        />
      </div>

      <p v-if="!showPlaygroundForm" class="dtpr-playground__empty">
        This element has no variables and its category has no context — toggle the style above to preview the dark variant.
      </p>
    </section>
  </div>
</template>

<style scoped>
.dtpr-playground {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dtpr-playground__panel {
  border: 1px solid var(--ui-border, rgb(229, 231, 235));
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background: var(--ui-bg-elevated, rgb(249, 250, 251));
}

.dtpr-playground__panel-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.dtpr-playground__panel-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dtpr-playground__panel-hint {
  margin: 0;
  font-size: 0.875rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}

.dtpr-playground__variables {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dtpr-playground__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  transition: opacity 0.2s ease;
}

.dtpr-playground__chips--dark {
  opacity: 0.5;
}

.dtpr-playground__chips-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  margin-right: 0.5rem;
}

.dtpr-playground__chip {
  cursor: pointer;
}

.dtpr-playground__style {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.dtpr-playground__empty {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
}
</style>
