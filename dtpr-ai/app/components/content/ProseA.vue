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
//   - static assets under `public/` (`/skills/....zip`,
//     `/figma-plugin/manifest.json`), which are served from the site
//     root with no locale segment and 404 when prefixed.
//
// The decision itself lives in `app/utils/content-links.ts` so it can
// be unit-tested without mounting the component.
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
import { isStaticAssetPath, shouldLocalizePath } from '../../utils/content-links'

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

const resolvedHref = computed(() => {
  const h = props.href ?? ''
  return shouldLocalizePath(h, localeCodes.value) ? localePath(h) : h
})

// Skipping `localePath` above is not enough on its own: `ULink` hands
// internal hrefs to `NuxtLink`, which localizes them again under the
// i18n `prefix` strategy — so a `public/` asset still came out as
// `/en/skills/….zip` and 404'd. Marking assets `external` renders a
// plain `<a>` instead, which is what a file download wants anyway.
const isExternalAsset = computed(() => isStaticAssetPath(props.href ?? ''))
</script>

<template>
  <ULink :href="resolvedHref" :target="target" :external="isExternalAsset" :class="ui({ class: [props.ui?.base, props.class] })" raw>
    <slot />
  </ULink>
</template>
