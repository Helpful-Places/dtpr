/**
 * Behavioural helpers shared by the legacy suites.
 *
 * The sibling `legacy-fixtures.ts` is deliberately inert: inlined
 * capture text, a manifest, and lookups over them. These helpers touch
 * the test *runtime* instead — `cloudflare:test`'s bindings and
 * `caches.default` — so they live next to it rather than in it, and
 * every consuming suite imports from here rather than restating them
 * (the same rule `legacy-fixtures.ts` states for the capture itself).
 */

import { env } from 'cloudflare:test'
import { cacheKeyFor } from '../../src/store/cache-wrapper.ts'

/**
 * Drop the `caches.default` entries for a set of R2 keys.
 *
 * Legacy cache keys carry no version segment (see the caveat in
 * `store/keys.ts`) and `caches.default` under vitest-pool-workers is a
 * real Miniflare cache that outlives the per-file R2 isolation, so
 * cached bytes survive into a suite that never wrote them — including
 * the junk `test/unit/legacy-loader.test.ts` deliberately writes to
 * some of these keys. Every legacy suite therefore evicts the keys it
 * seeds *and* the ones it expects to miss before writing anything.
 */
export async function evict(keys: readonly string[]): Promise<void> {
  await Promise.all(keys.map((key) => caches.default.delete(cacheKeyFor(key))))
}

/** Wraps a bucket to count `get` calls — the only method the loaders use. */
export function countingBucket(inner: R2Bucket): { bucket: R2Bucket; reads: () => number } {
  let reads = 0
  const bucket = {
    get: (key: string) => {
      reads += 1
      return inner.get(key)
    },
  } as unknown as R2Bucket
  return { bucket, reads: () => reads }
}

/** The ambient bindings with `CONTENT` swapped for a stand-in bucket. */
export function withBucket(bucket: R2Bucket): Env {
  return { ...env, CONTENT: bucket }
}
