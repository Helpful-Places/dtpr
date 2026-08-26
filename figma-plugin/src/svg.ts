/**
 * SVG fixups applied before handing bytes to Figma.
 *
 * Pure string work, kept out of `code.ts` so it can be tested without
 * a Figma sandbox.
 */

/**
 * The API's composed icon, as `icons/compositor.ts` emits it:
 *
 * ```
 * <svg …><path … fill="#000" stroke="#000"/><g color="#FFF">…<path fill="currentColor"/>…</g></svg>
 * ```
 *
 * The shape carries literal colors; the symbol is painted by CSS
 * inheritance — `fill="currentColor"` resolving against the `color` on
 * the wrapping `<g>`. That is correct SVG and browsers render it, but
 * `figma.createNodeFromSvg` has no CSS cascade and cannot resolve
 * `currentColor`, so every such path falls back to black.
 *
 * The damage depends on the variant. `default` wants a black symbol
 * anyway, so it survives by luck. `dark` wants white on a black shape
 * and renders a solid black blob. Context-colored variants break only
 * where the WCAG rule picked `#FFF` — which is why a category whose
 * colors are all light looks fine while the rest of the sheet does not.
 *
 * So substitute the inherited color in before Figma sees it. Only the
 * `<g>` wrapper carries a `color` attribute and only the symbol uses
 * `currentColor`, so the value is unambiguous and a global replace
 * cannot touch the shape.
 *
 * Left alone when there is no `<g color="…">` to read: better to hand
 * Figma the original bytes than to guess at a color.
 */
export function resolveCurrentColor(svg: string): string {
  if (!svg.includes('currentColor')) return svg
  const match = /<g\b[^>]*\bcolor="([^"]*)"/.exec(svg)
  const color = match?.[1]
  if (!color) return svg
  return svg.split('currentColor').join(color)
}
