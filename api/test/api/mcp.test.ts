import { describe, it, expect, beforeAll } from 'vitest'
import { SELF } from 'cloudflare:test'
import { SAMPLE_VERSION, seedVersion } from './seed.ts'
import { createMcpClient, structured, type ToolCallResult } from './mcp-client.ts'

interface ToolListResult {
  tools: Array<{
    name: string
    description?: string
    inputSchema?: { properties?: Record<string, unknown> }
  }>
}

interface VersionsPayload {
  ok: boolean
  data: { versions: Array<{ id: string; status: string }> }
}

interface ListElementsPayload {
  ok: boolean
  data: {
    version: string
    elements: Array<Record<string, unknown>>
    total: number
    returned: number
  }
  meta?: { next_cursor?: string | null; content_hash?: string }
}

interface SingleElementPayload {
  ok: boolean
  data?: { element: Record<string, unknown> }
  errors?: Array<{ code: string; fix_hint?: string }>
}

interface ValidatePayload {
  ok: boolean
  data?: { ok: boolean }
  errors?: Array<{ code: string; fix_hint?: string }>
}

interface BulkPayload {
  ok: boolean
  data?: { elements: Record<string, unknown> }
  errors?: Array<{ code: string; path?: string; fix_hint?: string }>
}

beforeAll(async () => {
  await seedVersion()
})

describe('MCP: jsonrpc version validation', () => {
  async function postRaw(payload: unknown): Promise<{ status: number; body: Record<string, unknown> }> {
    const res = await SELF.fetch('https://example.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify(payload),
    })
    const body = (await res.json()) as Record<string, unknown>
    return { status: res.status, body }
  }

  it('rejects jsonrpc:"1.0" with INVALID_REQUEST', async () => {
    const { body } = await postRaw({ jsonrpc: '1.0', id: 1, method: 'initialize' })
    const err = body.error as { code: number; message: string } | undefined
    expect(err?.code).toBe(-32600)
    expect(err?.message).toMatch(/jsonrpc/i)
    expect(body.id).toBe(1)
  })

  it('rejects requests missing the jsonrpc field with INVALID_REQUEST', async () => {
    const { body } = await postRaw({ id: 2, method: 'initialize' })
    const err = body.error as { code: number; message: string } | undefined
    expect(err?.code).toBe(-32600)
    expect(err?.message).toMatch(/jsonrpc/i)
    expect(body.id).toBe(2)
  })

  it('rejects per-entry in batch requests', async () => {
    const { body } = await postRaw([
      { jsonrpc: '2.0', id: 10, method: 'ping' },
      { jsonrpc: '1.0', id: 11, method: 'ping' },
    ])
    const arr = body as unknown as Array<Record<string, unknown>>
    expect(Array.isArray(arr)).toBe(true)
    const ok = arr.find((r) => r.id === 10)
    const bad = arr.find((r) => r.id === 11)
    expect(ok?.result).toBeDefined()
    expect((bad?.error as { code: number } | undefined)?.code).toBe(-32600)
  })

  it('all-notification batch returns 204, not an empty array (JSON-RPC §6)', async () => {
    const res = await SELF.fetch('https://example.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify([
        { jsonrpc: '2.0', method: 'notifications/initialized' },
        { jsonrpc: '2.0', method: 'initialized' },
      ]),
    })
    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')
  })
})

