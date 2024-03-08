import { defineNuxtConfig } from 'nuxt/config'

const locales = [
  'en',
  'fr',
  'es',
  'pt',
  'tl',
  'km'
]

const defaultLocale = 'en'

export default defineNuxtConfig({
  ssr: true,
  nitro: {
    prerender: {
      routes: locales.map(locale => `/api/dtpr/v0/${locale}`)
    }
  },
  routeRules: {
    '/api/dtpr/**': {
      'cors': true
    }
  },
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
  content: {
    defaultLocale,
    locales
  },
  i18n: {
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root' // recommended
    },
    defaultLocale,
    locales,
  }
})
