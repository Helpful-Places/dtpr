import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server'
import { z } from 'zod'
import {
  deriveElementDisplay,
  validateDatachain,
  type Category,
  type DatachainInstance,
  type Element,
  type ElementDisplay,
  type SchemaVersionSource,
} from '@dtpr/ui/core'
import { renderDatachainDocument, type RenderedSection } from '@dtpr/ui/html'
import { DatachainInstanceSchema } from '../../schema/datachain-instance.ts'
import { CategorySchema } from '../../schema/category.ts'
import { ElementSchema } from '../../schema/element.ts'
import {
  DATACHAIN_RESOURCE_URI,
  type DatachainResourceHandle,
} from '../resources/datachain_resource.ts'

// Version string regex per plan: `{type}@YYYY-MM-DD[-beta]`.
const VERSION_REGEX = /^[a-z0-9_-]+@\d{4}-\d{2}-\d{2}(-beta)?$/

// Error codes surfaced on the `_meta.error.code` envelope. Handlers
// always return a plain text message in `content` plus this structured
// meta so agents can branch on the code without re-parsing prose.
export type RenderDatachainErrorCode =
  | 'INVALID_VERSION'
  | 'INVALID_DATACHAIN'
  | 'MISSING_CATEGORIES'
  | 'MISSING_ELEMENTS'
  | 'SEMANTIC_VALIDATION_FAILED'

// Loose shape — the MCP SDK's CallToolResult type carries an open
// index signature; we let the registered tool callback's return type
// absorb these rather than fighting the declared-literal narrowing.
function typedError(
  code: RenderDatachainErrorCode,
  text: string,
  details?: unknown,
) {
  return {
    content: [{ type: 'text' as const, text }],
    isError: true as const,
    _meta: { error: { code, details } },
  }
}

// Wrap agent-supplied variable values in XML tags so downstream agents
// that re-read the summary cannot mistake variable content for
// instructions. Follows the sibling plan's `<dtpr_variable_value>` convention.
function wrapVariableValue(value: string): string {
  return `<dtpr_variable_value>${value}</dtpr_variable_value>`
}

// Produce a short plaintext summary of what was rendered. Mirrors the
// section/element structure of the iframe so the agent can answer
// questions without reading HTML.
function buildAgentSummary(
  sections: RenderedSection[],
  resourceUri: string,
): string {
  if (sections.length === 0) {
    return (
      `Rendered DTPR datachain with 0 categories and 0 elements. ` +
      `UI available at ${resourceUri}.`
    )
  }
  const totalElements = sections.reduce((n, s) => n + s.elements.length, 0)
  const lines: string[] = []
  lines.push(
    `Rendered DTPR datachain with ${sections.length} categories ` +
      `and ${totalElements} total elements. UI available at ${resourceUri}.`,
  )
  for (const section of sections) {
    const bits: string[] = []
    for (const el of section.elements) {
      const varBits = el.variables
        .filter((v) => v.value.length > 0)
        .map((v) => `${v.id}=${wrapVariableValue(v.value)}`)
      const varStr = varBits.length > 0 ? ` [${varBits.join(', ')}]` : ''
      bits.push(`${el.title}${varStr}`)
    }
    lines.push(
      `- ${section.title} (${section.elements.length} element${
        section.elements.length === 1 ? '' : 's'
      })${bits.length > 0 ? ': ' + bits.join('; ') : ''}`,
    )
  }
  return lines.join('\n')
}

// Minimal shape suitable for both the semantic validator and the
// display-layer grouping. We synthesize a manifest + datachainType on
// the fly from the supplied version + categories for v1, since v1 does
// not load the full schema bundle from R2.
function buildVersionSource(
  version: string,
  categories: Category[],
  elements: Element[],
  instance: DatachainInstance,
): SchemaVersionSource {
  const [typeId = 'ai'] = version.split('@')
  const rawLocales = categories.flatMap((c) => c.name.map((n) => n.locale))
  const seen = new Set<string>()
  const locales: typeof rawLocales = []
  for (const loc of rawLocales) {
    if (!seen.has(loc)) {
      seen.add(loc)
      locales.push(loc)
    }
  }
  const effectiveLocales = locales.length > 0 ? locales : (['en'] as typeof rawLocales)
  return {
    manifest: {
      version,
      status: version.endsWith('-beta') ? 'beta' : 'stable',
      created_at: instance.created_at,
      notes: '',
      content_hash: `sha256-${'0'.repeat(64)}`,
      locales: effectiveLocales,
    },
    datachainType: {
      id: typeId,
      name: [{ locale: 'en', value: typeId }],
      description: [],
      categories: categories.map((c) => c.id),
      locales: effectiveLocales,
    },
    categories,
    elements,
  }
}