describe('MCP: handshake + tools/list', () => {
  it('initialize returns server info', async () => {
    const client = createMcpClient()
    const res = await client.initialize()
    expect(res.error).toBeUndefined()
    expect((res.result as { serverInfo: { name: string } }).serverInfo.name).toBe('dtpr-api')
  })

  it('tools/list returns every registered tool', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.listTools()
    expect(res.error).toBeUndefined()
    const names = (res.result as ToolListResult).tools.map((t) => t.name).sort()
    expect(names).toEqual(
      [
        'get_element',
        'get_elements',
        'get_icon_url',
        'get_schema',
        'list_categories',
        'list_elements',
        'list_schema_versions',
        'render_datachain',
        'validate_datachain',
      ].sort(),
    )
  })

  it('every tool carries a non-empty description', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.listTools()
    for (const tool of (res.result as ToolListResult).tools) {
      expect(tool.description?.length ?? 0).toBeGreaterThan(0)
    }
  })

  it('tool inputSchema includes the documented parameters', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.listTools()
    const listElements = (res.result as ToolListResult).tools.find(
      (t) => t.name === 'list_elements',
    )
    const props = listElements?.inputSchema?.properties ?? {}
    expect(Object.keys(props)).toEqual(
      expect.arrayContaining(['version', 'category_id', 'locale', 'query', 'limit', 'cursor']),
    )
  })
})

describe('MCP: list_schema_versions', () => {
  it('returns the seeded versions', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<VersionsPayload>>(
      'list_schema_versions',
      {},
    )
    const env = structured(res)
    expect(env.ok).toBe(true)
    expect(env.data.versions[0]?.id).toBe(SAMPLE_VERSION.canonical)
  })

  it('filters by datachain_type', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<VersionsPayload>>('list_schema_versions', {
      datachain_type: 'device',
    })
    const env = structured(res)
    expect(env.data.versions).toEqual([])
  })
})

describe('MCP: get_schema', () => {
  it('manifest mode does not inline elements', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<{ ok: true; data: Record<string, unknown> }>>(
      'get_schema',
      { version: SAMPLE_VERSION.canonical },
    )
    const env = structured(res)
    expect((env.data as Record<string, unknown>).manifest).toBeDefined()
    expect((env.data as Record<string, unknown>).elements).toBeUndefined()
  })

  it('full mode inlines elements', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<{ ok: true; data: { elements: unknown[] } }>>(
      'get_schema',
      { version: SAMPLE_VERSION.canonical, include: 'full' },
    )
    const env = structured(res)
    expect(env.data.elements.length).toBeGreaterThan(0)
  })
})

describe('MCP: list_elements', () => {
  it('default projection returns id, title, category_id (icon_variants NOT included)', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<ListElementsPayload>>('list_elements', {
      version: SAMPLE_VERSION.canonical,
    })
    const env = structured(res)
    const fields = Object.keys(env.data.elements[0] ?? {}).sort()
    expect(fields).toEqual(['category_id', 'id', 'title'])
    // icon_variants is emitted by the build step but NOT part of the
    // compact default projection; callers must opt in.
    for (const el of env.data.elements) {
      expect(Object.prototype.hasOwnProperty.call(el, 'icon_variants')).toBe(false)
    }
  })

  it('returns icon_variants when requested via explicit fields', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<ListElementsPayload>>('list_elements', {
      version: SAMPLE_VERSION.canonical,
      fields: ['id', 'icon_variants'],
    })
    const env = structured(res)
    expect(env.data.elements.length).toBeGreaterThan(0)
    for (const el of env.data.elements) {
      const variants = (el as { icon_variants?: unknown }).icon_variants
      expect(Array.isArray(variants)).toBe(true)
      expect(variants as string[]).toEqual(
        expect.arrayContaining(['default', 'dark']),
      )
    }
  })

  it('search ranks identifiable_video first for "video"', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<ListElementsPayload>>('list_elements', {
      version: SAMPLE_VERSION.canonical,
      query: 'video',
    })
    const env = structured(res)
    expect((env.data.elements[0] as { id: string }).id).toBe('identifiable_video')
  })

  it('paginates with opaque cursor', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res1 = await client.callTool<ToolCallResult<ListElementsPayload>>('list_elements', {
      version: SAMPLE_VERSION.canonical,
      limit: 1,
    })
    const env1 = structured(res1)
    expect(env1.data.returned).toBe(1)
    expect(env1.meta?.next_cursor).toBeTruthy()

    const res2 = await client.callTool<ToolCallResult<ListElementsPayload>>('list_elements', {
      version: SAMPLE_VERSION.canonical,
      limit: 1,
      cursor: env1.meta!.next_cursor!,
    })
    const env2 = structured(res2)
    expect(env2.data.returned).toBe(1)
  })

  it('content_hash returned in meta', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<ListElementsPayload>>('list_elements', {
      version: SAMPLE_VERSION.canonical,
    })
    const env = structured(res)
    expect(env.meta?.content_hash).toMatch(/^sha256-/)
  })
})

