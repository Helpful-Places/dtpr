import { describe, it, expect } from 'vitest'
import { createApp } from '../../../src/app.ts'

describe('middleware: cors', () => {
  it('preflight returns Access-Control-Allow-Origin: * for any origin', async () => {
    const app = createApp()
    for (const origin of [
      'https://dtpr.io',
      'https://example.com',
      'https://evil.com',
      'http://localhost:3000',
    ]) {
      const res = await app.request('/healthz', {
        method: 'OPTIONS',
        headers: {
          Origin: origin,
          'Access-Control-Request-Method': 'GET',
        },
      })
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
    }
  })

  it('preflight advertises allowed methods and headers', async () => {
    const app = createApp()
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://example.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET')
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST')
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })

  it('actual requests also receive Access-Control-Allow-Origin: *', async () => {
    const app = createApp()
    const res = await app.request('/healthz', {
      headers: { Origin: 'https://example.com' },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
