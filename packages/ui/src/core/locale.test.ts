import { describe, it, expect } from 'vitest'
import type { LocaleValue } from '@dtpr/api/schema'
import { extract, extractWithLocale } from './locale.js'

const v = (locale: string, value: string) => ({ locale, value }) as LocaleValue

describe('extract', () => {
  it('returns the requested locale when present', () => {
    const values: LocaleValue[] = [v('en', 'Hello'), v('es', 'Hola')]
    expect(extract(values, 'es')).toBe('Hola')
  })

  it('returns the English value for an English request', () => {
    const values: LocaleValue[] = [v('en', 'Hello'), v('es', 'Hola')]
    expect(extract(values, 'en')).toBe('Hello')
  })

  it('falls back to en when the requested locale is missing', () => {
    const values: LocaleValue[] = [v('en', 'Hello'), v('pt', 'Olá')]
    expect(extract(values, 'fr')).toBe('Hello')
  })

  it('falls back to the first-available entry when en is also missing', () => {
    const values: LocaleValue[] = [v('pt', 'Olá')]
    expect(extract(values, 'fr')).toBe('Olá')
  })

  it('returns empty string for empty input', () => {
    expect(extract([], 'en')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(extract(undefined, 'en')).toBe('')
  })

  it('returns the matched empty string without crashing on malformed entry', () => {
    const values: LocaleValue[] = [v('en', '')]
    expect(extract(values, 'en')).toBe('')
  })

  it('respects a custom fallbackLocale', () => {
    const values: LocaleValue[] = [v('pt', 'Olá'), v('es', 'Hola')]
    expect(extract(values, 'fr', 'es')).toBe('Hola')
  })
})

describe('extractWithLocale', () => {
  it('returns value and matched locale on exact match', () => {
    const values: LocaleValue[] = [v('en', 'Hello'), v('es', 'Hola')]
    expect(extractWithLocale(values, 'es')).toEqual({ value: 'Hola', locale: 'es' })
  })

  it('reports the fallback locale when requested is missing', () => {
    const values: LocaleValue[] = [v('en', 'Hello'), v('pt', 'Olá')]
    expect(extractWithLocale(values, 'fr')).toEqual({ value: 'Hello', locale: 'en' })
  })

  it('reports the first-available locale when en is also missing', () => {
    const values: LocaleValue[] = [v('pt', 'Olá'), v('es', 'Hola')]
    expect(extractWithLocale(values, 'fr')).toEqual({ value: 'Olá', locale: 'pt' })
  })

  it('returns empty string and null locale for empty input', () => {
    expect(extractWithLocale([], 'en')).toEqual({ value: '', locale: null })
  })

  it('returns empty string and null locale for undefined input', () => {
    expect(extractWithLocale(undefined, 'en')).toEqual({ value: '', locale: null })
  })
})
