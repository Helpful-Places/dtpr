/**
 * URL-encoded SVG fallback for element icons. ~200 bytes. White (see
 * `fill`) hexagon in DTPR accent green (`#0f5153`) matching the
 * semantics of the legacy `/icons/dtpr-hexagon.png` asset. Used by
 * `<DtprIcon>` and `deriveElementDisplay` when an icon URL is missing
 * or empty so consumers always render a visible tile.
 */
export const HEXAGON_FALLBACK_DATA_URI =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5' fill='%230f5153'/%3E%3C/svg%3E"
