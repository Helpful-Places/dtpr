import { describe, it, expect } from 'vitest'
import type { SchemaVersionSource } from '@dtpr/api/validator'
import type { DatachainInstance, LocaleValue } from '@dtpr/api/schema'
import { validateDatachain } from './validate.js'

const loc = (locale: string, value: string) => ({ locale, value }) as LocaleValue

function baseSource(): SchemaVersionSource {
  return {
    manifest: {
      version: 'ai@2026-04-16-beta',
      status: 'beta',
      created_at: '2026-04-16T00:00:00.000Z',
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: ['en', 'es'],
    },
    datachainType: {
      id: 'ai',
      name: [loc('en', 'AI / Algorithm')],
      description: [],
      categories: ['ai__decision', 'ai__storage'],
      locales: ['en', 'es'],
    },
    categories: [
      {
        id: 'ai__decision',
        name: [loc('en', 'Decision Type')],
        description: [loc('en', 'Type of decision.')],
        prompt: [],
        required: true,
        order: 1,
        datachain_type: 'ai',
        shape: 'hexagon',
        element_variables: [],
      },
      {
        id: 'ai__storage',
        name: [loc('en', 'Storage')],
        description: [loc('en', 'Where data is held.')],
        prompt: [],
        required: false,
        order: 2,
        datachain_type: 'ai',
        shape: 'circle',
        element_variables: [
          {
            id: 'retention_period',
            label: [loc('en', 'Retention period')],
            required: true,
          },
        ],
      },
    ],
    elements: [
      {
        id: 'accept_deny',
        category_id: 'ai__decision',
        title: [loc('en', 'Accept or deny')],
        description: [loc('en', 'Binary yes/no decision.')],
        citation: [],
        symbol_id: 'accept_deny',
        variables: [],
      },
      {
        id: 'cloud_storage',
        category_id: 'ai__storage',
        title: [loc('en', 'Cloud storage')],
        description: [loc('en', 'Data held for {{retention_period}}.')],
        citation: [],
        symbol_id: 'cloud',
        variables: [],
      },
    ],
    symbols: {
      accept_deny: '<svg xmlns="http://www.w3.org/2000/svg"/>',
      cloud: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    },
  }
}

function validInstance(): DatachainInstance {
  return {
    id: 'worcester-lpr',
    schema_version: 'ai@2026-04-16-beta',
    created_at: '2026-04-16T00:00:00.000Z',
    elements: [
      { element_id: 'accept_deny', priority: 0, variables: [] },
      {
        element_id: 'cloud_storage',
        priority: 1,
        variables: [{ id: 'retention_period', value: '30 days' }],
      },
    ],
  }
}

describe('validateDatachain', () => {
  it('happy path: valid instance against clean source returns ok with no errors', () => {
    const result = validateDatachain(baseSource(), validInstance())
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('returns a semantic error when an instance places an unknown element', () => {
    const inst = validInstance()
    inst.elements[0]!.element_id = 'ghost_element'
    const result = validateDatachain(baseSource(), inst)
    expect(result.ok).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.every((e) => typeof e.code === 'string' && e.code.length > 0)).toBe(true)
  })

  it('returns a semantic error when a required variable is missing', () => {
    const inst = validInstance()
    inst.elements[1]!.variables = []
    const result = validateDatachain(baseSource(), inst)
    expect(result.ok).toBe(false)
    expect(result.errors.some((e) => /VARIABLE|MISSING|REQUIRED/i.test(e.code))).toBe(true)
  })

  it('preserves the full ValidationResult envelope (errors + warnings arrays)', () => {
    const result = validateDatachain(baseSource(), validInstance())
    expect(result).toHaveProperty('ok')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
  })
})
