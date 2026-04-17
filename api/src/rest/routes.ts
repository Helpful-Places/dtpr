import { Hono } from 'hono'
import { ZodError } from 'zod'
import type { AppEnv } from '../app-types.ts'
import { apiErrors } from '../middleware/errors.ts'
import { DatachainInstanceSchema } from '../schema/datachain-instance.ts'
import {
  loadCategories,
  loadDatachainType,
  loadElement,
  loadElements,
  loadManifest,
  loadSchemaIndex,
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
  setVersionHeaders,
} from './responses.ts'
import { reorderByIds, searchElementIds } from './search.ts'
import { resolveKnownVersion } from './version-resolver.ts'

const DEFAULT_ELEMENT_FIELDS = ['id', 'title', 'category_ids'] as const

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
      elements = elements.filter((el) => el.category_ids.includes(categoryFilter))
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
      { manifest, datachainType, categories, elements },
      parsed,
    )
    setVersionHeaders(c, manifest)
    if (result.ok) {
      return c.json({ ok: true, warnings: result.warnings }, 200)
    }
    return c.json({ ok: false, errors: result.errors, warnings: result.warnings }, 200)
  })

  return app
}
