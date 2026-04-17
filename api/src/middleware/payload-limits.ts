import type { MiddlewareHandler } from 'hono'
import { apiErrors } from './errors.ts'

/** Plan R30: 64 KB payload cap on every request. */
export const MAX_PAYLOAD_BYTES = 64 * 1024

/**
 * Rejects requests whose body exceeds the limit.
 *
 * If `Content-Length` is present we trust it as a cheap pre-parse
 * short-circuit. If it's absent (e.g. HTTP/1.1 chunked transfer
 * encoding from an Edge client), we drain the body stream ourselves,
 * counting bytes incrementally and aborting as soon as we cross the
 * cap — this prevents an attacker from forcing us to buffer a
 * gigabyte of chunked input before Zod ever gets a look.
 *
 * The drained bytes are seeded into Hono's `bodyCache` so the route
 * handler can still call `c.req.json()` / `c.req.text()` without
 * re-reading the (now-consumed) underlying `ReadableStream`.
 *
 * Depth (32) and array (1000) caps are enforced by Zod at parse time
 * rather than here — Zod sees the actual structure and can emit a
 * precise path.
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
      await next()
      return
    }

    // No declared length: we have to count bytes as they arrive.
    const stream = c.req.raw.body
    if (stream === null) {
      await next()
      return
    }

    const reader = stream.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value === undefined) continue
        total += value.byteLength
        if (total > maxBytes) {
          // Stop pulling more bytes from the wire and reject.
          await reader.cancel().catch(() => {})
          throw apiErrors.payloadTooLarge(maxBytes)
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    // Re-attach the consumed body via Hono's bodyCache so downstream
    // c.req.json()/text()/arrayBuffer() reuse the buffered bytes.
    // (Hono types `bodyCache` as Partial<Body>, but at runtime each
    // slot holds the resolved promise rather than a method — so we
    // cast through unknown to assign the buffered ArrayBuffer.)
    const buffer = concatChunks(chunks, total)
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer
    const cache = c.req.bodyCache as unknown as {
      arrayBuffer?: Promise<ArrayBuffer>
    }
    cache.arrayBuffer = Promise.resolve(arrayBuffer)

    await next()
  }

function concatChunks(chunks: Uint8Array[], total: number): Uint8Array {
  if (chunks.length === 1) return chunks[0]!
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}
