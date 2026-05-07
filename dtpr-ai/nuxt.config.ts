export default defineNuxtConfig({
  extends: ['docus'],

  // Docus references `@nuxtjs/i18n` via the `i18n:registerModule` hook
  // (to add its bundled locale message files) but does not register
  // the module itself. We add it here so `useI18n`, `useLocalePath`,
  // `useSwitchLocalePath`, and `<NuxtLinkLocale>` are wired up.
  //
  // The inline module after it patches the two route templates docus
  // ships with — both were written for the no-i18n / no-prefix case
  // and break under `strategy: 'prefix'` because `@nuxtjs/i18n`
  // prepends `/{locale}` to every route's path (`/foo` → `/en/foo`
  // + `/fr/foo`):
  //
  //   1. `lang-index` (landing template, path `/:lang?`) gets prefixed
  //      to `/en/:lang?`, which then matches *any* single-segment URL
  //      starting with `/en` — including `/en/getting-started`. The
  //      docs URL therefore lands on landing.vue, which queries the
  //      `landing_en` collection (only entry: `/en`) and 404s.
  //   2. `lang-slug` (docs catchall, path `/:lang?/:slug(.*)*`) gets
  //      prefixed to `/en/:lang?/:slug(.*)*`, which *also* matches the
  //      bare `/en` (lang=undefined, slug=[]) and beats the landing
  //      route, breaking the locale homepage.
  //
  // The fix:
  //   - lang-index → `/` (prefixed to `/en` and `/fr` only)
  //   - lang-slug  → `/:slug(.+)` (prefixed to `/en/:slug(.+)` and
  //     `/fr/:slug(.+)`; requires at least one segment after the
  //     locale, so `/en` falls through to the landing route).
  //
  // The patch must run inside a module rather than a top-level
  // `hooks: { 'pages:extend' }` entry: top-level hooks register before
  // `extends`-layer modules, so they fire *before* docus's routing
  // module has appended `lang-index`. Defining the listener in a module
  // here registers it after docus's, so it runs last.
  modules: [
    '@nuxtjs/i18n',
    (_options, nuxt) => {
      nuxt.hook('pages:extend', (pages) => {
        const landing = pages.find(p => p.name === 'lang-index')
        if (landing) landing.path = '/'
        const docs = pages.find(p => p.name === 'lang-slug')
        if (docs) docs.path = '/:slug(.+)'
      })
    },
  ],

  site: {
    name: 'DTPR for AI',
  },

  ogImage: { enabled: false },

  // Docus's i18n integration forces `strategy: 'prefix'`, so every
  // route is `/{locale}/...`. Locales here are the *route* locales —
  // the schema may carry more (es, km, pt, tl, etc.), and those still
  // resolve correctly when the API is asked for them, but for now
  // only en + fr are reachable via URL. Add a locale here when its
  // prose translation is ready to ship.
  i18n: {
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr' },
    ],
    defaultLocale: 'en',
    detectBrowserLanguage: false,
  },

  $production: {
    nitro: {
      preset: 'cloudflare-module',
      rollupConfig: {
        // Stub out agents/mcp — required by @nuxtjs/mcp-toolkit's Cloudflare
        // provider (from docus) but not available in Workers Builds
        plugins: [{
          name: 'stub-agents-mcp',
          resolveId(id: string) {
            if (id === 'agents/mcp') return id
          },
          load(id: string) {
            if (id === 'agents/mcp') {
              return 'export function createMcpHandler() { throw new Error("agents/mcp not available") }'
            }
          }
        }]
      }
    }
  },

  compatibilityDate: '2025-01-01'
})
