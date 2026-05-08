import { z, ZodError } from 'zod'
import {
  ApiError,
  type ApiErrorShape,
} from '../../middleware/errors.ts'
import {
  normalizeCategoryLocales,
  normalizeDatachainTypeLocales,
  normalizeElementLocales,
} from '../../resolver/resolve.ts'
import { ResolvedDatachainInstanceSchema } from '../../schema/datachain-instance-resolved.ts'
import type { Element } from '../../schema/element.ts'
import {
  loadCategories,
  loadDatachainType,
  loadElements,
  loadManifest,
  loadSchemaIndex,
  type LoadContext,
} from '../../store/index.ts'
import {
  normalizeVersionParam,
  resolveKnownVersion,
} from '../../rest/version-resolver.ts'
import { validateResolvedInstance } from '../../validator/semantic.ts'
import type {
  CanonicalSchema,
  LoadCanonicalSchema,
} from '../../validator/index.ts'
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
    .describe('Resolved DTPR datachain. See schema_json.ResolvedDatachainInstance.'),
})

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
 * MCP `validate_resolved` — sibling to the REST POST
 * `/schemas/:version/validate_resolved` endpoint. Mirrors
 * `validate_datachain`'s soft-failure semantics. Snapshot consistency
 * (R9) only fires when the pinned `schema_version` is in `INDEX_KEY`;
 * otherwise the loader returns null and the validator skips it.
 */
export function validateResolvedTool(ctx: LoadContext): ToolDef {
  return {
    descriptor: {
      name: 'validate_resolved',
      description:
        'Validate a ResolvedDatachainInstance (snapshot-pinned form) against its referenced schema. ' +
        'Returns ok:true on success or ok:false with structured errors. ' +
        'Always isError:false — invalid is a successful answer. Snapshot consistency ' +
        '(snapshot_drift) is checked only when the pinned version is still in the schema index.',
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
          parsed = ResolvedDatachainInstanceSchema.parse(args.datachain)
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

        // R9 loader: returns null when the pinned version is absent
        // from the index; the validator then skips snapshot consistency
        // (graceful degradation). Canonical items are run through the
        // same locale normalizer the resolver uses so drift detection
        // compares apples-to-apples.
        //
        // The snapshot is pinned to `resolved.schema_version`, which
        // may differ from the tool-arg `version` — store reads,
        // manifest, and locale normalization all key off the snapshot's
        // pinned version, not the tool-arg handle.
        const loadCanonicalSchema: LoadCanonicalSchema = async (
          schemaVersion,
        ): Promise<CanonicalSchema | null> => {
          const index = await loadSchemaIndex(ctx)
          const known = index.versions.some((entry) => entry.id === schemaVersion)
          if (!known) return null
          const snapVersion = normalizeVersionParam(schemaVersion)
          const snapManifest = await loadManifest(ctx, snapVersion)
          if (!snapManifest) return null
          const dt = await loadDatachainType(ctx, snapVersion)
          const cats = (await loadCategories(ctx, snapVersion)) ?? []
          const els = (await loadElements(ctx, snapVersion)) ?? []
          if (!dt) return null
          // Strip MaterializedElement enrichments (shape, icon_variants)
          // — same as the REST handler.
          const plainElements = els.map((e) => {
            const { shape: _shape, icon_variants: _iv, ...rest } = e as Element & {
              shape?: unknown
              icon_variants?: unknown
            }
            return rest
          })
          const locales = snapManifest.locales
          return {
            datachainType: normalizeDatachainTypeLocales(dt, locales),
            categories: cats.map((c) => normalizeCategoryLocales(c, locales)),
            elements: plainElements.map((e) => normalizeElementLocales(e, locales)),
          }
        }

        const result = await validateResolvedInstance(parsed, { loadCanonicalSchema })
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
        return toToolResult(errEnvelope(errorsFrom(e)))
      }
    },
  }
}
