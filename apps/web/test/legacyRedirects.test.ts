import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveLegacyRedirect, type LegacyRequest } from '../server/utils/legacyRedirects.ts'

function go(url: string, init: Partial<LegacyRequest> = {}) {
  const u = new URL(url)
  return resolveLegacyRedirect({
    host: u.host,
    path: u.pathname,
    search: u.search,
    method: 'GET',
    accept: 'text/html',
    skillsVersion: '0.3.3',
    ...init,
  })
}

function to(url: string, init?: Partial<LegacyRequest>) {
  return go(url, init)?.location
}

test('dtpr.io serves its own pages', () => {
  for (const path of ['/', '/taxonomy', '/taxonomy/elements/input_decision', '/docs', '/get-involved', '/sitemap.xml', '/_nuxt/x.js']) {
    assert.equal(go(`https://dtpr.io${path}`), null, path)
  }
})

test('www and dev keep the path and query', () => {
  assert.equal(to('https://www.dtpr.io/'), 'https://dtpr.io/')
  assert.equal(to('https://dev.dtpr.io/taxonomy?locale=fr'), 'https://dtpr.io/taxonomy?locale=fr')
  assert.equal(to('https://dev.dtpr.io/awards'), 'https://dtpr.io/dtpr-in-the-world')
  assert.equal(go('https://www.dtpr.io/')?.status, 301)
})

test('old app pages on dtpr.io', () => {
  assert.equal(to('https://dtpr.io/taxonomy/device'), '/taxonomy')
  assert.equal(to('https://dtpr.io/taxonomy/ai/'), '/taxonomy')
  assert.equal(to('https://dtpr.io/how-we-got-here'), '/who-we-are')
  assert.equal(to('https://dtpr.io/governance'), '/who-we-are')
  assert.equal(to('https://dtpr.io/tools-and-resources'), '/get-started')
  assert.equal(to('https://dtpr.io/admin/index.html'), '/')
  assert.equal(to('https://dtpr.io/fr'), '/')
  assert.equal(to('https://dtpr.io/es/get-involved'), '/get-involved')
  assert.equal(to('https://dtpr.io/fr/taxonomy/ai'), '/taxonomy?locale=fr')
  assert.equal(to('https://dtpr.io/tl/taxonomy'), '/taxonomy?locale=fil')
})

test('section indexes without a page', () => {
  assert.equal(to('https://dtpr.io/docs/developers/mcp-server/tools/'), '/docs/developers/mcp-server/tools/overview')
  assert.equal(to('https://dtpr.io/docs/developers/rest-api'), '/docs/developers/rest-api/overview')
  assert.equal(to('https://dtpr.io/docs/developers/quickstarts'), '/docs/developers/quickstarts/rest')
})

test('legacy API and icons go to api.dtpr.io with CORS', () => {
  const v0 = go('https://dtpr.io/api/dtpr/v0/en')
  assert.deepEqual(v0, { location: 'https://api.dtpr.io/api/v0/en', status: 308, cors: true })
  assert.equal(to('https://dtpr.io/api/dtpr/v1/elements/ai?locales=en,fr'), 'https://api.dtpr.io/api/v1/elements/ai?locales=en,fr')
  assert.equal(to('https://dtpr.io/dtpr-icons/accessibility.svg'), 'https://api.dtpr.io/api/v1/icons/accessibility.svg')
  assert.equal(to('https://dtpr.io/_ipx/s_64x64/dtpr-icons/accessibility.svg'), 'https://api.dtpr.io/api/v1/icons/accessibility.svg')
  assert.equal(to('https://dtpr.io/dtpr-icons/shapes/hexagon.svg'), 'https://api.dtpr.io/api/v2/shapes/hexagon.svg')
  assert.equal(to('https://dtpr.io/dtpr-icons/symbols/audit.svg'), 'https://api.dtpr.io/api/v2/schemas/dtpr@2026-09-01-beta/symbols/audit.svg')
  assert.equal(to('https://www.dtpr.io/api/dtpr/v0/fr'), 'https://api.dtpr.io/api/v0/fr')
})

