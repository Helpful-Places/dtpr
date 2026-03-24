import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { CategoriesResponseSchema } from './schemas'

describe('GET /api/dtpr/draft-2026-03/datachain-categories', () => {
  it('conforms to CategoriesResponseSchema', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories')
    const result = CategoriesResponseSchema.safeParse(data)
    if (!result.success) {
      console.error(result.error.format())
    }
    expect(result.success).toBe(true)
  })

  it('returns 9 categories', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories')
    const parsed = CategoriesResponseSchema.parse(data)
    expect(parsed).toHaveLength(9)
  })

  it('includes both en and fr locales', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories')
    const parsed = CategoriesResponseSchema.parse(data)
    for (const item of parsed) {
      expect(item.category.name).toHaveProperty('en')
      expect(item.category.name).toHaveProperty('fr')
    }
  })

  it('schema metadata has version 0.1', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories')
    const parsed = CategoriesResponseSchema.parse(data)
    for (const item of parsed) {
      expect(item.schema.version).toBe('0.1')
      expect(item.schema.id).toBe('dtpr_category')
    }
  })

  it('categories are sorted by order field', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories')
    const parsed = CategoriesResponseSchema.parse(data)
    const orders = parsed
      .map((item) => item.category.order)
      .filter((o): o is number => typeof o === 'number')

    for (let i = 1; i < orders.length; i++) {
      expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1])
    }
  })

  it('functional_modes category has context with 6 modes', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories')
    const parsed = CategoriesResponseSchema.parse(data)
    const functionalModes = parsed.find((c) => c.category.id === 'functional_modes')
    expect(functionalModes).toBeDefined()
    expect(functionalModes!.category.context).toBeDefined()
    expect(functionalModes!.category.context!.values).toHaveLength(6)
  })

  it('filters locales with ?locales=en', async () => {
    const data = await $fetch('/api/dtpr/draft-2026-03/datachain-categories?locales=en')
    const parsed = CategoriesResponseSchema.parse(data)
    for (const item of parsed) {
      expect(Object.keys(item.category.name)).toEqual(['en'])
      expect(item.category.name).not.toHaveProperty('fr')
    }
  })
})
