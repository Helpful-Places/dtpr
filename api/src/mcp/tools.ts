import { z, ZodError, type ZodType } from 'zod'
import {
  ApiError,
  apiErrors,
  type ApiErrorShape,
} from '../middleware/errors.ts'
import {
  loadCategories,
  loadDatachainType,
  loadElement,
  loadElements,
  loadManifest,
  loadSchemaIndex,
  loadSchemaJson,
  type LoadContext,
} from '../store/index.ts'
import {
  decodeCursor,
  paginate,
  parseLimitParam,
  MAX_LIMIT,
} from '../rest/pagination.ts'
import {
  deepFilterLocales,
  projectFields,
} from '../rest/responses.ts'
import { reorderByIds, searchElementIds } from '../rest/search.ts'
import {
  resolveKnownVersion,
  normalizeVersionParam,
} from '../rest/version-resolver.ts'
import { DatachainInstanceSchema } from '../schema/datachain-instance.ts'
import { LocaleCodeSchema, type LocaleCode } from '../schema/locale.ts'
import { validateInstance } from '../validator/semantic.ts'
import {
  errEnvelope,
  okEnvelope,
  toSoftFailureResult,
  toToolResult,
} from './envelope.ts'
import { renderDatachainTool } from './tools/render_datachain.ts'

/** Cap on bulk `get_elements` requests. Keeps the corpus shippable in one call. */
export const GET_ELEMENTS_MAX = 100
/** Per-id length cap inside `get_elements`. Enforced by the input schema. */
const ELEMENT_ID_MAX_LEN = 128

const DEFAULT_LIST_FIELDS = ['id', 'title', 'category_ids'] as const

/** Tool result envelope as serialized to MCP clients. */
export interface ToolResult {
  structuredContent?: Record<string, unknown>
  content: Array<{ type: 'text'; text: string }>
  isError?: true
}

/** Tool descriptor shipped in `tools/list` responses. */
export interface ToolDescriptor {
  name: string
  description: string
  inputSchema: Record<string, unknown>
  outputSchema?: Record<string, unknown>
}

export interface ToolDef {
  descriptor: ToolDescriptor
  handler: (args: Record<string, unknown>) => Promise<ToolResult>
}

export interface ToolRegistry {
  list(): ToolDescriptor[]
  get(name: string): ToolDef | undefined
}

function apiErrorToErrors(err: unknown): ApiErrorShape[] {
  if (err instanceof ApiError) return err.errors
  if (err instanceof Error) return [{ code: 'internal_error', message: err.message }]
  return [{ code: 'internal_error', message: String(err) }]
}

const VersionString = z.string().min(1).describe(
  'Schema version, e.g. "ai@2026-04-16". Use list_schema_versions to enumerate.',
)
const ElementId = z.string().min(1).describe('Element id (whitelisted to [a-zA-Z0-9_-]).')
const FieldsParam = z.union([z.array(z.string()), z.literal('all')])

/** Wrap a Zod schema as a draft-2020-12 input schema for tools/list. */
function schemaToJson(schema: ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: 'input',
    unrepresentable: 'any',
  }) as Record<string, unknown>
}

/**
 * Build a tool registry bound to a specific request context. Each
 * call to `/mcp` builds one of these; tool handlers close over the
 * provided `LoadContext` for R2 + caches. `sessionId` (from the
 * `mcp-session-id` request header) lets tools that persist state
 * across sub-requests (render_datachain → resources/read) key that
 * state per session.
 */
export function buildToolRegistry(ctx: LoadContext, sessionId: string): ToolRegistry {
  const tools: ToolDef[] = [
    listSchemaVersionsTool(ctx),
    getSchemaTool(ctx),
    listCategoriesTool(ctx),
    listElementsTool(ctx),
    getElementTool(ctx),
    getElementsTool(ctx),
    validateDatachainTool(ctx),
    renderDatachainTool(ctx, sessionId),
  ]
  const byName = new Map(tools.map((t) => [t.descriptor.name, t]))
  return {
    list: () => tools.map((t) => t.descriptor),
    get: (name) => byName.get(name),
  }
}

// ------------------------------------------------------------------ list_schema_versions
function listSchemaVersionsTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    datachain_type: z
      .string()
      .optional()
      .describe('Filter to one type, e.g. "ai". Omit to list every version.'),
  })
  return {
    descriptor: {
      name: 'list_schema_versions',
      description: 'List all known DTPR schema versions and their stability status.',
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      try {
        const args = inputSchema.parse(raw)
        const index = await loadSchemaIndex(ctx)
        const versions = args.datachain_type
          ? index.versions.filter((v) => v.id.startsWith(`${args.datachain_type}@`))
          : index.versions
        return toToolResult(okEnvelope({ versions }))
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
    },
  }
}

