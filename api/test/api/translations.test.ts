import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { SELF } from 'cloudflare:test'
import { SAMPLE_BETA_VERSION, SAMPLE_VERSION, makeManifest, seedVersion } from './seed.ts'
import { createMcpClient, structured, type ToolCallResult } from './mcp-client.ts'
import { _resetInlineBundles } from '../../src/store/inline-bundles.ts'
import type { EmittedTranslationStatus } from '../../src/schema/translation-status.ts'
import type { TranslationsPayload } from '../../src/rest/translations.ts'

beforeEach(() => {
  _resetInlineBundles()
})

const TRANSLATIONS: EmittedTranslationStatus = {
  source_locale: 'en',
  locales: [
    {
      locale: 'fr',
      status: 'unverified',
      updated_at: '2026-08-26',
      summary: 'Predates the workflow.',
    },
    {
      locale: 'fil',
      status: 'machine_reviewed',
      register: 'Filipino, polite plural',
      translated_by: 'model-a',
      reviewed_by: 'model-b',
      updated_at: '2026-10-05',
      summary: 'Publishable.',
    },
  ],
  flags: [
    {
      id: 'en-typo',
      locale: 'en',
      kind: 'source_issue',
      status: 'resolved',
      raised_by: 'translator',
      keys: ['elements/accept_deny.yaml#description'],
      note: 'Fixed.',
      targets: [{ type: 'element', id: 'accept_deny', field: 'description' }],
    },
    {
      id: 'en-placeholder',
      locale: 'en',
      kind: 'layout',
      status: 'open',
      raised_by: 'translator',
      keys: ['categories/ai__decision.yaml#element_context.values[0].name'],
      note: 'Abuts the text.',
      targets: [{ type: 'category', id: 'ai__decision', field: 'element_context.values[0].name' }],
    },
    {
      id: 'fil-vendor',
      locale: 'fil',
      kind: 'term_choice',
      status: 'open',
      raised_by: 'reviewer',
      keys: ['elements/accept_deny.yaml#title'],
      note: 'Check the term.',
      alternatives: ['Supplier'],
      targets: [{ type: 'element', id: 'accept_deny', field: 'title' }],
    },
    {
      id: 'fil-skip',
      locale: 'fil',
      kind: 'native_review',
      status: 'wontfix',
      raised_by: 'human',
      keys: ['datachain-type.yaml#name'],
      note: 'Left as is.',
      targets: [{ type: 'datachain_type', id: 'ai', field: 'name' }],
    },
  ],
}

type Body = { ok: true } & TranslationsPayload

const url = (version: string, query = '') =>
  `https://example.com/api/v2/schemas/${version}/translations${query}`

async function seed(version = SAMPLE_BETA_VERSION, translations: EmittedTranslationStatus | null = TRANSLATIONS) {
  await seedVersion({
    version,
    manifest: { ...makeManifest(version), locales: ['en', 'fr', 'fil', 'zh-Hant'] },
    translations: translations ?? undefined,
  })
}

