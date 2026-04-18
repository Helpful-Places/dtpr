import { describe, it, expect, beforeAll } from 'vitest'
import { SELF } from 'cloudflare:test'
import {
  categoriesFingerprint,
  elementsFingerprint,
} from './helpers.ts'
import {
  CategoriesResponseSchema,
  ElementsResponseSchema,
  ManifestResponseSchema,
  SchemaIndexResponseSchema,
  SingleElementResponseSchema,
} from './schemas.ts'
import { SAMPLE_VERSION, seedVersion } from './seed.ts'
import { createMcpClient, structured, type ToolCallResult } from './mcp-client.ts'

/**
 * Harness-parity coverage — mirrors the `app/test/api/*` pattern.
 * Each response shape is re-validated with a separately-maintained
 * Zod schema (catches accidental wire breakage) and distilled to a
 * structural fingerprint for snapshot-based regression detection.
 */

beforeAll(async () => {
  await seedVersion()
})

describe('harness parity: response shape + fingerprint', () => {
  it('GET /schemas conforms to the index response schema', async () => {
    const res = await SELF.fetch('https://example.com/api/v2/schemas')
    const json = await res.json()
    expect(() => SchemaIndexResponseSchema.parse(json)).not.toThrow()
  })

  it('GET /manifest conforms to the manifest response schema', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/manifest`,
    )
    const json = await res.json()
    expect(() => ManifestResponseSchema.parse(json)).not.toThrow()
  })

  it('GET /categories matches snapshot fingerprint (ignores prose)', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/categories`,
    )
    const parsed = CategoriesResponseSchema.parse(await res.json())
    expect(categoriesFingerprint(parsed)).toMatchInlineSnapshot(`
      [
        {
          "context_value_ids": [
            "ai_only",
          ],
          "datachain_type": "ai",
          "has_context": true,
          "id": "ai__decision",
          "locales": [
            "en",
            "fr",
          ],
          "order": 1,
          "required": true,
          "shape": "hexagon",
          "variable_ids": [],
        },
      ]
    `)
  })

  it('GET /elements?fields=all matches snapshot fingerprint', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements?fields=all`,
    )
    const parsed = ElementsResponseSchema.parse(await res.json())
    expect(elementsFingerprint(parsed)).toMatchInlineSnapshot(`
      [
        {
          "category_id": "ai__decision",
          "id": "accept_deny",
          "locales": [
            "en",
            "fr",
          ],
          "variable_ids": [],
        },
        {
          "category_id": "ai__decision",
          "id": "anomaly_detection",
          "locales": [
            "en",
            "fr",
          ],
          "variable_ids": [],
        },
        {
          "category_id": "ai__decision",
          "id": "identifiable_video",
          "locales": [
            "en",
            "fr",
          ],
          "variable_ids": [],
        },
      ]
    `)
  })

  it('GET /elements/:id conforms to the single-element response schema', async () => {
    const res = await SELF.fetch(
      `https://example.com/api/v2/schemas/${SAMPLE_VERSION.canonical}/elements/accept_deny`,
    )
    const json = await res.json()
    expect(() => SingleElementResponseSchema.parse(json)).not.toThrow()
  })
})

describe('harness parity: full agent-like MCP flow', () => {
  it('initialize → tools/list → list_schema_versions → get_schema → list_elements(query) → get_elements → validate_datachain', async () => {
    const start = Date.now()

    const client = createMcpClient()
    const init = await client.initialize()
    expect(init.error).toBeUndefined()

    const tools = await client.listTools()
    expect(tools.error).toBeUndefined()

    const versionsCall = await client.callTool<
      ToolCallResult<{ data: { versions: Array<{ id: string }> } }>
    >('list_schema_versions', {})
    const versions = structured(versionsCall)
    const versionId = versions.data.versions[0]!.id

    const schemaCall = await client.callTool<ToolCallResult<{ data: { manifest: unknown } }>>(
      'get_schema',
      { version: versionId },
    )
    structured(schemaCall)

    const listCall = await client.callTool<
      ToolCallResult<{ data: { elements: Array<{ id: string }> } }>
    >('list_elements', { version: versionId, query: 'video', limit: 5 })
    const list = structured(listCall)
    const topId = list.data.elements[0]!.id

    const bulkCall = await client.callTool<
      ToolCallResult<{ data: { elements: Record<string, unknown> } }>
    >('get_elements', {
      version: versionId,
      element_ids: [topId, 'accept_deny'],
    })
    const bulk = structured(bulkCall)
    expect(Object.keys(bulk.data.elements).sort()).toEqual([topId, 'accept_deny'].sort())

    const validateCall = await client.callTool<
      ToolCallResult<{ ok: boolean; data?: { ok: boolean } }>
    >('validate_datachain', {
      version: versionId,
      datachain: {
        id: 'harness-1',
        schema_version: versionId,
        created_at: '2026-04-16T00:00:00.000Z',
        elements: [{ element_id: topId }, { element_id: 'accept_deny' }],
      },
    })
    const validate = structured(validateCall)
    expect(validate.ok).toBe(true)

    // Session timing canary (regression signal only — not asserted as
    // a p95 SLO because Miniflare's single-process simulation doesn't
    // produce a meaningful distribution).
    const elapsed = Date.now() - start
    console.info(
      `harness-parity: full MCP flow elapsed=${elapsed}ms (log-only canary, no SLO)`,
    )
    expect(elapsed).toBeLessThan(30_000)
  })
})
