import { describe, it, expect, beforeEach } from 'vitest'
import { createApp } from '../../../src/app.ts'
import { __resetDatachainResourceStateForTest } from '../../../src/mcp/resources/datachain_resource.ts'
import type { Category } from '../../../src/schema/category.ts'
import type { Element } from '../../../src/schema/element.ts'
import type { DatachainInstance } from '../../../src/schema/datachain-instance.ts'

// Module-level rendered HTML slot bleeds across tests (see
// `src/mcp/resources/datachain_resource.ts`). Reset between cases so
// the empty-placeholder test sees a clean slate regardless of order.
beforeEach(() => {
  __resetDatachainResourceStateForTest()
})

// -------- test fixture helpers --------

const VERSION = 'ai@2026-04-16-beta'

function makeCategories(): Category[] {
  return [
    {
      id: 'ai__decision',
      name: [{ locale: 'en', value: 'Decision Type' }],
      description: [{ locale: 'en', value: 'Type of decision.' }],
      prompt: [],
      required: true,
      order: 1,
      datachain_type: 'ai',
      element_variables: [],
    },
    {
      id: 'ai__storage',
      name: [{ locale: 'en', value: 'Storage' }],
      description: [{ locale: 'en', value: 'Where data is held.' }],
      prompt: [],
      required: false,
      order: 2,
      datachain_type: 'ai',
      element_variables: [
        {
          id: 'retention_period',
          label: [{ locale: 'en', value: 'Retention period' }],
          required: true,
        },
      ],
    },
  ]
}

function makeElements(): Element[] {
  return [
    {
      id: 'accept_deny',
      category_ids: ['ai__decision'],
      title: [{ locale: 'en', value: 'Accept or deny' }],
      description: [{ locale: 'en', value: 'Binary yes/no decision.' }],
      citation: [],
      icon: {
        url: '/dtpr-icons/accept-deny.svg',
        format: 'svg',
        alt_text: [{ locale: 'en', value: 'accept/deny icon' }],
      },
      variables: [],
    },
    {
      id: 'cloud_storage',
      category_ids: ['ai__storage'],
      title: [{ locale: 'en', value: 'Cloud storage' }],
      description: [{ locale: 'en', value: 'Data held for {{retention_period}}.' }],
      citation: [],
      icon: {
        url: '/dtpr-icons/cloud.svg',
        format: 'svg',
        alt_text: [{ locale: 'en', value: 'cloud icon' }],
      },
      variables: [
        {
          id: 'retention_period',
          label: [{ locale: 'en', value: 'Retention period' }],
          required: true,
        },
      ],
    },
  ]
}

function makeInstance(): DatachainInstance {
  return {
    id: 'worcester-lpr',
    schema_version: VERSION,
    created_at: '2026-04-16T00:00:00.000Z',
    elements: [
      { element_id: 'accept_deny', priority: 0, variables: [] },
      {
        element_id: 'cloud_storage',
        priority: 1,
        variables: [{ id: 'retention_period', value: '30 days' }],
      },
    ],
  }
}

// -------- MCP protocol helpers --------

// Parse an MCP JSON-RPC response. The StreamableHTTPTransport may
// respond with either `application/json` (single message) or
// `text/event-stream` (SSE wrapping a single `data:` line). Both
// shapes show up in the spike; handle both so tests are transport-shape
// agnostic.
async function parseMcpResponse(res: Response): Promise<any> {
  const contentType = res.headers.get('content-type') ?? ''
  const body = await res.text()
  if (contentType.includes('application/json')) {
    return JSON.parse(body)
  }
  if (contentType.includes('text/event-stream')) {
    // Pull out the first `data: ...` line and parse it as JSON.
    const dataLine = body
      .split('\n')
      .find((l) => l.startsWith('data: '))
    if (!dataLine) throw new Error(`SSE body had no data line: ${body}`)
    return JSON.parse(dataLine.slice('data: '.length))
  }
  throw new Error(`unexpected content-type: ${contentType} body=${body}`)
}

async function callMcp(body: unknown, sessionId?: string): Promise<{
  response: Response
  message: any
  sessionId: string | null
}> {
  const app = createApp()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
  }
  if (sessionId) headers['mcp-session-id'] = sessionId
  const response = await app.request('/mcp', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  const message = await parseMcpResponse(response.clone())
  return {
    response,
    message,
    sessionId: response.headers.get('mcp-session-id'),
  }
}