describe('REST: GET .../translations', () => {
  beforeAll(() => seed())

  it('lists every manifest locale and the open flags by default', async () => {
    const res = await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical))
    expect(res.status).toBe(200)
    const body = (await res.json()) as Body
    expect(body.ok).toBe(true)
    expect(body.version).toBe(SAMPLE_BETA_VERSION.canonical)
    expect(body.source_locale).toBe('en')
    expect(body.locales.map((l) => [l.locale, l.status])).toEqual([
      ['en', 'source'],
      ['fr', 'unverified'],
      ['fil', 'machine_reviewed'],
      // In the manifest but not in the status file.
      ['zh-Hant', 'unverified'],
    ])
    expect(body.flags.map((f) => f.id)).toEqual(['en-placeholder', 'fil-vendor'])
  })

  it('carries recorded fields for translated locales and none for the source', async () => {
    const body = (await (await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical))).json()) as Body
    expect(body.locales[0]).toEqual({
      locale: 'en',
      status: 'source',
      updated_at: null,
      summary: '',
      flag_counts: { open: 1, resolved: 1, wontfix: 0 },
    })
    expect(body.locales[2]).toEqual({
      locale: 'fil',
      status: 'machine_reviewed',
      register: 'Filipino, polite plural',
      translated_by: 'model-a',
      reviewed_by: 'model-b',
      updated_at: '2026-10-05',
      summary: 'Publishable.',
      flag_counts: { open: 1, resolved: 0, wontfix: 1 },
    })
  })

  it('serves targets and alternatives alongside the raw keys', async () => {
    const body = (await (await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical))).json()) as Body
    const flag = body.flags.find((f) => f.id === 'fil-vendor')!
    expect(flag.keys).toEqual(['elements/accept_deny.yaml#title'])
    expect(flag.targets).toEqual([{ type: 'element', id: 'accept_deny', field: 'title' }])
    expect(flag.alternatives).toEqual(['Supplier'])
  })

  it('?flag_status selects flags without changing flag_counts', async () => {
    const ids = async (status: string) => {
      const body = (await (
        await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical, `?flag_status=${status}`))
      ).json()) as Body
      expect(body.locales[2]!.flag_counts).toEqual({ open: 1, resolved: 0, wontfix: 1 })
      return body.flags.map((f) => f.id)
    }
    expect(await ids('resolved')).toEqual(['en-typo'])
    expect(await ids('wontfix')).toEqual(['fil-skip'])
    expect(await ids('all')).toEqual(['en-typo', 'en-placeholder', 'fil-vendor', 'fil-skip'])
  })

  it('unknown flag_status → 400', async () => {
    const res = await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical, '?flag_status=closed'))
    expect(res.status).toBe(400)
    const body = (await res.json()) as { errors: { code: string; fix_hint?: string }[] }
    expect(body.errors[0]?.code).toBe('bad_request')
    expect(body.errors[0]?.fix_hint).toContain('open, resolved, wontfix, all')
  })

  it('?locales filters locale entries and flags, resolving aliases', async () => {
    const res = await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical, '?locales=tl&flag_status=all'))
    const body = (await res.json()) as Body
    expect(body.locales.map((l) => l.locale)).toEqual(['fil'])
    expect(body.flags.map((f) => f.id)).toEqual(['fil-vendor', 'fil-skip'])

    const multi = (await (
      await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical, '?locales=zh-TW,en'))
    ).json()) as Body
    expect(multi.locales.map((l) => l.locale)).toEqual(['en', 'zh-Hant'])
    expect(multi.flags.map((f) => f.id)).toEqual(['en-placeholder'])
  })

  it('unknown version returns the shared 404 envelope', async () => {
    const res = await SELF.fetch(url('ai@2099-12-31'))
    expect(res.status).toBe(404)
    const body = (await res.json()) as { errors: { code: string; fix_hint?: string }[] }
    expect(body.errors[0]?.code).toBe('not_found')
    expect(body.errors[0]?.fix_hint).toContain('GET /api/v2/schemas')
  })

  it('beta is no-store and stamps the content hash', async () => {
    const res = await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical))
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(res.headers.get('DTPR-Content-Hash')).toMatch(/^sha256-/)
  })
})

describe('REST: GET .../translations on a stable version', () => {
  beforeAll(() => seed(SAMPLE_VERSION))

  it('uses a short max-age, not immutable', async () => {
    const res = await SELF.fetch(url(SAMPLE_VERSION.canonical))
    expect(res.status).toBe(200)
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300')
  })
})

describe('REST: GET .../translations without a status file', () => {
  beforeAll(() => seed(SAMPLE_BETA_VERSION, null))

  it('returns 200 with unverified locales and no flags', async () => {
    const res = await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical, '?flag_status=all'))
    expect(res.status).toBe(200)
    const body = (await res.json()) as Body
    expect(body.source_locale).toBe('en')
    expect(body.locales.map((l) => [l.locale, l.status])).toEqual([
      ['en', 'source'],
      ['fr', 'unverified'],
      ['fil', 'unverified'],
      ['zh-Hant', 'unverified'],
    ])
    expect(body.locales[1]).toEqual({
      locale: 'fr',
      status: 'unverified',
      updated_at: null,
      summary: '',
      flag_counts: { open: 0, resolved: 0, wontfix: 0 },
    })
    expect(body.flags).toEqual([])
  })
})

describe('MCP: get_translation_status', () => {
  beforeAll(() => seed())

  it('returns the REST payload in the tool envelope', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<{ ok: boolean; data?: TranslationsPayload }>>(
      'get_translation_status',
      { version: SAMPLE_BETA_VERSION.canonical },
    )
    const env = structured(res)
    const rest = (await (await SELF.fetch(url(SAMPLE_BETA_VERSION.canonical))).json()) as Body
    const { ok: _ok, ...payload } = rest
    expect(env.ok).toBe(true)
    expect(env.data).toEqual(payload)
  })

  it('accepts locales (with aliases) and flag_status', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<ToolCallResult<{ ok: boolean; data?: TranslationsPayload }>>(
      'get_translation_status',
      { version: SAMPLE_BETA_VERSION.canonical, locales: ['tl'], flag_status: 'wontfix' },
    )
    const env = structured(res)
    expect(env.data?.locales.map((l) => l.locale)).toEqual(['fil'])
    expect(env.data?.flags.map((f) => f.id)).toEqual(['fil-skip'])
  })

  it('rejects an unknown flag_status', async () => {
    const client = createMcpClient()
    await client.initialize()
    const res = await client.callTool<
      ToolCallResult<{ ok: boolean; errors?: { code: string }[] }>
    >('get_translation_status', { version: SAMPLE_BETA_VERSION.canonical, flag_status: 'closed' })
    const env = structured(res)
    expect(env.ok).toBe(false)
    expect(env.errors?.[0]?.code).toBe('invalid_arguments')
  })
})
