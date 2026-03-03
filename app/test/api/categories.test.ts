import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { CategoriesResponseSchema } from './schemas'
import { categoriesFingerprint } from './helpers'

describe('GET /api/dtpr/v1/categories/:datachain_type', () => {
  describe.each(['ai', 'device'] as const)('%s categories', (type) => {
    it('conforms to CategoriesResponseSchema', async () => {
      const data = await $fetch(`/api/dtpr/v1/categories/${type}`)
      const result = CategoriesResponseSchema.safeParse(data)
      if (!result.success) {
        console.error(result.error.format())
      }
      expect(result.success).toBe(true)
    })

    it(`category IDs match ${type}__ prefix`, async () => {
      const data = await $fetch(`/api/dtpr/v1/categories/${type}`)
      const parsed = CategoriesResponseSchema.parse(data)
      for (const item of parsed) {
        expect(item.category.id).toMatch(new RegExp(`^${type}__`))
      }
    })

    it('includes all 6 locales when no filter', async () => {
      const data = await $fetch(`/api/dtpr/v1/categories/${type}`)
      const parsed = CategoriesResponseSchema.parse(data)
      const expectedLocales = ['en', 'es', 'fr', 'km', 'pt', 'tl']
      for (const item of parsed) {
        const locales = item.category.name.map((n) => n.locale).sort()
        expect(locales).toEqual(expectedLocales)
      }
    })

    it('schema metadata has version 0.2', async () => {
      const data = await $fetch(`/api/dtpr/v1/categories/${type}`)
      const parsed = CategoriesResponseSchema.parse(data)
      for (const item of parsed) {
        expect(item.schema.version).toBe('0.2')
        expect(item.schema.id).toBe('dtpr_category')
      }
    })

    it('categories are sorted by order field', async () => {
      const data = await $fetch(`/api/dtpr/v1/categories/${type}`)
      const parsed = CategoriesResponseSchema.parse(data)
      const orders = parsed
        .map((item) => item.category.order)
        .filter((o): o is number => typeof o === 'number')

      for (let i = 1; i < orders.length; i++) {
        expect(orders[i]).toBeGreaterThanOrEqual(orders[i - 1])
      }
    })

    it('structural fingerprint matches snapshot', async () => {
      const data = await $fetch(`/api/dtpr/v1/categories/${type}`)
      const parsed = CategoriesResponseSchema.parse(data)
      expect(categoriesFingerprint(parsed)).toMatchSnapshot()
    })
  })

  it('returns 400 for invalid datachain_type', async () => {
    await expect(
      $fetch('/api/dtpr/v1/categories/invalid'),
    ).rejects.toThrow()
  })
})
