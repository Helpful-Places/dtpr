import { apiErrors } from '../middleware/errors.ts'

/**
 * Opaque cursor pagination (MCP spec, base64-encoded `{offset}`).
 *
 * Clients MUST treat cursors as opaque tokens — discard on schema
 * version change, never decode/manipulate. Validity is bounded by
 * the version because offset positions depend on the sorted element
 * list for a given snapshot.
 */

export const DEFAULT_LIMIT = 50
export const MAX_LIMIT = 200

interface CursorPayload {
  offset: number
}

export function encodeCursor(offset: number): string {
  const json = JSON.stringify({ offset } satisfies CursorPayload)
  return btoa(json)
}

export function decodeCursor(raw: string | null | undefined): number {
  if (!raw) return 0
  let decoded: string
  try {
    decoded = atob(raw)
  } catch {
    throw apiErrors.badRequest(
      'Invalid pagination cursor.',
      undefined,
      'Discard the cursor and re-issue the request without one, or pass a value previously returned by the API.',
    )
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(decoded)
  } catch {
    throw apiErrors.badRequest('Invalid pagination cursor.', undefined, 'Discard the cursor.')
  }
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    typeof (parsed as { offset?: unknown }).offset !== 'number' ||
    !Number.isInteger((parsed as { offset: number }).offset) ||
    (parsed as { offset: number }).offset < 0
  ) {
    throw apiErrors.badRequest('Invalid pagination cursor.', undefined, 'Discard the cursor.')
  }
  return (parsed as { offset: number }).offset
}

/**
 * Resolve a `?limit=` value to an integer in `[1, MAX_LIMIT]`. Rejects
 * non-integers and out-of-range values with a typed 400.
 */
export function parseLimitParam(raw?: string | null, fallback = DEFAULT_LIMIT): number {
  if (raw === undefined || raw === null || raw === '') return fallback
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0) {
    throw apiErrors.badRequest(
      `Invalid limit '${raw}'`,
      undefined,
      `Use a positive integer up to ${MAX_LIMIT}.`,
    )
  }
  if (n > MAX_LIMIT) {
    throw apiErrors.badRequest(
      `Limit ${n} exceeds maximum (${MAX_LIMIT}).`,
      undefined,
      `Reduce the limit to ${MAX_LIMIT} or less.`,
    )
  }
  return n
}

/**
 * Slice `items` for a single page. Returns the page + the cursor for
 * the next page (or null when there is none).
 */
export function paginate<T>(
  items: T[],
  offset: number,
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const page = items.slice(offset, offset + limit)
  const next = offset + limit
  return {
    page,
    nextCursor: next < items.length ? encodeCursor(next) : null,
  }
}
