import { describe, it, expect } from 'vitest'
import {
  emitAllContentSchemas,
  emitJsonSchema,
  JSON_SCHEMA_OPTIONS,
} from '../../src/schema/emit-json-schema.ts'
import { ElementSchema } from '../../src/schema/element.ts'

describe('emitJsonSchema', () => {
  it('uses draft-2020-12 and input io mode', () => {
    expect(JSON_SCHEMA_OPTIONS.target).toBe('draft-2020-12')
    expect(JSON_SCHEMA_OPTIONS.io).toBe('input')
  })

  it('emits a draft-2020-12 JSON Schema for ElementSchema', () => {
    const emitted = emitJsonSchema(ElementSchema, 'Element') as Record<string, unknown>
    expect(emitted.$schema).toContain('2020-12')
    expect(emitted.type).toBe('object')
    expect(emitted.title).toBe('Element')
  })

  it('preserves .describe() texts in emitted description fields', () => {
    const emitted = emitJsonSchema(ElementSchema) as any
    // Top-level description from .describe() on ElementSchema itself.
    expect(emitted.description).toContain('DTPR element tile')
    // Nested field descriptions propagate.
    expect(emitted.properties?.category_ids?.description).toMatch(/Category ids/i)
  })

  it('emitAllContentSchemas returns every top-level schema', () => {
    const all = emitAllContentSchemas()
    expect(Object.keys(all).sort()).toEqual([
      'Category',
      'DatachainInstance',
      'DatachainType',
      'Element',
      'Manifest',
    ])
    for (const [name, schema] of Object.entries(all)) {
      expect(schema.title).toBe(name)
      expect(schema.type).toBe('object')
    }
  })

  it('emission is stable across repeat calls (byte-for-byte)', () => {
    const a = JSON.stringify(emitJsonSchema(ElementSchema))
    const b = JSON.stringify(emitJsonSchema(ElementSchema))
    expect(a).toBe(b)
  })
})