// ------------------------------------------------------------------ get_schema
function getSchemaTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    version: VersionString,
    include: z
      .enum(['manifest', 'full'])
      .default('manifest')
      .describe('"manifest" (default): manifest + categories. "full": also inline elements.'),
  })
  return {
    descriptor: {
      name: 'get_schema',
      description:
        'Fetch a schema version. By default returns manifest + categories + datachain-type; pass include="full" to also inline every element.',
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      try {
        const args = inputSchema.parse(raw)
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        const datachainType = await loadDatachainType(ctx, version)
        const categories = (await loadCategories(ctx, version)) ?? []
        const schemaJson = await loadSchemaJson(ctx, version)
        const data: Record<string, unknown> = {
          version: version.canonical,
          manifest,
          datachain_type: datachainType,
          categories,
          schema_json: schemaJson,
        }
        if (args.include === 'full') {
          data.elements = (await loadElements(ctx, version)) ?? []
        }
        return toToolResult(
          okEnvelope(data, { content_hash: manifest.content_hash, version: version.canonical }),
        )
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
    },
  }
}

// ------------------------------------------------------------------ list_categories
function listCategoriesTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    version: VersionString,
    locales: z
      .array(LocaleCodeSchema)
      .optional()
      .describe('Locales to retain in localized strings. Omit for every locale.'),
  })
  return {
    descriptor: {
      name: 'list_categories',
      description: 'List the categories defined in a schema version, with locale filtering.',
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      try {
        const args = inputSchema.parse(raw)
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        const categories = (await loadCategories(ctx, version)) ?? []
        const allow = args.locales ? new Set<LocaleCode>(args.locales) : null
        const filtered = categories.map((c) => deepFilterLocales(c, allow))
        return toToolResult(
          okEnvelope(
            { version: version.canonical, categories: filtered },
            { content_hash: manifest.content_hash, version: version.canonical },
          ),
        )
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
    },
  }
}

// ------------------------------------------------------------------ list_elements
function listElementsTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    version: VersionString,
    category_id: z.string().optional().describe('Restrict to one category.'),
    locale: LocaleCodeSchema.default('en').describe('Locale used for `query` search. Default "en".'),
    locales: z.array(LocaleCodeSchema).optional(),
    query: z.string().optional().describe('BM25 search across title (boost 3) + description.'),
    fields: FieldsParam.optional().describe(
      'Field projection. Default: ["id","title","category_ids"]. Pass "all" for full elements.',
    ),
    limit: z
      .number()
      .int()
      .positive()
      .max(MAX_LIMIT)
      .default(50)
      .describe(`Page size (1-${MAX_LIMIT}). Default 50.`),
    cursor: z.string().optional().describe('Opaque pagination cursor from a previous call.'),
  })
  return {
    descriptor: {
      name: 'list_elements',
      description:
        'List elements in a schema version. Supports category_id filter, BM25 `query`, locale filtering, projection, and opaque-cursor pagination.',
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      try {
        const args = inputSchema.parse(raw)
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        let elements = (await loadElements(ctx, version)) ?? []
        if (args.category_id) {
          elements = elements.filter((e) => e.category_ids.includes(args.category_id!))
        }
        if (args.query && args.query.trim().length > 0) {
          const ids = await searchElementIds({
            ctx,
            version,
            locale: args.locale,
            query: args.query,
          })
          // `null` means no index for this locale — leave elements in
          // natural order rather than zeroing them out.
          if (ids !== null) {
            elements = reorderByIds(elements, ids)
          }
        }
        const offset = decodeCursor(args.cursor)
        const limit = parseLimitParam(args.limit?.toString())
        const { page, nextCursor } = paginate(elements, offset, limit)
        const fields = args.fields ?? DEFAULT_LIST_FIELDS
        const allow = args.locales ? new Set<LocaleCode>(args.locales) : null
        const projected = page.map((el) => projectFields(el, fields))
        const filtered = projected.map((el) => deepFilterLocales(el, allow))
        return toToolResult(
          okEnvelope(
            {
              version: version.canonical,
              elements: filtered,
              total: elements.length,
              returned: filtered.length,
            },
            {
              content_hash: manifest.content_hash,
              next_cursor: nextCursor,
              version: version.canonical,
            },
          ),
        )
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
    },
  }
}

// ------------------------------------------------------------------ get_element
function getElementTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    version: VersionString,
    element_id: ElementId,
    locales: z.array(LocaleCodeSchema).optional(),
    fields: FieldsParam.optional(),
  })
  return {
    descriptor: {
      name: 'get_element',
      description: 'Point read for a single element by id.',
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      try {
        const args = inputSchema.parse(raw)
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        const element = await loadElement(ctx, version, args.element_id)
        if (!element) {
          return toToolResult(
            errEnvelope([
              {
                code: 'element_not_found',
                message: `Element '${args.element_id}' not found in ${version.canonical}.`,
                fix_hint: 'Use list_elements to enumerate available elements.',
              },
            ]),
          )
        }
        const fields = args.fields ?? 'all'
        const allow = args.locales ? new Set<LocaleCode>(args.locales) : null
        const projected = projectFields(element, fields)
        const filtered = deepFilterLocales(projected, allow)
        return toToolResult(
          okEnvelope(
            { version: version.canonical, element: filtered },
            { content_hash: manifest.content_hash, version: version.canonical },
          ),
        )
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
    },
  }
}

