import { renderDatachainDocument } from '@dtpr/ui/html'

// Stable URI for the rendered datachain view. `render_datachain` tool
// responses reference this URI in their `_meta.ui.resourceUri`; the MCP
// client fetches the HTML body via `resources/read` on the same URI.
export const DATACHAIN_RESOURCE_URI = 'ui://dtpr/datachain/view.html'

// MCP Apps spec (SEP-1865) content type for iframe-renderable HTML.
export const DATACHAIN_RESOURCE_MIME = 'text/html;profile=mcp-app'

// Fallback key for requests that arrive without an mcp-session-id
// header. Clients that follow the protocol set this after `initialize`;
// we key by it so two concurrent sessions in the same Worker isolate do
// not read each other's last-rendered HTML. Clients that omit the header
// share this fallback key and can still bleed — by design, since we
// cannot identify them.
export const DEFAULT_SESSION_KEY = '__dtpr_default_session__'

// Rendered HTML keyed by mcp-session-id. A render_datachain call in
// session A and its subsequent resources/read in session A return the
// same document even while session B is rendering something else.
// Cross-isolate persistence (Durable Objects, KV) is still out of scope
// — the guarantee is same-isolate, same-session.
const htmlSlots = new Map<string, string>()

export function setDatachainHtml(sessionId: string, html: string): void {
  htmlSlots.set(sessionId, html)
}

// Returns the last rendered HTML for this session, or a neutral
// placeholder when the resource is read before any tool call has
// populated it in this session.
export async function getDatachainHtml(sessionId: string): Promise<string> {
  const existing = htmlSlots.get(sessionId)
  if (existing !== undefined) return existing
  return renderDatachainDocument([], {
    title: 'DTPR datachain (awaiting tool call)',
  })
}

export function __resetDatachainResourceStateForTest(): void {
  htmlSlots.clear()
}

export interface ResourceDescriptor {
  uri: string
  name: string
  description?: string
  mimeType: string
}

export function datachainResourceDescriptor(): ResourceDescriptor {
  return {
    uri: DATACHAIN_RESOURCE_URI,
    name: 'DTPR Datachain View',
    description: 'Rendered DTPR datachain HTML (MCP App iframe)',
    mimeType: DATACHAIN_RESOURCE_MIME,
  }
}
