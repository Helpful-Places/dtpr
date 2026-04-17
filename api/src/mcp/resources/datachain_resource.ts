import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server'
import { renderDatachainDocument } from '@dtpr/ui/html'

// Stable URI for the rendered datachain view. Tool responses reference
// this URI in their `_meta.ui.resourceUri`; the MCP client then issues
// a `resources/read` against this URI to fetch the HTML body.
export const DATACHAIN_RESOURCE_URI = 'ui://dtpr/datachain/view.html'

// Module-level HTML slot — last rendered datachain wins.
//
// TODO: per-session isolation deferred. Module-level state is
// acceptable in v1 because the Hono `/mcp` handler creates a fresh
// McpServer per request; the HTML needs to persist across that
// request boundary (render_datachain call → subsequent resources/read)
// and a module slot is the smallest thing that survives. Under
// concurrent sessions this introduces cross-session bleed; the
// follow-up is to key by `mcp-session-id` once we adopt a transport
// shape that preserves session identity across server instances.
let currentHtml: string | undefined

// For tests that need to reset shared state between scenarios.
export function __resetDatachainResourceStateForTest(): void {
  currentHtml = undefined
}

export interface DatachainResourceHandle {
  setHtml(html: string): void
  getHtml(): string | undefined
}

// Placeholder rendered when the resource is read before any tool call
// has populated it. Keeps `resources/read` well-behaved during probe
// requests from clients that enumerate resources before invoking tools.
async function defaultPlaceholder(): Promise<string> {
  return renderDatachainDocument([], {
    title: 'DTPR datachain (awaiting tool call)',
  })
}

// Register the UI resource on the supplied server and return a handle
// that the tool handler uses to stash rendered HTML. The readCallback
// declares an empty CSP (no external origins) so the MCP Apps host can
// safely render the iframe with inline styles/scripts only.
export function registerDatachainResource(server: McpServer): DatachainResourceHandle {
  registerAppResource(
    server,
    'DTPR Datachain View',
    DATACHAIN_RESOURCE_URI,
    {
      description: 'Rendered DTPR datachain HTML (MCP App iframe)',
      _meta: {
        ui: {
          csp: {
            resourceDomains: [],
            connectDomains: [],
          },
        },
      },
    },
    async () => ({
      contents: [
        {
          uri: DATACHAIN_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: currentHtml ?? (await defaultPlaceholder()),
          _meta: {
            ui: {
              csp: {
                resourceDomains: [],
                connectDomains: [],
              },
            },
          },
        },
      ],
    }),
  )

  return {
    setHtml(html: string) {
      currentHtml = html
    },
    getHtml() {
      return currentHtml
    },
  }
}
