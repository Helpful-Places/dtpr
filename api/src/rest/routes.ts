import { Hono, type Context } from 'hono'
import { ZodError } from 'zod'
import type { AppEnv } from '../app-types.ts'
import { composeIcon, type ComposeVariant } from '../icons/compositor.ts'
import { getShapeSvgFragment, SHAPES, type ShapeType } from '../icons/shapes.ts'
import { apiErrors } from '../middleware/errors.ts'
import type { Category } from '../schema/category.ts'
import { DatachainInstanceSchema } from '../schema/datachain-instance.ts'
import {
  loadCategories,
  loadCategory,
  loadComposedIconSvg,
  loadDatachainType,
  loadElement,
  loadElements,
  loadManifest,
  loadSchemaIndex,
  loadSymbolSvg,
  type LoadContext,
} from '../store/index.ts'
import { validateInstance } from '../validator/semantic.ts'
import {
  decodeCursor,
  paginate,
  parseLimitParam,
} from './pagination.ts'
import {
  deepFilterLocales,
  parseFieldsParam,
  parseLocalesParam,
  projectFields,
  setIconCacheHeaders,
  setVersionHeaders,
} from './responses.ts'
import { reorderByIds, searchElementIds } from './search.ts'
import { resolveKnownVersion } from './version-resolver.ts'

/**
 * Allowed shape names as a Set for O(1) validation. Derived from
 * `SHAPES` so adding a new shape primitive is a single-file change.
 */
const SHAPE_NAMES: ReadonlySet<string> = new Set(Object.keys(SHAPES))
const VALID_SHAPES: readonly string[] = Object.keys(SHAPES).sort()

/**
 * Path-parameter guard for ids (shape, symbol, element, variant).
 * Build-time Zod already enforces this, but the URL is untrusted
 * input — we must re-validate before passing a value to an R2 key
 * builder to prevent path traversal (`..%2Findex.svg`) or injection.
 */
const ID_REGEX = /^[a-zA-Z0-9_-]+$/

/**
 * Strip the `.svg` suffix from a Hono path param. Hono's default
 * router treats a segment like `:shape.svg` as a single param named
 * `shape.svg` because its param-label regex allows dots — so the
 * handler receives the raw `hexagon.svg` value and has to peel off
 * the extension itself. Returns `null` when the input doesn't carry
 * the expected `.svg` suffix so the handler can 404 cleanly.
 */
function stripSvgSuffix(raw: string): string | null {
  if (!raw.endsWith('.svg')) return null
  return raw.slice(0, -'.svg'.length)
}

/** Consistent 404 body for a path that didn't carry the `.svg` suffix. */
function notFoundSvgRoute(raw: string) {
  return apiErrors.notFound(`Route '${raw}' not found.`, 'Did you mean to append `.svg`?')
}

const DEFAULT_ELEMENT_FIELDS = ['id', 'title', 'category_id'] as const

/**
 * Resolve a variant URL token to the `ComposeVariant` the pure
 * compositor accepts. Returns `null` when the token isn't one of the
 * reserved names (`default`, `dark`) and doesn't match any context
 * value on the element's category — the caller translates that into a
 * 404 with a `valid_variants` fix hint.
 */
function resolveComposeVariant(
  variant: string,
  category: Category,
): ComposeVariant | null {
  if (variant === 'default') return 'default'
  if (variant === 'dark') return 'dark'
  const ctxValue = category.context?.values.find((v) => v.id === variant)
  if (!ctxValue) return null
  // Null colors are tag-style and don't compose to a colored icon.
  if (ctxValue.color === null) return null
  return { kind: 'colored', color: ctxValue.color }
}

/**
 * Human-readable list of the variants a given category supports.
 * Always includes `default` and `dark`; appends context-value ids when
 * the category declares a `context`. Used for the fix-hint body on a
 * 404 unknown-variant response.
 */
function validVariantsFor(category: Category): string[] {
  const base = ['default', 'dark']
  const ctxIds = category.context?.values.map((v) => v.id) ?? []
  return [...base, ...ctxIds]
}

/**
 * Emit a structured JSON log line when the composed-icon route falls
 * back to on-the-fly composition. In production this signals either a
 * stale R2 (build ran, upload pending) or a consumer URL referencing
 * an invalid variant. The line is filterable by `event` in the
 * Cloudflare observability UI.
 *
 * No dedicated telemetry module exists in this codebase (the request
 * logger at `api/src/middleware/logging.ts` is the only precedent);
 * a JSON line is the established pattern.
 */
