export default defineNuxtConfig({
  extends: ['docus'],

  site: {
    name: 'DTPR for AI',
  },

  ogImage: { enabled: false },

  $production: {
    nitro: {
      preset: 'cloudflare-module',
      rollupConfig: {
        // Stub out agents/mcp — required by @nuxtjs/mcp-toolkit's Cloudflare
        // provider (from docus) but not available in Workers Builds
        plugins: [{
          name: 'stub-agents-mcp',
          resolveId(id: string) {
            if (id === 'agents/mcp') return id
          },
          load(id: string) {
            if (id === 'agents/mcp') {
              return 'export function createMcpHandler() { throw new Error("agents/mcp not available") }'
            }
          }
        }]
      }
    }
  },

  compatibilityDate: '2025-01-01'
})
