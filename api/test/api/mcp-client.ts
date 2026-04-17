/**
 * Lightweight test-only JSON-RPC client for the `/mcp` endpoint.
 *
 * `@modelcontextprotocol/sdk`'s real client wires up an
 * `EventSource`-style transport that workerd doesn't expose in tests,
 * so the simplest path is to drive the streamable-HTTP endpoint
 * directly and parse its responses ourselves. The shape we need is
 * tiny: an initialize handshake, tools/list, and tools/call.
 */

import { SELF } from 'cloudflare:test'

const ORIGIN = 'https://example.com'
const ACCEPT = 'application/json, text/event-stream'

let nextId = 1

export interface McpClientOptions {
  origin?: string
  /** Optional override for the path. */
  path?: string
}

export interface McpResponse<T = unknown> {
  jsonrpc: '2.0'
  id: number
  result?: T
  error?: { code: number; message: string; data?: unknown }
}

export interface McpClient {
  initialize: () => Promise<McpResponse>
  listTools: () => Promise<McpResponse<{ tools: Array<{ name: string; description?: string }> }>>
  callTool: <T = unknown>(name: string, args: Record<string, unknown>) => Promise<McpResponse<T>>
  /** The session id surfaced after `initialize` (transport-managed). */
  sessionId: () => string | null
}

function parseBody(text: string, contentType: string | null): unknown {
  if (contentType?.includes('text/event-stream')) {
    // SSE frames look like:  event: message\ndata: {...}\n\n
    const lines = text.split('\n')
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const payload = line.slice('data:'.length).trim()
        if (payload && payload !== '[DONE]') return JSON.parse(payload)
      }
    }
    throw new Error(`SSE response had no data frame: ${text.slice(0, 200)}`)
  }
  return JSON.parse(text)
}

export function createMcpClient(opts: McpClientOptions = {}): McpClient {
  const origin = opts.origin ?? ORIGIN
  const path = opts.path ?? '/mcp'
  let sessionId: string | null = null

  async function send(payload: object): Promise<McpResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: ACCEPT,
    }
    if (sessionId) headers['mcp-session-id'] = sessionId
    const res = await SELF.fetch(`${origin}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
    const sid = res.headers.get('mcp-session-id')
    if (sid) sessionId = sid
    const text = await res.text()
    const body = parseBody(text, res.headers.get('content-type'))
    return body as McpResponse
  }

  return {
    sessionId: () => sessionId,
    async initialize() {
      const id = nextId++
      return send({
        jsonrpc: '2.0',
        id,
        method: 'initialize',
        params: {
          protocolVersion: '2025-06-18',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '0.0.0' },
        },
      })
    },
    async listTools() {
      const id = nextId++
      return (await send({ jsonrpc: '2.0', id, method: 'tools/list' })) as McpResponse<{
        tools: Array<{ name: string; description?: string }>
      }>
    },
    async callTool<T = unknown>(name: string, args: Record<string, unknown>) {
      const id = nextId++
      return (await send({
        jsonrpc: '2.0',
        id,
        method: 'tools/call',
        params: { name, arguments: args },
      })) as McpResponse<T>
    },
  }
}

export interface ToolCallResult<T = unknown> {
  structuredContent?: T
  content?: Array<{ type: string; text: string }>
  isError?: boolean
}

/** Pull the structuredContent off a tools/call result, asserting present. */
export function structured<T>(res: McpResponse<ToolCallResult<T>>): T {
  if (res.error) throw new Error(`MCP error: ${res.error.message}`)
  if (!res.result?.structuredContent) {
    throw new Error(`tools/call result missing structuredContent: ${JSON.stringify(res.result)}`)
  }
  return res.result.structuredContent
}
