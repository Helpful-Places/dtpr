<script setup lang="ts">
import type { NuxtError } from '#app'
import AppFooter from './components/appFooter.vue'

// Replaces Nuxt's bare error screen, so a wrong address still has the site's
// navigation, a page title and a way forward.
const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() => (notFound.value ? 'Page not found' : 'Something went wrong'))
const description = computed(() => notFound.value
  ? 'This address does not lead anywhere on the DTPR site. The page may have moved, or the link may be mistyped.'
  : 'The page could not be loaded. Try again in a moment.')

useHead({ title: () => `${title.value} · DTPR` })

const links = [
  { label: 'Go to the home page', to: '/', size: 'xl' as const, class: 'min-h-11' },
  { label: 'Explore the taxonomy', to: '/taxonomy', color: 'primary' as const, variant: 'outline' as const, size: 'xl' as const, class: 'min-h-11' },
]
</script>

<template>
  <UApp>
    <div class="graph-paper bg-default">
      <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-4 focus:py-2 focus:text-primary">Skip to content</a>
      <navHeader />
      <main id="main">
        <UContainer>
          <UPageHero :title="title" :description="description" :links="links" />
        </UContainer>
      </main>
      <AppFooter />
    </div>
  </UApp>
</template>
