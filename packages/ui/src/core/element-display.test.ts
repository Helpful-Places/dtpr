import { describe, it, expect } from 'vitest'
import type {
  Category,
  Element,
  InstanceElement,
  LocaleValue,
  Variable,
} from '@dtpr/api/schema'
import { deriveElementDisplay } from './element-display.js'
import { HEXAGON_FALLBACK_DATA_URI } from './icons.js'

const loc = (locale: string, value: string) => ({ locale, value }) as LocaleValue

function makeElement(overrides: Partial<Element> = {}): Element {
  return {
    id: 'cloud_storage',
    category_id: 'ai__storage',
    title: [loc('en', 'Cloud storage'), loc('es', 'Almacenamiento en la nube')],
    description: [
      loc('en', 'Data held for {{retention_period}}.'),
      loc('es', 'Datos almacenados durante {{retention_period}}.'),
    ],
    citation: [loc('en', 'See RFC 1234'), loc('es', 'Véase RFC 1234')],
    symbol_id: 'cloud',
    variables: [
      {
        id: 'retention_period',
        label: [loc('en', 'Retention period'), loc('es', 'Periodo de retención')],
        required: true,
      } satisfies Variable,
    ],
    ...overrides,
  }
}

function makeInstanceElement(overrides: Partial<InstanceElement> = {}): InstanceElement {
  return {
    element_id: 'cloud_storage',
    priority: 0,
    variables: [{ id: 'retention_period', value: '30 days' }],
    actions: [],
    ...overrides,
  }
}

