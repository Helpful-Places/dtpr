import { describe, expect, it } from 'vitest'
import {
  collectPresentLocales,
  pickDefaultLocale,
} from '../app/utils/datachain-visualizer-locales'
import type { ResolvedDatachainInstance } from '@dtpr/ui/core'

function lv(locale: string, value: string) {
  return { locale, value }
}

function instanceWith(overrides: Partial<ResolvedDatachainInstance>): ResolvedDatachainInstance {
  return {
    instance: {
      schema_version: 'ai@2026-05-06-beta',
      id: 'demo',
      title: [],
      description: [],
      elements: [],
    },
    schema_version: 'ai@2026-05-06-beta',
    schema_snapshot: {
      datachain_type: { id: 'ai', categories: [] },
      categories: [],
      elements: [],
    },
    suggested_elements: [],
    elements: [],
    ...overrides,
  } as unknown as ResolvedDatachainInstance
}

describe('collectPresentLocales', () => {
  it('returns the union of locales from instance and snapshot fields', () => {
    const resolved = instanceWith({
      instance: {
        schema_version: 'ai@2026-05-06-beta',
        id: 'demo',
        title: [lv('en', 'Demo'), lv('fr', 'Démo')],
        description: [lv('en', 'A short description')],
        elements: [],
      },
      schema_snapshot: {
        datachain_type: { id: 'ai', categories: [] },
        categories: [
          { id: 'purpose', name: [lv('en', 'Purpose'), lv('fr', 'But')], description: [] },
        ],
        elements: [
          {
            id: 'purpose__primary',
            category_id: 'purpose',
            title: [lv('en', 'Primary purpose'), lv('es', 'Propósito principal')],
            description: [],
          },
        ],
      },
    } as never)
    expect(collectPresentLocales(resolved)).toEqual(['en', 'es', 'fr'])
  })

  it('honors siteLocaleOrder before alphabetical fallback', () => {
    const resolved = instanceWith({
      instance: {
        schema_version: 'ai@2026-05-06-beta',
        id: 'demo',
        title: [lv('es', 'X'), lv('fr', 'Y'), lv('en', 'Z')],
        description: [],
        elements: [],
      },
    } as never)
    expect(collectPresentLocales(resolved, ['en', 'fr'])).toEqual(['en', 'fr', 'es'])
  })

  it('produces a stable order on repeated calls', () => {
    const resolved = instanceWith({
      instance: {
        schema_version: 'ai@2026-05-06-beta',
        id: 'demo',
        title: [lv('km', 'A'), lv('en', 'B'), lv('pt', 'C'), lv('fr', 'D')],
        description: [],
        elements: [],
      },
    } as never)
    const first = collectPresentLocales(resolved, ['en', 'fr'])
    const second = collectPresentLocales(resolved, ['en', 'fr'])
    expect(first).toEqual(second)
    expect(first).toEqual(['en', 'fr', 'km', 'pt'])
  })

  it('skips empty LocaleValue arrays', () => {
    const resolved = instanceWith({
      instance: {
        schema_version: 'ai@2026-05-06-beta',
        id: 'demo',
        title: [],
        description: [lv('fr', 'Description')],
        elements: [],
      },
    } as never)
    expect(collectPresentLocales(resolved)).toEqual(['fr'])
  })

  it('counts a LocaleValue entry whose value is empty string', () => {
    const resolved = instanceWith({
      instance: {
        schema_version: 'ai@2026-05-06-beta',
        id: 'demo',
        title: [lv('en', '')],
        description: [],
        elements: [],
      },
    } as never)
    expect(collectPresentLocales(resolved)).toEqual(['en'])
  })

  it('returns ["en"] when no locale strings appear', () => {
    const resolved = instanceWith({})
    expect(collectPresentLocales(resolved)).toEqual(['en'])
  })

  it('walks nested element variable values and labels', () => {
    const resolved = instanceWith({
      instance: {
        schema_version: 'ai@2026-05-06-beta',
        id: 'demo',
        title: [],
        description: [],
        elements: [
          {
            id: 'placement-1',
            element_id: 'foo',
            variables: [{ id: 'bar', value: [lv('km', 'ភាសា')] }],
          },
        ],
      },
    } as never)
    expect(collectPresentLocales(resolved)).toEqual(['km'])
  })
})

describe('pickDefaultLocale', () => {
  it('uses the site locale when present in the chain', () => {
    expect(pickDefaultLocale(['en', 'fr'], 'fr')).toBe('fr')
  })

  it('falls back to the first present locale when the site locale is absent', () => {
    expect(pickDefaultLocale(['en', 'fr'], 'es')).toBe('en')
  })

  it('falls back to "en" when present is empty', () => {
    expect(pickDefaultLocale([], 'fr')).toBe('en')
  })
})
