<script lang="ts">
import theme from '#build/ui/prose/a'
</script>

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
//
// Applies the upstream `prose.a` theme class (via `tv`) so markdown
// links keep their styling — the earlier version passed only
// `props.class` alongside `raw`, which stripped all link styling and
// rendered bare, uncolored `<a>` elements. On a `@nuxt/ui` bump,
// re-sync the theme wiring against upstream A.vue; the
// `useLocalePath` rewrite is the only intentional divergence.
import { computed } from 'vue'
import { useAppConfig } from '#imports'
import { useI18n } from '#i18n'
import { tv } from '#ui/utils/tv'
import ULink from '#ui/components/Link.vue'

const props = defineProps<{
  href?: string
  target?: string
  class?: unknown
  ui?: Record<string, unknown>
}>()

const appConfig = useAppConfig()
const ui = computed(() => tv({ extend: tv(theme), ...appConfig.ui?.prose?.a || {} }))

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
  <ULink :href="resolvedHref" :target="target" :class="ui({ class: [props.ui?.base, props.class] })" raw>
    <slot />
  </ULink>
</template>
