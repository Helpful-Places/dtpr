import { describe, it, expect } from 'vitest'
import { canonicalStringify, contentHash } from '../../cli/lib/content-hash.ts'

describe('canonicalStringify', () => {
  it('sorts object keys alphabetically', () => {
    expect(canonicalStringify({ b: 1, a: 2 })).toBe('{"a":2,"b":1}')
  })

  it('preserves array order', () => {
    expect(canonicalStringify([3, 1, 2])).toBe('[3,1,2]')
  })

  it('omits undefined properties', () => {
    expect(canonicalStringify({ a: 1, b: undefined })).toBe('{"a":1}')
  })

  it('recurses into nested objects', () => {
    const out = canonicalStringify({ outer: { z: 1, a: 2 } })
    expect(out).toBe('{"outer":{"a":2,"z":1}}')
  })

  it('throws on circular references', () => {
    const a: any = {}
    a.self = a
    expect(() => canonicalStringify(a)).toThrow(/circular/i)
  })
})

describe('contentHash', () => {
  it('returns sha256-<hex> shape', () => {
    const h = contentHash({ hello: 'world' })
    expect(h).toMatch(/^sha256-[0-9a-f]{64}$/)
  })

  it('is deterministic for equal canonical content', () => {
    const a = contentHash({ a: 1, b: 2 })
    const b = contentHash({ b: 2, a: 1 })
    expect(a).toBe(b)
  })

  it('changes when a value changes', () => {
    const a = contentHash({ a: 1 })
    const b = contentHash({ a: 2 })
    expect(a).not.toBe(b)
  })
})
