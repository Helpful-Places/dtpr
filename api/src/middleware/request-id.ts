import { requestId as honoRequestId } from 'hono/request-id'
import type { MiddlewareHandler } from 'hono'

/**
 * Stamps every request with an `X-Request-Id` header. Reuses Hono's
 * built-in middleware so incoming IDs are respected (subject to safe
 * character/length limits) and generates a UUID when absent.
 *
 * `c.var.requestId` is typed via `hono/request-id`'s module augmentation.
 */
export const configuredRequestId = (): MiddlewareHandler =>
  honoRequestId({
    headerName: 'X-Request-Id',
    // Keep defaults for generator + length limit.
  })
