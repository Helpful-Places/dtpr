import { defineContentConfig, defineCollection } from '@nuxt/content'

// Adding `app/pages/index.vue` disables docus's auto-registered `landing`
// collection (see node_modules/docus/content.config.ts). Re-declare it
// here so `content/index.md` remains queryable from the override page.
export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'page',
      source: {
        include: 'index.md',
      },
    }),
  },
})
