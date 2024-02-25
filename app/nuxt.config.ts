import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@nuxtjs/google-fonts',
    'nuxt-icon',
    '@nuxt/image',
    '@nuxtjs/i18n'
  ],
  googleFonts: {
    families: {
      'Red Hat Text': [300, 400, 500, 600, 700]
    }
  },
  i18n: {
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root' // recommended
    },
    defaultLocale: 'en',
    locales: [
      'en',
      'fr',
      'es',
      'pt',
      'tl',
      'km'
    ],
  }
})
