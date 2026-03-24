import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { ElementsResponseSchema, CategoriesResponseSchema } from './schemas'

describe('GET /api/dtpr/draft-2026-03/elements', () => {
  it('conforms to ElementsResponseSchema', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/elements')
    const result = ElementsResponseSchema.safeParse(data)
    if (!result.success) {
      console.error(result.error.format())
    }
    expect(result.success).toBe(true)
  })

  it('returns 68 elements', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/elements')
    const parsed = ElementsResponseSchema.parse(data)
    expect(parsed).toHaveLength(68)
  })

  it('includes both en and fr locales', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/elements')
    const parsed = ElementsResponseSchema.parse(data)
    for (const item of parsed) {
      expect(item.element.name).toHaveProperty('en')
      expect(item.element.name).toHaveProperty('fr')
    }
  })

  it('all element category references are valid', async () => {
    const [elementsData, categoriesData] = await Promise.all([
      $fetch('/api/dtpr/draft-2026-03/elements'),
      $fetch('/api/dtpr/draft-2026-03/datachain-categories'),
    ])
    const elements = ElementsResponseSchema.parse(elementsData)
    const categories = CategoriesResponseSchema.parse(categoriesData)
    const categoryIds = new Set(categories.map((c) => c.category.id))

    for (const item of elements) {
      for (const catRef of item.element.category) {
        expect(categoryIds).toContain(catRef)
      }
    }
  })

  it('includes 6 functional mode elements', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/elements')
    const parsed = ElementsResponseSchema.parse(data)
    const functionalModeElements = parsed.filter((e) =>
      e.element.category.includes('functional_modes'),
    )
    expect(functionalModeElements).toHaveLength(6)
  })

  it('schema metadata has version 0.1', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/elements')
    const parsed = ElementsResponseSchema.parse(data)
    for (const item of parsed) {
      expect(item.schema.version).toBe('0.1')
      expect(item.schema.id).toBe('dtpr_element')
    }
  })

  it('filters locales with ?locales=en', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/elements?locales=en')
    const parsed = ElementsResponseSchema.parse(data)
    for (const item of parsed) {
      expect(Object.keys(item.element.name)).toEqual(['en'])
      expect(item.element.name).not.toHaveProperty('fr')
    }
  })
})
