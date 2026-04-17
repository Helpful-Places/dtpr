import type { MiddlewareHandler } from 'hono'
import { apiErrors } from './errors.ts'

/** Plan R30: 64 KB payload cap on every request. */
export const MAX_PAYLOAD_BYTES = 64 * 1024

/**
 * Rejects requests whose `Content-Length` exceeds the limit.
 *
 * Depth (32) and array (1000) caps are enforced by Zod at parse time
 * rather than here — Zod sees the actual structure and can emit a
 * precise path. This middleware is a cheap, pre-parse short-circuit
 * for obviously-too-large bodies.
 */
export const payloadLimits = (maxBytes = MAX_PAYLOAD_BYTES): MiddlewareHandler =>
  async (c, next) => {
    const lenHeader = c.req.header('content-length')
    if (lenHeader !== undefined) {
      const len = Number(lenHeader)
      if (!Number.isFinite(len) || len < 0) {
        throw apiErrors.badRequest(
          `Invalid Content-Length header: ${lenHeader}`,
          undefined,
          'Send a valid Content-Length or omit it.',
        )
      }
      if (len > maxBytes) {
        throw apiErrors.payloadTooLarge(maxBytes)
      }
    }
    await next()
  }
