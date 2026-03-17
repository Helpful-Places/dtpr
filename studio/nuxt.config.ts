export default defineNuxtConfig({
  modules: ['@nuxt/ui', '@nuxtjs/mdc'],

  css: ['~/assets/css/main.css'],

  ssr: false,

  devServer: {
    port: 3001,
  },

  runtimeConfig: {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    recraftApiKey: process.env.RECRAFT_API_KEY || '',
    contentDir: process.env.DTPR_CONTENT_DIR || '',
    iconsDir: process.env.DTPR_ICONS_DIR || '',
  },

  compatibilityDate: '2025-01-01',
})
