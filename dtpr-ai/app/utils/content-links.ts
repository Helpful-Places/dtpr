/**
 * Decides whether a markdown link should be rewritten through
 * `useLocalePath`. Used by the `ProseA` override.
 *
 * Under the i18n `prefix` strategy every *page* route carries a locale
 * segment (`/icons/urls` → `/en/icons/urls`), so bare markdown links
 * have to be prefixed. But not everything a doc links to is a page.
 */

/** A site-root path — not protocol-qualified, not protocol-relative. */
function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//')
}

/**
 * Already locale-prefixed, e.g. a cross-locale reference like
 * `[English](/en)` inside `fr/index.md`. Re-prefixing would produce
 * `/fr/en`.
 */
function startsWithKnownLocale(href: string, localeCodes: readonly string[]): boolean {
  const first = href.split('/')[1]
  if (!first) return false
  return localeCodes.includes(first)
}

/**
 * A file in `public/` rather than a content route.
 *
 * Static assets are served from the site root with no locale segment
 * (`/skills/dtpr-skills.zip`, `/figma-plugin/manifest.json`), so
 * prefixing them yields a 404. Content routes are always extensionless
 * — `/icons/urls`, `/mcp/tools/get-schema` — which makes a file
 * extension on the final segment a reliable signal.
 *
 * Query strings and hash fragments are stripped first so
 * `/concepts/datachains#authoring-provenance` is not mistaken for a
 * file named `datachains#authoring-provenance`.
 */
export function isStaticAssetPath(href: string): boolean {
  const path = href.split(/[?#]/)[0] ?? ''
  const last = path.split('/').pop() ?? ''
  return /\.[a-zA-Z0-9]+$/.test(last)
}

/**
 * `true` when `href` names a content page that needs a locale prefix.
 */
export function shouldLocalizePath(href: string, localeCodes: readonly string[]): boolean {
  if (!href || !isInternalPath(href)) return false
  if (startsWithKnownLocale(href, localeCodes)) return false
  if (isStaticAssetPath(href)) return false
  return true
}
