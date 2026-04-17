import { describe, it, expect } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { _test as corsTest } from '../../../src/middleware/cors.ts'

describe('middleware: cors', () => {
  it('allows explicit allow-list origins', () => {
    expect(corsTest.isAllowedOrigin('https://dtpr.io')).toBe(true)
    expect(corsTest.isAllowedOrigin('https://docs.dtpr.io')).toBe(true)
  })

  it('allows preview subdomains by pattern', () => {
    expect(corsTest.isAllowedOrigin('https://pr-42-preview.api.dtpr.io')).toBe(true)
  })

  it('allows localhost for development', () => {
    expect(corsTest.isAllowedOrigin('http://localhost:3000')).toBe(true)
    expect(corsTest.isAllowedOrigin('http://127.0.0.1:8787')).toBe(true)
  })

  it('rejects arbitrary origins', () => {
    expect(corsTest.isAllowedOrigin('https://evil.com')).toBe(false)
    expect(corsTest.isAllowedOrigin('https://dtpr.io.evil.com')).toBe(false)
  })

  it('preflight returns matching Access-Control-Allow-Origin for allowed origin', async () => {
    const app = createApp()
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://dtpr.io',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://dtpr.io')
  })

  it('preflight does not set allow-origin for a disallowed origin', async () => {
    const app = createApp()
    const res = await app.request('/healthz', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://evil.com',
        'Access-Control-Request-Method': 'GET',
      },
    })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
