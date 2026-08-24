import { Hono, type Context } from 'hono'
import type { AppEnv } from '../app-types.ts'
import { loadLegacyDocument } from '../store/index.ts'
import {
  filterLegacyCategoriesDocument,
  filterLegacyElementsDocument,
  hasEffectiveLocalesFilter,
  parseLegacyLocalesQuery,
  type LegacyV1DocumentFilter,
} from './legacy-locales.ts'
import {
  legacyErrorResponse,
  legacyBadRequest,
  legacyJsonBody,
  legacyLoadCtx,
  legacyPageNotFound,
  rawFinalSegment,
  registerBothSlashForms,
  registerLegacyIconRoute,
  registerLegacyNotFoundRoute,
} from './legacy-shared.ts'

/**
 * The frozen `/api/v1` surface: five documents, 148 icons, and one
 * locale filter that has to reproduce a retired Nitro handler's
 * quirks exactly.
 *
 * Unlike v0, this surface is not purely a byte pump. Four of its five
 * documents accept `?locales=`, and when an effective value is present
 * the response is re-serialised from a parse rather than streamed
 * (KTD10). That fork — and only that fork — is what this file adds on
 * top of the shared legacy mechanics.
 *
 * Routes, in declaration order:
 *   GET /icons/:icon_id                (both slash forms)
 *   GET /elements                      (both slash forms)
 *   GET /elements/:datachain_type      (both slash forms)
 *   GET /categories/:datachain_type    (both slash forms)
 *   ALL *                              → legacy 404
 */

/** The legacy `VALID_DATACHAIN_TYPES`. */
export const LEGACY_V1_DATACHAIN_TYPES = ['ai', 'device'] as const
export type LegacyV1DatachainType = (typeof LEGACY_V1_DATACHAIN_TYPES)[number]

const V1_DATACHAIN_TYPES: ReadonlySet<string> = new Set(LEGACY_V1_DATACHAIN_TYPES)

/**
 * The five document paths this surface publishes, as
 * `legacyDocumentKey` takes them. Exported so the uploader and the
 * conformance suite enumerate the same list this file serves.
 */
export const LEGACY_V1_DOCUMENT_PATHS = [
  'elements',
  ...LEGACY_V1_DATACHAIN_TYPES.map((type) => `elements/${type}`),
  ...LEGACY_V1_DATACHAIN_TYPES.map((type) => `categories/${type}`),
] as const

/** The legacy `validateDatachainType` message, byte-for-byte. */
const INVALID_DATACHAIN_TYPE = 'Invalid datachain_type. Must be "ai" or "device"'

/**
 * The h3 body for an unhandled handler exception. What the legacy
 * service rendered when `/api/v1/elements` threw — see the 500 branch
 * below.
 */
const SERVER_ERROR = 'Server Error'

/**
 * The requested locales for this request, parsed the legacy way.
 *
 * `queries` rather than `query`: repeated parameters both apply, and
 * the first-value accessor would silently drop the second (KTD2).
 */
function requestedLocales(c: Context<AppEnv>): string[] | null {
  return parseLegacyLocalesQuery(c.req.queries('locales'))
}

/**
 * Register one typed endpoint — `/elements/:datachain_type` or
 * `/categories/:datachain_type` — under both slash forms.
 *
 * Order of operations is the legacy handler's, and it is observable:
 * `validateDatachainType` threw before `getQuery` ran, so an invalid
 * type is a 400 even when the query is malformed too, and no document
 * load is attempted.
 */
function registerTypedRoute(
  app: Hono<AppEnv>,
  prefix: 'elements' | 'categories',
  filter: LegacyV1DocumentFilter,
): void {
  registerBothSlashForms(app, `/${prefix}/:datachain_type`, async (c) => {
    // KTD7: v1 does NOT decode before matching. Hono hands handlers a
    // decoded param, so `/elements/%61i` would arrive as `ai` and
    // resolve — which the legacy router did not do. Reading the raw
    // segment back off `c.req.raw.url` is what keeps `%61i` a 400
    // (R15, AE10), and it doubles as the traversal guard: an
    // unrecognised segment never reaches `legacyDocumentKey`.
    const datachainType = rawFinalSegment(c)
    if (!V1_DATACHAIN_TYPES.has(datachainType)) {
      return legacyBadRequest(c, INVALID_DATACHAIN_TYPE)
    }

    const locales = requestedLocales(c)
    const document = await loadLegacyDocument(
      legacyLoadCtx(c),
      'v1',
      `${prefix}/${datachainType}`,
    )

    // An allowlisted type whose object is absent means the snapshot
    // was never uploaded, or only partly. Answer in the legacy shape
    // rather than the house envelope, as v0 does.
    if (document === null) return legacyPageNotFound(c)

    // No effective value: stream the stored bytes (KTD1). This is the
    // common path and the only one that is byte-identical by
    // construction rather than by test.
    if (!hasEffectiveLocalesFilter(locales)) return legacyJsonBody(c, document)

    return legacyJsonBody(c, filter(document, locales))
  })
}

/**
 * Build the `/api/v1` sub-app. The caller mounts it —
 * `app.route('/api/v1', createLegacyV1App())` — so this module stays
 * independent of the middleware posture the mount site chooses.
 */
export function createLegacyV1App() {
  const app = new Hono<AppEnv>()

  // Icons first. `/icons/:icon_id` cannot collide with the typed
  // routes — the first segment is a literal — but declaring the most
  // specific pattern first keeps the file readable in match order.
  registerLegacyIconRoute(app, 'v1')

  // `/elements` before `/elements/:datachain_type`, so the
  // trailing-slash form registered here claims `/api/v1/elements/`
  // rather than arriving at the typed handler with an empty segment.
  // (The vendored Hono does not match an empty segment against a
  // parameter, so this is belt and braces — `/api/v1/categories/`,
  // which has no untyped route, falls through to the 404.)
  registerBothSlashForms(app, '/elements', async (c) => {
    const locales = requestedLocales(c)

    // R10, AE8: preserved defect. The legacy untyped handler emitted
    // `variables: [{ id, type, required, default }]` — no `label` key
    // — and then called `.filter()` on `variable.label`, so any
    // effective `locales` value produced a TypeError that h3 rendered
    // as this 500. Reproduce it, do not repair it: the frozen surface
    // is a preserved artifact, and a consumer that today gets a 500
    // must keep getting one.
    //
    // Answering before the load is deliberate. It keeps the malformed
    // document out of the filter — where the same TypeError would be
    // thrown for real and rendered by the Worker's global handler in
    // the v2 envelope, which is the wrong shape (KTD4).
    if (hasEffectiveLocalesFilter(locales)) {
      return legacyErrorResponse(c, { status: 500, statusMessage: SERVER_ERROR })
    }

    const document = await loadLegacyDocument(legacyLoadCtx(c), 'v1', 'elements')
    if (document === null) return legacyPageNotFound(c)
    return legacyJsonBody(c, document)
  })

  registerTypedRoute(app, 'elements', filterLegacyElementsDocument)
  registerTypedRoute(app, 'categories', filterLegacyCategoriesDocument)

  // Must be last — it is a route, not a `notFound()` handler (KTD4),
  // so anything declared after it is unreachable. `/api/v1/categories`
  // lands here: the legacy service never published an untyped
  // categories endpoint.
  registerLegacyNotFoundRoute(app)

  return app
}