async function initAndCall(
  toolName: string,
  args: Record<string, unknown>,
): Promise<any> {
  // Each `app.request` call is a fresh Hono request — but since
  // createApp() constructs a new Hono app each time AND the /mcp route
  // constructs a fresh McpServer each time, we cannot rely on session
  // persistence. The StreamableHTTPTransport in per-request mode still
  // handles a single initialize + tools/call inside one request batch
  // if we chain calls with the session id it returns. Here we rely on
  // the SDK's per-request stateless handling: initialize is implicit
  // when the server hasn't seen this session id.
  //
  // In practice, with `@hono/mcp` the transport expects a session id
  // from initialize; we pipeline via a single app instance to share
  // the transport's internal state.
  const app = createApp()

  const doPost = async (payload: unknown, sessionId?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    }
    if (sessionId) headers['mcp-session-id'] = sessionId
    return app.request('/mcp', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  }

  const initRes = await doPost({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    },
  })
  const sessionId = initRes.headers.get('mcp-session-id')
  const initMsg = await parseMcpResponse(initRes.clone())
  expect(initMsg.error, `initialize failed: ${JSON.stringify(initMsg.error)}`).toBeUndefined()

  // `notifications/initialized` per the protocol — not strictly required
  // by @hono/mcp but harmless.
  await doPost(
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    sessionId ?? undefined,
  )

  const callRes = await doPost(
    {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: toolName, arguments: args },
    },
    sessionId ?? undefined,
  )
  return {
    app,
    sessionId,
    call: await parseMcpResponse(callRes),
    doPost,
  }
}

// -------- tests --------

