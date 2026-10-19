// https://nuxt.com/docs/api/configuration/nuxt-config
// Nuxt Studio commits editors' changes to this branch, never to main. Workers
// Builds sets WORKERS_CI_BRANCH, and Studio is only built into the branch's
// own Preview, so editors always see the content they're committing on top of.
// .github/workflows/web-content-pr.yaml opens the PR from it into main.
// `nuxt dev` keeps Studio too, where it writes to the local files instead.
const STUDIO_BRANCH = 'content'
const withStudio = process.env.WORKERS_CI_BRANCH === STUDIO_BRANCH || process.env.NODE_ENV === 'development'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    ...(withStudio ? ['nuxt-studio'] : []),
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxtjs/robots'

  ],

  fonts: {
    families: [
      { name: 'Public Sans', provider: 'google' },
      { name: 'Source Serif 4', provider: 'google' },
      { name: 'Source Code Pro', provider: 'google' },
      {name:'Kalam', provider: 'google'}

    ],
  },
  css: ['~/assets/css/main.css'],

  // The theme defines light tokens only, so the site never switches to dark.
  ui: {
    colorMode: false,
  },

  // Built but not launched. Switch one on for an environment with its variable,
  // such as NUXT_PUBLIC_FEATURES_BUILDER=true. See useFeature.
  runtimeConfig: {
    public: {
      features: {
        builder: false,
      },
    },
  },

  // Icons ship with the site instead of coming from a CDN at render time: the
  // ones the source names are inlined into the app, and Lucide (installed as
  // @iconify-json/lucide) is bundled into the server for any it builds by name.
  // On Workers, Nuxt Icon would otherwise fetch every collection from jsDelivr.
  icon: {
    clientBundle: { scan: true },
    serverBundle: { collections: ['lucide'] },
  },

  // Work in progress on dev.dtpr.io. When this site takes over dtpr.io,
  // set url to 'https://dtpr.io' and indexable to true.
  site: {
    url: 'https://dev.dtpr.io',
    name: 'DTPR',
    indexable: false,
  },

  robots: {
    sitemap: '/sitemap.xml',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
      meta: [
        { name: 'theme-color', content: '#1B2B80' },
      ],
    },
  },

  studio:{
    repository:{
      provider:'github',
      owner:'helpful-places',
      repo:'dtpr',
      branch: STUDIO_BRANCH,
      rootDir:'apps/web'
    }
  },




  devtools: { enabled: true },
  
  content: {
    database: { type: 'd1', bindingName: 'DB' },
    build: {
      markdown: {
        // Nuxt UI defaults to a dark theme, which is unreadable on the light
        // code panels. This one keeps every token at 4.5:1 or better.
        highlight: { theme: 'github-light-high-contrast' },
      },
    },
  },

  $production: {
    nitro: {
      preset: 'cloudflare-module',
    },
  },

  compatibilityDate: '2026-09-01',
})

