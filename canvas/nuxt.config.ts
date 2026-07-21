// The canvas app: a DTPR AI register with a click-to-react feedback
// layer. Mirrors the Cloudflare deployment shape of `dtpr-ai` and
// `docs-site` — a `cloudflare-module` Nitro preset under `$production`,
// deployed via Cloudflare Workers Builds (no CI job).
export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/i18n'],

  css: ['~/assets/css/main.css'],

  // Canvas pages are SSR so LinkedIn / newsletter deep links render OG
  // previews (U7 / R15). Nitro is the default; this is explicit intent.
  ssr: true,

  // Locales are the *feedback-UI chrome* locales. Each canvas carries
  // its own en/fr content inline in the seed data and the renderer
  // reads the active locale from `useI18n().locale` — the chrome and
  // canvas content share the same toggle. `restructureDir: false`
  // keeps `locales/` at the project root as the plan specifies rather
  // than the i18n v10 default `i18n/` directory.
  i18n: {
    restructureDir: false,
    langDir: 'locales',
    strategy: 'no_prefix',
    defaultLocale: 'en',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'fr', name: 'Français', language: 'fr', file: 'fr.json' },
    ],
    vueI18n: 'i18n.config.ts',
  },

  $production: {
    nitro: {
      preset: 'cloudflare-module',
    },
  },

  compatibilityDate: '2025-01-01',
})
