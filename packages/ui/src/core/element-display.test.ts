import { describe, it, expect } from 'vitest'
import type {
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
})
