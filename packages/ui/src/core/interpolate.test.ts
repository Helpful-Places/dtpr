import { describe, it, expect } from 'vitest'
import { interpolate, interpolateSegments } from './interpolate.js'

describe('interpolate', () => {
  it('replaces a single variable', () => {
    expect(interpolate('Hello {{name}}', { name: 'world' })).toBe('Hello world')
  })

  it('replaces multiple variables', () => {
    expect(interpolate('{{a}} and {{b}}', { a: 'x', b: 'y' })).toBe('x and y')
  })

  it('passes unresolved placeholders through literally', () => {
    expect(interpolate('Hello {{name}}', {})).toBe('Hello {{name}}')
  })

  it('tolerates whitespace inside placeholders', () => {
    expect(interpolate('{{ name }}', { name: 'x' })).toBe('x')
  })

  it('handles repeated placeholders', () => {
    expect(interpolate('{{x}}-{{x}}', { x: 'a' })).toBe('a-a')
  })

  it('returns the original string when vars is empty and template has no placeholders', () => {
    expect(interpolate('plain text', {})).toBe('plain text')
  })

  it('replaces empty-string values (distinct from missing)', () => {
    expect(interpolate('[{{name}}]', { name: '' })).toBe('[]')
  })
})

describe('interpolateSegments', () => {
  it('splits template into text + variable segments', () => {
    expect(interpolateSegments('Hello {{name}}', { name: 'world' })).toEqual([
      { kind: 'text', value: 'Hello ' },
      { kind: 'variable', variable_id: 'name', value: 'world' },
    ])
  })

  it('emits missing-variable segment with the raw placeholder as value', () => {
    expect(interpolateSegments('Hello {{name}}', {})).toEqual([
      { kind: 'text', value: 'Hello ' },
      { kind: 'missing', variable_id: 'name', value: '{{name}}' },
    ])
  })

  it('returns a single text segment when template has no placeholders', () => {
    expect(interpolateSegments('plain text', {})).toEqual([
      { kind: 'text', value: 'plain text' },
    ])
  })

  it('returns an empty array for an empty template', () => {
    expect(interpolateSegments('', {})).toEqual([])
  })

  it('tolerates whitespace inside placeholders', () => {
    expect(interpolateSegments('{{ name }}', { name: 'x' })).toEqual([
      { kind: 'variable', variable_id: 'name', value: 'x' },
    ])
  })

  it('interleaves multiple variables with surrounding text', () => {
    expect(
      interpolateSegments('pre {{a}} mid {{b}} post', { a: '1', b: '2' }),
    ).toEqual([
      { kind: 'text', value: 'pre ' },
      { kind: 'variable', variable_id: 'a', value: '1' },
      { kind: 'text', value: ' mid ' },
      { kind: 'variable', variable_id: 'b', value: '2' },
      { kind: 'text', value: ' post' },
    ])
  })

  it('emits an empty-string variable segment when the value is empty', () => {
    expect(interpolateSegments('[{{x}}]', { x: '' })).toEqual([
      { kind: 'text', value: '[' },
      { kind: 'variable', variable_id: 'x', value: '' },
      { kind: 'text', value: ']' },
    ])
  })
})