// ------------------------------------------------------------------ get_elements (bulk)
function getElementsTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    version: VersionString,
    element_ids: z
      .array(z.string().min(1).max(ELEMENT_ID_MAX_LEN))
      .min(1)
      .describe(`Element ids to fetch. Cap: ${GET_ELEMENTS_MAX} after dedupe.`),
    locales: z.array(LocaleCodeSchema).optional(),
    fields: FieldsParam.optional(),
  })
  return {
    descriptor: {
      name: 'get_elements',
      description: `Bulk point read for up to ${GET_ELEMENTS_MAX} elements in one call. Server-side dedupes repeated ids; per-id failures appear inline as null with an errors[] entry.`,
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      try {
        const args = inputSchema.parse(raw)
        const dedup = Array.from(new Set(args.element_ids))
        if (dedup.length > GET_ELEMENTS_MAX) {
          return toToolResult(
            errEnvelope([
              {
                code: 'element_ids_too_many',
                message: `Requested ${dedup.length} unique ids; cap is ${GET_ELEMENTS_MAX}.`,
                fix_hint: `Split into batches of ≤${GET_ELEMENTS_MAX} or use list_elements.`,
              },
            ]),
          )
        }
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        const fields = args.fields ?? 'all'
        const allow = args.locales ? new Set<LocaleCode>(args.locales) : null
        const elements: Record<string, unknown> = {}
        const errors: ApiErrorShape[] = []
        const reads = await Promise.all(
          dedup.map(async (id) => ({ id, element: await loadElement(ctx, version, id) })),
        )
        for (const { id, element } of reads) {
          if (!element) {
            elements[id] = null
            errors.push({
              code: 'element_not_found',
              message: `Element '${id}' not found.`,
              path: id,
              fix_hint: 'Use list_elements to enumerate available elements.',
            })
            continue
          }
          const projected = projectFields(element, fields)
          elements[id] = deepFilterLocales(projected, allow)
        }
        if (errors.length > 0) {
          return toSoftFailureResult({
            ok: false,
            errors,
            meta: { content_hash: manifest.content_hash, version: version.canonical },
            data: { version: version.canonical, elements },
          } as never)
        }
        return toToolResult(
          okEnvelope(
            { version: version.canonical, elements },
            { content_hash: manifest.content_hash, version: version.canonical },
          ),
        )
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
    },
  }
}

// ------------------------------------------------------------------ validate_datachain
function validateDatachainTool(ctx: LoadContext): ToolDef {
  const inputSchema = z.object({
    version: VersionString,
    datachain: z.unknown().describe('Datachain instance JSON. See schema_json.DatachainInstance.'),
  })
  return {
    descriptor: {
      name: 'validate_datachain',
      description:
        'Validate a datachain instance against a schema version. Returns ok:true on success or ok:false with structured errors + fix_hints. Always isError:false — invalid is a successful answer.',
      inputSchema: schemaToJson(inputSchema),
    },
    handler: async (raw) => {
      let args
      try {
        args = inputSchema.parse(raw)
      } catch (e) {
        return toToolResult(errEnvelope(zodOrApiErrors(e)))
      }
      try {
        normalizeVersionParam(args.version)
      } catch (e) {
        return toToolResult(errEnvelope(apiErrorToErrors(e)))
      }
      try {
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        let parsed
        try {
          parsed = DatachainInstanceSchema.parse(args.datachain)
        } catch (e) {
          if (e instanceof ZodError) {
            const errors = e.issues.map((iss) => ({
              code: 'parse_error',
              message: iss.message,
              path: iss.path.join('.'),
              fix_hint: 'Fix the field shape and retry.',
            }))
            return toSoftFailureResult(
              errEnvelope(errors, {
                content_hash: manifest.content_hash,
                version: version.canonical,
              }),
            )
          }
          throw e
        }
        const datachainType = await loadDatachainType(ctx, version)
        const categories = (await loadCategories(ctx, version)) ?? []
        const elements = (await loadElements(ctx, version)) ?? []
        if (!datachainType) {
          return toToolResult(
            errEnvelope([
              {
                code: 'unknown_version',
                message: `Datachain type for ${version.canonical} missing.`,
              },
            ]),
          )
        }
        const result = validateInstance(
          { manifest, datachainType, categories, elements },
          parsed,
        )
        if (result.ok) {
          return toSoftFailureResult(
            okEnvelope(
              { ok: true, warnings: result.warnings },
              { content_hash: manifest.content_hash, version: version.canonical },
            ),
          )
        }
        return toSoftFailureResult(
          errEnvelope(result.errors, {
            content_hash: manifest.content_hash,
            version: version.canonical,
            warnings: result.warnings.map((w) => `${w.code}: ${w.message}`),
          }),
        )
      } catch (e) {
        return toToolResult(errEnvelope(apiErrorToErrors(e)))
      }
    },
  }
}

function zodOrApiErrors(err: unknown): ApiErrorShape[] {
  if (err instanceof ZodError) {
    return err.issues.map((iss) => ({
      code: 'invalid_arguments',
      message: iss.message,
      path: iss.path.join('.'),
      fix_hint: 'Provide valid values for the tool arguments.',
    }))
  }
  return apiErrorToErrors(err)
}

export { apiErrors }
