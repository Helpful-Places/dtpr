import { Hono, type Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { AppEnv } from '../app-types.ts'
import { loadLegacyIconSvg, type LegacyVersion, type LoadContext } from '../store/index.ts'
import { setIconCacheHeaders } from './responses.ts'

/**
 * Mechanics shared by the two frozen legacy sub-apps (`/api/v0` and
 * `/api/v1`).
 *
 * What lives here is behaviour the two majors share verbatim: the h3
 * error envelope the retired `dtpr.io` service emitted, the
 * both-slash-forms route registration Hono forces on us, and the icon
 * route — whose only difference between majors is which namespace it
 * reads from.
 *
 * What deliberately does *not* live here is anything the majors do
 * differently. v0 percent-decodes its locale segment and answers an
 * unrecognised one with `[]` at 200; v1 refuses to decode its
 * `datachain_type` segment and answers an unrecognised one with a
 * 400. Folding either into a "configurable" shared handler would bury
 * the divergence that KTD7 exists to preserve, so each sub-app spells
 * its own segment handling out in full.
 */

/**
 * Content types the legacy service emitted — both **without** a
 * charset parameter (R4).
 *
 * Every legacy response sets one of these explicitly and returns
 * `c.body()`. `c.json()` is banned outright (KTD1): it re-serialises,
 * which is fatal to byte fidelity for a snapshot we hold as text, and
 * it picks the content type itself, so the charset-free form would be
 * Hono's choice to change rather than ours to guarantee.
 */
export const LEGACY_JSON_CONTENT_TYPE = 'application/json'
export const LEGACY_SVG_CONTENT_TYPE = 'image/svg+xml'

/**
 * The `statusMessage` h3 emitted for an unhandled handler exception.
 * Shared so the two places that render a legacy 500 — the preserved
 * `/api/v1/elements` filter branch and the mount's error handler —
 * cannot drift apart.
 */
export const LEGACY_SERVER_ERROR = 'Server Error'

/**
 * Path-parameter guard for legacy icon ids. Same character class as
 * `ID_REGEX` in `rest/routes.ts`, for the same reason: the URL is
 * untrusted input and has to be re-validated before it reaches an R2
 * key builder. All 148 captured icon ids match it.
 *
 * Applied to the **raw**, still-percent-encoded segment (KTD7), so
 * `..%2Findex.svg` is rejected on the `%` rather than arriving here
 * already decoded to `../index` — and so a would-be "fix" that
 * switches this to `c.req.param()` fails a test instead of quietly
 * widening the guard.
 */
export const LEGACY_ID_REGEX = /^[a-zA-Z0-9_-]+$/

const SVG_SUFFIX = '.svg'

/**
 * Strip the `.svg` suffix from a raw path segment, or return `null`
 * when it isn't there.
 *
 * A near-twin of `stripSvgSuffix` in `rest/routes.ts`, duplicated
 * rather than shared: that copy is paired with `notFoundSvgRoute`,
 * which renders the v2 `{ok:false,errors:[…]}` envelope, and importing
 * one without the other would leave the coupling looking accidental.
 * Three lines is cheaper than that ambiguity.
 */
function stripSvgSuffix(raw: string): string | null {
  if (!raw.endsWith(SVG_SUFFIX)) return null
  return raw.slice(0, -SVG_SUFFIX.length)
}

/**
 * Bundle the R2 bucket + execution context for the legacy loaders.
 * Mirrors the private `loadCtx` in `rest/routes.ts`; the legacy
 * sub-apps read through the same store barrel the v2 routes do.
 */
export function legacyLoadCtx(c: Context<AppEnv>): LoadContext {
  return { bucket: c.env.CONTENT, ctx: c.executionCtx }
}

/**
 * The incoming request URL, parsed but **not** normalised past what
 * `URL` does.
 *
 * Hono decodes at routing time (KTD7), so by the time a handler runs
 * both `c.req.param()` and `c.req.path` have lost the original
 * encoding. `c.req.raw.url` is the only accessor that still carries
 * it, which matters for two things: v1's no-decode segment rule, and
 * the raw-segment icon guard both majors keep.
 */
function rawUrl(c: Context<AppEnv>): URL {
  return new URL(c.req.raw.url)
}

/**
 * Path-and-query of the incoming request, still percent-encoded.
 *
 * This is the value the legacy 404 envelope embeds in four places.
 * The retired service produced it from vue-router's `to.fullPath`,
 * which is the encoded path *including* the query string — hence
 * `search` rather than `pathname` alone.
 */
export function rawPathWithQuery(c: Context<AppEnv>): string {
  const url = rawUrl(c)
  return `${url.pathname}${url.search}`
}

/**
 * The final path segment of the incoming request, still
 * percent-encoded. Tolerates the trailing-slash route form (R15) by
 * dropping one trailing separator before splitting.
 */
export function rawFinalSegment(c: Context<AppEnv>): string {
  const pathname = rawUrl(c).pathname
  const trimmed = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return trimmed.slice(trimmed.lastIndexOf('/') + 1)
}

/** A legacy route handler. Narrower than Hono's `Handler`: legacy
 * handlers never call `next` and always return a real `Response`. */
type LegacyRouteHandler = (c: Context<AppEnv>) => Response | Promise<Response>

/**
 * Register one legacy GET route under both its unslashed and its
 * slashed form (R15).
 *
 * Hono's non-strict routing option would cover this in one line, but a
 * sub-app's routing options are discarded at `app.route()` mount time
 * (KTD3), and flipping the *root* app to non-strict would change how
 * `/api/v2` matches too. Two explicit registrations is the only form
 * that survives the mount. Verified against the vendored Hono 4.12.28:
 * a non-strict sub-app mounted under the strict root still 404s the
 * trailing-slash form.
 *
 * GET only, deliberately. The legacy handlers answered any method with
 * the full body; the frozen surface sends everything else to the
 * catch-all 404, which is an enumerated departure (R21).
 */
export function registerBothSlashForms(
  app: Hono<AppEnv>,
  path: string,
  handler: LegacyRouteHandler,
): void {
  if (path.endsWith('/')) {
    throw new Error(`registerBothSlashForms expects the unslashed form, got '${path}'`)
  }
  app.get(path, handler)
  app.get(`${path}/`, handler)
}

/**
 * Stream stored JSON bytes with the charset-free content type
 * (KTD1, R4). `body` is the document exactly as captured — never a
 * re-serialisation.
 */
export function legacyJsonBody(c: Context<AppEnv>, body: string): Response {
  c.header('Content-Type', LEGACY_JSON_CONTENT_TYPE)
  return c.body(body)
}

export interface LegacyErrorInit {
  status: ContentfulStatusCode
  /** Carried in both `statusMessage` and `message` — the captured
   * envelopes always agree on those two. */
  statusMessage: string
  /**
   * Optional `data` member. Omitted from the body entirely when
   * absent, which is what the captured 400s look like; only the 404
   * carries one.
   */
  data?: Record<string, unknown>
}

/**
 * Render an h3-style legacy error envelope.
 *
 * Byte shape is taken from the captures under `api/legacy/raw/errors/`:
 * two-space pretty-printing, no trailing newline, and this key order —
 * `error`, `url`, `statusCode`, `statusMessage`, `message`, `data`.
 * The object literal below is written in that order because
 * `JSON.stringify` follows insertion order for string keys.
 *
 * `url` is re-derived from the incoming request rather than replayed
 * from the capture (R14). That is the plan's one per-request departure
 * from byte-identity, and it is the reason this cannot be a stored
 * fixture.
 *
 * Returned directly, never thrown (KTD4): the Worker's global error
 * handler renders the v2 `{ok:false,errors:[…]}` envelope for every
 * 400/404/500, which would be wrong on this surface.
 */
export function legacyErrorResponse(c: Context<AppEnv>, init: LegacyErrorInit): Response {
  const body: Record<string, unknown> = {
    error: true,
    url: c.req.raw.url,
    statusCode: init.status,
    statusMessage: init.statusMessage,
    message: init.statusMessage,
  }
  if (init.data !== undefined) body.data = init.data
  c.header('Content-Type', LEGACY_JSON_CONTENT_TYPE)
  return c.body(JSON.stringify(body, null, 2), init.status)
}

/**
 * The legacy 404 — h3's `Page not found: <path>`, with all four
 * path-derived fields re-derived from the incoming request (R14).
 */
export function legacyPageNotFound(c: Context<AppEnv>): Response {
  const path = rawPathWithQuery(c)
  return legacyErrorResponse(c, {
    status: 404,
    statusMessage: `Page not found: ${path}`,
    data: { path },
  })
}

/**
 * The legacy 400 — same envelope minus `data`, matching the captured
 * `Invalid datachain_type…` bodies.
 */
export function legacyBadRequest(c: Context<AppEnv>, statusMessage: string): Response {
  return legacyErrorResponse(c, { status: 400, statusMessage })
}

/**
 * Register the legacy 404 as a catch-all, and **call this last**.
 *
 * It has to be a route rather than `app.notFound()` because a
 * sub-app's not-found handler is discarded at `app.route()` mount time
 * (KTD4) — verified against the vendored Hono 4.12.28, where the
 * catch-all survives the mount and the not-found handler does not.
 * Being a route, it is also order-sensitive in a way `notFound()`
 * would not have been: declared before the real routes it would
 * swallow them.
 */
export function registerLegacyNotFoundRoute(app: Hono<AppEnv>): void {
  app.all('*', (c) => legacyPageNotFound(c))
}

/**
 * Register `GET /icons/:icon_id` (both slash forms) for one legacy
 * major.
 *
 * Each major serves its own icon namespace with no cross-version
 * fallback (R6): the 25 ids that exist only in v1 are a genuine 404
 * under v0, not a lookup bug (R16). The bytes are the original flat
 * files — no variants, no composition (R8).
 *
 * Three outcomes, in the order they are decided:
 *   - no `.svg` suffix → 404, matching the flat-file host the legacy
 *     icons were served from;
 *   - suffix present but the **raw** id fails `LEGACY_ID_REGEX` → 400,
 *     before any key builder runs (KTD7);
 *   - otherwise a point read, 404 on miss.
 *
 * `setIconCacheHeaders` is called with no manifest (KTD8): that form
 * emits the immutable one-year `Cache-Control`, which is the right
 * semantic for frozen content. The content type is set here rather
 * than reused from the v2 icon handlers, which append
 * `; charset=utf-8` — a parameter the legacy service never sent (R4).
 */
export function registerLegacyIconRoute(app: Hono<AppEnv>, version: LegacyVersion): void {
  registerBothSlashForms(app, '/icons/:icon_id', async (c) => {
    const rawSegment = rawFinalSegment(c)
    const iconId = stripSvgSuffix(rawSegment)
    if (iconId === null) return legacyPageNotFound(c)
    if (!LEGACY_ID_REGEX.test(iconId)) {
      return legacyBadRequest(c, 'Invalid icon id. Must match [a-zA-Z0-9_-]')
    }
    const svg = await loadLegacyIconSvg(legacyLoadCtx(c), version, iconId)
    if (svg === null) return legacyPageNotFound(c)
    c.header('Content-Type', LEGACY_SVG_CONTENT_TYPE)
    setIconCacheHeaders(c)
    return c.body(svg)
  })
}
