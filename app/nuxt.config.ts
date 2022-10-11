// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@nuxtjs/google-fonts'
  ],
  googleFonts: {
    families: {
      'Red Hat Text': true
    }
  }
})
