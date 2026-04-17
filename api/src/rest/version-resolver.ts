import {
  InvalidVersionError,
  parseVersion,
  type ParsedVersion,
} from '../../cli/lib/version-parser.ts'
import { apiErrors } from '../middleware/errors.ts'
import { loadSchemaIndex, type LoadContext } from '../store/index.ts'

/**
 * Parse a `:version` path param.
 *
 * Handles both the canonical `ai@2026-04-16-beta` and the
 * URL-encoded `ai%402026-04-16-beta` forms. Hono already decodes
 * single-pass, but we defensively decode again so a double-encoded
 * value (rare) still works. Malformed input throws 400 with the
 * specific parser error.
 */
export function normalizeVersionParam(raw: string): ParsedVersion {
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    throw apiErrors.badRequest(
      `Malformed version parameter: ${raw}`,
      undefined,
      "Use the canonical 'type@YYYY-MM-DD[-beta]' form.",
    )
  }
  try {
    return parseVersion(decoded)
  } catch (e) {
    if (e instanceof InvalidVersionError) {
      throw apiErrors.badRequest(
        e.message,
        undefined,
        "Use the canonical 'type@YYYY-MM-DD[-beta]' form.",
      )
    }
    throw e
  }
}

/**
 * Parse the param and confirm the version is registered in
 * `schemas/index.json`. This is the path every read route takes so
 * unknown versions 404 with a helpful fix_hint before any other R2
 * reads are attempted.
 */
export async function resolveKnownVersion(
  ctx: LoadContext,
  raw: string,
): Promise<ParsedVersion> {
  const version = normalizeVersionParam(raw)
  const index = await loadSchemaIndex(ctx)
  const known = index.versions.some((entry) => entry.id === version.canonical)
  if (!known) {
    throw apiErrors.notFound(
      `Schema version '${version.canonical}' is not registered.`,
      'List available versions via GET /api/v2/schemas.',
    )
  }
  return version
}
