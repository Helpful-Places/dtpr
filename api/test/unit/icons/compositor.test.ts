import { describe, expect, it } from 'vitest'
import {
  composeIcon,
  InvalidSymbolSvgError,
  stripOuterSvg,
} from '../../../src/icons/compositor.ts'

// Raw SVG sources imported via Vite's `?raw` suffix. The workers
// vitest pool uses Vite under the hood, so these imports resolve at
// bundle time (not at runtime inside workerd — there's no
// filesystem). Symbols are pulled from the legacy app directory
// because the ported release symbols don't exist yet (that's Unit 2).
// See `types.d.ts` for the `?raw` module declaration.
import acceptDenySymbolRaw from '../../../../app/public/dtpr-icons/symbols/dm_accept-or-deny.svg?raw'
import rawDataSymbolRaw from '../../../../app/public/dtpr-icons/symbols/raw_data.svg?raw'
import availableForResaleSymbolRaw from '../../../../app/public/dtpr-icons/symbols/available_for_resale.svg?raw'
import rightsAccessSymbolRaw from '../../../../app/public/dtpr-icons/symbols/rights_access.svg?raw'

import acceptDenyGolden from '../../fixtures/icons/golden/accept_deny__hexagon__default.svg?raw'
import rawDataGolden from '../../fixtures/icons/golden/raw_data__circle__default.svg?raw'
import availableForResaleGolden from '../../fixtures/icons/golden/available_for_resale__rounded-square__default.svg?raw'
import rightsAccessGolden from '../../fixtures/icons/golden/rights_access__octagon__default.svg?raw'

// Small synthetic symbol for cases where we want to assert exact
// content without pulling in 6 KB of real-world path data.
const TINY_SYMBOL =
  '<svg viewBox="0 0 36 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M0 0H36V36H0Z"/></svg>'

describe('stripOuterSvg', () => {
  it('returns inner content for a standard symbol svg', () => {
    expect(stripOuterSvg(TINY_SYMBOL)).toBe('<path d="M0 0H36V36H0Z"/>')
  })

  it('tolerates leading and trailing whitespace', () => {
    const padded = `\n  ${TINY_SYMBOL}  \n`
    expect(stripOuterSvg(padded)).toBe('<path d="M0 0H36V36H0Z"/>')
  })

  it('ignores extra attributes on the wrapping svg tag', () => {
    const extra =
      '<svg viewBox="0 0 36 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="foo"><path d="M0 0Z"/></svg>'
    expect(stripOuterSvg(extra)).toBe('<path d="M0 0Z"/>')
  })

  it('throws InvalidSymbolSvgError when input does not start with <svg', () => {
    expect(() => stripOuterSvg('not an svg')).toThrow(InvalidSymbolSvgError)
    expect(() => stripOuterSvg('<div>x</div>')).toThrow(InvalidSymbolSvgError)
  })

  it('throws when the opening tag is preceded by a BOM or XML prolog', () => {
    // The build-time guard in Unit 3 rejects these at authoring time.
    // Compositor fails loudly if they slip through.
    expect(() => stripOuterSvg('\uFEFF<svg viewBox="0 0 36 36"></svg>')).toThrow(
      InvalidSymbolSvgError,
    )
    expect(() =>
      stripOuterSvg('<?xml version="1.0"?><svg viewBox="0 0 36 36"></svg>'),
    ).toThrow(InvalidSymbolSvgError)
  })

  it('throws for non-string input', () => {
    expect(() => stripOuterSvg(null as unknown as string)).toThrow(
      InvalidSymbolSvgError,
    )
    expect(() => stripOuterSvg(42 as unknown as string)).toThrow(
      InvalidSymbolSvgError,
    )
  })

  it('throws when the closing </svg> tag is missing', () => {
    expect(() => stripOuterSvg('<svg viewBox="0 0 36 36"><path/>')).toThrow(
      InvalidSymbolSvgError,
    )
  })
})

