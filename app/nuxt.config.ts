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
    },
    routeRules: {
      '/api/**': { cors: true },
      '/dtpr-icons/**': { cors: true }
    }
  },

  vite: {
    server: {
      cors: true, // Only for dev
    },
  },

  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@nuxtjs/google-fonts',
    '@nuxt/image',
    '@nuxtjs/i18n',
  ],

  googleFonts: {
    families: {
      'Red Hat Text': [300, 400, 500, 600, 700]
    }
  },

  colorMode: {
    preference: 'light'
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
  },

  runtimeConfig: {
    siteUrl: process.env.RENDER_EXTERNAL_URL || "http://localhost:3000"
  },

  compatibilityDate: '2024-08-14'
})