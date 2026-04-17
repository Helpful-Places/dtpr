import { renderDatachainDocument } from '@dtpr/ui/html'

// Stable URI for the rendered datachain view. `render_datachain` tool
// responses reference this URI in their `_meta.ui.resourceUri`; the MCP
// client fetches the HTML body via `resources/read` on the same URI.
export const DATACHAIN_RESOURCE_URI = 'ui://dtpr/datachain/view.html'

// MCP Apps spec (SEP-1865) content type for iframe-renderable HTML.
export const DATACHAIN_RESOURCE_MIME = 'text/html;profile=mcp-app'

// Module-level HTML slot — last rendered datachain wins.
//
// TODO: per-session isolation deferred. Module-level state is acceptable
// in v1 because the hand-rolled /mcp handler is stateless per request.
// The HTML needs to persist across a render_datachain call and a
// subsequent resources/read, and a module slot is the smallest thing
// that survives that boundary. Under concurrent sessions this introduces
// cross-session bleed; follow-up keys by session id once transport
// supports it.
let currentHtml: string | undefined

export function setDatachainHtml(html: string): void {
  currentHtml = html
}

// Returns the last rendered HTML, or a placeholder document when the
// resource is read before any tool call has populated it.
export async function getDatachainHtml(): Promise<string> {
  if (currentHtml !== undefined) return currentHtml
  return renderDatachainDocument([], {
    title: 'DTPR datachain (awaiting tool call)',
  })
}

export function __resetDatachainResourceStateForTest(): void {
  currentHtml = undefined
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
