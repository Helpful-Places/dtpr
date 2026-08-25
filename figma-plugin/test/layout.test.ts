import { describe, expect, it } from 'vitest'
import { flowWrap } from '../src/layout.ts'

const box = (width: number, height = 36) => ({ width, height })

describe('flowWrap', () => {
  it('lays a single row left to right', () => {
    const result = flowWrap([box(36), box(36), box(36)], {
      maxWidth: 500,
      gapX: 10,
      gapY: 10,
    })
    expect(result.placements).toEqual([
      { x: 0, y: 0 },
      { x: 46, y: 0 },
      { x: 92, y: 0 },
    ])
    expect(result.width).toBe(128)
    expect(result.height).toBe(36)
  })

  it('wraps once a box would exceed maxWidth', () => {
    const result = flowWrap([box(40), box(40), box(40)], {
      maxWidth: 90,
      gapX: 10,
      gapY: 20,
    })
    expect(result.placements).toEqual([
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 0, y: 56 },
    ])
    expect(result.height).toBe(92)
  })

  it('uses the tallest box in a row as that row height', () => {
    const result = flowWrap([box(40, 36), box(40, 80), box(40, 36)], {
      maxWidth: 90,
      gapX: 10,
      gapY: 10,
    })
    // Row 1 is 80 tall, so row 2 starts at 80 + gapY.
    expect(result.placements[2]).toEqual({ x: 0, y: 90 })
    expect(result.height).toBe(126)
  })

  it('places an over-wide box on its own row rather than dropping it', () => {
    const result = flowWrap([box(36), box(400)], { maxWidth: 100, gapX: 10, gapY: 10 })
    expect(result.placements).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 46 },
    ])
    expect(result.width).toBe(400)
  })

  it('reports the widest row, not the last one', () => {
    const result = flowWrap([box(40), box(40), box(20)], {
      maxWidth: 90,
      gapX: 10,
      gapY: 10,
    })
    expect(result.width).toBe(90)
  })

  it('handles an empty list', () => {
    expect(flowWrap([], { maxWidth: 100, gapX: 10, gapY: 10 })).toEqual({
      placements: [],
      width: 0,
      height: 0,
    })
  })
})