describe('render_datachain tool (end-to-end via Hono /mcp)', () => {
  it('happy path: valid datachain -> _meta.ui.resourceUri present', async () => {
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: makeInstance(),
      categories: makeCategories(),
      elements: makeElements(),
      locale: 'en',
    })
    expect(call.error).toBeUndefined()
    expect(call.result).toBeDefined()
    expect(call.result.isError).not.toBe(true)
    expect(call.result._meta?.ui?.resourceUri).toBe('ui://dtpr/datachain/view.html')
    // CSP declares no external origins.
    const csp = call.result._meta?.ui?.csp
    expect(csp).toBeDefined()
    expect(csp.resourceDomains).toEqual([])
    expect(csp.connectDomains).toEqual([])
  })

  it('text summary enumerates categories and element counts', async () => {
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: makeInstance(),
      categories: makeCategories(),
      elements: makeElements(),
    })
    const text = call.result.content[0].text as string
    expect(text).toContain('2 categories')
    expect(text).toContain('2 total elements')
    expect(text).toContain('Decision Type')
    expect(text).toContain('Storage')
    expect(text).toContain('Accept or deny')
    expect(text).toContain('Cloud storage')
    // Agent-supplied variable value is XML-wrapped.
    expect(text).toContain('<dtpr_variable_value>30 days</dtpr_variable_value>')
  })

  it('resources/read returns full <!doctype html> with MCP-App mime type', async () => {
    const { doPost, sessionId } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: makeInstance(),
      categories: makeCategories(),
      elements: makeElements(),
    })
    const res = await doPost(
      {
        jsonrpc: '2.0',
        id: 3,
        method: 'resources/read',
        params: { uri: 'ui://dtpr/datachain/view.html' },
      },
      sessionId ?? undefined,
    )
    const msg = await parseMcpResponse(res)
    expect(msg.error).toBeUndefined()
    const contents = msg.result.contents
    expect(contents).toHaveLength(1)
    expect(contents[0].mimeType).toBe('text/html;profile=mcp-app')
    expect(contents[0].uri).toBe('ui://dtpr/datachain/view.html')
    const html = contents[0].text as string
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('ai__decision')
    expect(html).toContain('Accept or deny')
  })

  it('resources/list reports the datachain resource', async () => {
    const app = createApp()
    const doPost = async (payload: unknown, sessionId?: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      }
      if (sessionId) headers['mcp-session-id'] = sessionId
      return app.request('/mcp', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    }
    const initRes = await doPost({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0' },
      },
    })
    const sessionId = initRes.headers.get('mcp-session-id')
    await doPost(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      sessionId ?? undefined,
    )
    const listRes = await doPost(
      { jsonrpc: '2.0', id: 2, method: 'resources/list', params: {} },
      sessionId ?? undefined,
    )
    const msg = await parseMcpResponse(listRes)
    expect(msg.error).toBeUndefined()
    const resources = msg.result.resources
    expect(resources.some((r: any) => r.uri === 'ui://dtpr/datachain/view.html')).toBe(true)
  })

  it('tools/list exposes render_datachain', async () => {
    const app = createApp()
    const doPost = async (payload: unknown, sessionId?: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      }
      if (sessionId) headers['mcp-session-id'] = sessionId
      return app.request('/mcp', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    }
    const initRes = await doPost({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0' },
      },
    })
    const sessionId = initRes.headers.get('mcp-session-id')
    await doPost(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      sessionId ?? undefined,
    )
    const listRes = await doPost(
      { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} },
      sessionId ?? undefined,
    )
    const msg = await parseMcpResponse(listRes)
    expect(msg.error).toBeUndefined()
    const tools = msg.result.tools
    const tool = tools.find((t: any) => t.name === 'render_datachain')
    expect(tool).toBeDefined()
    // _meta.ui.resourceUri present on the tool descriptor so a host can
    // pre-fetch before first invocation.
    expect(tool._meta?.ui?.resourceUri).toBe('ui://dtpr/datachain/view.html')
  })

  it('error path: invalid version regex -> INVALID_VERSION typed error', async () => {
    const { call } = await initAndCall('render_datachain', {
      version: 'not-a-version',
      datachain: makeInstance(),
      categories: makeCategories(),
      elements: makeElements(),
    })
    expect(call.result.isError).toBe(true)
    expect(call.result._meta?.error?.code).toBe('INVALID_VERSION')
    expect(call.result.content[0].text).toContain('Validation failed')
  })

  it('error path: datachain fails Zod -> INVALID_DATACHAIN', async () => {
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: { id: 'x' }, // missing schema_version, created_at, elements
      categories: makeCategories(),
      elements: makeElements(),
    })
    expect(call.result.isError).toBe(true)
    expect(call.result._meta?.error?.code).toBe('INVALID_DATACHAIN')
    expect(call.result._meta?.error?.details?.issues).toBeDefined()
  })

  it('error path: missing categories -> MISSING_CATEGORIES', async () => {
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: makeInstance(),
      elements: makeElements(),
    })
    expect(call.result.isError).toBe(true)
    expect(call.result._meta?.error?.code).toBe('MISSING_CATEGORIES')
  })

  it('error path: missing elements -> MISSING_ELEMENTS', async () => {
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: makeInstance(),
      categories: makeCategories(),
    })
    expect(call.result.isError).toBe(true)
    expect(call.result._meta?.error?.code).toBe('MISSING_ELEMENTS')
  })

  it('error path: semantic validation failure -> SEMANTIC_VALIDATION_FAILED', async () => {
    const instance = makeInstance()
    // cloud_storage requires `retention_period` but we drop it — semantic
    // rule 10 fires.
    instance.elements[1]!.variables = []
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: instance,
      categories: makeCategories(),
      elements: makeElements(),
    })
    expect(call.result.isError).toBe(true)
    expect(call.result._meta?.error?.code).toBe('SEMANTIC_VALIDATION_FAILED')
  })

  it('edge: empty datachain -> schema rejects min(1); returns INVALID_DATACHAIN', async () => {
    // The DatachainInstanceSchema enforces `.min(1)` on elements, so a
    // zero-element instance is structurally invalid. We exercise the
    // empty-render path via the placeholder resource read (see below).
    const { call } = await initAndCall('render_datachain', {
      version: VERSION,
      datachain: {
        id: 'empty',
        schema_version: VERSION,
        created_at: '2026-04-16T00:00:00.000Z',
        elements: [],
      },
      categories: makeCategories(),
      elements: makeElements(),
    })
    expect(call.result.isError).toBe(true)
    expect(call.result._meta?.error?.code).toBe('INVALID_DATACHAIN')
  })

  it('edge: placeholder resource read before any tool call returns empty-state doc', async () => {
    const app = createApp()
    const doPost = async (payload: unknown, sessionId?: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      }
      if (sessionId) headers['mcp-session-id'] = sessionId
      return app.request('/mcp', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })
    }
    const initRes = await doPost({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '0' },
      },
    })
    const sessionId = initRes.headers.get('mcp-session-id')
    await doPost(
      { jsonrpc: '2.0', method: 'notifications/initialized' },
      sessionId ?? undefined,
    )
    const readRes = await doPost(
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'resources/read',
        params: { uri: 'ui://dtpr/datachain/view.html' },
      },
      sessionId ?? undefined,
    )
    const msg = await parseMcpResponse(readRes)
    expect(msg.error).toBeUndefined()
    const html = msg.result.contents[0].text as string
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html).toContain('dtpr-empty')
  })
})
