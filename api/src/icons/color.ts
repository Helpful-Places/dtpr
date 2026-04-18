/**
 * WCAG 2.x color math helpers used by the icon compositor to pick an
 * inner icon color (`#000` or `#FFF`) that contrasts with the shape
 * fill. Pure functions — no I/O, no dependencies.
 */

export type RGB = { r: number; g: number; b: number }

const HEX6_RE = /^#([0-9a-fA-F]{6})$/

/**
 * Parse a 6-char `#RRGGBB` hex color into integer channel values in
 * `[0, 255]`. Returns `null` for any other input (including 3-char
 * shorthand like `#fff` — the content schema only allows the 6-char
 * form).
 */
export function parseHex(hex: string): RGB | null {
  if (typeof hex !== 'string') return null
  const match = HEX6_RE.exec(hex)
  if (!match) return null
  const digits = match[1]!
  return {
    r: parseInt(digits.slice(0, 2), 16),
    g: parseInt(digits.slice(2, 4), 16),
    b: parseInt(digits.slice(4, 6), 16),
  }
}

/**
 * Linearize an sRGB channel in `[0, 1]` per the WCAG 2 definition.
 */
function linearize(channel: number): number {
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

/**
 * WCAG relative luminance for an sRGB color. Input channels are
 * 8-bit integers in `[0, 255]`; output is in `[0, 1]`.
 */
export function relativeLuminance({ r, g, b }: RGB): number {
  const rl = linearize(r / 255)
  const gl = linearize(g / 255)
  const bl = linearize(b / 255)
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl
}

/**
 * WCAG contrast ratio between two colors. Returns a value in
 * `[1, 21]`, or `NaN` if either argument fails `parseHex`.
 */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = parseHex(hexA)
  const b = parseHex(hexB)
  if (!a || !b) return Number.NaN
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [bright, dark] = la >= lb ? [la, lb] : [lb, la]
  return (bright + 0.05) / (dark + 0.05)
}

/**
 * Pick a readable inner color for a given shape fill. Uses the 0.179
 * luminance threshold (matches the common "choose black or white text
 * on a background" heuristic): luminance >= 0.179 → black, below →
 * white.
 *
 * Throws if `shapeColor` isn't a valid 6-char hex — callers should have
 * validated upstream (e.g. via the content schema's `HexColor` type).
 */
export function innerColorForShape(shapeColor: string): '#000' | '#FFF' {
  const rgb = parseHex(shapeColor)
  if (!rgb) {
    throw new Error(
      `innerColorForShape: expected 6-char hex color (e.g. "#FFDD00"), got ${JSON.stringify(shapeColor)}`,
    )
  }
  return relativeLuminance(rgb) >= 0.179 ? '#000' : '#FFF'
}
