import { describe, it, expect } from 'vitest'
import { createApp } from '../../../src/app.ts'

/**
 * The noindex middleware is registered unconditionally but only
 * stamps the header when `c.env.ENVIRONMENT === 'preview'`. These
 * tests inject `env` via Hono's three-argument `app.request()` so
 * the same `createApp()` build can simulate prod and preview.
 */

describe('middleware: noindex', () => {
  it('adds X-Robots-Tag on preview', async () => {
    const app = createApp()
    const res = await app.request(
      '/healthz',
      {},
      { ENVIRONMENT: 'preview' } as Record<string, unknown>,
    )
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow')
  })

  it('does not add X-Robots-Tag in production (no ENVIRONMENT var)', async () => {
    const app = createApp()
    const res = await app.request('/healthz')
    expect(res.status).toBe(200)
    expect(res.headers.get('X-Robots-Tag')).toBeNull()
  })

  it('does not add X-Robots-Tag when ENVIRONMENT is an unexpected value', async () => {
    const app = createApp()
    const res = await app.request(
      '/healthz',
      {},
      { ENVIRONMENT: 'staging' } as Record<string, unknown>,
    )
    expect(res.headers.get('X-Robots-Tag')).toBeNull()
  })
})