describe('composeIcon — variant matrix', () => {
  it('default variant: shape fill="none" stroke="#000", inner color "#000"', () => {
    const out = composeIcon({
      shape: 'hexagon',
      symbolSvg: TINY_SYMBOL,
      variant: 'default',
    })
    expect(out).toContain('viewBox="0 0 36 36"')
    expect(out).toContain('width="36"')
    expect(out).toContain('height="36"')
    expect(out).toContain('fill="none" stroke="#000" stroke-width="2"')
    expect(out).toContain('<g color="#000">')
    expect(out).toContain('<path d="M0 0H36V36H0Z"/>')
    // Hexagon path data should appear in the output.
    expect(out).toContain('M31.8564 8.8453')
  })

  it('dark variant: shape fill="#000" stroke="#000", inner color "#FFF"', () => {
    const out = composeIcon({
      shape: 'hexagon',
      symbolSvg: TINY_SYMBOL,
      variant: 'dark',
    })
    expect(out).toContain('fill="#000" stroke="#000" stroke-width="2"')
    expect(out).toContain('<g color="#FFF">')
  })

  it('colored variant with amber #F39C12 uses black inner (luminance > 0.179)', () => {
    const out = composeIcon({
      shape: 'circle',
      symbolSvg: TINY_SYMBOL,
      variant: { kind: 'colored', color: '#F39C12' },
    })
    expect(out).toContain('fill="#F39C12" stroke="#F39C12" stroke-width="2"')
    expect(out).toContain('<g color="#000">')
  })

  it('colored variant with navy #003366 uses white inner (luminance < 0.179)', () => {
    const out = composeIcon({
      shape: 'circle',
      symbolSvg: TINY_SYMBOL,
      variant: { kind: 'colored', color: '#003366' },
    })
    expect(out).toContain('fill="#003366" stroke="#003366" stroke-width="2"')
    expect(out).toContain('<g color="#FFF">')
  })
})

describe('composeIcon — structure and shape coverage', () => {
  it('wraps output in a single <svg> root with xmlns and the 36×36 envelope', () => {
    const out = composeIcon({
      shape: 'circle',
      symbolSvg: TINY_SYMBOL,
      variant: 'default',
    })
    expect(out.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true)
    expect(out.endsWith('</svg>')).toBe(true)
    // No doctype, no XML prolog, no line breaks injected by the
    // compositor itself.
    expect(out).not.toContain('<?xml')
    expect(out).not.toContain('<!DOCTYPE')
  })

  it('produces output for every shape primitive', () => {
    const shapes = ['circle', 'hexagon', 'octagon', 'rounded-square'] as const
    for (const shape of shapes) {
      const out = composeIcon({
        shape,
        symbolSvg: TINY_SYMBOL,
        variant: 'default',
      })
      expect(out).toContain('viewBox="0 0 36 36"')
      expect(out).toContain('<g color="#000"><path d="M0 0H36V36H0Z"/></g>')
    }
  })

  it('does not leak extra wrapper attributes from the symbol svg', () => {
    const extra =
      '<svg viewBox="0 0 36 36" fill="currentColor" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="authored-by-figma"><path d="M1 1Z"/></svg>'
    const out = composeIcon({
      shape: 'hexagon',
      symbolSvg: extra,
      variant: 'default',
    })
    expect(out).not.toContain('xmlns:xlink')
    expect(out).not.toContain('class="authored-by-figma"')
    expect(out).not.toContain('fill="currentColor" xmlns')
    expect(out).toContain('<path d="M1 1Z"/>')
  })
})

describe('composeIcon — determinism', () => {
  it('produces byte-identical output across repeated calls with the same input', () => {
    const args = {
      shape: 'octagon' as const,
      symbolSvg: acceptDenySymbolRaw,
      variant: { kind: 'colored' as const, color: '#F39C12' },
    }
    const a = composeIcon(args)
    const b = composeIcon(args)
    const c = composeIcon(args)
    expect(a).toBe(b)
    expect(b).toBe(c)
  })
})

describe('composeIcon — golden-file parity', () => {
  // Each golden file is a self-referential lock captured from
  // `composeIcon` output on a sample symbol. A byte mismatch here
  // means the compositor's output has drifted — either regenerate
  // goldens intentionally or fix the regression.
  const cases = [
    {
      label: 'hexagon / accept_deny',
      shape: 'hexagon' as const,
      symbol: acceptDenySymbolRaw,
      golden: acceptDenyGolden,
    },
    {
      label: 'circle / raw_data',
      shape: 'circle' as const,
      symbol: rawDataSymbolRaw,
      golden: rawDataGolden,
    },
    {
      label: 'rounded-square / available_for_resale',
      shape: 'rounded-square' as const,
      symbol: availableForResaleSymbolRaw,
      golden: availableForResaleGolden,
    },
    {
      label: 'octagon / rights_access',
      shape: 'octagon' as const,
      symbol: rightsAccessSymbolRaw,
      golden: rightsAccessGolden,
    },
  ]

  for (const { label, shape, symbol, golden } of cases) {
    it(`matches golden for ${label} (default variant)`, () => {
      const out = composeIcon({ shape, symbolSvg: symbol, variant: 'default' })
      expect(out).toBe(golden)
    })
  }
})
