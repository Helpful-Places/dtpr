import type { Context } from 'hono'
import type { AppEnv } from '../app-types.ts'
import { errEnvelope, toToolResult } from './envelope.ts'
import { buildToolRegistry, type ToolRegistry, type ToolResult } from './tools.ts'

/**
 * Hand-rolled MCP-over-JSON-RPC handler (plan fallback per
 * `api/docs/mcp-fallback.md` rationale).
 *
 * The official `@modelcontextprotocol/sdk` pulls in CJS-only Ajv via
 * its server transport, which workerd's nodejs_compat v1 cannot load
 * cleanly. Rather than fight the SDK runtime, we implement the
 * read-only subset of the protocol that DTPR needs (`initialize`,
 * `tools/list`, `tools/call`) directly. Streamable HTTP semantics are
 * trivial when we don't need server-initiated notifications: a single
 * POST returns a single JSON response.
 *
 * Wire format implemented (2025-06-18 spec):
 *   request  : { jsonrpc:"2.0", id, method, params? }
 *   response : { jsonrpc:"2.0", id, result | error }
 */

export const PROTOCOL_VERSION = '2025-06-18'

export const SERVER_INFO = {
  name: 'dtpr-api',
  version: '0.1.0',
}

export const SERVER_CAPABILITIES = {
  tools: {},
}

interface JsonRpcRequest {
  jsonrpc?: string
  id?: number | string
  method?: string
  params?: Record<string, unknown>
}

type JsonRpcResponse =
  | { jsonrpc: '2.0'; id: number | string | null; result: unknown }
  | { jsonrpc: '2.0'; id: number | string | null; error: { code: number; message: string; data?: unknown } }

const ERR = {
  PARSE: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL: -32603,
}

function rpcError(
  id: number | string | null,
  code: number,
  message: string,
  data?: unknown,
): JsonRpcResponse {
  return { jsonrpc: '2.0', id, ...(data !== undefined ? { error: { code, message, data } } : { error: { code, message } }) }
}

function rpcSuccess(id: number | string, result: unknown): JsonRpcResponse {
  return { jsonrpc: '2.0', id, result }
}

async function dispatch(
  registry: ToolRegistry,
  body: JsonRpcRequest,
): Promise<JsonRpcResponse | null> {
  const { id, method, params } = body
  // Per JSON-RPC 2.0 spec, the `jsonrpc` member MUST be exactly "2.0".
  // Reject requests that omit it or send a different version (e.g. "1.0").
  if (body.jsonrpc !== '2.0') {
    return rpcError(id ?? null, ERR.INVALID_REQUEST, 'Invalid or missing `jsonrpc` version; must be "2.0"')
  }
  if (typeof method !== 'string' || method.length === 0) {
    return rpcError(id ?? null, ERR.INVALID_REQUEST, 'Missing method')
  }
  // Notifications (no id) get no response per JSON-RPC spec.
  const reqId = id ?? null

  switch (method) {
    case 'initialize': {
      if (reqId === null) return null
      return rpcSuccess(reqId, {
        protocolVersion: PROTOCOL_VERSION,
        serverInfo: SERVER_INFO,
        capabilities: SERVER_CAPABILITIES,
      })
    }
    case 'notifications/initialized':
    case 'initialized': {
      // Client confirmation — no response.
      return null
    }
    case 'tools/list': {
      if (reqId === null) return null
      const tools = registry.list()
      return rpcSuccess(reqId, { tools })
    }
    case 'tools/call': {
      if (reqId === null) return null
      const name = params?.['name']
      const args = params?.['arguments'] ?? {}
      if (typeof name !== 'string') {
        return rpcError(reqId, ERR.INVALID_PARAMS, '`name` is required')
      }
      const tool = registry.get(name)
      if (!tool) {
        return rpcError(reqId, ERR.METHOD_NOT_FOUND, `Tool not found: ${name}`)
      }
      let result: ToolResult
      try {
        result = await tool.handler(args as Record<string, unknown>)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        result = toToolResult(
          errEnvelope([{ code: 'internal_error', message: msg }]),
          { isError: true },
        )
      }
      return rpcSuccess(reqId, result)
    }
    case 'ping': {
      if (reqId === null) return null
      return rpcSuccess(reqId, {})
    }
    default: {
      if (reqId === null) return null
      return rpcError(reqId, ERR.METHOD_NOT_FOUND, `Method not implemented: ${method}`)
    }
  }
}

/**
 * Hono handler for `/mcp`. Accepts a single JSON-RPC POST and
 * returns the response as `application/json` (no SSE / streaming
 * needed for our stateless read-only surface).
 *
 * GET requests return 405 — server-initiated streams are not
 * supported here.
 */
export async function handleMcpRequest(c: Context<AppEnv>): Promise<Response> {
  if (c.req.method === 'GET') {
    return c.json(
      {
        jsonrpc: '2.0',
        id: null,
        error: { code: ERR.INVALID_REQUEST, message: 'GET not supported on /mcp' },
      },
      405,
    )
  }
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    const res = rpcError(null, ERR.PARSE, 'Invalid JSON')
    return c.json(res as Record<string, unknown>, 400)
  }

  const registry = buildToolRegistry({
    bucket: c.env.CONTENT,
    ctx: c.executionCtx,
  })

  // Single request or batch.
  if (Array.isArray(body)) {
    const responses: JsonRpcResponse[] = []
    for (const entry of body) {
      const resp = await dispatch(registry, entry as JsonRpcRequest)
      if (resp) responses.push(resp)
    }
    // JSON-RPC 2.0 §6: when a batch contains only notifications, the
    // server MUST NOT return an empty Array — it returns nothing.
    // Mirror the single-notification branch below.
    if (responses.length === 0) {
      return new Response(null, { status: 204 })
    }
    return c.json(responses as unknown as Record<string, unknown>)
  }
  const resp = await dispatch(registry, body as JsonRpcRequest)
  if (!resp) {
    // Notification with no response — 204 per JSON-RPC convention.
    return new Response(null, { status: 204 })
  }
  return c.json(resp as unknown as Record<string, unknown>)
}
