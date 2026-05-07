import { describe, expect, it } from 'vitest'
import { canonicalStringify } from '../../src/resolver/canonical-stringify.ts'

describe('canonicalStringify', () => {
  it('serializes primitives like JSON.stringify', () => {
    expect(canonicalStringify('hello')).toBe('"hello"')
    expect(canonicalStringify(42)).toBe('42')
    expect(canonicalStringify(true)).toBe('true')
    expect(canonicalStringify(false)).toBe('false')
    expect(canonicalStringify(null)).toBe('null')
  })

  it('sorts object keys alphabetically at every depth', () => {
    const v = { b: 2, a: 1, c: { z: 1, y: 2, x: 3 } }
    expect(canonicalStringify(v)).toBe('{"a":1,"b":2,"c":{"x":3,"y":2,"z":1}}')
  })

  it('preserves array order', () => {
    const v = [3, 1, 2]
    expect(canonicalStringify(v)).toBe('[3,1,2]')
  })

  it('drops undefined object properties (matching JSON.stringify)', () => {
    const v = { a: 1, b: undefined, c: 2 }
    expect(canonicalStringify(v)).toBe('{"a":1,"c":2}')
  })

  it('produces byte-identical output across runs over the same input', () => {
    const v = {
      elements: [
        { id: 'a', title: [{ locale: 'en', value: 'A' }] },
        { id: 'b', title: [{ locale: 'en', value: 'B' }] },
      ],
      categories: [{ id: 'c1', required: true }],
      meta: { foo: 'bar', baz: 99 },
    }
    const a = canonicalStringify(v)
    const b = canonicalStringify(v)
    expect(a).toBe(b)
    // 100 runs identical
    for (let i = 0; i < 100; i++) {
      expect(canonicalStringify(v)).toBe(a)
    }
  })

  it('two objects with different key insertion order canonicalize to the same bytes', () => {
    const a = { foo: { x: 1, y: 2 }, bar: [1, 2, 3] }
    const b = { bar: [1, 2, 3], foo: { y: 2, x: 1 } }
    expect(canonicalStringify(a)).toBe(canonicalStringify(b))
  })

  it('handles nested arrays and objects', () => {
    const v = {
      arr: [{ b: 1, a: 2 }, { d: 3, c: 4 }],
    }
    expect(canonicalStringify(v)).toBe('{"arr":[{"a":2,"b":1},{"c":4,"d":3}]}')
  })

  it('escapes string values using JSON.stringify rules', () => {
    expect(canonicalStringify({ s: 'hello "world"\n' })).toBe(
      '{"s":"hello \\"world\\"\\n"}',
    )
  })

  it('handles empty object and empty array', () => {
    expect(canonicalStringify({})).toBe('{}')
    expect(canonicalStringify([])).toBe('[]')
  })
})
