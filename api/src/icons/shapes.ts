import type { ShapeType } from '../schema/category.ts'

export type { ShapeType }

/**
 * Parameterized SVG path data for the 4 icon shape primitives.
 *
 * Each entry holds the `d` attribute lifted verbatim from
 * `app/public/dtpr-icons/shapes/*.svg`. The `circle` and
 * `rounded-square` source SVGs use `<rect ... rx="…">`; we represent
 * those as equivalent path data so the compositor can inject fill and
 * stroke via a single `<path>` element regardless of shape.
 *
 * All shapes share a `36×36` viewBox; stroke width in the source SVGs
 * is `2`. The compositor is responsible for wrapping this fragment in
 * the outer `<svg>` element and adding the inner icon content.
 */
export const SHAPES: Record<ShapeType, { d: string; viewBox: '0 0 36 36' }> = {
  circle: {
    // Source: <rect x="2" y="2" width="32" height="32" rx="16" .../>
    // A 32×32 square with corner radius 16 is a circle of radius 16
    // centered at (18,18).
    d: 'M18 2C26.8366 2 34 9.16344 34 18C34 26.8366 26.8366 34 18 34C9.16344 34 2 26.8366 2 18C2 9.16344 9.16344 2 18 2Z',
    viewBox: '0 0 36 36',
  },
  hexagon: {
    d: 'M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z',
    viewBox: '0 0 36 36',
  },
  octagon: {
    d: 'M24.1191 1.41309L24.3174 1.42285C24.7751 1.46907 25.2056 1.6733 25.5332 2.00195L34.0898 10.585C34.4172 10.9135 34.6183 11.3442 34.6631 11.8018L34.6729 11.999L34.6533 24.1191C34.6526 24.5833 34.4914 25.0313 34.1992 25.3867L34.0654 25.5332L25.4824 34.0898C25.1538 34.4173 24.7224 34.6183 24.2646 34.6631L24.0674 34.6729L11.9473 34.6533C11.4171 34.6524 10.9085 34.4409 10.5342 34.0654L1.97754 25.4824C1.60327 25.1069 1.39281 24.5976 1.39355 24.0674L1.41309 11.9482C1.41392 11.4178 1.62629 10.9087 2.00195 10.5342L10.585 1.97754L10.7314 1.84473C11.0876 1.55395 11.5352 1.39299 11.999 1.39355L24.1191 1.41309Z',
    viewBox: '0 0 36 36',
  },
  'rounded-square': {
    // Source: <rect x="3" y="3" width="30" height="30" rx="3" .../>
    d: 'M6 3H30C31.6569 3 33 4.34315 33 6V30C33 31.6569 31.6569 33 30 33H6C4.34315 33 3 31.6569 3 30V6C3 4.34315 4.34315 3 6 3Z',
    viewBox: '0 0 36 36',
  },
}

export class UnknownShapeError extends Error {
  readonly shape: string
  constructor(shape: string) {
    super(`Unknown shape primitive: ${JSON.stringify(shape)}`)
    this.name = 'UnknownShapeError'
    this.shape = shape
  }
}

/**
 * Escape characters that would break an SVG attribute value.
 * Callers pass hex colors (`#RRGGBB`) or the literal string `"none"`,
 * so in practice this is defensive.
 */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

/**
 * Return the shape as a single `<path>` element string with the given
 * fill and stroke injected. The caller wraps this fragment in the
 * outer `<svg>` element at composition time.
 *
 * The source SVGs use `stroke-width="2"`; we preserve that here.
 */
export function getShapeSvgFragment(
  shape: ShapeType,
  { fill, stroke }: { fill: string; stroke: string },
): string {
  const entry = SHAPES[shape]
  if (!entry) {
    // TypeScript exhaustiveness normally prevents this; belt-and-suspenders
    // for callers that cast through `any` or receive untrusted input.
    throw new UnknownShapeError(shape as unknown as string)
  }
  const fillAttr = escapeAttr(fill)
  const strokeAttr = escapeAttr(stroke)
  return `<path d="${entry.d}" fill="${fillAttr}" stroke="${strokeAttr}" stroke-width="2"/>`
}
