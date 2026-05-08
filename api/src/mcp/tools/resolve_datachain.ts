import { z, ZodError } from 'zod'
import {
  ApiError,
  apiErrors,
  type ApiErrorShape,
} from '../../middleware/errors.ts'
import { canonicalStringify } from '../../resolver/canonical-stringify.ts'
import { resolve, type SchemaContext } from '../../resolver/resolve.ts'
import { DatachainInstanceSchema } from '../../schema/datachain-instance.ts'
import {
  loadCategories,
  loadDatachainType,
  loadElements,
  loadManifest,
  type LoadContext,
} from '../../store/index.ts'
import {
  normalizeVersionParam,
  resolveKnownVersion,
} from '../../rest/version-resolver.ts'
import { validateInstance } from '../../validator/semantic.ts'
import {
  errEnvelope,
  okEnvelope,
  toSoftFailureResult,
  toToolResult,
} from '../envelope.ts'
import type { ToolDef } from '../tools.ts'

const VersionString = z
  .string()
  .min(1)
  .describe('Schema version, e.g. "ai@2026-04-16". Use list_schema_versions to enumerate.')

const InputSchema = z.object({
  version: VersionString,
  datachain: z
    .unknown()
    .describe('Thin DTPR datachain instance. See schema_json.DatachainInstance.'),
})

// 512 KB cap on the resolved bundle (matches the REST handler in U5).
const RESOLVE_RESPONSE_CAP_BYTES = 512 * 1024

function schemaToJson(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: 'input',
    unrepresentable: 'any',
  }) as Record<string, unknown>
}

function errorsFrom(e: unknown): ApiErrorShape[] {
  if (e instanceof ZodError) {
    return e.issues.map((iss) => ({
      code: 'invalid_arguments',
      message: iss.message,
      path: iss.path.join('.'),
      fix_hint: 'Fix the field shape and retry.',
    }))
  }
  if (e instanceof ApiError) return e.errors
  if (e instanceof Error) return [{ code: 'internal_error', message: e.message }]
  return [{ code: 'internal_error', message: String(e) }]
}

/**
 * MCP `resolve_datachain` — sibling to the REST POST
 * `/schemas/:version/resolve` endpoint. Mirrors `validate_datachain`'s
 * envelope semantics: parse failures and semantic-validate failures
 * surface as `toSoftFailureResult` (`isError: false`) — invalid is
 * still a successful tool answer. The 512 KB response cap returns a
 * `payload_too_large` envelope rather than a truncated body.
 *
 * R7: validates the thin instance before assembling the snapshot.
 * Resolve itself is pure and trusts the parsed input.
 */
export function resolveDatachainTool(ctx: LoadContext): ToolDef {
  return {
    descriptor: {
      name: 'resolve_datachain',
      description:
        'Compose a thin DatachainInstance + the pinned schema slice into a ' +
        'ResolvedDatachain. The response carries `schema_snapshot` (referenced ' +
        'subset of categories/elements + full datachain_type), `suggested_elements: []`, ' +
        'and no authoring_provenance. Soft-failure (isError:false) on parse / ' +
        'semantic validate errors. Capped at 512 KB; over-cap returns a ' +
        'payload_too_large envelope.',
      inputSchema: schemaToJson(InputSchema),
    },
    handler: async (raw) => {
      let args
      try {
        args = InputSchema.parse(raw)
      } catch (e) {
        return toToolResult(errEnvelope(errorsFrom(e)))
      }
      try {
        normalizeVersionParam(args.version)
      } catch (e) {
        return toToolResult(errEnvelope(errorsFrom(e)))
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
            return toSoftFailureResult(
              errEnvelope(errorsFrom(e), {
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

        // R7: validate before resolve. Soft-failure on semantic errors.
        const semantic = validateInstance(
          { manifest, datachainType, categories, elements, symbols: {} },
          parsed,
        )
        if (!semantic.ok) {
          return toSoftFailureResult(
            errEnvelope(semantic.errors, {
              content_hash: manifest.content_hash,
              version: version.canonical,
              warnings: semantic.warnings.map((w) => `${w.code}: ${w.message}`),
            }),
          )
        }

        const schemaCtx: SchemaContext = {
          manifest,
          datachain_type: datachainType,
          categories,
          elements,
        }
        const resolved = resolve(parsed, schemaCtx)

        const serialized = canonicalStringify(resolved)
        const byteLength = new TextEncoder().encode(serialized).byteLength
        if (byteLength > RESOLVE_RESPONSE_CAP_BYTES) {
          return toSoftFailureResult(
            errEnvelope(
              [
                {
                  code: 'payload_too_large',
                  message: `Resolved bundle exceeds ${RESOLVE_RESPONSE_CAP_BYTES}-byte cap (got ${byteLength}).`,
                  fix_hint:
                    'Reduce locales/elements/categories pinned by the schema, or fetch the schema content separately.',
                },
              ],
              { content_hash: manifest.content_hash, version: version.canonical },
            ),
          )
        }

        return toSoftFailureResult(
          okEnvelope(resolved as unknown as Record<string, unknown>, {
            content_hash: manifest.content_hash,
            version: version.canonical,
          }),
        )
      } catch (e) {
        return toToolResult(errEnvelope(errorsFrom(e)))
      }
    },
  }
}
