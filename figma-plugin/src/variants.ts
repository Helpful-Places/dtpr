/**
 * Variant-token parsing.
 *
 * The DTPR API exposes each element's icons as a flat list of tokens
 * on `element.icon_variants`:
 *
 *   ['default', 'dark', 'vendor', 'vendor.dark']
 *
 * Those tokens are really two independent axes — a *context* (the
 * category's `element_context` value, or `default`) and a *theme*
 * (light or dark). Figma models exactly this with multi-property
 * component sets, so the plugin splits the token back into its axes
 * and rebuilds it as `Context=vendor, Theme=dark`.
 *
 * Token grammar (mirrors `parseVariantToken` in `api/src/rest/routes.ts`):
 *
 *   <base>          -> light theme
 *   <base>.dark     -> dark theme
 *
 * with the two reserved bases `default` and `dark`, where the bare
 * token `dark` means "default context, dark theme".
 */

export type Theme = 'light' | 'dark'

export interface VariantAxes {
  /** Context value id, or `'default'` when the icon has no context. */
  context: string
  theme: Theme
}

const DARK_SUFFIX = '.dark'
const DEFAULT_CONTEXT = 'default'

/**
 * Split an API variant token into its context/theme axes. Returns
 * `null` for tokens the API would itself reject (empty, or a base
 * containing a stray dot), so callers can skip them loudly rather
 * than generating a component named after a malformed token.
 */
export function parseVariantToken(token: string): VariantAxes | null {
  if (token.length === 0) return null

  let base = token
  let theme: Theme = 'light'

  if (token.endsWith(DARK_SUFFIX)) {
    base = token.slice(0, -DARK_SUFFIX.length)
    theme = 'dark'
  }

  if (base.length === 0 || base.includes('.')) return null

  // `dark` is the reserved spelling of "default context, dark theme".
  // `dark.dark` is not a thing — the API rejects it, so do we.
  if (base === 'dark') {
    if (theme === 'dark') return null
    return { context: DEFAULT_CONTEXT, theme: 'dark' }
  }

  return { context: base, theme }
}

export interface VariantPlan {
  token: string
  axes: VariantAxes
  /**
   * The Figma layer name for this variant's component. Only the axes
   * that actually vary across the element are included — an element
   * with just light/dark gets `Theme=light`, not the noisier
   * `Context=default, Theme=light`.
   */
  name: string
}

/**
 * Build the Figma naming plan for one element's variant tokens.
 *
 * Unparseable tokens are dropped. The returned list preserves the
 * input order, which is the order the API declares (default first),
 * and that becomes the component set's default variant in Figma.
 */
export function planVariants(tokens: readonly string[]): VariantPlan[] {
  const parsed: Array<{ token: string; axes: VariantAxes }> = []
  for (const token of tokens) {
    const axes = parseVariantToken(token)
    if (axes) parsed.push({ token, axes })
  }

  const contexts = new Set(parsed.map((p) => p.axes.context))
  const themes = new Set(parsed.map((p) => p.axes.theme))
  const useContext = contexts.size > 1
  const useTheme = themes.size > 1

  return parsed.map(({ token, axes }) => {
    const props: string[] = []
    if (useContext) props.push(`Context=${axes.context}`)
    if (useTheme) props.push(`Theme=${axes.theme}`)
    // A single-variant element has no varying axis at all; it becomes
    // a plain component, and this name is unused by the caller.
    return { token, axes, name: props.length > 0 ? props.join(', ') : axes.context }
  })
}
