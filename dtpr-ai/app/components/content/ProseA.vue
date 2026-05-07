<script setup lang="ts">
// Override of `@nuxt/ui`'s ProseA so markdown links inside content
// resolve through `useLocalePath` — markdown source uses bare `/mcp`,
// `/getting-started`, etc., and we need them to render as
// `/en/mcp`, `/fr/getting-started`, etc. under the i18n `prefix`
// strategy. Skips:
//   - protocol-qualified URLs (https://, mailto:, etc.)
//   - protocol-relative `//host/...`
//   - paths that already start with a known locale (`/en/...`, `/fr`),
//     so cross-locale references like `[English](/en)` in `fr/index.md`
//     don't get re-prefixed into `/fr/en`.
import { computed } from 'vue'
import { useI18n } from '#i18n'
import ULink from '#ui/components/Link.vue'

const props = defineProps<{
  href?: string
  target?: string
  class?: unknown
  ui?: Record<string, unknown>
}>()

const localePath = useLocalePath()
const { locales } = useI18n()

const localeCodes = computed(() => (locales.value as Array<{ code: string }>).map(l => l.code))

const isInternal = (h: string) => h.startsWith('/') && !h.startsWith('//')

const startsWithKnownLocale = (h: string) => {
  const first = h.split('/')[1]
  if (!first) return false
  return localeCodes.value.includes(first)
}

const resolvedHref = computed(() => {
  const h = props.href ?? ''
  if (!h || !isInternal(h)) return h
  if (startsWithKnownLocale(h)) return h
  return localePath(h)
})
</script>

<template>
  <ULink :href="resolvedHref" :target="target" :class="props.class" raw>
    <slot />
  </ULink>
</template>
