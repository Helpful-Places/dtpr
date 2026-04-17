import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { SELF } from 'cloudflare:test'
import { SAMPLE_VERSION, seedVersion } from '../seed.ts'
import { __resetDatachainResourceStateForTest } from '../../../src/mcp/resources/datachain_resource.ts'
import { createMcpClient, type McpResponse } from '../mcp-client.ts'

// Module-level HTML slot bleeds across tests — reset between cases.
beforeEach(() => {
  __resetDatachainResourceStateForTest()
})

beforeAll(async () => {
  await seedVersion()
})

const VERSION = SAMPLE_VERSION.canonical

function validInstance() {
  return {
    id: 'test-chain-1',
    schema_version: VERSION,
    created_at: '2026-04-16T00:00:00.000Z',
    elements: [
      { element_id: 'accept_deny', priority: 0, variables: [] },
      { element_id: 'identifiable_video', priority: 1, variables: [] },
    ],
  }
}

async function postMcp(
  payload: unknown,
  sessionId?: string,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  if (sessionId) headers['mcp-session-id'] = sessionId
  const res = await SELF.fetch('https://example.com/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const body = (await res.json()) as Record<string, unknown>
  return { status: res.status, body }
}

interface RenderResult {
  structuredContent?: {
    ok?: boolean
    data?: {
      resource_uri?: string
      section_count?: number
      element_count?: number
    }
    errors?: Array<{ code: string; message: string }>
  }
  content?: Array<{ type: string; text: string }>
  isError?: boolean
  _meta?: {
    ui?: {
      resourceUri?: string
      csp?: { resourceDomains: string[]; connectDomains: string[] }
    }
  }
}

describe('render_datachain tool (end-to-end via /mcp)', () => {
  it('appears in tools/list', async () => {
    const client = createMcpClient()
    await client.initialize()
    const list = await client.listTools()
    const tool = list.result?.tools.find((t) => t.name === 'render_datachain')
    expect(tool).toBeDefined()
    expect(tool?.description).toMatch(/datachain/i)
  })

  it('happy path: returns _meta.ui.resourceUri + structured summary', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = (await client.callTool<RenderResult>('render_datachain', {
      version: VERSION,
      datachain: validInstance(),
    })) as McpResponse<RenderResult>

    expect(res.error).toBeUndefined()
    expect(res.result?.isError).toBeUndefined()
    expect(res.result?._meta?.ui?.resourceUri).toBe('ui://dtpr/datachain/view.html')
    expect(res.result?._meta?.ui?.csp).toEqual({ resourceDomains: [], connectDomains: [] })
    expect(res.result?.structuredContent?.ok).toBe(true)
    expect(res.result?.structuredContent?.data?.section_count).toBe(1)
    expect(res.result?.structuredContent?.data?.element_count).toBe(2)
    const summary = res.result?.content?.[0]?.text
    expect(summary).toContain('Decision')
    expect(summary).toContain('Accept / Deny')
  })

  it('resources/list advertises the datachain view resource', async () => {
    const { body } = await postMcp({
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
    })
    const result = body.result as { resources?: Array<{ uri: string; mimeType: string }> }
    expect(result?.resources?.[0]?.uri).toBe('ui://dtpr/datachain/view.html')
    expect(result?.resources?.[0]?.mimeType).toBe('text/html;profile=mcp-app')
  })

  it('resources/read returns the full HTML document with mcp-app mime', async () => {
    const client = createMcpClient()
    await client.initialize()
    await client.callTool('render_datachain', {
      version: VERSION,
      datachain: validInstance(),
    })

    const { body } = await postMcp({
      jsonrpc: '2.0',
      id: 99,
      method: 'resources/read',
      params: { uri: 'ui://dtpr/datachain/view.html' },
    })
    const result = body.result as {
      contents?: Array<{ uri: string; mimeType: string; text: string }>
    }
    const content = result?.contents?.[0]
    expect(content?.uri).toBe('ui://dtpr/datachain/view.html')
    expect(content?.mimeType).toBe('text/html;profile=mcp-app')
    expect(content?.text?.startsWith('<!doctype html>')).toBe(true)
    expect(content?.text).toContain('ai__decision')
    expect(content?.text).toContain('data-dtpr-collapsible')
  })

  it('resources/read returns a placeholder when no tool call has populated the slot', async () => {
    const { body } = await postMcp({
      jsonrpc: '2.0',
      id: 100,
      method: 'resources/read',
      params: { uri: 'ui://dtpr/datachain/view.html' },
    })
    const result = body.result as { contents?: Array<{ text: string }> }
    const html = result?.contents?.[0]?.text
    expect(html?.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('awaiting tool call')
  })

  it('resources/read rejects an unknown URI', async () => {
    const { body } = await postMcp({
      jsonrpc: '2.0',
      id: 101,
      method: 'resources/read',
      params: { uri: 'ui://dtpr/unknown.html' },
    })
    expect(body.error).toBeDefined()
    expect((body.error as { message: string }).message).toContain('Resource not found')
  })

  it('isolates rendered HTML by mcp-session-id across concurrent sessions', async () => {
    // Session A renders a single-element instance; session B renders a
    // two-element instance. Each session's resources/read must return
    // the document rendered inside that session, not the other.
    const singleElement = {
      id: 'session-a',
      schema_version: VERSION,
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'accept_deny', priority: 0, variables: [] }],
    }
    const twoElements = validInstance()

    await postMcp(
      {
        jsonrpc: '2.0',
        id: 200,
        method: 'tools/call',
        params: {
          name: 'render_datachain',
          arguments: { version: VERSION, datachain: singleElement },
        },
      },
      'session-a',
    )
    await postMcp(
      {
        jsonrpc: '2.0',
        id: 201,
        method: 'tools/call',
        params: {
          name: 'render_datachain',
          arguments: { version: VERSION, datachain: twoElements },
        },
      },
      'session-b',
    )

    const readA = await postMcp(
      {
        jsonrpc: '2.0',
        id: 202,
        method: 'resources/read',
        params: { uri: 'ui://dtpr/datachain/view.html' },
      },
      'session-a',
    )
    const readB = await postMcp(
      {
        jsonrpc: '2.0',
        id: 203,
        method: 'resources/read',
        params: { uri: 'ui://dtpr/datachain/view.html' },
      },
      'session-b',
    )

    const htmlA = (readA.body.result as { contents: Array<{ text: string }> })
      .contents[0]!.text
    const htmlB = (readB.body.result as { contents: Array<{ text: string }> })
      .contents[0]!.text

    expect(htmlA).toContain('Accept / Deny')
    expect(htmlA).not.toContain('Identifiable video')
    expect(htmlB).toContain('Accept / Deny')
    expect(htmlB).toContain('Identifiable video')
  })

  it('error: invalid version string → bad_request envelope', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = (await client.callTool<RenderResult>('render_datachain', {
      version: 'not-a-version',
      datachain: validInstance(),
    })) as McpResponse<RenderResult>
    expect(res.result?.structuredContent?.ok).toBe(false)
    const codes = res.result?.structuredContent?.errors?.map((e) => e.code) ?? []
    expect(codes).toContain('bad_request')
  })

  it('error: datachain missing required fields → ok:false envelope', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = (await client.callTool<RenderResult>('render_datachain', {
      version: VERSION,
      datachain: { id: 'x' },
    })) as McpResponse<RenderResult>
    expect(res.result?.structuredContent?.ok).toBe(false)
    expect(res.result?.structuredContent?.errors?.length).toBeGreaterThan(0)
  })

  it('error: unknown version → not_found envelope', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = (await client.callTool<RenderResult>('render_datachain', {
      version: 'ai@2099-01-01',
      datachain: validInstance(),
    })) as McpResponse<RenderResult>
    expect(res.result?.structuredContent?.ok).toBe(false)
    const codes = res.result?.structuredContent?.errors?.map((e) => e.code) ?? []
    expect(codes).toContain('not_found')
  })

  it('error: semantic validation failure renders as soft-failure envelope', async () => {
    const client = createMcpClient()
    await client.initialize()
    const bad = {
      id: 'test-chain-bad',
      schema_version: VERSION,
      created_at: '2026-04-16T00:00:00.000Z',
      elements: [{ element_id: 'does_not_exist', priority: 0, variables: [] }],
    }
    const res = (await client.callTool<RenderResult>('render_datachain', {
      version: VERSION,
      datachain: bad,
    })) as McpResponse<RenderResult>
    expect(res.result?.structuredContent?.ok).toBe(false)
  })
})
