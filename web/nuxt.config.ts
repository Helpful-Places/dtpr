// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    'nuxt-studio',
    '@nuxt/ui',
    '@nuxt/fonts'

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

  // Vendored into the dtpr monorepo at `web/`, so Studio edits commit here
  // rather than back to the standalone DTPR-Website-Refresh repo it came from.
  studio: {
    repository: {
      provider: 'github',
      owner: 'helpful-places',
      repo: 'dtpr',
      branch: 'main',
      rootDir: 'web'
    }
  },




  devtools: { enabled: true },
  
  $production: {
    nitro: {
      preset: 'cloudflare-module',
    //   rollupConfig: {
    //     // Stub out agents/mcp — required by @nuxtjs/mcp-toolkit's Cloudflare
    //     // provider (from docus) but not available in Workers Builds
    //   //   plugins: [{
    //   //     name: 'stub-agents-mcp',
    //   //     resolveId(id: string) {
    //   //       if (id === 'agents/mcp') return id
    //   //     },
    //   //     load(id: string) {
    //   //       if (id === 'agents/mcp') {
    //   //         return 'export function createMcpHandler() { throw new Error("agents/mcp not available") }'
    //   //       }
    //   //     }
    //   //   }]
    //   // }
    }
  },


  // Must be >= 2024-09-19, or Nitro silently downgrades the Cloudflare build to
  // the `cloudflare-module-legacy` preset — which bundles Workers Sites
  // (`__STATIC_CONTENT_MANIFEST`) instead of the Workers Static Assets binding
  // that `wrangler.jsonc`'s `assets` block provides. Matches docs-site/dtpr-ai.
  compatibilityDate: '2025-01-01',
})