describe('MCP: get_element', () => {
  it('returns the element', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<SingleElementPayload>>('get_element', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
    })
    const env = structured(res)
    expect((env.data?.element as { id: string }).id).toBe('accept_deny')
  })

  it('surfaces symbol_id, shape, and icon_variants on a full projection', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<SingleElementPayload>>('get_element', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
      fields: 'all',
    })
    const env = structured(res)
    const element = env.data?.element as {
      symbol_id?: string
      shape?: string
      icon_variants?: string[]
    }
    expect(element.symbol_id).toBe('accept_deny')
    expect(element.shape).toBe('hexagon')
    expect(element.icon_variants).toEqual(
      expect.arrayContaining(['default', 'dark']),
    )
  })

  it('unknown id returns isError with element_not_found', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<SingleElementPayload>>('get_element', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'nope',
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.[0]?.code).toBe('element_not_found')
    expect(env.errors?.[0]?.fix_hint).toContain('list_elements')
    expect(res.result?.isError).toBe(true)
  })

  it('unknown version returns isError with unknown_version', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<SingleElementPayload>>('get_element', {
      version: 'ai@2099-12-31',
      element_id: 'accept_deny',
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.[0]?.code).toBe('not_found')
  })
})

describe('MCP: get_elements (bulk)', () => {
  it('returns multiple elements keyed by id', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<BulkPayload>>('get_elements', {
      version: SAMPLE_VERSION.canonical,
      element_ids: ['accept_deny', 'identifiable_video'],
    })
    const env = structured(res)
    expect(Object.keys(env.data?.elements ?? {}).sort()).toEqual([
      'accept_deny',
      'identifiable_video',
    ])
  })

  it('deduplicates repeated ids', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<BulkPayload>>('get_elements', {
      version: SAMPLE_VERSION.canonical,
      element_ids: ['accept_deny', 'accept_deny', 'accept_deny'],
    })
    const env = structured(res)
    expect(Object.keys(env.data?.elements ?? {})).toEqual(['accept_deny'])
  })

  it('per-id miss returns null + an inline error entry, not a hard failure', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<BulkPayload>>('get_elements', {
      version: SAMPLE_VERSION.canonical,
      element_ids: ['accept_deny', 'nope'],
    })
    const env = structured(res)
    expect(env.data?.elements?.accept_deny).toBeTruthy()
    expect(env.data?.elements?.nope).toBeNull()
    expect(env.errors?.find((e) => e.path === 'nope')?.code).toBe('element_not_found')
    // Soft failure — call succeeded.
    expect(res.result?.isError).toBeUndefined()
  })

  it('rejects when too many ids are sent', async () => {
    const client = createMcpClient()
    await client.initialize()
    const ids = Array.from({ length: 101 }, (_, i) => `id_${i}`)
    const res = await client.callTool<ToolCallResult<BulkPayload>>('get_elements', {
      version: SAMPLE_VERSION.canonical,
      element_ids: ids,
    })
    const env = structured(res)
    expect(env.errors?.[0]?.code).toBe('element_ids_too_many')
  })
})

