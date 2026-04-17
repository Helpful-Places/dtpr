import { describe, it, expect, beforeEach } from 'vitest'
import { cached, cachedText, cacheKeyFor } from '../../src/store/cache-wrapper.ts'

/**
 * caches.default in vitest-pool-workers is a real Miniflare cache,
 * so hits/misses behave like production. Each test uses a unique key
 * to keep ordering between cases independent.
 */

let counter = 0
const uniqueKey = (label: string) => `test/${label}/${Date.now()}-${counter++}`

describe('cache-wrapper: cached', () => {
  beforeEach(() => {
    counter++
  })

  it('first call invokes loader; second call serves from cache', async () => {
    const key = uniqueKey('basic-hit')
    let calls = 0
    const loader = async () => {
      calls++
      return { foo: 'bar', n: calls }
    }
    const r1 = await cached<{ foo: string; n: number }>(key, loader, { enabled: true, ttl: 60 })
    const r2 = await cached<{ foo: string; n: number }>(key, loader, { enabled: true, ttl: 60 })
    expect(r1).toEqual({ foo: 'bar', n: 1 })
    expect(r2).toEqual({ foo: 'bar', n: 1 })
    expect(calls).toBe(1)
  })

  it('does not cache null results so missing data becomes visible immediately', async () => {
    const key = uniqueKey('null-not-cached')
    let calls = 0
    let value: { x: number } | null = null
    const loader = async () => {
      calls++
      return value
    }
    expect(await cached<{ x: number }>(key, loader, { enabled: true, ttl: 60 })).toBeNull()
    value = { x: 42 }
    expect(await cached<{ x: number }>(key, loader, { enabled: true, ttl: 60 })).toEqual({ x: 42 })
    expect(calls).toBe(2)
  })

  it('bypasses cache when enabled=false', async () => {
    const key = uniqueKey('disabled')
    let calls = 0
    const loader = async () => {
      calls++
      return { tick: calls }
    }
    await cached<{ tick: number }>(key, loader, { enabled: false, ttl: 60 })
    await cached<{ tick: number }>(key, loader, { enabled: false, ttl: 60 })
    expect(calls).toBe(2)
  })

  it('different keys do not share cache entries', async () => {
    const a = uniqueKey('isolated-a')
    const b = uniqueKey('isolated-b')
    const ra = await cached<string>(a, async () => 'A', { enabled: true, ttl: 60 })
    const rb = await cached<string>(b, async () => 'B', { enabled: true, ttl: 60 })
    expect(ra).toBe('A')
    expect(rb).toBe('B')
  })

  it('uses ctx.waitUntil for background cache writes when provided', async () => {
    const key = uniqueKey('waituntil')
    const ctx = createCtx()
    let calls = 0
    const loader = async () => {
      calls++
      return { v: calls }
    }
    const r1 = await cached(key, loader, { enabled: true, ttl: 60, ctx })
    expect(r1).toEqual({ v: 1 })
    expect(ctx.queue.length).toBe(1)
    await Promise.all(ctx.queue)
    const r2 = await cached(key, loader, { enabled: true, ttl: 60, ctx })
    expect(r2).toEqual({ v: 1 })
    expect(calls).toBe(1)
  })
})

describe('cache-wrapper: cachedText', () => {
  it('round-trips text without parsing it', async () => {
    const key = uniqueKey('text')
    const payload = '{"a":1,"b":[true,null,"xx"]}'
    let calls = 0
    const loader = async () => {
      calls++
      return payload
    }
    const r1 = await cachedText(key, loader, { enabled: true, ttl: 60 })
    const r2 = await cachedText(key, loader, { enabled: true, ttl: 60 })
    expect(r1).toBe(payload)
    expect(r2).toBe(payload)
    expect(calls).toBe(1)
  })
})

describe('cache-wrapper: cacheKeyFor', () => {
  it('strips leading slashes and produces an absolute URL', () => {
    expect(cacheKeyFor('schemas/ai/2026-04-16/manifest.json')).toBe(
      'https://cache.internal.dtpr-api/schemas/ai/2026-04-16/manifest.json',
    )
    expect(cacheKeyFor('/schemas/index.json')).toBe(
      'https://cache.internal.dtpr-api/schemas/index.json',
    )
  })
})

function createCtx(): { queue: Promise<unknown>[] } & ExecutionContext {
  const queue: Promise<unknown>[] = []
  const ctx = {
    waitUntil(p: Promise<unknown>) {
      queue.push(p)
    },
    passThroughOnException() {},
    props: {} as never,
    exports: {} as never,
    queue,
  }
  return ctx as { queue: Promise<unknown>[] } & ExecutionContext
}
