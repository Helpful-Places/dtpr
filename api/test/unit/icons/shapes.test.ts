import { describe, expect, it } from 'vitest'
import type { ShapeType } from '../../../src/schema/category.ts'
import {
  SHAPES,
  UnknownShapeError,
  getShapeSvgFragment,
} from '../../../src/icons/shapes.ts'

describe('SHAPES', () => {
  const names: ShapeType[] = ['circle', 'hexagon', 'octagon', 'rounded-square']

  it('has entries for all 4 primitives with non-empty path data', () => {
    for (const name of names) {
      const entry = SHAPES[name]
      expect(entry).toBeDefined()
      expect(entry.d.length).toBeGreaterThan(0)
      expect(entry.d.startsWith('M')).toBe(true)
      expect(entry.viewBox).toBe('0 0 36 36')
    }
  })

  it('hexagon path data matches the value lifted from the source SVG', () => {
    // Sanity check the literal — if the source SVG changes we want to
    // notice here rather than discover via a downstream golden.
    expect(SHAPES.hexagon.d).toContain('M31.8564 8.8453L19 1.42265')
  })
})

describe('getShapeSvgFragment', () => {
  it('returns a <path> element with the shape`s d attribute and injected fill/stroke', () => {
    const out = getShapeSvgFragment('hexagon', { fill: 'none', stroke: '#000' })
    expect(out).toContain(`d="${SHAPES.hexagon.d}"`)
    expect(out).toContain('fill="none"')
    expect(out).toContain('stroke="#000"')
    expect(out.startsWith('<path')).toBe(true)
    expect(out.endsWith('/>')).toBe(true)
  })

  it('works for all 4 shapes', () => {
    const names: ShapeType[] = ['circle', 'hexagon', 'octagon', 'rounded-square']
    for (const name of names) {
      const out = getShapeSvgFragment(name, { fill: '#FFDD00', stroke: '#000000' })
      expect(out).toContain(`d="${SHAPES[name].d}"`)
      expect(out).toContain('fill="#FFDD00"')
      expect(out).toContain('stroke="#000000"')
    }
  })

  it('preserves stroke-width="2" from the source SVGs', () => {
    const out = getShapeSvgFragment('circle', { fill: '#FFF', stroke: '#000' })
    expect(out).toContain('stroke-width="2"')
  })

  it('throws UnknownShapeError for an unknown shape name at runtime', () => {
    expect(() =>
      getShapeSvgFragment('triangle' as unknown as ShapeType, {
        fill: 'none',
        stroke: '#000',
      }),
    ).toThrow(UnknownShapeError)
    expect(() =>
      getShapeSvgFragment('triangle' as unknown as ShapeType, {
        fill: 'none',
        stroke: '#000',
      }),
    ).toThrow(/triangle/)
  })
})
