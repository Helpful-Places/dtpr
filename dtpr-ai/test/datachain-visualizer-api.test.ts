import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validateAndResolve } from '../app/utils/datachain-visualizer-api'
import { DTPR_API_BASE } from '../app/utils/dtpr-api-config'

const VERSION = 'ai@2026-05-06-beta'

const VALID_INSTANCE = JSON.stringify({
  schema_version: VERSION,
  id: 'demo',
  title: [{ locale: 'en', value: 'Demo' }],
  elements: [],
})

interface MockResponse {
  status: number
  body: unknown
}

function fakeResponse(spec: MockResponse): Response {
  return {
    status: spec.status,
    json: async () => spec.body,
  } as unknown as Response
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('validateAndResolve', () => {
  it('returns the resolved instance when both calls succeed', async () => {
    const resolved = {
      schema_version: VERSION,
      schema_snapshot: { datachain_type: { categories: [] }, categories: [], elements: [] },
      suggested_elements: [],
      elements: [],
      instance: { schema_version: VERSION, id: 'demo' },
    }
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.endsWith('/validate')) return fakeResponse({ status: 200, body: { ok: true } })
      if (u.endsWith('/resolve'))
        return fakeResponse({ status: 200, body: { ok: true, version: VERSION, resolved } })
      throw new Error(`unexpected url: ${u}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve(VALID_INSTANCE)
    expect(result).toEqual({ ok: true, resolved })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      `${DTPR_API_BASE}/schemas/${encodeURIComponent(VERSION)}/validate`,
    )
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      `${DTPR_API_BASE}/schemas/${encodeURIComponent(VERSION)}/resolve`,
    )
  })

  it('returns invalid_json without calling fetch when JSON.parse fails', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve('{ not json')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].code).toBe('invalid_json')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns invalid_json when schema_version is missing', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve('{"id":"demo"}')
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].code).toBe('invalid_json')
    expect(result.errors[0].path).toBe('schema_version')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards validate failures and skips resolve', async () => {
    const validateError = {
      code: 'parse_error',
      message: 'Required field missing',
      path: 'elements.0.id',
      fix_hint: 'Set elements[0].id to a non-empty string.',
    }
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.endsWith('/validate'))
        return fakeResponse({ status: 200, body: { ok: false, errors: [validateError] } })
      throw new Error(`resolve should not be called, got ${u}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve(VALID_INSTANCE)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors).toEqual([validateError])
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('maps a 404 from validate to unsupported_schema_version (R6)', async () => {
    const fetchMock = vi.fn(async () =>
      fakeResponse({
        status: 404,
        body: {
          ok: false,
          errors: [
            {
              code: 'not_found',
              message: `Schema version '${VERSION}' is not registered.`,
              fix_hint: 'List available versions via GET /api/v2/schemas.',
            },
          ],
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve(VALID_INSTANCE)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].code).toBe('unsupported_schema_version')
    expect(result.errors[0].message).toContain(VERSION)
    expect(result.errors[0].path).toBe('schema_version')
  })

  it('maps a 404 from resolve (after a successful validate) to unsupported_schema_version', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.endsWith('/validate')) return fakeResponse({ status: 200, body: { ok: true } })
      if (u.endsWith('/resolve'))
        return fakeResponse({
          status: 404,
          body: {
            ok: false,
            errors: [
              { code: 'not_found', message: `Schema version '${VERSION}' is not registered.` },
            ],
          },
        })
      throw new Error(`unexpected url: ${u}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve(VALID_INSTANCE)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].code).toBe('unsupported_schema_version')
  })

  it('returns network_error when fetch rejects', async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError('fetch failed')
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve(VALID_INSTANCE)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].code).toBe('network_error')
    expect(result.errors[0].message).toContain('fetch failed')
  })

  it('falls back to api_error on a non-envelope 5xx', async () => {
    const fetchMock = vi.fn(async () =>
      fakeResponse({ status: 502, body: { error: 'bad gateway' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await validateAndResolve(VALID_INSTANCE)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected failure')
    expect(result.errors[0].code).toBe('api_error')
    expect(result.errors[0].message).toContain('502')
  })
})
