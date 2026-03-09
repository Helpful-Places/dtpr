import { describe, it, expect } from 'vitest'
import {
  validateDatachainType,
  parseLocalesQuery,
  calculateLatestVersion,
  filterLocaleValues,
  processVariableWithLocale,
  processContextWithLocale,
  finalizeContext,
  filterContextByLocale,
  filterVariablesByLocale,
} from '../../server/api/dtpr/v1/utils'
import type { LocaleValue, Variable, Context, ContextValue } from '../../server/api/dtpr/v1/types'

describe('validateDatachainType', () => {
  it('accepts "ai"', () => {
    expect(validateDatachainType('ai')).toBe('ai')
  })

  it('accepts "device"', () => {
    expect(validateDatachainType('device')).toBe('device')
  })

  it('throws 400 for invalid type', () => {
    expect(() => validateDatachainType('invalid')).toThrow()
  })

  it('throws 400 for null', () => {
    expect(() => validateDatachainType(null)).toThrow()
  })

  it('throws 400 for undefined', () => {
    expect(() => validateDatachainType(undefined)).toThrow()
  })

  it('throws 400 for empty string', () => {
    expect(() => validateDatachainType('')).toThrow()
  })
})

describe('parseLocalesQuery', () => {
  it('returns null when no locales in query', () => {
    expect(parseLocalesQuery({})).toBeNull()
  })

  it('returns null when locales is empty string', () => {
    expect(parseLocalesQuery({ locales: '' })).toBeNull()
  })

  it('parses a single locale', () => {
    expect(parseLocalesQuery({ locales: 'en' })).toEqual(['en'])
  })

  it('parses comma-separated locales', () => {
    expect(parseLocalesQuery({ locales: 'en,fr,es' })).toEqual(['en', 'fr', 'es'])
  })

  it('passes through array input', () => {
    expect(parseLocalesQuery({ locales: ['en', 'fr'] })).toEqual(['en', 'fr'])
  })
})

describe('calculateLatestVersion', () => {
  it('returns current ISO string for empty array', () => {
    const result = calculateLatestVersion([])
    expect(new Date(result).getTime()).not.toBeNaN()
  })

  it('returns the single timestamp for one-element array', () => {
    expect(calculateLatestVersion(['2024-01-01T00:00:00Z'])).toBe('2024-01-01T00:00:00Z')
  })

  it('returns the latest from multiple timestamps', () => {
    const timestamps = [
      '2024-01-01T00:00:00Z',
      '2024-06-15T00:00:00Z',
      '2024-03-01T00:00:00Z',
    ]
    expect(calculateLatestVersion(timestamps)).toBe('2024-06-15T00:00:00Z')
  })
})

describe('filterLocaleValues', () => {
  const values: LocaleValue[] = [
    { locale: 'en', value: 'Hello' },
    { locale: 'fr', value: 'Bonjour' },
    { locale: 'es', value: 'Hola' },
  ]

  it('returns all values when requestedLocales is empty', () => {
    expect(filterLocaleValues(values, [])).toEqual(values)
  })

  it('filters to matching locales', () => {
    expect(filterLocaleValues(values, ['en'])).toEqual([{ locale: 'en', value: 'Hello' }])
  })

  it('filters to multiple matching locales', () => {
    expect(filterLocaleValues(values, ['en', 'fr'])).toEqual([
      { locale: 'en', value: 'Hello' },
      { locale: 'fr', value: 'Bonjour' },
    ])
  })

  it('returns empty array when no locales match', () => {
    expect(filterLocaleValues(values, ['km'])).toEqual([])
  })
})

describe('processVariableWithLocale', () => {
  it('creates a new variable entry', () => {
    const map = new Map<string, Variable>()
    processVariableWithLocale({ id: 'var1', label: 'Label EN' }, 'en', map)

    expect(map.get('var1')).toEqual({
      id: 'var1',
      label: [{ locale: 'en', value: 'Label EN' }],
      required: false,
    })
  })

  it('adds locale to existing variable', () => {
    const map = new Map<string, Variable>()
    processVariableWithLocale({ id: 'var1', label: 'Label EN' }, 'en', map)
    processVariableWithLocale({ id: 'var1', label: 'Label FR' }, 'fr', map)

    expect(map.get('var1')!.label).toHaveLength(2)
    expect(map.get('var1')!.label[1]).toEqual({ locale: 'fr', value: 'Label FR' })
  })

  it('deduplicates locale entries', () => {
    const map = new Map<string, Variable>()
    processVariableWithLocale({ id: 'var1', label: 'Label EN' }, 'en', map)
    processVariableWithLocale({ id: 'var1', label: 'Label EN again' }, 'en', map)

    expect(map.get('var1')!.label).toHaveLength(1)
  })

  it('sets required flag when true', () => {
    const map = new Map<string, Variable>()
    processVariableWithLocale({ id: 'var1', label: 'L', required: true }, 'en', map)

    expect(map.get('var1')!.required).toBe(true)
  })

  it('upgrades required to true from false', () => {
    const map = new Map<string, Variable>()
    processVariableWithLocale({ id: 'var1', label: 'L', required: false }, 'en', map)
    processVariableWithLocale({ id: 'var1', label: 'L2', required: true }, 'fr', map)

    expect(map.get('var1')!.required).toBe(true)
  })
})

