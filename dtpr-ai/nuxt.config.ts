export default defineNuxtConfig({
  extends: ['docus'],

  // Docus references `@nuxtjs/i18n` via the `i18n:registerModule` hook
  // (to add its bundled locale message files) but does not register
  // the module itself. We add it here so `useI18n`, `useLocalePath`,
  // `useSwitchLocalePath`, and `<NuxtLinkLocale>` are wired up.
  modules: ['@nuxtjs/i18n'],

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
