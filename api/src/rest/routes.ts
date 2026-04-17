import { Hono } from 'hono'
import { ZodError } from 'zod'
import type { AppEnv } from '../app-types.ts'
import { getShapeSvgFragment, SHAPES, type ShapeType } from '../icons/shapes.ts'
import { apiErrors } from '../middleware/errors.ts'
import { DatachainInstanceSchema } from '../schema/datachain-instance.ts'
import {
  loadCategories,
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

  return app
}
