import { describe, expect, it } from 'vitest'
import {
  contrastRatio,
  innerColorForShape,
  parseHex,
  relativeLuminance,
} from '../../../src/icons/color.ts'

describe('parseHex', () => {
  it('parses a 6-char hex string', () => {
    expect(parseHex('#FFDD00')).toEqual({ r: 255, g: 221, b: 0 })
  })

  it('is case-insensitive', () => {
    expect(parseHex('#ffdd00')).toEqual({ r: 255, g: 221, b: 0 })
    expect(parseHex('#FfDd00')).toEqual({ r: 255, g: 221, b: 0 })
  })

  it('returns null for 3-char shorthand', () => {
    expect(parseHex('#fff')).toBeNull()
  })

  it('returns null for non-hex strings', () => {
    expect(parseHex('not a color')).toBeNull()
    expect(parseHex('FFDD00')).toBeNull() // missing #
    expect(parseHex('#GGGGGG')).toBeNull() // non-hex digits
    expect(parseHex('')).toBeNull()
  })

  it('returns null for non-string input', () => {
    expect(parseHex(null as unknown as string)).toBeNull()
    expect(parseHex(undefined as unknown as string)).toBeNull()
    expect(parseHex(123 as unknown as string)).toBeNull()
  })
})

describe('relativeLuminance', () => {
  it('returns 1.0 for pure white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1.0, 10)
  })

  it('returns 0.0 for pure black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0.0, 10)
  })

  it('matches published WCAG samples within tolerance', () => {
    // Reference values computed from the WCAG 2 formula:
    //   #FFDD00 (yellow) → ≈ 0.7297
    //   #003366 (dark navy) → ≈ 0.0333
    //   #808080 (mid-gray) → ≈ 0.2159
    expect(relativeLuminance({ r: 255, g: 221, b: 0 })).toBeCloseTo(0.7297, 3)
    expect(relativeLuminance({ r: 0, g: 0x33, b: 0x66 })).toBeCloseTo(0.0333, 3)
    expect(relativeLuminance({ r: 128, g: 128, b: 128 })).toBeCloseTo(0.2159, 3)
  })
})

describe('contrastRatio', () => {
  it('is ~21 for white vs black (WCAG max)', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5)
  })

  it('is symmetric (order does not matter)', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(
      contrastRatio('#000000', '#FFFFFF'),
      10,
    )
  })

  it('is 1.0 for equal colors', () => {
    expect(contrastRatio('#808080', '#808080')).toBeCloseTo(1, 10)
  })

  it('returns NaN if either input is not parseable', () => {
    expect(contrastRatio('not a color', '#000000')).toBeNaN()
    expect(contrastRatio('#FFFFFF', 'bogus')).toBeNaN()
    expect(contrastRatio('#fff', '#000')).toBeNaN() // 3-char not accepted
  })
})

describe('innerColorForShape', () => {
  it('returns #000 for bright yellow', () => {
    expect(innerColorForShape('#FFDD00')).toBe('#000')
  })

  it('returns #FFF for dark navy', () => {
    expect(innerColorForShape('#003366')).toBe('#FFF')
  })

  it('returns #000 for pure white', () => {
    expect(innerColorForShape('#FFFFFF')).toBe('#000')
  })

  it('returns #FFF for pure black', () => {
    expect(innerColorForShape('#000000')).toBe('#FFF')
  })

  it('maps consistently on either side of the 0.179 threshold', () => {
    // Grays straddling the 0.179 luminance boundary:
    //   #767676 → luminance ≈ 0.1812 (above threshold → black inner)
    //   #757575 → luminance ≈ 0.1779 (below threshold → white inner)
    expect(relativeLuminance({ r: 0x76, g: 0x76, b: 0x76 })).toBeGreaterThanOrEqual(
      0.179,
    )
    expect(innerColorForShape('#767676')).toBe('#000')

    expect(relativeLuminance({ r: 0x75, g: 0x75, b: 0x75 })).toBeLessThan(0.179)
    expect(innerColorForShape('#757575')).toBe('#FFF')
  })

  it('throws if input is not a valid 6-char hex', () => {
    expect(() => innerColorForShape('#fff')).toThrow(/6-char hex/)
    expect(() => innerColorForShape('bogus')).toThrow(/6-char hex/)
  })
})
