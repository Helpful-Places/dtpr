import { describe, expect, it } from 'vitest'
import { resolveCurrentColor } from '../src/svg.ts'

/**
 * Trimmed from a real response — `GET /api/v2/schemas/ai@2026-08-24-beta
 * /elements/accessibility/icon.dark.svg`. Shape colors are literal, the
 * symbol inherits from the `<g>`.
 */
const DARK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
  '<path d="M31 8L19 1Z" fill="#000" stroke="#000" stroke-width="2"/>' +
  '<g color="#FFF">' +
  '<path d="M23 8C24 8 25 9Z" fill="currentColor"/>' +
  '<path d="M18 21H23V25Z" fill="currentColor"/>' +
  '</g></svg>'

describe('resolveCurrentColor', () => {
  it('substitutes the inherited color into every symbol path', () => {
    const out = resolveCurrentColor(DARK_ICON)
    expect(out).not.toContain('currentColor')
    expect(out.match(/fill="#FFF"/g)).toHaveLength(2)
  })

  it('leaves the shape untouched', () => {
    // The regression: a white symbol turning black is invisible against
    // the black shape of a `dark` variant, so assert the two colors stay
    // distinct rather than just that a replacement happened.
    expect(resolveCurrentColor(DARK_ICON)).toContain(
      '<path d="M31 8L19 1Z" fill="#000" stroke="#000" stroke-width="2"/>',
    )
  })

  it('handles a context-colored variant', () => {
    const svg = '<path fill="#6A1B7A"/><g color="#FFF"><path fill="currentColor"/></g>'
    expect(resolveCurrentColor(svg)).toBe(
      '<path fill="#6A1B7A"/><g color="#FFF"><path fill="#FFF"/></g>',
    )
  })

  it('passes through an SVG with no currentColor', () => {
    const svg = '<svg><path fill="#000"/><g color="#FFF"><path fill="white"/></g></svg>'
    expect(resolveCurrentColor(svg)).toBe(svg)
  })

  it('leaves currentColor alone when no color attribute is readable', () => {
    // Guessing a color would be worse than Figma's own black fallback.
    const svg = '<svg><g><path fill="currentColor"/></g></svg>'
    expect(resolveCurrentColor(svg)).toBe(svg)
  })

  it('reads color off a <g> carrying other attributes first', () => {
    const svg = '<g id="symbol" color="#000"><path fill="currentColor"/></g>'
    expect(resolveCurrentColor(svg)).toContain('fill="#000"')
  })
})