test('dtpr.ai pages, with or without the locale prefix', () => {
  assert.equal(to('https://dtpr.ai/'), 'https://dtpr.io/docs/developers')
  assert.equal(to('https://www.dtpr.ai/en'), 'https://dtpr.io/docs/developers')
  assert.equal(to('https://dtpr.ai/en/getting-started/mcp-quickstart'), 'https://dtpr.io/docs/developers/quickstarts/mcp')
  assert.equal(to('https://dtpr.ai/en/mcp'), 'https://dtpr.io/docs/developers/mcp-server')
  assert.equal(to('https://dtpr.ai/en/mcp/connection'), 'https://dtpr.io/docs/developers/mcp-server/connection')
  assert.equal(to('https://dtpr.ai/mcp/tools/'), 'https://dtpr.io/docs/developers/mcp-server/tools/overview')
  assert.equal(to('https://dtpr.ai/mcp/tools/get-element'), 'https://dtpr.io/docs/developers/mcp-server/tools/get-element')
  assert.equal(to('https://dtpr.ai/en/rest'), 'https://dtpr.io/docs/developers/rest-api/overview')
  assert.equal(to('https://dtpr.ai/en/rest/icons'), 'https://dtpr.io/docs/developers/rest-api/icons')
  assert.equal(to('https://dtpr.ai/en/icons'), 'https://dtpr.io/docs/developers/icons')
  assert.equal(to('https://dtpr.ai/en/icons/urls'), 'https://dtpr.io/docs/developers/icons/urls')
  assert.equal(to('https://dtpr.ai/en/plugin/skills/describe-system'), 'https://dtpr.io/docs/developers/agent-skills/skills/describe-system')
  assert.equal(to('https://dtpr.ai/en/concepts/subchains'), 'https://dtpr.io/docs/concepts#subchain')
  assert.equal(to('https://dtpr.ai/fr/cite'), 'https://dtpr.io/docs/cite')
  assert.equal(to('https://dtpr.ai/en/tools/datachain'), 'https://dtpr.io/docs/developers/mcp-server/tools/render-datachain')
  assert.equal(to('https://dtpr.ai/en/ui/vue'), 'https://dtpr.io/docs/developers')
  assert.equal(to('https://dtpr.ai/llms.txt'), 'https://dtpr.io/docs/developers')
})

test('dtpr.ai taxonomy', () => {
  assert.equal(to('https://dtpr.ai/en/taxonomy?v=ai@2026-04-16'), 'https://dtpr.io/taxonomy')
  assert.equal(to('https://dtpr.ai/fr/taxonomy'), 'https://dtpr.io/taxonomy?locale=fr')
  assert.equal(to('https://dtpr.ai/en/taxonomy/print'), 'https://dtpr.io/taxonomy/all')
  assert.equal(to('https://dtpr.ai/en/taxonomy/elements/input_decision'), 'https://dtpr.io/taxonomy/elements/input_decision')
  assert.equal(to('https://dtpr.ai/en/elements/input_decision'), 'https://dtpr.io/taxonomy/elements/input_decision')
  assert.equal(to('https://dtpr.ai/fr/taxonomy/categories/ai__decision'), 'https://dtpr.io/taxonomy/categories/ai__decision?locale=fr')
  assert.equal(to('https://dtpr.ai/en/taxonomy/elements/agentic_mode'), 'https://dtpr.io/taxonomy')
  assert.equal(to('https://dtpr.ai/en/taxonomy/categories/functional_modes'), 'https://dtpr.io/taxonomy')
})

test('dtpr.ai downloads and the MCP endpoint', () => {
  assert.equal(to('https://dtpr.ai/skills/0.3.2/dtpr-skills.zip'), 'https://dtpr.io/skills/0.3.3/dtpr-skills.zip')
  assert.equal(to('https://dtpr.ai/skills/manifest.json'), 'https://dtpr.io/skills/manifest.json')
  assert.equal(to('https://dtpr.ai/figma-plugin/0.2.0/dtpr-figma-plugin.zip'), 'https://dtpr.io/figma-plugin/0.2.0/dtpr-figma-plugin.zip')
  assert.equal(to('https://dtpr.ai/dtpr-for-ai.bib'), 'https://dtpr.io/dtpr.bib')
  assert.deepEqual(go('https://dtpr.ai/mcp', { method: 'POST' }), { location: 'https://api.dtpr.io/mcp', status: 308, cors: true })
  assert.equal(to('https://dtpr.ai/mcp', { accept: 'text/event-stream' }), 'https://api.dtpr.io/mcp')
})

test('docs.dtpr.io', () => {
  assert.equal(to('https://docs.dtpr.io/'), 'https://dtpr.io/docs/deployers')
  assert.equal(to('https://docs.dtpr.io/getting-started/who-is-involved'), 'https://dtpr.io/who-we-are')
  assert.equal(to('https://docs.dtpr.io/standard/visual-language'), 'https://dtpr.io/get-started#visual-language')
  assert.equal(to('https://docs.dtpr.io/implementation/signage'), 'https://dtpr.io/docs/deployers/public-signage')
  assert.equal(to('https://docs.dtpr.io/api'), 'https://dtpr.io/docs/developers/rest-api/overview')
  assert.equal(to('https://docs.dtpr.io/api/v1/elements'), 'https://dtpr.io/docs/developers/changelog#v1-frozen')
  assert.equal(to('https://docs.dtpr.io/concepts/variables'), 'https://dtpr.io/docs/concepts#variable')
  assert.equal(to('https://docs.dtpr.io/images/guide/signage-porto.png'), 'https://dtpr.io/images/docs/signage-porto.webp')
})

test('unknown legacy paths land on the docs instead of a 404', () => {
  assert.equal(to('https://dtpr.ai/en/some/old/page'), 'https://dtpr.io/docs/developers')
  assert.equal(to('https://docs.dtpr.io/whatever'), 'https://dtpr.io/docs')
  assert.equal(to('https://docs.dtpr.io/images/guide/gone.png'), 'https://dtpr.io/docs')
  assert.equal(to('https://DTPR.AI:443/en/cite'), 'https://dtpr.io/docs/cite')
})
