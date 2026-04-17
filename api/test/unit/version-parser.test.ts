import { describe, it, expect } from 'vitest'
import { InvalidVersionError, parseVersion } from '../../cli/lib/version-parser.ts'

describe('parseVersion', () => {
  it('parses the canonical stable form', () => {
    const v = parseVersion('ai@2026-04-16')
    expect(v).toEqual({
      type: 'ai',
      date: '2026-04-16',
      beta: false,
      canonical: 'ai@2026-04-16',
      dir: 'ai/2026-04-16',
    })
  })

  it('parses the beta form', () => {
    const v = parseVersion('ai@2026-04-16-beta')
    expect(v.beta).toBe(true)
    expect(v.canonical).toBe('ai@2026-04-16-beta')
    expect(v.dir).toBe('ai/2026-04-16-beta')
  })

  it('accepts slash-separator path form', () => {
    const v = parseVersion('ai/2026-04-16-beta')
    expect(v).toEqual({
      type: 'ai',
      date: '2026-04-16',
      beta: true,
      canonical: 'ai@2026-04-16-beta',
      dir: 'ai/2026-04-16-beta',
    })
  })

  it('rejects empty separator suffix', () => {
    expect(() => parseVersion('ai@')).toThrow(InvalidVersionError)
  })

  it('rejects missing date component', () => {
    expect(() => parseVersion('ai@2026-04')).toThrow(InvalidVersionError)
  })

  it('rejects unknown suffix', () => {
    expect(() => parseVersion('ai@2026-04-16-alpha')).toThrow(
      /unknown suffix/i,
    )
  })

  it('rejects invalid calendar date', () => {
    expect(() => parseVersion('ai@2026-02-30')).toThrow(/not a valid calendar date/i)
  })

  it('rejects missing separator', () => {
    expect(() => parseVersion('ai2026-04-16')).toThrow(InvalidVersionError)
  })

  it('rejects invalid type characters', () => {
    expect(() => parseVersion('a i@2026-04-16')).toThrow(/invalid characters/i)
  })
})
