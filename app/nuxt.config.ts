import { parseFrontMatter } from 'remark-mdc'
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

  hooks: {
    'content:file:beforeParse': (ctx) => {
      // Skip if there's no body to parse
      if (!ctx.file.body) return;

      // Use the parseFrontMatter function to extract the frontmatter data
      try {
        // Wrap the content in frontmatter delimiters if it doesn't already have them
        const content = ctx.file.body.toString();
        let contentToProcess = content;

        if (!content.trim().startsWith('---')) {
          contentToProcess = `---\n${content}\n---`;
        }

        const { data } = parseFrontMatter(contentToProcess);

        // If an ID was specified in the frontmatter, store it for later use
        if (data && data.id) {
          ctx.file._dtpr_id = data.id;
        }
      } catch (error) {
        // If there's an error parsing the frontmatter, just continue
        console.error(`Error parsing frontmatter in ${ctx.file.path}:`, error);
      }
    },
    'content:file:afterParse': (ctx) => {
      // Get path from file object
      const path = ctx.file.path || '';

      // Skip processing if path is empty
      if (!path) return;

      // Split path by directory separator
      // This handles both Unix-style (/) and Windows-style (\) paths
      const pathParts = path.split(/[/\\]/).filter(Boolean);

      let locale;

      // Check for structure: content/dtpr.v1/collection/locale/file.md
      // or: content/dtpr/collection/locale/file.md
      if (pathParts.length >= 4) {
        // Try the second-to-last part (directory containing the file)
        const candidateLocale = pathParts[pathParts.length - 2];
        if (locales.includes(candidateLocale)) {
          locale = candidateLocale;
        }
      }

      // Only set locale if one was found
      if (locale) {
        ctx.content._locale = locale;
      }

      // If we stored an original ID in the beforeParse hook, use it now
      if (ctx.file._dtpr_id) {
        ctx.content.dtpr_id = ctx.file._dtpr_id;
      }
    }
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