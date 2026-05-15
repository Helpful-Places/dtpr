import { gzipSync } from 'node:zlib'
import { afterEach, describe, expect, it } from 'vitest'
import {
  decodeFragment,
  FragmentUnsupportedError,
} from '../app/utils/datachain-visualizer-fragment'

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function gzipString(input: string): Uint8Array {
  const buf = gzipSync(Buffer.from(input, 'utf8'))
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength)
}

function buildHash(json: string, extra: string = ''): string {
  const gz = gzipString(json)
  const encoded = bytesToBase64Url(gz)
  return `#data=${encoded}${extra}`
}

afterEach(() => {
  // Tests may stub out DecompressionStream — restore the real one.
  // jsdom + Node 25 expose CompressionStream/DecompressionStream as
  // globals; nothing to do here besides a defensive delete-then-noop
  // when assignments leave undefined behind.
})

describe('decodeFragment', () => {
  it('round-trips a gzipped JSON payload byte-for-byte', async () => {
    const original = JSON.stringify({ schema_version: 'ai@2026-05-06-beta', id: 'demo' })
    const hash = buildHash(original)
    const decoded = await decodeFragment(hash)
    expect(decoded).toBe(original)
  })

  it('returns null when the hash has no data= key', async () => {
    expect(await decodeFragment('#foo=bar')).toBeNull()
    expect(await decodeFragment('')).toBeNull()
    expect(await decodeFragment('#')).toBeNull()
  })

  it('decodes when data= is mixed with extra params', async () => {
    const original = JSON.stringify({ ok: true })
    const hash = buildHash(original, '&trace=42')
    expect(await decodeFragment(hash)).toBe(original)
  })

  it('returns null for an empty data= value', async () => {
    expect(await decodeFragment('#data=')).toBeNull()
  })

  it('decodes payloads using the base64url alphabet (- and _)', async () => {
    // Construct bytes that base64-encode with + and / so we can test the
    // url-safe substitution path without a server-side encoder.
    const original = JSON.stringify({ x: '~~~~~~~~~~~~?>?>?>?>' })
    const hash = buildHash(original)
    // The fixture uses our own builder which already produces url-safe.
    expect(await decodeFragment(hash)).toBe(original)
    // Sanity: the encoded body should not contain + or /.
    expect(hash.includes('+')).toBe(false)
    expect(hash.includes('/')).toBe(false)
  })

  it('rejects payloads that contain characters outside the base64 alphabet', async () => {
    await expect(decodeFragment('#data=!!!nothex!!!')).rejects.toBeInstanceOf(
      FragmentUnsupportedError,
    )
  })

  it('rejects valid base64url that is not gzip data', async () => {
    const bytes = new TextEncoder().encode('{"not":"gzip"}')
    const hash = `#data=${bytesToBase64Url(bytes)}`
    await expect(decodeFragment(hash)).rejects.toBeInstanceOf(FragmentUnsupportedError)
  })

  it('throws FragmentUnsupportedError when DecompressionStream is missing', async () => {
    const original = JSON.stringify({ a: 1 })
    const hash = buildHash(original)
    const saved = (globalThis as { DecompressionStream?: typeof DecompressionStream })
      .DecompressionStream
    try {
      ;(globalThis as Record<string, unknown>).DecompressionStream = undefined
      await expect(decodeFragment(hash)).rejects.toBeInstanceOf(FragmentUnsupportedError)
    } finally {
      ;(globalThis as Record<string, unknown>).DecompressionStream = saved
    }
  })
})
