import { z, ZodError } from 'zod'
import { deriveElementDisplay, type ElementDisplay } from '@dtpr/ui/core'
import { renderDatachainDocument, type RenderedSection } from '@dtpr/ui/html'
import type { Category } from '../../schema/category.ts'
import type { Element } from '../../schema/element.ts'
import { DatachainInstanceSchema, type DatachainInstance } from '../../schema/datachain-instance.ts'
import { LocaleCodeSchema } from '../../schema/locale.ts'
import {
  loadCategories,
  loadDatachainType,
  loadElements,
  loadManifest,
  type LoadContext,
} from '../../store/index.ts'
import {
  normalizeVersionParam,
  resolveKnownVersion,
} from '../../rest/version-resolver.ts'
import { validateInstance } from '../../validator/semantic.ts'
import { ApiError, type ApiErrorShape } from '../../middleware/errors.ts'
import { errEnvelope, okEnvelope, toSoftFailureResult, toToolResult } from '../envelope.ts'
import {
  DATACHAIN_RESOURCE_URI,
  setDatachainHtml,
} from '../resources/datachain_resource.ts'
import type { ToolDef } from '../tools.ts'

const VersionString = z.string().min(1).describe('Pinned schema version, e.g. "ai@2026-04-16-beta"')

const InputSchema = z.object({
  version: VersionString,
  datachain: z.unknown().describe('DTPR datachain instance. See schema_json.DatachainInstance.'),
  locale: LocaleCodeSchema.default('en').describe('Locale for rendered strings. Defaults to "en".'),
})

function schemaToJson(schema: z.ZodType): Record<string, unknown> {
  return z.toJSONSchema(schema, {
    target: 'draft-2020-12',
    io: 'input',
    unrepresentable: 'any',
  }) as Record<string, unknown>
}

function zodErrorsToApiShape(e: ZodError, code = 'parse_error'): ApiErrorShape[] {
  return e.issues.map((iss) => ({
    code,
    message: iss.message,
    path: iss.path.join('.'),
    fix_hint: 'Fix the field shape and retry.',
  }))
}

function errorsFrom(e: unknown): ApiErrorShape[] {
  if (e instanceof ZodError) return zodErrorsToApiShape(e, 'invalid_arguments')
  if (e instanceof ApiError) return e.errors
  if (e instanceof Error) return [{ code: 'internal_error', message: e.message }]
  return [{ code: 'internal_error', message: String(e) }]
}

// Wrap agent-supplied variable values so downstream agents cannot
// mistake variable content for instructions. Follows the sibling
// read-path tools' provenance convention.
function wrapVariableValue(value: string): string {
  return `<dtpr_variable_value>${value}</dtpr_variable_value>`
}

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

// Build the ordered list of sections + their rendered elements from the
// instance, preserving per-instance ordering within each category.
function buildSections(
  instance: DatachainInstance,
  categories: Category[],
  elements: Element[],
  locale: string,
): RenderedSection[] {
  const elementById = new Map<string, Element>()
  for (const el of elements) elementById.set(el.id, el)

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

// Tool descriptor + handler factory. Fits main's `buildToolRegistry`
// pattern: each call to /mcp builds one registry bound to the request's
// LoadContext (R2 bucket + execution ctx).
export function renderDatachainTool(ctx: LoadContext): ToolDef {
  return {
    descriptor: {
      name: 'render_datachain',
      description:
        'Render a DTPR datachain instance as an interactive HTML document. ' +
        'The document URL is returned in _meta.ui.resourceUri and can be ' +
        'fetched via resources/read; the tool also returns a plaintext ' +
        'summary of the rendered categories and elements.',
      inputSchema: schemaToJson(InputSchema),
    },
    handler: async (raw: Record<string, unknown>) => {
      let args
      try {
        args = InputSchema.parse(raw)
      } catch (e) {
        return toToolResult(errEnvelope(errorsFrom(e)))
      }
      try {
        normalizeVersionParam(args.version)
      } catch (e) {
        return toToolResult(errEnvelope(errorsFrom(e)))
      }

      let parsedInstance: DatachainInstance
      try {
        parsedInstance = DatachainInstanceSchema.parse(args.datachain)
      } catch (e) {
        if (e instanceof ZodError) {
          return toSoftFailureResult(errEnvelope(zodErrorsToApiShape(e)))
        }
        throw e
      }

      try {
        const version = await resolveKnownVersion(ctx, args.version)
        const manifest = await loadManifest(ctx, version)
        if (!manifest) {
          return toToolResult(
            errEnvelope([
              { code: 'unknown_version', message: `Manifest for ${version.canonical} missing.` },
            ]),
          )
        }
        const datachainType = await loadDatachainType(ctx, version)
        const categories = (await loadCategories(ctx, version)) ?? []
        const elements = (await loadElements(ctx, version)) ?? []
        if (!datachainType) {
          return toToolResult(
            errEnvelope([
              {
                code: 'unknown_version',
                message: `Datachain type for ${version.canonical} missing.`,
              },
            ]),
          )
        }

        const semantic = validateInstance(
          { manifest, datachainType, categories, elements },
          parsedInstance,
        )
        if (!semantic.ok) {
          return toSoftFailureResult(
            errEnvelope(semantic.errors, {
              content_hash: manifest.content_hash,
              version: version.canonical,
              warnings: semantic.warnings.map((w) => `${w.code}: ${w.message}`),
            }),
          )
        }

        const sections = buildSections(parsedInstance, categories, elements, args.locale)
        const html = await renderDatachainDocument(sections, { locale: args.locale })
        setDatachainHtml(html)

        const summary = buildAgentSummary(sections, DATACHAIN_RESOURCE_URI)
        return {
          structuredContent: okEnvelope({
            resource_uri: DATACHAIN_RESOURCE_URI,
            section_count: sections.length,
            element_count: sections.reduce((n, s) => n + s.elements.length, 0),
            warnings: semantic.warnings,
          }, { content_hash: manifest.content_hash, version: version.canonical }) as unknown as Record<string, unknown>,
          content: [{ type: 'text' as const, text: summary }],
          _meta: {
            ui: {
              resourceUri: DATACHAIN_RESOURCE_URI,
              csp: { resourceDomains: [], connectDomains: [] },
            },
          },
        }
      } catch (e) {
        return toToolResult(errEnvelope(errorsFrom(e)))
      }
    },
  }
}
