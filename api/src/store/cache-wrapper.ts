/**
 * Cache API wrapper for typed loaders.
 *
 * Wraps an arbitrary `loader: () => Promise<T | null>` so that the
 * loader's positive results are cached in `caches.default` keyed by
 * an internal URL. On cache hit the wrapper deserializes the stored
 * JSON and returns it without invoking the loader. `null` results are
 * never cached so a freshly-uploaded version becomes visible on the
 * next request rather than waiting out a TTL.
 *
 * Caveats:
 *  - `caches.default` is only persisted on Cloudflare custom domains.
 *    Local `wrangler dev --local` skips writes silently. The
 *    `vitest-pool-workers` runner exposes a working Cache API, so
 *    integration tests can assert hit/miss behavior.
 *  - Cache invalidation on schema promotion is handled implicitly:
 *    cache keys include the version directory, so a promoted
 *    `<type>/<date>/` directory has a different key than its
 *    `<type>/<date>-beta/` predecessor.
 */

export interface CacheOptions {
  /** Cache TTL in seconds. Used in the synthesized Cache-Control. */
  ttl: number
  /** When false, bypass cache entirely (read + write). */
  enabled: boolean
  /** Worker execution context for non-blocking cache writes. */
  ctx?: ExecutionContext
}

const CACHE_BASE = 'https://cache.internal.dtpr-api/'

/** Build a unique cache key from an arbitrary R2-style path. */
export function cacheKeyFor(path: string): string {
  // Cache API requires absolute URLs. Strip leading slashes so a path
  // like `schemas/ai/2026-04-16/elements.json` becomes a deterministic
  // URL under our internal namespace.
  const normalized = path.replace(/^\/+/, '')
  return `${CACHE_BASE}${normalized}`
}

/**
 * Memoize a JSON loader through `caches.default`.
 *
 * @param key Stable cache identifier (turned into an internal URL).
 * @param loader Source-of-truth fetcher; returns `null` for missing data.
 * @param options TTL + enabled flag + optional execution context.
 */
export async function cached<T>(
  key: string,
  loader: () => Promise<T | null>,
  options: CacheOptions,
): Promise<T | null> {
  if (!options.enabled) return loader()

  const cache = caches.default
  const req = new Request(cacheKeyFor(key))

  const hit = await cache.match(req)
  if (hit) {
    return (await hit.json()) as T
  }

  const value = await loader()
  if (value === null) return null

  const response = new Response(JSON.stringify(value), {
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${options.ttl}`,
    },
  })
  if (options.ctx) {
    options.ctx.waitUntil(cache.put(req, response.clone()))
  } else {
    await cache.put(req, response.clone())
  }
  return value
}

/**
 * Variant of {@link cached} for callers that need text rather than JSON
 * (used by the MiniSearch index loader, which deserializes via
 * `MiniSearch.loadJSON`).
 */
export async function cachedText(
  key: string,
  loader: () => Promise<string | null>,
  options: CacheOptions,
): Promise<string | null> {
  if (!options.enabled) return loader()

  const cache = caches.default
  const req = new Request(cacheKeyFor(key))

  const hit = await cache.match(req)
  if (hit) return hit.text()

  const value = await loader()
  if (value === null) return null

  const response = new Response(value, {
    headers: {
      'content-type': 'application/json',
      'cache-control': `public, max-age=${options.ttl}`,
    },
  })
  if (options.ctx) {
    options.ctx.waitUntil(cache.put(req, response.clone()))
  } else {
    await cache.put(req, response.clone())
  }
  return value
}
