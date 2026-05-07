<script>
import theme from '#build/ui/prose/card'
</script>

<script setup>
// Override of `@nuxt/ui`'s `ProseCard` (Card.vue from
// `@nuxt/ui/dist/runtime/components/prose/Card.vue`). Mirrors upstream
// verbatim (including the `tv()` theme wiring) except for one change:
// the `to` prop is routed through `useLocalePath` when it points at an
// internal absolute path. Markdown source uses bare paths like
// `to="/mcp"`; under our `strategy: 'prefix'` i18n setup those need
// to become `/en/mcp` / `/fr/mcp`.
//
// On a `@nuxt/ui` bump, re-sync this file against upstream Card.vue
// to pick up styling or markup changes; the `useLocalePath` rewrite
// is the only intentional divergence.
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import { useI18n } from '#i18n'
import { useComponentUI } from '#ui/composables/useComponentUI'
import { tv } from '#ui/utils/tv'
import ULink from '#ui/components/Link.vue'
import UIcon from '#ui/components/Icon.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  to: { type: null, required: false },
  target: { type: [String, Object, null], required: false },
  icon: { type: null, required: false },
  title: { type: String, required: false },
  description: { type: String, required: false },
  color: { type: null, required: false },
  class: { type: null, required: false },
  ui: { type: Object, required: false },
})

const slots = defineSlots()
const appConfig = useAppConfig()
const uiProp = useComponentUI('prose.card', props)
const ui = computed(() => tv({ extend: tv(theme), ...appConfig.ui?.prose?.card || {} })({
  color: props.color,
  to: !!props.to,
  title: !!props.title,
}))

const localePath = useLocalePath()
const { locales } = useI18n()
const localeCodes = computed(() => locales.value.map((l) => l.code))
const resolvedTo = computed(() => {
  const t = props.to
  if (typeof t !== 'string') return t
  if (!t.startsWith('/') || t.startsWith('//')) return t
  // Skip if already prefixed with a known locale (e.g., a `/en/...`
  // link inside `fr/...` content).
  const first = t.split('/')[1]
  if (first && localeCodes.value.includes(first)) return t
  return localePath(t)
})

const target = computed(() => props.target || (!!props.to && typeof props.to === 'string' && props.to.startsWith('http') ? '_blank' : undefined))
const ariaLabel = computed(() => (props.title || 'Card link').trim())
</script>

<template>
  <div :class="ui.base({ class: [uiProp?.base, props.class] })">
    <ULink
      v-if="resolvedTo"
      :aria-label="ariaLabel"
      v-bind="{ to: resolvedTo, target, ...$attrs }"
      class="focus:outline-none"
      raw
    >
      <span class="absolute inset-0" aria-hidden="true" />
    </ULink>

    <UIcon v-if="icon" :name="icon" :class="ui.icon({ class: uiProp?.icon })" />
    <UIcon v-if="!!resolvedTo && target === '_blank'" :name="appConfig.ui.icons.external" :class="ui.externalIcon({ class: uiProp?.externalIcon })" />

    <p v-if="title || !!slots.title" :class="ui.title({ class: uiProp?.title })">
      <slot name="title" mdc-unwrap="p">
        {{ title }}
      </slot>
    </p>

    <div v-if="!!slots.default" :class="ui.description({ class: uiProp?.description })">
      <slot>
        {{ description }}
      </slot>
    </div>
  </div>
</template>
