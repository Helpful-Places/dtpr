import { describe, it, expect } from 'vitest'
import { createApp } from '../../src/app.ts'

describe('smoke', () => {
  it('boots and responds to /healthz', async () => {
    const app = createApp()
    const res = await app.request('/healthz')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true, service: 'dtpr-api' })
  })
})
