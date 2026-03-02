export default defineNuxtConfig({
  extends: ['docus'],

  $production: {
    nitro: {
      preset: 'cloudflare-module'
    }
  },

  compatibilityDate: '2025-01-01'
})