describe('deriveElementDisplay', () => {
  it('returns fully locale-resolved display data for a happy-path fixture', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'en', {
      iconUrl: '/icons/cloud.svg',
      iconAlt: 'Cloud',
    })
    expect(result.title).toBe('Cloud storage')
    expect(result.description).toBe('Data held for 30 days.')
    expect(result.citation).toBe('See RFC 1234')
    expect(result.icon.url).toBe('/icons/cloud.svg')
    expect(result.icon.alt).toBe('Cloud')
    expect(result.variables).toEqual([
      {
        id: 'retention_period',
        label: 'Retention period',
        value: '30 days',
        type: 'text',
        required: true,
      },
    ])
  })

  it('resolves strings in the requested non-default locale', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'es')
    expect(result.title).toBe('Almacenamiento en la nube')
    expect(result.description).toBe('Datos almacenados durante 30 days.')
    // Alt defaults to the resolved title when no override is supplied.
    expect(result.icon.alt).toBe('Almacenamiento en la nube')
    expect(result.variables[0]?.label).toBe('Periodo de retención')
  })

  it('falls back to HEXAGON_FALLBACK_DATA_URI when no iconUrl option is supplied', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'en')
    expect(result.icon.url).toBe(HEXAGON_FALLBACK_DATA_URI)
    // Defaults to the resolved title for a sensible, descriptive alt.
    expect(result.icon.alt).toBe('Cloud storage')
  })

  it('falls back to HEXAGON_FALLBACK_DATA_URI when iconUrl is the empty string', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'en', {
      iconUrl: '',
      iconAlt: 'Missing',
    })
    expect(result.icon.url).toBe(HEXAGON_FALLBACK_DATA_URI)
    expect(result.icon.alt).toBe('Missing')
  })

  it('leaves a required variable value as "" when no instance value is provided, preserving required + type', () => {
    const el = makeElement()
    const instance = makeInstanceElement({ variables: [] })
    const result = deriveElementDisplay(el, instance, 'en')
    expect(result.variables[0]).toEqual({
      id: 'retention_period',
      label: 'Retention period',
      value: '',
      type: 'text',
      required: true,
    })
  })

  it('accepts an undefined instance (variables use empty values)', () => {
    const result = deriveElementDisplay(makeElement(), undefined, 'en')
    expect(result.variables[0]?.value).toBe('')
    expect(result.variables[0]?.required).toBe(true)
    expect(result.description).toBe('Data held for {{retention_period}}.')
  })

  it('leaves unresolved {{vars}} literal in description when no instance value is provided', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement({ variables: [] }), 'en')
    expect(result.description).toBe('Data held for {{retention_period}}.')
  })

  it('returns empty strings for locales that have no entry (instead of throwing)', () => {
    const el = makeElement({ citation: [] })
    const result = deriveElementDisplay(el, makeInstanceElement(), 'en')
    expect(result.citation).toBe('')
  })

  it('plumbs iconUrlDark through to icon.urlDark', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'en', {
      iconUrl: '/icons/cloud.svg',
      iconUrlDark: '/icons/cloud.dark.svg',
    })
    expect(result.icon.url).toBe('/icons/cloud.svg')
    expect(result.icon.urlDark).toBe('/icons/cloud.dark.svg')
  })

  it('leaves icon.urlDark undefined when iconUrlDark is not supplied', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'en', {
      iconUrl: '/icons/cloud.svg',
    })
    expect(result.icon.urlDark).toBeUndefined()
  })

  it('treats an empty iconUrlDark string as not supplied', () => {
    const result = deriveElementDisplay(makeElement(), makeInstanceElement(), 'en', {
      iconUrl: '/icons/cloud.svg',
      iconUrlDark: '',
    })
    expect(result.icon.urlDark).toBeUndefined()
  })

  describe('contextValue', () => {
    function makeCategoryWithContext(): Category {
      return {
        id: 'ai__storage',
        name: [loc('en', 'Storage')],
        description: [loc('en', 'Where data is held.')],
        prompt: [],
        required: false,
        order: 1,
        datachain_type: 'ai',
        shape: 'rounded-square',
        element_variables: [],
        context: {
          id: 'pii',
          name: [loc('en', 'PII')],
          description: [loc('en', 'Personal-info classification.')],
          values: [
            {
              id: 'identifiable',
              name: [loc('en', 'Identifiable'), loc('es', 'Identificable')],
              description: [loc('en', 'Identifies a person.')],
              color: '#FFD700',
            },
            {
              id: 'tag_only',
              name: [loc('en', 'Tag-style')],
              description: [loc('en', 'No icon color.')],
              color: null,
            },
          ],
        },
      }
    }

    it('populates contextValue with hex color when instance picks a colored value', () => {
      const result = deriveElementDisplay(
        makeElement(),
        makeInstanceElement({ context_type_id: 'identifiable' }),
        'en',
        { category: makeCategoryWithContext() },
      )
      expect(result.contextValue).toEqual({
        id: 'identifiable',
        name: 'Identifiable',
        color: '#FFD700',
      })
    })

    it('populates contextValue with null color for tag-style values', () => {
      const result = deriveElementDisplay(
        makeElement(),
        makeInstanceElement({ context_type_id: 'tag_only' }),
        'en',
        { category: makeCategoryWithContext() },
      )
      expect(result.contextValue).toEqual({
        id: 'tag_only',
        name: 'Tag-style',
        color: null,
      })
    })

    it('resolves the context value name in the requested locale', () => {
      const result = deriveElementDisplay(
        makeElement(),
        makeInstanceElement({ context_type_id: 'identifiable' }),
        'es',
        { category: makeCategoryWithContext() },
      )
      expect(result.contextValue?.name).toBe('Identificable')
    })

    it('leaves contextValue undefined when no instance is provided', () => {
      const result = deriveElementDisplay(makeElement(), undefined, 'en', {
        category: makeCategoryWithContext(),
      })
      expect(result.contextValue).toBeUndefined()
    })

    it('leaves contextValue undefined when instance has no context_type_id', () => {
      const result = deriveElementDisplay(
        makeElement(),
        makeInstanceElement(),
        'en',
        { category: makeCategoryWithContext() },
      )
      expect(result.contextValue).toBeUndefined()
    })

    it('leaves contextValue undefined when context_type_id does not match any value', () => {
      const result = deriveElementDisplay(
        makeElement(),
        makeInstanceElement({ context_type_id: 'unknown_id' }),
        'en',
        { category: makeCategoryWithContext() },
      )
      expect(result.contextValue).toBeUndefined()
    })

    it('element-level context overrides category-level context (no merge)', () => {
      const elementWithContext = makeElement({
        context: {
          id: 'role',
          name: [loc('en', 'Role')],
          description: [loc('en', 'Role.')],
          values: [
            {
              id: 'vendor',
              name: [loc('en', 'Vendor')],
              description: [loc('en', 'Vendor.')],
              color: null,
            },
          ],
        },
      })
      const result = deriveElementDisplay(
        elementWithContext,
        makeInstanceElement({ context_type_id: 'vendor' }),
        'en',
        { category: makeCategoryWithContext() },
      )
      expect(result.contextValue).toEqual({
        id: 'vendor',
        name: 'Vendor',
        color: null,
      })
    })

    it('returns undefined when category is not provided and the element has no context', () => {
      const result = deriveElementDisplay(
        makeElement(),
        makeInstanceElement({ context_type_id: 'identifiable' }),
        'en',
      )
      expect(result.contextValue).toBeUndefined()
    })
  })
})
