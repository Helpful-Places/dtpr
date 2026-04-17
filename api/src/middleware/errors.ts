import type { ContentfulStatusCode } from 'hono/utils/http-status'

/**
 * Shape of a single error record in the public envelope. Contract is
 * stable — adding new `code` values is additive; renaming/removing is
 * a breaking change (guarded by snapshot fixtures in
 * `api/test/fixtures/error-envelopes/`).
 */
export interface ApiErrorShape {
  code: string
  message: string
  /** JSON path inside the caller's payload, e.g. `elements[3].category_id`. */
  path?: string
  /** Short actionable instruction for a caller (agent or human). */
  fix_hint?: string
}

export interface ApiErrorEnvelope {
  ok: false
  errors: ApiErrorShape[]
}

/**
 * Thrown anywhere in the request pipeline; caught by the global
 * `onError` handler (see `registerErrorHandler`). Carries the HTTP
 * status and one or more structured errors.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly errors: ApiErrorShape[],
  ) {
    super(errors[0]?.message ?? 'api error')
    this.name = 'ApiError'
  }
}

export function errorEnvelope(errors: ApiErrorShape[]): ApiErrorEnvelope {
  return { ok: false, errors }
}

/**
 * Known error-shape factories. Centralizing these keeps `code` values
 * consistent across REST + MCP surfaces and lets reviewers spot new
 * codes introduced by a change.
 */
export const apiErrors = {
  badRequest(message: string, path?: string, fix_hint?: string): ApiError {
    return new ApiError(400, [{ code: 'bad_request', message, path, fix_hint }])
  },
  notFound(message: string, fix_hint?: string): ApiError {
    return new ApiError(404, [{ code: 'not_found', message, fix_hint }])
  },
  payloadTooLarge(maxBytes: number): ApiError {
    return new ApiError(413, [
      {
        code: 'payload_too_large',
        message: `Request body exceeds ${maxBytes}-byte limit.`,
        fix_hint: 'Shrink the request or break it into smaller batches.',
      },
    ])
  },
  timeout(budgetMs: number): ApiError {
    return new ApiError(504, [
      {
        code: 'timeout',
        message: `Request exceeded ${budgetMs}-ms wall-clock budget.`,
        fix_hint: 'Retry; if persistent, reduce payload size or open an issue.',
      },
    ])
  },
  rateLimited(retryAfterSeconds: number): ApiError {
    return new ApiError(429, [
      {
        code: 'rate_limited',
        message: 'Rate limit exceeded.',
        fix_hint: `Wait ${retryAfterSeconds} seconds or set \`DTPR-Client\` for a dedicated bucket.`,
      },
    ])
  },
  upstreamError(key?: string): ApiError {
    return new ApiError(502, [
      {
        code: 'upstream_error',
        message: key
          ? `Schema store read failed for ${key}.`
          : 'Schema store unreachable.',
        fix_hint: 'Retry; if persistent, the content store may be degraded.',
      },
    ])
  },
  internal(): ApiError {
    return new ApiError(500, [
      { code: 'internal_error', message: 'Unexpected server error.' },
    ])
  },
}
