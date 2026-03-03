import { describe, it, expect } from 'vitest'
import { $fetch } from '@nuxt/test-utils/e2e'
import { ElementsResponseSchema, AllElementsResponseSchema } from './schemas'
import { elementsFingerprint } from './helpers'

describe('GET /api/dtpr/v1/elements/:datachain_type', () => {
  describe.each(['ai', 'device'] as const)('%s elements', (type) => {
    it('conforms to ElementsResponseSchema', async () => {
      const data = await $fetch(`/api/dtpr/v1/elements/${type}`)
      const result = ElementsResponseSchema.safeParse(data)
      if (!result.success) {
        console.error(result.error.format())
      }
      expect(result.success).toBe(true)
    })

    it('elements with context_type_id have valid values', async () => {
      const data = await $fetch(`/api/dtpr/v1/elements/${type}`)
      const parsed = ElementsResponseSchema.parse(data)
      for (const item of parsed) {
        if (item.element.context_type_id !== undefined) {
          expect(typeof item.element.context_type_id).toBe('string')
          expect(item.element.context_type_id.length).toBeGreaterThan(0)
        }
      }
    })

    it('includes all 6 locales when no filter', async () => {
      const data = await $fetch(`/api/dtpr/v1/elements/${type}`)
      const parsed = ElementsResponseSchema.parse(data)
      const expectedLocales = ['en', 'es', 'fr', 'km', 'pt', 'tl']
      for (const item of parsed) {
        const locales = item.element.title.map((t) => t.locale).sort()
        expect(locales).toEqual(expectedLocales)
      }
    })

    it('schema metadata has version 0.2', async () => {
      const data = await $fetch(`/api/dtpr/v1/elements/${type}`)
      const parsed = ElementsResponseSchema.parse(data)
      for (const item of parsed) {
        expect(item.schema.version).toBe('0.2')
        expect(item.schema.id).toBe('dtpr_element')
      }
    })

    it('structural fingerprint matches snapshot', async () => {
      const data = await $fetch(`/api/dtpr/v1/elements/${type}`)
      const parsed = ElementsResponseSchema.parse(data)
      expect(elementsFingerprint(parsed)).toMatchSnapshot()
    })
  })
})

describe('GET /api/dtpr/v1/elements (all elements)', () => {
  it('conforms to AllElementsResponseSchema', async () => {
    const data = await $fetch('/api/dtpr/v1/elements')
    const result = AllElementsResponseSchema.safeParse(data)
    if (!result.success) {
      console.error(result.error.format())
    }
    expect(result.success).toBe(true)
  })

  it('returns more elements than any single datachain_type', async () => {
    const [all, ai, device] = await Promise.all([
      $fetch('/api/dtpr/v1/elements'),
      $fetch('/api/dtpr/v1/elements/ai'),
      $fetch('/api/dtpr/v1/elements/device'),
    ])
    const allParsed = AllElementsResponseSchema.parse(all)
    const aiParsed = ElementsResponseSchema.parse(ai)
    const deviceParsed = ElementsResponseSchema.parse(device)

    expect(allParsed.length).toBeGreaterThanOrEqual(aiParsed.length)
    expect(allParsed.length).toBeGreaterThanOrEqual(deviceParsed.length)
  })
})
