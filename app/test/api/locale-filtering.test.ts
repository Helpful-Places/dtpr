import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { CategoriesResponseSchema, ElementsResponseSchema } from './schemas'

describe('locale filtering', () => {
  describe('categories', () => {
    it('?locales=en returns only en entries', async () => {
      const data = await $fetch('/api/dtpr/v1/categories/ai?locales=en')
      const parsed = CategoriesResponseSchema.parse(data)

      for (const item of parsed) {
        for (const n of item.category.name) {
          expect(n.locale).toBe('en')
        }
        for (const d of item.category.description) {
          expect(d.locale).toBe('en')
        }
        // Check context locale arrays are also filtered
        if (item.category.context) {
          for (const n of item.category.context.name) {
            expect(n.locale).toBe('en')
          }
          for (const d of item.category.context.description) {
            expect(d.locale).toBe('en')
          }
          for (const val of item.category.context.values) {
            for (const n of val.name) {
              expect(n.locale).toBe('en')
            }
            for (const d of val.description) {
              expect(d.locale).toBe('en')
            }
          }
        }
      }
    })

    it('?locales=en,fr returns only en and fr entries', async () => {
      const data = await $fetch('/api/dtpr/v1/categories/ai?locales=en,fr')
      const parsed = CategoriesResponseSchema.parse(data)
      const allowedLocales = ['en', 'fr']

      for (const item of parsed) {
        for (const n of item.category.name) {
          expect(allowedLocales).toContain(n.locale)
        }
        for (const d of item.category.description) {
          expect(allowedLocales).toContain(d.locale)
        }
      }
    })
  })

  describe('elements by type', () => {
    it('?locales=en returns only en entries', async () => {
      const data = await $fetch('/api/dtpr/v1/elements/ai?locales=en')
      const parsed = ElementsResponseSchema.parse(data)

      for (const item of parsed) {
        for (const t of item.element.title) {
          expect(t.locale).toBe('en')
        }
        for (const d of item.element.description) {
          expect(d.locale).toBe('en')
        }
        for (const a of item.element.icon.alt_text) {
          expect(a.locale).toBe('en')
        }
      }
    })

    it('?locales=en,fr returns only en and fr entries', async () => {
      const data = await $fetch('/api/dtpr/v1/elements/device?locales=en,fr')
      const parsed = ElementsResponseSchema.parse(data)
      const allowedLocales = ['en', 'fr']

      for (const item of parsed) {
        for (const t of item.element.title) {
          expect(allowedLocales).toContain(t.locale)
        }
        for (const d of item.element.description) {
          expect(allowedLocales).toContain(d.locale)
        }
      }
    })
  })
})
