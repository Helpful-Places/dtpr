/**
 * Network plumbing for the UI iframe: a rate limiter sized to the
 * API's own budget, a bounded-concurrency map, and a fetch wrapper
 * that respects `Retry-After`.
 *
 * This matters more than it looks. A full library build is ~470
 * requests against an endpoint that allows 300 per minute, so the
 * plugin *will* hit the ceiling unless it paces itself.
 */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Sliding-window limiter. Keeps at most `limit` request starts inside
 * any `windowMs`, blocking callers until the window has room.
 */
export class RateLimiter {
  private readonly starts: number[] = []

  constructor(
    private readonly limit: number,
    private readonly windowMs = 60_000,
  ) {}

  async take(): Promise<void> {
    for (;;) {
      const now = Date.now()
      while (this.starts.length > 0 && now - (this.starts[0] as number) >= this.windowMs) {
        this.starts.shift()
      }
      if (this.starts.length < this.limit) {
        this.starts.push(now)
        return
      }
      const oldest = this.starts[0] as number
      // +50ms so we wake up just after the slot frees, not exactly on it.
      await sleep(this.windowMs - (now - oldest) + 50)
    }
  }
}

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export interface RequestOptions {
  limiter: RateLimiter
  headers: Record<string, string>
  /** Retries on 429 and on 5xx. */
  maxAttempts?: number
  signal?: () => boolean
}

const DEFAULT_MAX_ATTEMPTS = 4

/**
 * GET with pacing, `Retry-After` handling, and bounded retries.
 *
 * A 429 waits out the server's hint. A 5xx backs off exponentially. A
 * 4xx other than 429 is a bug in our request, so it fails immediately
 * rather than burning three more attempts on the same mistake.
 */
export async function get(url: string, options: RequestOptions): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  let lastError: unknown = null

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    if (options.signal?.()) throw new Error('Cancelled')
    await options.limiter.take()

    let response: Response
    try {
      response = await fetch(url, { headers: options.headers })
    } catch (error) {
      // Network-level failure (offline, DNS, TLS). Worth a retry.
      lastError = error
      if (attempt === maxAttempts) break
      await sleep(500 * 2 ** (attempt - 1))
      continue
    }

    if (response.ok) return response

    if (response.status === 429) {
      const hint = Number(response.headers.get('Retry-After'))
      const waitSeconds = Number.isFinite(hint) && hint > 0 ? hint : 10
      lastError = new HttpError(429, url, `Rate limited; waited ${waitSeconds}s`)
      if (attempt === maxAttempts) break
      await sleep(waitSeconds * 1000)
      continue
    }

    if (response.status >= 500) {
      lastError = new HttpError(response.status, url, `${response.status} from ${url}`)
      if (attempt === maxAttempts) break
      await sleep(500 * 2 ** (attempt - 1))
      continue
    }

    throw new HttpError(response.status, url, `${response.status} ${response.statusText} — ${url}`)
  }

  if (lastError instanceof Error) throw lastError
  throw new Error(`Request failed after ${maxAttempts} attempts: ${url}`)
}

/**
 * Run `worker` over `items` with at most `concurrency` in flight,
 * calling `onResult` as each finishes. Results are delivered out of
 * order by design — the sandbox reassembles them by id.
 */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onResult: (result: R, index: number) => void,
): Promise<void> {
  let cursor = 0
  const width = Math.max(1, Math.min(concurrency, items.length))

  const runners = Array.from({ length: width }, async () => {
    for (;;) {
      const index = cursor
      cursor += 1
      if (index >= items.length) return
      const result = await worker(items[index] as T, index)
      onResult(result, index)
    }
  })

  await Promise.all(runners)
}
