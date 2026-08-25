import { describe, expect, it } from 'vitest'
import { parseVariantToken, planVariants } from '../src/variants.ts'

describe('parseVariantToken', () => {
  it('reads the two reserved bases', () => {
    expect(parseVariantToken('default')).toEqual({ context: 'default', theme: 'light' })
    expect(parseVariantToken('dark')).toEqual({ context: 'default', theme: 'dark' })
  })

  it('splits a context token into its axes', () => {
    expect(parseVariantToken('vendor')).toEqual({ context: 'vendor', theme: 'light' })
    expect(parseVariantToken('vendor.dark')).toEqual({ context: 'vendor', theme: 'dark' })
    expect(parseVariantToken('de_identified.dark')).toEqual({
      context: 'de_identified',
      theme: 'dark',
    })
  })

  it('rejects what the API rejects', () => {
    expect(parseVariantToken('')).toBeNull()
    expect(parseVariantToken('.dark')).toBeNull()
    expect(parseVariantToken('a.b')).toBeNull()
    expect(parseVariantToken('a.b.dark')).toBeNull()
    // `dark` already means dark; `dark.dark` is not a second darkening.
    expect(parseVariantToken('dark.dark')).toBeNull()
  })
})

describe('planVariants', () => {
  it('names only the axis that varies for a light/dark element', () => {
    expect(planVariants(['default', 'dark']).map((p) => p.name)).toEqual([
      'Theme=light',
      'Theme=dark',
    ])
  })

  it('names both axes when contexts vary', () => {
    const plan = planVariants(['default', 'dark', 'vendor', 'vendor.dark'])
    expect(plan.map((p) => p.name)).toEqual([
      'Context=default, Theme=light',
      'Context=default, Theme=dark',
      'Context=vendor, Theme=light',
      'Context=vendor, Theme=dark',
    ])
  })

  it('handles a context axis with no dark variants', () => {
    expect(planVariants(['default', 'vendor']).map((p) => p.name)).toEqual([
      'Context=default',
      'Context=vendor',
    ])
  })

  it('preserves API order so `default` becomes the default variant', () => {
    const plan = planVariants(['default', 'dark', 'identifiable', 'identifiable.dark'])
    expect(plan[0]?.token).toBe('default')
  })

  it('drops unparseable tokens instead of failing the element', () => {
    const plan = planVariants(['default', 'a.b', 'dark'])
    expect(plan.map((p) => p.token)).toEqual(['default', 'dark'])
  })

  it('returns an empty plan for no tokens', () => {
    expect(planVariants([])).toEqual([])
  })
})