describe('MCP: validate_datachain', () => {
  it('valid datachain returns ok:true (soft success)', async () => {
    const client = createMcpClient()
    await client.initialize()
    const datachain = {
      id: 'i1',
      schema_version: SAMPLE_VERSION.canonical,
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }],
    }
    const res = await client.callTool<ToolCallResult<ValidatePayload>>('validate_datachain', {
      version: SAMPLE_VERSION.canonical,
      datachain,
    })
    const env = structured(res)
    expect(env.ok).toBe(true)
    expect(env.data?.ok).toBe(true)
    expect(res.result?.isError).toBeUndefined()
  })

  it('invalid datachain returns ok:false but isError:false (semantic failure)', async () => {
    const client = createMcpClient()
    await client.initialize()
    const datachain = {
      id: 'i2',
      schema_version: SAMPLE_VERSION.canonical,
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny' }, { element_id: 'unknown_one' }],
    }
    const res = await client.callTool<ToolCallResult<ValidatePayload>>('validate_datachain', {
      version: SAMPLE_VERSION.canonical,
      datachain,
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors && env.errors.length).toBeGreaterThan(0)
    expect(res.result?.isError).toBeUndefined()
  })

  it('malformed datachain shape returns parse_error envelope', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<ValidatePayload>>('validate_datachain', {
      version: SAMPLE_VERSION.canonical,
      datachain: { wrong: 'shape' },
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.every((e) => e.code === 'parse_error')).toBe(true)
  })
})

interface IconUrlPayload {
  ok: boolean
  data?: {
    url: string
    content_type: string
    variant: string
    valid_variants?: string[]
  }
  errors?: Array<{ code: string; message: string; fix_hint?: string }>
}

describe('MCP: get_icon_url', () => {
  it('omitted variant defaults to `default` and the bare icon.svg URL', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
    })
    const env = structured(res)
    expect(env.ok).toBe(true)
    expect(env.data?.variant).toBe('default')
    expect(env.data?.content_type).toBe('image/svg+xml')
    expect(env.data?.url).toBe(
      `/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny/icon.svg`,
    )
  })

  it('dark variant produces icon.dark.svg', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
      variant: 'dark',
    })
    const env = structured(res)
    expect(env.ok).toBe(true)
    expect(env.data?.variant).toBe('dark')
    expect(env.data?.url).toBe(
      `/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny/icon.dark.svg`,
    )
  })

  it('context-value variant (ai_only) produces icon.ai_only.svg', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
      variant: 'ai_only',
    })
    const env = structured(res)
    expect(env.ok).toBe(true)
    expect(env.data?.variant).toBe('ai_only')
    expect(env.data?.url).toBe(
      `/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny/icon.ai_only.svg`,
    )
  })

  it('emits the canonical (unencoded) version in the URL', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
    })
    const env = structured(res)
    // Canonical form contains `@`; the URL should carry it through
    // verbatim rather than percent-encoding it. The REST routes accept
    // both forms (covered in icons.test.ts), so the friendlier form
    // wins.
    expect(env.data?.url).toContain(`ai@${SAMPLE_VERSION.date}`)
    expect(env.data?.url).not.toContain('ai%40')
  })

  it('unknown variant returns unknown_variant with valid_variants listed', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'accept_deny',
      variant: 'nope',
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.[0]?.code).toBe('unknown_variant')
    const hint = env.errors?.[0]?.fix_hint ?? ''
    expect(hint).toMatch(/default/)
    expect(hint).toMatch(/dark/)
    expect(hint).toMatch(/ai_only/)
    expect(res.result?.isError).toBe(true)
  })

  it('unknown element returns element_not_found', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: SAMPLE_VERSION.canonical,
      element_id: 'nope',
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.[0]?.code).toBe('element_not_found')
    expect(env.errors?.[0]?.fix_hint).toContain('list_elements')
    expect(res.result?.isError).toBe(true)
  })

  it('unknown version returns not_found', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<IconUrlPayload>>('get_icon_url', {
      version: 'ai@2099-12-31',
      element_id: 'accept_deny',
    })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.[0]?.code).toBe('not_found')
  })
})
