import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    categories: defineCollection({
      type: 'data',
      source: 'dtpr.beta/categories/**/*.md',
      schema: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        datachain_type: z.string()
      })
    }),
    datachain_types: defineCollection({
      type: 'data',
      source: 'dtpr.beta/datachain_types/**/*.md',
      schema: z.object({
        id: z.string(),
        name: z.string()
      })
    }),
    elements: defineCollection({
      type: 'data',
      source: 'dtpr.beta/elements/**/*.md',
      schema: z.object({
        category: z.array(z.string()),
        name: z.string(),
        id: z.string(),
        description: z.string(),
        icon: z.string()
      })
    }),
  }
})