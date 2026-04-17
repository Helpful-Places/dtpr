import { describe, it, expect, beforeAll } from 'vitest'
import { SELF } from 'cloudflare:test'
import { SAMPLE_VERSION, seedVersion } from './seed.ts'
import { deepFilterLocales, parseLocalesParam } from '../../src/rest/responses.ts'

beforeAll(async () => {
  await seedVersion()
})

describe('locale filtering: parseLocalesParam', () => {
  it('returns null when missing', () => {
    expect(parseLocalesParam(undefined)).toBeNull()
    expect(parseLocalesParam(null)).toBeNull()
    expect(parseLocalesParam('')).toBeNull()
  })

  it('parses comma-separated values into a Set', () => {
    const set = parseLocalesParam('en,fr')
    expect(set?.has('en')).toBe(true)
    expect(set?.has('fr')).toBe(true)
    expect(set?.size).toBe(2)
  })

  it('trims whitespace and skips empties', () => {
    const set = parseLocalesParam(' en , , fr ')
    expect(set?.size).toBe(2)
    expect(set?.has('en')).toBe(true)
    expect(set?.has('fr')).toBe(true)
  })
})

describe('locale filtering: deepFilterLocales', () => {
  const sample = {
    title: [
      { locale: 'en', value: 'Hi' },
      { locale: 'fr', value: 'Salut' },
    ],
    nested: {
      description: [
        { locale: 'en', value: 'long' },
        { locale: 'fr', value: 'longue' },
      ],
    },
    untouched: ['stays', 'as', 'is'],
    scalar: 42,
  }

  it('returns input unchanged when allow=null', () => {
    expect(deepFilterLocales(sample, null)).toEqual(sample)
  })

  it('filters LocaleValue arrays at any depth', () => {
    const result = deepFilterLocales(sample, new Set(['en']))
    expect(result.title).toEqual([{ locale: 'en', value: 'Hi' }])
    expect(result.nested.description).toEqual([{ locale: 'en', value: 'long' }])
  })

  it('does not touch non-LocaleValue arrays or scalars', () => {
    const result = deepFilterLocales(sample, new Set(['en']))
    expect(result.untouched).toEqual(['stays', 'as', 'is'])
    expect(result.scalar).toBe(42)
  })
})

describe('locale filtering: end-to-end through REST', () => {
  it('?locales=fr filters all category-level localized strings', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/categories?locales=fr`,
    )
    const body = (await res.json()) as {
      categories: Array<{
        name: { locale: string }[]
        description: { locale: string }[]
      }>
    }
    expect(body.categories[0]?.name.map((n) => n.locale)).toEqual(['fr'])
    expect(body.categories[0]?.description.map((n) => n.locale)).toEqual(['fr'])
  })

  it('?locales=en,fr keeps both', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/categories?locales=en,fr`,
    )
    const body = (await res.json()) as {
      categories: Array<{ name: { locale: string }[] }>
    }
    expect(body.categories[0]?.name.map((n) => n.locale).sort()).toEqual(['en', 'fr'])
  })

  it('?locales filters element title and description', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny?locales=en`,
    )
    const body = (await res.json()) as {
      element: {
        title: { locale: string }[]
        description: { locale: string }[]
      }
    }
    expect(body.element.title.map((t) => t.locale)).toEqual(['en'])
    expect(body.element.description.map((t) => t.locale)).toEqual(['en'])
  })
})
