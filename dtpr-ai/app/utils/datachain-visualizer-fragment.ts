// URL-hash deep-link decoder. A producer (a future DTPR authoring
// skill, a doc snippet, an external tool) builds `#data=<base64url
// of gzipped JSON>` and the visualizer page decodes it on mount and
// runs it through the same input-then-validate path a paste would use.
//
// Web standards only: `DecompressionStream('gzip')`, `atob`, and
// `TextDecoder`. No external dep. Browsers without
// `DecompressionStream` (older Safari) fail with a typed error so the
// page can surface a clear "paste JSON instead" notice without
// crashing.

export class FragmentUnsupportedError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message)
    this.name = 'FragmentUnsupportedError'
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause
  }
}

function base64UrlToBytes(base64url: string): Uint8Array {
  // Pad to the next multiple of 4, then convert -/_ → +/.
  const padded = base64url.padEnd(
    base64url.length + ((4 - (base64url.length % 4)) % 4),
    '=',
  )
  const standard = padded.replace(/-/g, '+').replace(/_/g, '/')
  // Defensive: any character outside the base64 alphabet should reject.
  if (/[^A-Za-z0-9+/=]/.test(standard)) {
    throw new FragmentUnsupportedError(
      'Deep-link payload contains characters outside the base64url alphabet.',
    )
  }
  let bin: string
  try {
    bin = atob(standard)
  } catch (err) {
    throw new FragmentUnsupportedError(
      'Deep-link payload could not be base64-decoded.',
      err,
    )
  }
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

async function gunzipBytesToString(bytes: Uint8Array): Promise<string> {
  const Decompression =
    typeof globalThis.DecompressionStream === 'function'
      ? globalThis.DecompressionStream
      : undefined
  if (!Decompression) {
    throw new FragmentUnsupportedError(
      'This browser does not support DecompressionStream — deep links cannot be expanded here.',
    )
  }

  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
  const stream = source.pipeThrough(new Decompression('gzip'))
  try {
    const text = await new Response(stream).text()
    return text
  } catch (err) {
    throw new FragmentUnsupportedError(
      'Deep-link payload is not valid gzip data.',
      err,
    )
  }
}

function readDataParam(hash: string): string | null {
  if (!hash) return null
  const stripped = hash.startsWith('#') ? hash.slice(1) : hash
  if (stripped.length === 0) return null
  for (const part of stripped.split('&')) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    const key = part.slice(0, eq)
    if (key !== 'data') continue
    const value = part.slice(eq + 1)
    if (value.length === 0) return null
    try {
      return decodeURIComponent(value)
    } catch (err) {
      throw new FragmentUnsupportedError(
        'Deep-link fragment contains invalid percent-encoding.',
        err,
      )
    }
  }
  return null
}

/**
 * Decode `#data=<base64url-gzipped-json>` to the embedded JSON text.
 * Returns `null` when the hash carries no `data=` value.
 * Throws `FragmentUnsupportedError` for malformed payloads or for
 * runtimes without `DecompressionStream`.
 */
export async function decodeFragment(hash: string): Promise<string | null> {
  const raw = readDataParam(hash)
  if (raw === null) return null
  const bytes = base64UrlToBytes(raw)
  return gunzipBytesToString(bytes)
}
