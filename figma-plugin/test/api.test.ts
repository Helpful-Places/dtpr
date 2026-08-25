import { describe, expect, it } from 'vitest'
import { DEFAULT_API_BASE, elementsUrl, iconUrl, localized } from '../src/api.ts'

describe('iconUrl', () => {
  it('spells the default variant as icon.svg', () => {
    expect(iconUrl(DEFAULT_API_BASE, 'ai@2026-08-24-beta', 'accessibility', 'default')).toBe(
      'https://api.dtpr.io/api/v2/schemas/ai%402026-08-24-beta/elements/accessibility/icon.svg',
    )
  })

  it('appends any other token', () => {
    expect(iconUrl(DEFAULT_API_BASE, 'v1', 'institution', 'vendor.dark')).toBe(
      'https://api.dtpr.io/api/v2/schemas/v1/elements/institution/icon.vendor.dark.svg',
    )
  })
})

describe('elementsUrl', () => {
  it('requests one full page with only the fields the plugin reads', () => {
    const url = elementsUrl(DEFAULT_API_BASE, 'v1', 'en')
    expect(url).toContain('limit=200')
    expect(url).toContain('icon_variants')
    expect(url).not.toContain('cursor=')
  })

  it('threads the cursor through for later pages', () => {
    expect(elementsUrl(DEFAULT_API_BASE, 'v1', 'en', 'abc==')).toContain('cursor=abc%3D%3D')
  })
})

describe('localized', () => {
  const values = [
    { locale: 'en', value: 'Accessibility' },
    { locale: 'es', value: 'Accesibilidad' },
  ]

  it('prefers the requested locale', () => {
    expect(localized(values, 'es')).toBe('Accesibilidad')
  })

  it('falls back to English, then to whatever exists', () => {
    expect(localized(values, 'km')).toBe('Accessibility')
    expect(localized([{ locale: 'fr', value: 'Accessibilité' }], 'km')).toBe('Accessibilité')
  })

  it('is empty for a missing list', () => {
    expect(localized(undefined, 'en')).toBe('')
    expect(localized([], 'en')).toBe('')
  })
})
