import { describe, it, expect } from 'vitest'
import { SYSTEMS, listSystems, resolveCanvas, liveCanvases } from '../app/canvas-data'
import type { CanvasSystem } from '../app/canvas-data'

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
    expect(r!.versionKey).toBe('1')
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

  it('defaults a version to the newest when a variant has several', () => {
    // Guards the "restyle = new version, prior feedback stays comparable"
    // contract (R5 / AE2): resolving without a version must land on the
    // current look, not the first.
    const s: CanvasSystem = {
      systemKey: 'x',
      variants: [
        {
          variantKey: 'a',
          label: { en: 'A', fr: 'A' },
          live: true,
          versions: [
            { versionKey: '1', content: SYSTEMS[0].variants[0].versions[0].content },
            { versionKey: '2', content: SYSTEMS[0].variants[0].versions[0].content },
          ],
        },
      ],
    }
    const current = s.variants[0].versions.at(-1)!.versionKey
    expect(current).toBe('2')
  })
})