function logIconMissFallback(meta: {
  version: string
  element_id: string
  variant: string
}): void {
  console.log(
    JSON.stringify({ level: 'info', event: 'icon_miss_fallback', ...meta }),
  )
}

/**
 * Shared handler for `GET /schemas/:version/elements/:element_id/icon[.<variant>].svg`.
 *
 * Flow:
 *   1. Resolve version + validate `element_id` / `variant` against
 *      `ID_REGEX` (path-traversal guard).
 *   2. Try the pre-baked R2 point-read via `loadComposedIconSvg` — hot
 *      path for production traffic.
 *   3. On miss, emit an `icon_miss_fallback` metric and compose the
 *      icon on the fly with the same pure `composeIcon` function used
 *      at build time (guarantees byte parity).
 *
 * No R2 write-back on miss — persistence comes from the next
 * `schema:build` + upload.
 */
async function composedIconHandler(
  c: Context<AppEnv>,
  variant: string,
): Promise<Response> {
  const ctx = loadCtx(c)
  const version = await resolveKnownVersion(ctx, c.req.param('version') ?? '')
  const elementId = c.req.param('element_id') ?? ''
  if (!ID_REGEX.test(elementId)) {
    throw apiErrors.badRequest(
      `Invalid element_id '${elementId}'.`,
      undefined,
      'Use [a-zA-Z0-9_-] only.',
    )
  }
  if (!ID_REGEX.test(variant)) {
    throw apiErrors.badRequest(
      `Invalid variant '${variant}'.`,
      undefined,
      'Use [a-zA-Z0-9_-] only.',
    )
  }

  const manifest = await loadManifest(ctx, version)
  if (!manifest) {
    throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)
  }

  // 1. Pre-baked hot path.
  const prebaked = await loadComposedIconSvg(ctx, version, elementId, variant)
  if (prebaked) {
    c.header('Content-Type', 'image/svg+xml; charset=utf-8')
    setIconCacheHeaders(c, manifest, { prebaked: true })
    return c.body(prebaked)
  }

  // 2. Miss-fallback: observability + on-the-fly composition.
  logIconMissFallback({
    version: version.canonical,
    element_id: elementId,
    variant,
  })

  const element = await loadElement(ctx, version, elementId)
  if (!element) {
    throw apiErrors.notFound(
      `Element '${elementId}' not found in ${version.canonical}.`,
      'Use GET /api/v2/schemas/:version/elements to enumerate available element ids.',
    )
  }

  const category = await loadCategory(ctx, version, element.category_id)
  if (!category) {
    // Build-time invariant; categories referenced by elements are
    // validated at `schema:build`. Surface as a clean 404 rather than
    // crashing the request.
    throw apiErrors.notFound(
      `Category '${element.category_id}' referenced by '${elementId}' not found in ${version.canonical}.`,
    )
  }

  const composeVariant = resolveComposeVariant(variant, category)
  if (!composeVariant) {
    throw apiErrors.notFound(
      `Unknown variant '${variant}' for element '${elementId}'.`,
      `Valid variants: ${validVariantsFor(category).join(', ')}.`,
    )
  }

  const symbolSvg = await loadSymbolSvg(ctx, version, element.symbol_id)
  if (!symbolSvg) {
    throw apiErrors.notFound(
      `Symbol '${element.symbol_id}' not found in ${version.canonical}.`,
    )
  }

  const svg = composeIcon({
    shape: category.shape,
    symbolSvg,
    variant: composeVariant,
  })
  c.header('Content-Type', 'image/svg+xml; charset=utf-8')
  setIconCacheHeaders(c, manifest, { prebaked: false })
  return c.body(svg)
}

function loadCtx(c: { env: Env; executionCtx?: { waitUntil(p: Promise<unknown>): void } }): LoadContext {
  return { bucket: c.env.CONTENT, ctx: c.executionCtx }
}

/**
 * Mount the REST surface at `/api/v2`. Returns a Hono sub-app the
 * caller can `app.route('/api/v2', restApp())`.
 *
 * Routes:
 *   GET  /schemas
 *   GET  /schemas/:version/manifest
 *   GET  /schemas/:version/categories
 *   GET  /schemas/:version/elements
 *   GET  /schemas/:version/elements/:element_id
 *   POST /schemas/:version/validate
 */
