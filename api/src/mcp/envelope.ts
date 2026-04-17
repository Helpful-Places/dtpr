import type { ApiErrorShape } from '../middleware/errors.ts'

/**
 * Tool response envelopes mirror the REST `{ok, errors?}` shape so
 * agents see one consistent contract whether they call REST or MCP.
 *
 * Each envelope is emitted as both `structuredContent` (typed JSON for
 * 2025-06-18 MCP clients) and a back-compat `content[].text` block
 * carrying the same JSON serialized — older clients that don't yet
 * read structuredContent still get the data.
 */

export interface OkEnvelope<T> {
  ok: true
  data: T
  meta?: ResponseMeta
}

export interface ErrEnvelope {
  ok: false
  errors: ApiErrorShape[]
  meta?: ResponseMeta
}

export interface ResponseMeta {
  content_hash?: string
  next_cursor?: string | null
  warnings?: string[]
  /** Convenience: mirror the schema version on every response. */
  version?: string
}

export type Envelope<T> = OkEnvelope<T> | ErrEnvelope

export function okEnvelope<T>(data: T, meta?: ResponseMeta): OkEnvelope<T> {
  return meta ? { ok: true, data, meta } : { ok: true, data }
}

export function errEnvelope(errors: ApiErrorShape[], meta?: ResponseMeta): ErrEnvelope {
  return meta ? { ok: false, errors, meta } : { ok: false, errors }
}

/**
 * Shape an envelope into an MCP tool result. `isError` is set when the
 * envelope is `ok:false` AND the failure represents an operational
 * problem (unknown version, parse error, etc.). Semantic validation
 * results from `validate_datachain` are `ok:false` but NOT `isError`,
 * since the call itself ran successfully — the *result* is "invalid".
 */
export function toToolResult<T>(env: Envelope<T>, opts: { isError?: boolean } = {}) {
  const isError = opts.isError ?? (env.ok === false)
  return {
    structuredContent: env as unknown as Record<string, unknown>,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(env),
      },
    ],
    ...(isError ? { isError: true as const } : {}),
  }
}

/**
 * Soft-failure variant: a tool ran fine, but the answer is "no" or
 * "invalid". `validate_datachain` and per-id null entries from
 * `get_elements` use this so the MCP client doesn't treat them as
 * transport-level failures.
 */
export function toSoftFailureResult<T>(env: Envelope<T>) {
  return toToolResult(env, { isError: false })
}
