<script setup lang="ts">
// App chrome: a slim header with the site title and an EN/FR toggle. The
// same locale drives both the chrome and the canvas content (the renderer
// reads useI18n().locale).
const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <div class="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
    <header class="border-b border-[var(--line)] bg-[var(--card)]">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <NuxtLink :to="localePath('/')" class="font-bold tracking-tight text-[var(--ink)] no-underline">
          {{ t('app.title') }}
        </NuxtLink>
        <div class="flex overflow-hidden rounded-full border border-[var(--line)]">
          <button
            v-for="code in ['en', 'fr']" :key="code"
            type="button"
            class="px-3 py-1 text-xs font-bold tracking-wide transition"
            :class="locale === code ? 'bg-[var(--teal)] text-white' : 'text-[var(--muted)]'"
            @click="setLocale(code as 'en' | 'fr')"
          >{{ code.toUpperCase() }}</button>
        </div>
      </div>
    </header>
    <slot />
  </div>
</template>
