import { Hono } from 'hono'
import type { AppEnv } from '../app-types.ts'
import { loadLegacyDocument } from '../store/index.ts'
import {
  legacyJsonBody,
  legacyLoadCtx,
  legacyPageNotFound,
  registerBothSlashForms,
  registerLegacyIconRoute,
  registerLegacyNotFoundRoute,
} from './legacy-shared.ts'

/**
 * The frozen `/api/v0` surface: six locale documents and 123 icons,
 * served verbatim from the capture that `api/legacy/` holds.
 *
 * This is a preserved artifact, not a feature. Nothing here derives,
 * filters, or repairs anything — the stored bytes are streamed out
 * with an explicit content type (KTD1) and the known defects in them
 * (no `headline` key, per-locale record counts that don't match, and
 * records missing `title`/`description` where a locale lacked the
 * field) are part of the contract, not bugs to fix (R10).
 *
 * Routes:
 *   GET /icons/:icon_id   (both slash forms)
 *   GET /:locale          (both slash forms)
 *   ALL *                 → legacy 404
 */

/**
 * The six published v0 locales (R1). This is an allowlist, not a
 * lookup table: an unrecognised locale never reaches a key builder,
 * which is what keeps traversal out of `legacyDocumentKey`.
 */
export const LEGACY_V0_LOCALES = ['en', 'fr', 'es', 'pt', 'tl', 'km'] as const
export type LegacyV0Locale = (typeof LEGACY_V0_LOCALES)[number]

const V0_LOCALES: ReadonlySet<string> = new Set(LEGACY_V0_LOCALES)

/**
 * Answer for a locale outside the six.
 *
 * Not an error (R4, AE4). The legacy handler treated an unknown locale
 * as "no elements in that language" and returned an empty array at
 * 200; only the six published locales were prerendered. A 404 here
 * would be an improvement, and improvements are out of scope.
 */
const EMPTY_DOCUMENT = '[]'

/**
 * Build the `/api/v0` sub-app. The caller mounts it —
 * `app.route('/api/v0', createLegacyV0App())` — so this module stays
 * independent of the middleware posture the mount site chooses.
 */
export function createLegacyV0App() {
  const app = new Hono<AppEnv>()

  // Icons first. `/icons/:icon_id` and `/:locale` differ in segment
  // count so they cannot actually collide, but declaring the more
  // specific pattern first keeps the file readable in match order.
  //
  // One consequence worth naming: `/api/v0/icons` — no id — has a
  // single segment and so matches `/:locale`, answering `[]` at 200.
  // That is not a wart introduced here; the legacy `[locale].ts`
  // handler did exactly the same with `/api/dtpr/v0/icons`.
  registerLegacyIconRoute(app, 'v0')

  registerBothSlashForms(app, '/:locale', async (c) => {
    // KTD7: v0 decodes before matching, unlike v1. Hono has already
    // done it — `c.req.param()` returns the fully decoded segment — so
    // `/api/v0/%65s` arrives here as `es` and serves the full Spanish
    // body (R15, AE13). v1 has to reach for `c.req.raw.url` to *undo*
    // this; v0 must not.
    const locale = c.req.param('locale') ?? ''

    if (!V0_LOCALES.has(locale)) return legacyJsonBody(c, EMPTY_DOCUMENT)

    // `locales` is ignored entirely on v0 (R3). Not parsed, not read,
    // not echoed: each v0 document is single-locale already, so there
    // is nothing for a filter to remove. The legacy handler ignored it
    // too — the parameter only ever did anything on the four typed v1
    // routes.
    const document = await loadLegacyDocument(legacyLoadCtx(c), 'v0', locale)

    // An allowlisted locale whose object is absent means the snapshot
    // was never uploaded, or only partly. Answer in the legacy shape
    // rather than the house envelope; the deploy smoke tests are what
    // turn this into a visible failure.
    if (document === null) return legacyPageNotFound(c)

    return legacyJsonBody(c, document)
  })

  // Must be last — it is a route, not a `notFound()` handler (KTD4),
  // so anything declared after it is unreachable.
  registerLegacyNotFoundRoute(app)

  return app
}
