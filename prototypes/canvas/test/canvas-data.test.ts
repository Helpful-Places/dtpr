import { describe, it, expect } from 'vitest'
import { SYSTEMS, listSystems, resolveCanvas, liveCanvases, currentVersion, defaultVariant } from '../app/canvas-data'
import type { CanvasSystem, CanvasVariant } from '../app/canvas-data'

describe('canvas data registry (U2)', () => {
  it('exposes all four systems, each with at least one live variant', () => {
    expect(listSystems()).toHaveLength(4)
    for (const s of SYSTEMS) {
      expect(s.variants.some(v => v.live)).toBe(true)
    }
  })

  it('gives every canvas a unique (system, variant, version) key', () => {
    const keys = new Set<string>()
    for (const s of SYSTEMS) {
      for (const v of s.variants) {
        for (const ver of v.versions) {
          const key = `${s.systemKey}::${v.variantKey}::${ver.versionKey}`
          expect(keys.has(key), `duplicate key ${key}`).toBe(false)
          keys.add(key)
        }
      }
    }
  })

  it('has non-empty stable keys at every level', () => {
    for (const s of SYSTEMS) {
      expect(s.systemKey.trim()).not.toBe('')
      for (const v of s.variants) {
        expect(v.variantKey.trim()).not.toBe('')
        for (const ver of v.versions) {
          expect(ver.versionKey.trim()).not.toBe('')
        }
      }
    }
  })

  it('provides en and fr for localized slots on every seed system', () => {
    const bilingual = (v: { en: string; fr: string }) => {
      expect(v.en.trim()).not.toBe('')
      expect(v.fr.trim()).not.toBe('')
    }
    for (const s of SYSTEMS) {
      const c = resolveCanvas(s.systemKey)!.content
      bilingual(c.name)
      bilingual(c.read)
      bilingual(c.purpose.t)
      bilingual(c.runby.role)
      bilingual(c.builtby.role)
      bilingual(c.input.type)
      bilingual(c.input.instance)
      bilingual(c.output.type)
      bilingual(c.usedon.who)
      for (const r of c.risks) {
        bilingual(r.title)
        bilingual(r.narrative)
      }
    }
  })

  it('resolves a system by key, defaulting to the live variant + current version', () => {
    const r = resolveCanvas('face-gates')
    expect(r).not.toBeNull()
    expect(r!.systemKey).toBe('face-gates')
    expect(r!.variantKey).toBe('v6')
    // Version 2 (ai@2026-08-24-beta) is the current version of every seed.
    expect(r!.versionKey).toBe('2')
    expect(r!.live).toBe(true)
  })

  it('returns null for unknown system / variant / version keys', () => {
    expect(resolveCanvas('nope')).toBeNull()
    expect(resolveCanvas('face-gates', 'nope')).toBeNull()
    expect(resolveCanvas('face-gates', 'v6', 'nope')).toBeNull()
  })

  it('surfaces one live canvas per live variant via liveCanvases()', () => {
    const live = liveCanvases()
    expect(live).toHaveLength(4)
    expect(live.every(c => c.live)).toBe(true)
  })

  it('currentVersion() returns the newest of several — the resolve-layer AE2 path', () => {
    // Guards the "restyle = new version, prior feedback stays comparable"
    // contract (R5 / AE2): resolving without a version must land on the
    // current look, not the first. Exercises the real currentVersion()
    // that resolveCanvas() falls through to.
    const content = SYSTEMS[0].variants[0].versions[0].content
    const variant: CanvasVariant = {
      variantKey: 'a',
      label: { en: 'A', fr: 'A' },
      live: true,
      versions: [
        { versionKey: '1', content },
        { versionKey: '2', content },
      ],
    }
    expect(currentVersion(variant).versionKey).toBe('2')
  })

  it('defaultVariant() prefers a live variant over a paused one (R16)', () => {
    const content = SYSTEMS[0].variants[0].versions[0].content
    const withPaused: CanvasSystem = {
      systemKey: 'x',
      variants: [
        { variantKey: 'old', label: { en: 'Old', fr: 'Old' }, live: false, versions: [{ versionKey: '1', content }] },
        { variantKey: 'new', label: { en: 'New', fr: 'New' }, live: true, versions: [{ versionKey: '1', content }] },
      ],
    }
    expect(defaultVariant(withPaused)?.variantKey).toBe('new')

    // Falls back to the first variant when none are live.
    const allPaused: CanvasSystem = {
      systemKey: 'y',
      variants: [{ variantKey: 'only', label: { en: 'Only', fr: 'Only' }, live: false, versions: [{ versionKey: '1', content }] }],
    }
    expect(defaultVariant(allPaused)?.variantKey).toBe('only')
  })
})
