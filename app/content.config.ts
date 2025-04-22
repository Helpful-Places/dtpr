import { defineContentConfig, defineCollection } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    categories: defineCollection({
      type: 'page',
      source: 'dtpr.beta/categories/**/*.md'
    }),
    datachain_types: defineCollection({
      type: 'page',
      source: 'dtpr.beta/datachain_types/**/*.md'
    }),
    elements: defineCollection({
      type: 'page',
      source: 'dtpr.beta/elements/**/*.md'
    }),
  }
})