/**
 * Pure icon compositor.
 *
 * Produces a final 36×36 composed SVG string from a shape primitive
 * (drawn from `./shapes.ts`), a symbol SVG (one of the per-element
 * `<svg>...</svg>` documents bundled in a release), and a variant
 * (`default`, `dark`, or a colored shape).
 *
 * Used at build time by the pre-bake step and at runtime by the
 * miss-fallback. Identical inputs produce byte-identical output — no
 * randomness, no timestamps, no environment-dependent behavior.
 */

import { innerColorForShape } from './color.ts'
import { getShapeSvgFragment, type ShapeType } from './shapes.ts'

/** Variants the compositor knows how to render. */
export type ComposeVariant =
  | 'default'
  | 'dark'
  | { kind: 'colored'; color: string }

/**
 * Thrown when `stripOuterSvg` (or `composeIcon` via it) is handed a
 * string that doesn't look like an `<svg ...>...</svg>` document. The
 * build-time guard in Unit 3 is expected to reject BOM / XML prologs
 * / leading comments at authoring time — this error is the runtime
 * equivalent for callers that bypass validation.
 */
export class InvalidSymbolSvgError extends Error {
  constructor(message: string) {
    super(`InvalidSymbolSvgError: ${message}`)
    this.name = 'InvalidSymbolSvgError'
  }
}

/**
 * Resolve the three colors needed to compose an icon given a variant.
 */
function resolveVariantColors(variant: ComposeVariant): {
  shapeFill: string
  shapeStroke: string
  innerColor: string
} {
  if (variant === 'default') {
    return { shapeFill: 'none', shapeStroke: '#000', innerColor: '#000' }
  }
  if (variant === 'dark') {
    return { shapeFill: '#000', shapeStroke: '#000', innerColor: '#FFF' }
  }
  // variant is { kind: 'colored', color }
  return {
    shapeFill: variant.color,
    shapeStroke: variant.color,
    innerColor: innerColorForShape(variant.color),
  }
}

// Matches the wrapping `<svg ...>` open tag. ASCII whitespace (space,
// tab, newline, CR) before the tag is tolerated; a leading BOM
// (U+FEFF), XML prolog (`<?xml ...?>`), or `<!-- ... -->` comment is
// NOT — Unit 3's build-time guard rejects those at authoring time
// and the compositor fails loudly if anything slips through.
//
// Note: JS `\s` includes U+FEFF, so this deliberately uses an explicit
// `[ \t\n\r]*` character class instead.
const SVG_OPEN_RE = /^[ \t\n\r]*<svg\b[^>]*>/
const SVG_CLOSE_RE = /<\/svg>[ \t\n\r]*$/

/**
 * Remove the wrapping `<svg ...>...</svg>` tags from a symbol SVG
 * document, returning the inner fragment. Leading and trailing
 * whitespace are tolerated.
 *
 * All 95 source symbols in `app/public/dtpr-icons/symbols/*.svg`
 * follow the same shape — a single `<svg viewBox="0 0 36 36" ...>`
 * wrapper around one or more `<path>` (occasionally `<g>`) elements.
 * A regex for the opening/closing tags is sufficient; we deliberately
 * avoid pulling in an HTML/XML parser dependency for what is a
 * trivial transformation on author-controlled input.
 */
export function stripOuterSvg(symbolSvg: string): string {
  if (typeof symbolSvg !== 'string') {
    throw new InvalidSymbolSvgError('symbolSvg must be a string')
  }
  const openMatch = SVG_OPEN_RE.exec(symbolSvg)
  if (!openMatch) {
    throw new InvalidSymbolSvgError(
      'symbolSvg must start with a <svg ...> opening tag (no BOM / XML prolog / leading comments permitted)',
    )
  }
  const afterOpen = symbolSvg.slice(openMatch[0].length)
  const closeMatch = SVG_CLOSE_RE.exec(afterOpen)
  if (!closeMatch) {
    throw new InvalidSymbolSvgError(
      'symbolSvg must end with a </svg> closing tag',
    )
  }
  return afterOpen.slice(0, closeMatch.index).trim()
}

/**
 * Compose an icon. Pure function: no I/O, no globals, no randomness.
 *
 * Output structure (inline-compact, no whitespace between elements):
 *
 * ```
 * <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36"><path d="..." fill="..." stroke="..." stroke-width="2"/><g color="#000">…symbolInner…</g></svg>
 * ```
 */
export function composeIcon(args: {
  shape: ShapeType
  symbolSvg: string
  variant: ComposeVariant
}): string {
  const { shape, symbolSvg, variant } = args
  const { shapeFill, shapeStroke, innerColor } = resolveVariantColors(variant)
  const shapeFragment = getShapeSvgFragment(shape, {
    fill: shapeFill,
    stroke: shapeStroke,
  })
  const symbolInner = stripOuterSvg(symbolSvg)
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">' +
    shapeFragment +
    `<g color="${innerColor}">` +
    symbolInner +
    '</g>' +
    '</svg>'
  )
}
