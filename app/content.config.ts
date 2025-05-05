import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {

    categories: defineCollection({
      type: 'data',
      source: 'dtpr.v1/categories/**/*.md',
      schema: z.object({
        dtpr_id: z.string(),
        name: z.string(),
        description: z.string(),
        datachain_type: z.string(),
        _locale: z.string()
      })
    }),
    datachain_types: defineCollection({
      type: 'data',
      source: 'dtpr.v1/datachain_types/**/*.md',
      schema: z.object({
        dtpr_id: z.string(),
        name: z.string(),
        _locale: z.string()
      })
    }),
    elements: defineCollection({
      type: 'data',
      source: 'dtpr.v1/elements/**/*.md',
      schema: z.object({
        category: z.array(z.string()),
        name: z.string(),
        description: z.string(),
        icon: z.string(),
        dtpr_id: z.string(),
        _locale: z.string()
      })
    }),
    v0_elements: defineCollection({
      type: 'data',
      source: 'dtpr.v0/elements/**/*.md',
      schema: z.object({
        category: z.string(),
        name: z.string(),
        dtpr_id: z.string(),
        description: z.string(),
        icon: z.string(),
        _locale: z.string()
      })
    }),
    v0_categories: defineCollection({
      type: 'data',
      source: 'dtpr.v0/categories/**/*.md',
      schema: z.object({
        dtpr_id: z.string(),
        name: z.string(),
        headline: z.string(),
        _locale: z.string()
      })
    }),
  }
})