export default defineNuxtConfig({
  extends: ['docus'],

  site: {
    name: 'Digital Trust for Places & Routines',
  },

  $production: {
    nitro: {
      preset: 'cloudflare-module',
      rollupConfig: {
        external: ['agents/mcp']
      }
    }
  },

  compatibilityDate: '2025-01-01'
})
