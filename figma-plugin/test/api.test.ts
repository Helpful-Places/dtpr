import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_API_BASE,
  ICON_LIMIT_PER_MINUTE,
  READ_LIMIT_PER_MINUTE,
  elementsUrl,
  iconUrl,
  localized,
} from '../src/api.ts'

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

/**
 * The plugin hardcodes the API's rate-limit ceilings so it can pace
 * itself and size its own estimate. Nothing at runtime tells it when
 * those move, so read the ceilings straight out of the Worker config
 * and fail here instead of discovering the drift as a 429 mid-build.
 */
describe('rate-limit constants track api/wrangler.jsonc', () => {
  const wrangler = readFileSync(
    new URL('../../api/wrangler.jsonc', import.meta.url),
    'utf8',
  )

  /** First `simple.limit` following the named binding, top-level env. */
  const limitFor = (binding: string): number => {
    const match = wrangler.match(
      new RegExp(`"name":\\s*"${binding}"[\\s\\S]*?"limit":\\s*(\\d+)`),
    )
    if (!match) throw new Error(`No ${binding} binding in api/wrangler.jsonc`)
    return Number(match[1])
  }

  it('matches RL_READ', () => {
    expect(READ_LIMIT_PER_MINUTE).toBe(limitFor('RL_READ'))
  })

  it('matches RL_ICONS', () => {
    expect(ICON_LIMIT_PER_MINUTE).toBe(limitFor('RL_ICONS'))
  })

  it('leaves the icon ceiling above a full 468-icon build', () => {
    expect(ICON_LIMIT_PER_MINUTE).toBeGreaterThan(468)
  })
})
