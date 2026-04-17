import { describe, it, expect } from 'vitest'
import { createApp } from '../../../src/app.ts'

describe('middleware: request-id', () => {
  it('generates a UUID when no header is sent', async () => {
    const app = createApp()
    const res = await app.request('/healthz')
    const id = res.headers.get('X-Request-Id')
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
  })

  it('echoes a safe caller-provided id', async () => {
    const app = createApp()
    const res = await app.request('/healthz', {
      headers: { 'X-Request-Id': 'abc-123' },
    })
    expect(res.headers.get('X-Request-Id')).toBe('abc-123')
  })

  it('regenerates when caller sends an unsafe id', async () => {
    const app = createApp()
    const res = await app.request('/healthz', {
      headers: { 'X-Request-Id': 'has spaces and !?' },
    })
    const id = res.headers.get('X-Request-Id') ?? ''
    expect(id).not.toBe('has spaces and !?')
    expect(id.length).toBeGreaterThan(0)
  })
})