// Build the rendered section list for `renderDatachainDocument`.
// Preserves the category order supplied by the caller and produces an
// empty `elements` array for categories that have no placements in the
// instance (the document layer emits an empty-state sub-placeholder).
function buildSections(
  instance: DatachainInstance,
  categories: Category[],
  elements: Element[],
  locale: string,
): RenderedSection[] {
  const elementById = new Map<string, Element>()
  for (const el of elements) elementById.set(el.id, el)

  // Map category id -> ordered list of ElementDisplay derived from
  // the instance placements. Priority order is preserved from the
  // instance for deterministic rendering.
  const byCategory = new Map<string, ElementDisplay[]>()
  for (const c of categories) byCategory.set(c.id, [])

  for (const placement of instance.elements) {
    const def = elementById.get(placement.element_id)
    if (!def) continue
    const display = deriveElementDisplay(def, placement, locale)
    for (const catId of def.category_ids) {
      const bucket = byCategory.get(catId)
      if (bucket) bucket.push(display)
    }
  }

  return categories.map((c) => {
    const label = c.name.find((n) => n.locale === locale) ?? c.name[0]
    return {
      id: c.id,
      title: label?.value ?? c.id,
      elements: byCategory.get(c.id) ?? [],
    }
  })
}

// Register the tool on the supplied server. Idempotent: `createMcpServer`
// calls this exactly once per server, so duplicate registrations are the
// McpServer SDK's concern (it throws on duplicate tool names).
export function registerRenderDatachainTool(
  server: McpServer,
  resourceHandle: DatachainResourceHandle,
): void {
  registerAppTool(
    server,
    'render_datachain',
    {
      description:
        'Render a DTPR datachain as an interactive MCP App iframe. ' +
        'Returns a resource URI the client can fetch via resources/read ' +
        'plus a plaintext summary of the rendered categories and elements.',
      inputSchema: {
        version: z.string().describe('Pinned schema version, e.g. "ai@2026-04-16-beta"'),
        datachain: z.unknown().describe('DTPR datachain instance (validated via Zod)'),
        locale: z.string().default('en').describe('BCP-47 locale tag; defaults to "en"'),
        categories: z
          .array(z.unknown())
          .optional()
          .describe(
            'Category definitions for the pinned version. Required in v1; ' +
              'R2 loading is out of scope.',
          ),
        elements: z
          .array(z.unknown())
          .optional()
          .describe(
            'Element definitions for the pinned version. Required in v1; ' +
              'R2 loading is out of scope.',
          ),
      },
      _meta: {
        ui: {
          resourceUri: DATACHAIN_RESOURCE_URI,
          csp: {
            resourceDomains: [],
            connectDomains: [],
          },
        },
      },
    },
    async (raw) => {
      const args = raw as {
        version: string
        datachain: unknown
        locale?: string
        categories?: unknown[]
        elements?: unknown[]
      }

      // 1. Version regex.
      if (!VERSION_REGEX.test(args.version)) {
        return typedError(
          'INVALID_VERSION',
          `Validation failed: version "${args.version}" does not match ` +
            `{type}@YYYY-MM-DD[-beta].`,
        )
      }

      // 2. Zod structural validation of the datachain.
      const instanceParse = DatachainInstanceSchema.safeParse(args.datachain)
      if (!instanceParse.success) {
        return typedError(
          'INVALID_DATACHAIN',
          `Validation failed: datachain did not match DatachainInstance schema.`,
          { issues: instanceParse.error.issues },
        )
      }
      const instance = instanceParse.data

      // 3. Categories must be supplied inline in v1.
      if (!args.categories || args.categories.length === 0) {
        return typedError(
          'MISSING_CATEGORIES',
          `No categories provided — R2 category loading is out of v1 scope.`,
        )
      }
      const categoriesParse = z.array(CategorySchema).safeParse(args.categories)
      if (!categoriesParse.success) {
        return typedError(
          'INVALID_DATACHAIN',
          `Validation failed: categories did not match Category schema.`,
          { issues: categoriesParse.error.issues },
        )
      }
      const categories = categoriesParse.data

      // 4. Elements must be supplied inline in v1.
      if (!args.elements || args.elements.length === 0) {
        return typedError(
          'MISSING_ELEMENTS',
          `No elements provided — R2 element loading is out of v1 scope.`,
        )
      }
      const elementsParse = z.array(ElementSchema).safeParse(args.elements)
      if (!elementsParse.success) {
        return typedError(
          'INVALID_DATACHAIN',
          `Validation failed: elements did not match Element schema.`,
          { issues: elementsParse.error.issues },
        )
      }
      const elements = elementsParse.data

      // 5. Semantic validation (category refs, variable conflicts, required
      // categories, etc.) via @dtpr/ui/core -> @dtpr/api/validator.
      const source = buildVersionSource(args.version, categories, elements, instance)
      const validation = validateDatachain(source, instance)
      if (!validation.ok) {
        return typedError(
          'SEMANTIC_VALIDATION_FAILED',
          `Semantic validation failed: ` +
            validation.errors.map((e) => `${e.code}: ${e.message}`).join('; '),
          { errors: validation.errors, warnings: validation.warnings },
        )
      }

      // 6. Render the document and stash it for the resource readCallback.
      const locale = args.locale ?? 'en'
      const sections = buildSections(instance, categories, elements, locale)
      const html = await renderDatachainDocument(sections, { locale })
      resourceHandle.setHtml(html)

      const summary = buildAgentSummary(sections, DATACHAIN_RESOURCE_URI)
      return {
        content: [{ type: 'text', text: summary }],
        _meta: {
          ui: {
            resourceUri: DATACHAIN_RESOURCE_URI,
            csp: {
              resourceDomains: [],
              connectDomains: [],
            },
          },
        },
      }
    },
  )
}