export function createRestApp() {
  const app = new Hono<AppEnv>()

  app.get('/schemas', async (c) => {
    const ctx = loadCtx(c)
    const index = await loadSchemaIndex(ctx)
    return c.json({ ok: true, versions: index.versions })
  })

  app.get('/schemas/:version/manifest', async (c) => {
    const ctx = loadCtx(c)
    const version = await resolveKnownVersion(ctx, c.req.param('version'))
    const manifest = await loadManifest(ctx, version)
    if (!manifest) throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)
    setVersionHeaders(c, manifest)
    return c.json({ ok: true, manifest })
  })

  app.get('/schemas/:version/categories', async (c) => {
    const ctx = loadCtx(c)
    const version = await resolveKnownVersion(ctx, c.req.param('version'))
    const manifest = await loadManifest(ctx, version)
    if (!manifest) throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)
    const allow = parseLocalesParam(c.req.query('locales'))
    const categories = (await loadCategories(ctx, version)) ?? []
    const filtered = categories.map((cat) => deepFilterLocales(cat, allow))
    setVersionHeaders(c, manifest)
    return c.json({ ok: true, version: version.canonical, categories: filtered })
  })

  app.get('/schemas/:version/elements', async (c) => {
    const ctx = loadCtx(c)
    const version = await resolveKnownVersion(ctx, c.req.param('version'))
    const manifest = await loadManifest(ctx, version)
    if (!manifest) throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)

    const allow = parseLocalesParam(c.req.query('locales'))
    const fields = parseFieldsParam(c.req.query('fields')) ?? DEFAULT_ELEMENT_FIELDS
    const limit = parseLimitParam(c.req.query('limit'))
    const offset = decodeCursor(c.req.query('cursor'))
    const categoryFilter = c.req.query('category_id')
    const query = c.req.query('query')

    let elements = (await loadElements(ctx, version)) ?? []
    if (categoryFilter) {
      elements = elements.filter((el) => el.category_id === categoryFilter)
    }

    if (query && query.trim().length > 0) {
      const searchLocale = (c.req.query('locale') ?? 'en') as 'en'
      const ids = await searchElementIds({ ctx, version, locale: searchLocale, query })
      // `null` means no index for this locale — leave elements in
      // natural order rather than zeroing them out.
      if (ids !== null) {
        elements = reorderByIds(elements, ids)
      }
    }

    const { page, nextCursor } = paginate(elements, offset, limit)
    const projected = page.map((el) => projectFields(el, fields))
    const filtered = projected.map((el) => deepFilterLocales(el, allow))

    setVersionHeaders(c, manifest)
    return c.json({
      ok: true,
      version: version.canonical,
      elements: filtered,
      meta: {
        total: elements.length,
        returned: filtered.length,
        next_cursor: nextCursor,
      },
    })
  })

  app.get('/schemas/:version/elements/:element_id', async (c) => {
    const ctx = loadCtx(c)
    const version = await resolveKnownVersion(ctx, c.req.param('version'))
    const manifest = await loadManifest(ctx, version)
    if (!manifest) throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)
    const elementId = c.req.param('element_id')
    const element = await loadElement(ctx, version, elementId)
    if (!element) {
      throw apiErrors.notFound(
        `Element '${elementId}' not found in ${version.canonical}.`,
        'Use GET /api/v2/schemas/:version/elements to enumerate available element ids.',
      )
    }
    const allow = parseLocalesParam(c.req.query('locales'))
    const fields = parseFieldsParam(c.req.query('fields')) ?? 'all'
    const projected = projectFields(element, fields)
    const filtered = deepFilterLocales(projected, allow)
    setVersionHeaders(c, manifest)
    return c.json({ ok: true, version: version.canonical, element: filtered })
  })

  app.post('/schemas/:version/validate', async (c) => {
    const ctx = loadCtx(c)
    const version = await resolveKnownVersion(ctx, c.req.param('version'))
    const manifest = await loadManifest(ctx, version)
    if (!manifest) throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)

    let raw: unknown
    try {
      raw = await c.req.json()
    } catch {
      throw apiErrors.badRequest(
        'Invalid JSON body.',
        undefined,
        'Send a valid JSON datachain-instance payload.',
      )
    }

    let parsed
    try {
      parsed = DatachainInstanceSchema.parse(raw)
    } catch (e) {
      if (e instanceof ZodError) {
        const errors = e.issues.map((iss) => ({
          code: 'parse_error',
          message: iss.message,
          path: iss.path.join('.'),
          fix_hint: 'Fix the field shape and retry.',
        }))
        return c.json({ ok: false, errors }, 200)
      }
      throw e
    }

    const datachainType = await loadDatachainType(ctx, version)
    const categories = (await loadCategories(ctx, version)) ?? []
    const elements = (await loadElements(ctx, version)) ?? []
    if (!datachainType) {
      throw apiErrors.notFound(`Datachain type for ${version.canonical} missing.`)
    }
    const result = validateInstance(
      { manifest, datachainType, categories, elements, symbols: {} },
      parsed,
    )
    setVersionHeaders(c, manifest)
    if (result.ok) {
      return c.json({ ok: true, warnings: result.warnings }, 200)
    }
    return c.json({ ok: false, errors: result.errors, warnings: result.warnings }, 200)
  })

  // Shape primitive — bundled with the worker code; not versioned
  // because the shape enum itself is part of the structural schema.
  //
  // Hono treats `:shape.svg` as a single param name containing the
  // literal `.svg` suffix (its param regex is `[^\{\}]+`, which
  // includes dots). Rather than use the regex-constraint form — which
  // would turn bad inputs into a router-level 404 — we strip the
  // suffix in-handler and validate with `ID_REGEX` so
  // `..%2Findex.svg` and friends surface as a clean 400 bad_request.
  app.get('/shapes/:shape', async (c) => {
    const raw = c.req.param('shape') ?? ''
    const shape = stripSvgSuffix(raw)
    if (shape === null) throw notFoundSvgRoute(raw)
    if (!ID_REGEX.test(shape)) {
      throw apiErrors.badRequest(
        `Invalid shape '${shape}'.`,
        undefined,
        'Use [a-zA-Z0-9_-] only.',
      )
    }
    if (!SHAPE_NAMES.has(shape)) {
      throw apiErrors.notFound(
        `Unknown shape '${shape}'.`,
        `Valid shapes: ${VALID_SHAPES.join(', ')}.`,
      )
    }
    const fragment = getShapeSvgFragment(shape as ShapeType, { fill: 'none', stroke: '#000' })
    const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">${fragment}</svg>`
    c.header('Content-Type', 'image/svg+xml; charset=utf-8')
    setIconCacheHeaders(c)
    return c.body(body)
  })

  // Release-pinned symbol SVG. The `.svg` suffix handling mirrors the
  // shape route above.
  app.get('/schemas/:version/symbols/:symbol_id', async (c) => {
    const ctx = loadCtx(c)
    const version = await resolveKnownVersion(ctx, c.req.param('version') ?? '')
    const raw = c.req.param('symbol_id') ?? ''
    const symbolId = stripSvgSuffix(raw)
    if (symbolId === null) throw notFoundSvgRoute(raw)
    if (!ID_REGEX.test(symbolId)) {
      throw apiErrors.badRequest(
        `Invalid symbol_id '${symbolId}'.`,
        undefined,
        'Use [a-zA-Z0-9_-] only.',
      )
    }
    const manifest = await loadManifest(ctx, version)
    if (!manifest) throw apiErrors.notFound(`Manifest for ${version.canonical} missing.`)
    const svg = await loadSymbolSvg(ctx, version, symbolId)
    if (!svg) {
      throw apiErrors.notFound(
        `Symbol '${symbolId}' not found in ${version.canonical}.`,
        'List available symbols via the schema manifest.',
      )
    }
    c.header('Content-Type', 'image/svg+xml; charset=utf-8')
    setIconCacheHeaders(c, manifest)
    return c.body(svg)
  })

  // Composed icon — both default and non-default variants funnel
  // through the same route pattern. Two mount forms were considered:
  //
  //   (a) `icon.svg` literal + `icon.:variant` with in-code suffix
  //       stripping (mirrors the symbol / shape handlers).
  //   (b) a single `:icon_variant` param that captures the whole
  //       final segment (`icon.svg`, `icon.dark.svg`, …) and parses
  //       it by hand.
  //
  // Form (a) is cleaner in principle but Hono 4.12 refuses to match
  // the literal `icon.` prefix in `icon.:variant`: the `:variant`
  // param never gets populated for `icon.dark.svg` and the route
  // falls through to 404. Form (b) matches reliably at the cost of
  // doing the split in handler code — which we already do for the
  // `.svg` suffix anyway, so the ergonomic gap is small. We pick (b).
  app.get(
    '/schemas/:version/elements/:element_id/:icon_variant',
    async (c) => {
      const raw = c.req.param('icon_variant') ?? ''
      const stripped = stripSvgSuffix(raw)
      if (stripped === null) throw notFoundSvgRoute(raw)
      if (stripped === 'icon') return composedIconHandler(c, 'default')
      if (stripped.startsWith('icon.')) {
        return composedIconHandler(c, stripped.slice('icon.'.length))
      }
      throw notFoundSvgRoute(raw)
    },
  )

  return app
}
