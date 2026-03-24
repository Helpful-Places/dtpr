import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { TaxonomyResponseSchema } from './schemas'

describe('GET /api/dtpr/draft-2026-03/taxonomy', () => {
  it('conforms to TaxonomyResponseSchema', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/taxonomy')
    const result = TaxonomyResponseSchema.safeParse(data)
    if (!result.success) {
      console.error(result.error.format())
    }
    expect(result.success).toBe(true)
  })

  it('returns both datachain_categories and elements', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/taxonomy')
    const parsed = TaxonomyResponseSchema.parse(data)
    expect(parsed.datachain_categories.length).toBe(9)
    expect(parsed.elements.length).toBe(68)
  })

  it('filters locales with ?locales=fr', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/taxonomy?locales=fr')
    const parsed = TaxonomyResponseSchema.parse(data)

    // Check categories have only fr
    for (const item of parsed.datachain_categories) {
      expect(Object.keys(item.category.name)).toEqual(['fr'])
    }

    // Check elements have only fr
    for (const item of parsed.elements) {
      expect(Object.keys(item.element.name)).toEqual(['fr'])
    }
  })
})
