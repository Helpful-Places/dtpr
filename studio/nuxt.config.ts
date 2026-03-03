export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  ssr: false,

  devServer: {
    port: 3001,
  },

  runtimeConfig: {
    anthropicApiKey: '',
    recraftApiKey: '',
    contentDir: '',
    iconsDir: '',
  },

  compatibilityDate: '2025-01-01',
})
