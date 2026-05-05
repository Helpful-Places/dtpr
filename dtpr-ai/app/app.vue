<script setup lang="ts">
// Local override of docus's app.vue (see
// node_modules/docus/app/app.vue, docus@5.10.0). The body of this
// component mirrors the upstream verbatim except for one bound prop:
// `:groups="dtprGroups"` on `<LazyUContentSearch>`. The groups array
// is appended after the navigation-derived groups inside `<UContentSearch>`,
// surfacing every DTPR element and category as a Cmd-K item alongside
// the prose docs.
//
// On a docus version bump, re-sync this file against the upstream to
// pick up any non-Cmd-K shell changes (color mode, header rendering,
// layout slots). The synthetic-group binding is the only intentional
// divergence.
import type { ContentNavigationItem, PageCollections } from '@nuxt/content'
import * as nuxtUiLocales from '@nuxt/ui/locale'
import { transformNavigation } from 'docus/app/utils/navigation'
import { useDtprSearchOverlay } from './composables/useDtprSearchOverlay'

const appConfig = useAppConfig()
const { seo } = appConfig
const { forced: forcedColorMode } = useDocusColorMode()
const site = useSiteConfig()
const { locale, locales, isEnabled, switchLocalePath } = useDocusI18n()
const { isEnabled: isAssistantEnabled, panelWidth: assistantPanelWidth, shouldPushContent } = useAssistant()

const nuxtUiLocale = computed(() => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] || nuxtUiLocales.en)
const lang = computed(() => nuxtUiLocale.value.code)
const dir = computed(() => nuxtUiLocale.value.dir)
const collectionName = computed(() => isEnabled.value ? `docs_${locale.value}` : 'docs')

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang,
    dir,
  },
})

useSeoMeta({
  titleTemplate: seo.titleTemplate,
  title: seo.title,
  description: seo.description,
  ogSiteName: site.name,
  twitterCard: 'summary_large_image',
})

if (isEnabled.value) {
  const route = useRoute()
  const defaultLocale = useRuntimeConfig().public.i18n.defaultLocale!
  onMounted(() => {
    const currentLocale = route.path.split('/')[1]
    if (!locales.some(l => l.code === currentLocale)) {
      return navigateTo(switchLocalePath(defaultLocale) as string)
    }
  })
}

const { data: navigation } = await useAsyncData(() => `navigation_${collectionName.value}`, () => queryCollectionNavigation(collectionName.value as keyof PageCollections), {
  transform: (data: ContentNavigationItem[]) => transformNavigation(data, isEnabled.value, locale.value),
  watch: [locale],
})
const { data: files } = useLazyAsyncData(`search_${collectionName.value}`, () => queryCollectionSearchSections(collectionName.value as keyof PageCollections), {
  server: false,
  watch: [locale],
})

provide('navigation', navigation)

const { subNavigationMode } = useSubNavigation(navigation)

const { dtprGroups } = useDtprSearchOverlay(files)
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <NuxtLoadingIndicator color="var(--ui-primary)" />

    <div
      :class="['transition-[margin-right] duration-200 ease-linear will-change-[margin-right]', { 'docus-sub-header': subNavigationMode === 'header' }]"
      :style="{ marginRight: shouldPushContent ? `${assistantPanelWidth}px` : '0' }"
    >
      <AppHeader v-if="$route.meta.header !== false" />
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
      <AppFooter v-if="$route.meta.footer !== false" />
    </div>

    <ClientOnly>
      <LazyUContentSearch
        :files="files"
        :navigation="navigation"
        :groups="dtprGroups"
        :color-mode="!forcedColorMode"
      />
      <template v-if="isAssistantEnabled">
        <LazyAssistantPanel />
        <LazyAssistantFloatingInput />
      </template>
    </ClientOnly>
  </UApp>
</template>

<style>
@media (min-width: 1024px) {
  .docus-sub-header {
    /* 64px base header + 48px sub-navigation bar */
    --ui-header-height: 112px;
  }
}
</style>