describe('processContextWithLocale', () => {
  const contextInput = {
    id: 'ctx1',
    name: 'Context Name',
    description: 'Context Description',
    values: [
      { id: 'val1', name: 'Value 1', description: 'Desc 1', color: '#FF0000' },
    ],
  }

  it('creates a new accumulator when null', () => {
    const result = processContextWithLocale(contextInput, 'en', null)

    expect(result.id).toBe('ctx1')
    expect(result.name).toEqual([{ locale: 'en', value: 'Context Name' }])
    expect(result.description).toEqual([{ locale: 'en', value: 'Context Description' }])
    expect(result.values.get('val1')).toBeDefined()
    expect(result.values.get('val1')!.name).toEqual([{ locale: 'en', value: 'Value 1' }])
  })

  it('adds locale to existing accumulator', () => {
    let acc = processContextWithLocale(contextInput, 'en', null)
    acc = processContextWithLocale(
      { ...contextInput, name: 'Nom', description: 'Desc FR', values: [{ id: 'val1', name: 'Valeur 1', description: 'Desc FR', color: '#FF0000' }] },
      'fr',
      acc,
    )

    expect(acc.name).toHaveLength(2)
    expect(acc.description).toHaveLength(2)
    expect(acc.values.get('val1')!.name).toHaveLength(2)
  })

  it('deduplicates locale entries', () => {
    let acc = processContextWithLocale(contextInput, 'en', null)
    acc = processContextWithLocale(contextInput, 'en', acc)

    expect(acc.name).toHaveLength(1)
    expect(acc.description).toHaveLength(1)
  })
})

describe('finalizeContext', () => {
  it('converts accumulator Map to array', () => {
    const acc = processContextWithLocale(
      {
        id: 'ctx1',
        name: 'Name',
        description: 'Desc',
        values: [
          { id: 'val1', name: 'V1', description: 'D1', color: '#000' },
          { id: 'val2', name: 'V2', description: 'D2', color: '#FFF' },
        ],
      },
      'en',
      null,
    )

    const result = finalizeContext(acc)

    expect(result.id).toBe('ctx1')
    expect(Array.isArray(result.values)).toBe(true)
    expect(result.values).toHaveLength(2)
    expect(result.values[0].id).toBe('val1')
    expect(result.values[1].id).toBe('val2')
  })
})

describe('filterContextByLocale', () => {
  const context: Context = {
    id: 'ctx1',
    name: [
      { locale: 'en', value: 'Name EN' },
      { locale: 'fr', value: 'Name FR' },
    ],
    description: [
      { locale: 'en', value: 'Desc EN' },
      { locale: 'fr', value: 'Desc FR' },
    ],
    values: [
      {
        id: 'val1',
        name: [
          { locale: 'en', value: 'Val EN' },
          { locale: 'fr', value: 'Val FR' },
        ],
        description: [
          { locale: 'en', value: 'VDesc EN' },
          { locale: 'fr', value: 'VDesc FR' },
        ],
        color: '#000',
      },
    ],
  }

  it('filters all nested locale arrays', () => {
    const result = filterContextByLocale(context, ['en'])

    expect(result.name).toEqual([{ locale: 'en', value: 'Name EN' }])
    expect(result.description).toEqual([{ locale: 'en', value: 'Desc EN' }])
    expect(result.values[0].name).toEqual([{ locale: 'en', value: 'Val EN' }])
    expect(result.values[0].description).toEqual([{ locale: 'en', value: 'VDesc EN' }])
  })

  it('preserves id and color on values', () => {
    const result = filterContextByLocale(context, ['en'])
    expect(result.id).toBe('ctx1')
    expect(result.values[0].id).toBe('val1')
    expect(result.values[0].color).toBe('#000')
  })
})

describe('filterVariablesByLocale', () => {
  const variables: Variable[] = [
    {
      id: 'var1',
      label: [
        { locale: 'en', value: 'Label EN' },
        { locale: 'fr', value: 'Label FR' },
      ],
      required: true,
    },
  ]

  it('returns all when requestedLocales is empty', () => {
    expect(filterVariablesByLocale(variables, [])).toEqual(variables)
  })

  it('filters labels by locale', () => {
    const result = filterVariablesByLocale(variables, ['en'])
    expect(result[0].label).toEqual([{ locale: 'en', value: 'Label EN' }])
  })

  it('preserves id and required', () => {
    const result = filterVariablesByLocale(variables, ['en'])
    expect(result[0].id).toBe('var1')
    expect(result[0].required).toBe(true)
  })
})
