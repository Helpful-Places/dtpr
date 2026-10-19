// Where the URLs of the sites this one replaced now live. dtpr.io was the
// Nuxt app on Render (app/), dtpr.ai the developer docs (dtpr-ai/), and
// docs.dtpr.io the deployer docs (docs-site/). All three hosts, plus www and
// dev, now point at this Worker, and server/middleware/legacy-redirects.ts
// sends each request on to its new home.
//
// Kept free of Nitro imports so test/legacyRedirects.test.ts can run it
// directly.

export const CANONICAL_ORIGIN = 'https://dtpr.io'
const API_ORIGIN = 'https://api.dtpr.io'

export interface LegacyRequest {
  host: string
  path: string
  search: string
  method: string
  accept: string
  // The plugin version /skills/<version>/ is built for. dtpr.ai served
  // older versions that this site doesn't rebuild.
  skillsVersion: string
}

export interface LegacyRedirect {
  location: string
  status: 301 | 308
  // Set for API and icon URLs, which other sites fetch cross-origin. The
  // browser checks CORS on the redirect response, not just the final one.
  cors?: boolean
}

type Target = { path: string, query?: Record<string, string> } | { url: string, cors: true }

const ALIAS_HOSTS = new Set(['dtpr.io', 'www.dtpr.io', 'dev.dtpr.io'])
const DTPR_AI_HOSTS = new Set(['dtpr.ai', 'www.dtpr.ai'])
const DOCS_HOST = 'docs.dtpr.io'

export function resolveLegacyRedirect(req: LegacyRequest): LegacyRedirect | null {
  const host = req.host.toLowerCase().replace(/:\d+$/, '')
  const path = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path
  const alias = ALIAS_HOSTS.has(host) && host !== 'dtpr.io'

  let target: Target | null
  if (DTPR_AI_HOSTS.has(host)) target = fromDtprAi(path, req) ?? { path: '/docs/developers' }
  else if (host === DOCS_HOST) target = fromDocsSite(path) ?? { path: '/docs' }
  // dtpr.io and anything else this Worker answers on (Previews, localhost)
  // gets the old app's paths. www and dev move to dtpr.io whatever the path.
  else target = fromOldApp(path) ?? (alias ? { path: req.path } : null)

  if (!target) return null
  if ('url' in target) return { location: target.url + req.search, status: 308, cors: true }

  // Old query strings mean nothing to the new pages, except on www and dev
  // where the path is unchanged.
  const keepSearch = alias && target.path === req.path
  const query = target.query ? new URLSearchParams(target.query).toString() : ''
  const search = keepSearch ? req.search : query ? `?${query}` : ''
  const offsite = alias || DTPR_AI_HOSTS.has(host) || host === DOCS_HOST
  return { location: `${offsite ? CANONICAL_ORIGIN : ''}${target.path}${search}`, status: 301 }
}

// app/ prefixed every page but English with its locale. The taxonomy pages
// take the locale as ?locale=, and Tagalog is now fil.
const OLD_APP_LOCALES: Record<string, string> = { fr: 'fr', es: 'es', pt: 'pt', tl: 'fil', km: 'km' }

// Pages that moved. The rest of the old paths still exist here, so only
// their locale prefix goes.
const OLD_APP_PAGES: Record<string, string> = {
  '/taxonomy/device': '/taxonomy',
  '/taxonomy/ai': '/taxonomy',
  '/how-we-got-here': '/who-we-are',
  '/governance': '/who-we-are',
  '/awards': '/dtpr-in-the-world',
  '/tools-and-resources': '/get-started',
}

// Section indexes this site doesn't have a page for, which links in the
// agent skills and elsewhere point at.
const SECTION_INDEXES: Record<string, string> = {
  '/docs/developers/mcp-server/tools': '/docs/developers/mcp-server/tools/overview',
  '/docs/developers/quickstarts': '/docs/developers/quickstarts/rest',
  '/docs/developers/rest-api': '/docs/developers/rest-api/overview',
}

function fromOldApp(path: string): Target | null {
  const api = path.match(/^\/api\/dtpr\/(v0|v1)(\/.*)?$/)
  if (api) return { url: `${API_ORIGIN}/api/${api[1]}${api[2] ?? ''}`, cors: true }

  // The old pages loaded icons through Nuxt Image, as /_ipx/<size>/dtpr-icons/…
  const icon = path.match(/^(?:\/_ipx\/[^/]+)?\/dtpr-icons\/(.+\.svg)$/)
  if (icon) return { url: oldIconUrl(icon[1]!), cors: true }

  if (SECTION_INDEXES[path]) return { path: SECTION_INDEXES[path] }
  if (/^\/admin(-local)?(\/|$)/.test(path)) return { path: '/' }

  const localized = path.match(/^\/(fr|es|pt|tl|km)(\/.*)?$/)
  const rest = localized ? localized[2] ?? '/' : path
  const page = OLD_APP_PAGES[rest]
  if (!page && !localized) return null

  const locale = localized ? OLD_APP_LOCALES[localized[1]!] : undefined
  const to = page ?? rest
  return to === '/taxonomy' && locale ? { path: to, query: { locale } } : { path: to }
}

function oldIconUrl(file: string): string {
  const shape = file.match(/^shapes\/(.+)$/)
  if (shape) return `${API_ORIGIN}/api/v2/shapes/${shape[1]}`
  const symbol = file.match(/^symbols\/(.+)$/)
  if (symbol) return `${API_ORIGIN}/api/v2/schemas/dtpr@2026-09-01-beta/symbols/${symbol[1]}`
  return `${API_ORIGIN}/api/v1/icons/${file}`
}

const DTPR_AI_PAGES: Record<string, string> = {
  '/': '/docs/developers',
  '/getting-started': '/docs/developers',
  '/getting-started/mcp-quickstart': '/docs/developers/quickstarts/mcp',
  '/getting-started/rest-quickstart': '/docs/developers/quickstarts/rest',
  // The datachain visualiser has no successor yet; the MCP tool renders one.
  '/tools': '/docs/developers/mcp-server/tools/render-datachain',
  '/tools/datachain': '/docs/developers/mcp-server/tools/render-datachain',
  '/mcp': '/docs/developers/mcp-server',
  '/mcp/tools': '/docs/developers/mcp-server/tools/overview',
  '/rest': '/docs/developers/rest-api/overview',
  '/concepts': '/docs/concepts',
  '/concepts/datachains': '/docs/concepts#datachain',
  '/concepts/subchains': '/docs/concepts#subchain',
  '/concepts/versions-and-releases': '/docs/concepts#schema-version',
  '/concepts/elements-categories': '/docs/concepts#element',
  '/concepts/shape-contract': '/docs/developers/icons/shapes',
  '/concepts/content-hash': '/docs/developers/rest-api/manifest',
  '/object-reference': '/docs/developers/rest-api/schemas',
  '/changelog': '/docs/developers/changelog',
  '/attribution': '/docs/attribution',
  '/cite': '/docs/cite',
  '/taxonomy': '/taxonomy',
  '/taxonomy/print': '/taxonomy/all',
  '/dtpr-for-ai.bib': '/dtpr.bib',
  '/sitemap.xml': '/sitemap.xml',
  '/robots.txt': '/robots.txt',
}

// Same slugs under a new parent.
const DTPR_AI_SECTIONS: [RegExp, string][] = [
  [/^\/mcp\/tools\/(.+)$/, '/docs/developers/mcp-server/tools/$1'],
  [/^\/mcp\/(.+)$/, '/docs/developers/mcp-server/$1'],
  [/^\/rest\/(.+)$/, '/docs/developers/rest-api/$1'],
  [/^\/icons(\/.*)?$/, '/docs/developers/icons$1'],
  [/^\/plugin(\/.*)?$/, '/docs/developers/agent-skills$1'],
  [/^\/figma-plugin(\/.*)$/, '/figma-plugin$1'],
]

function fromDtprAi(path: string, req: LegacyRequest): Target | null {
  // The MCP endpoint, as opposed to the page about it. Clients POST, or GET
  // for an event stream.
  if (path === '/mcp' && (!['GET', 'HEAD'].includes(req.method) || req.accept.includes('text/event-stream'))) {
    return { url: `${API_ORIGIN}/mcp`, cors: true }
  }

  if (path === '/skills/manifest.json') return { path }
  const skill = path.match(/^\/skills\/[^/]+\/([^/]+)$/)
  if (skill) return { path: `/skills/${req.skillsVersion}/${skill[1]}` }

  // Every page was under /en or /fr. Early plugin versions linked them
  // without the prefix, so take both.
  const localized = path.match(/^\/(en|fr)(\/.*)?$/)
  const rest = localized ? localized[2] ?? '/' : path
  const locale = localized?.[1] === 'fr' ? 'fr' : undefined

  const taxonomy = rest.match(/^\/(?:taxonomy\/)?(elements|categories)\/([^/]+)$/)
  if (taxonomy) {
    // The functional-mode category and its elements didn't survive into
    // the dtpr schema.
    const gone = /_mode$|^functional_modes$/.test(taxonomy[2]!)
    const to = gone ? '/taxonomy' : `/taxonomy/${taxonomy[1]}/${taxonomy[2]}`
    return locale ? { path: to, query: { locale } } : { path: to }
  }
  if (rest === '/taxonomy' || rest === '/taxonomy/print') {
    const to = DTPR_AI_PAGES[rest]!
    return locale ? { path: to, query: { locale } } : { path: to }
  }

  if (DTPR_AI_PAGES[rest]) return { path: DTPR_AI_PAGES[rest] }
  for (const [pattern, to] of DTPR_AI_SECTIONS) {
    if (pattern.test(rest)) return { path: rest.replace(pattern, to).replace(/\/$/, '') }
  }
  return null
}

const DOCS_SITE_PAGES: Record<string, string> = {
  '/': '/docs/deployers',
  '/getting-started/introduction': '/get-started',
  '/getting-started/who-is-involved': '/who-we-are',
  '/standard/why-dtpr': '/get-started',
  '/standard/what-is-dtpr': '/get-started',
  '/standard/taxonomy': '/get-started#taxonomy',
  '/standard/visual-language': '/get-started#visual-language',
  '/standard/data-chain': '/docs/concepts#datachain',
  '/implementation/design-principles': '/docs/deployers/design-principles',
  '/implementation/signage': '/docs/deployers/public-signage',
  '/implementation/digital-channel': '/docs/deployers/digital-channel',
  '/appendix/how-dtpr-was-developed': '/get-started#methodology',
  '/appendix/shapes-and-colours': '/docs/deployers/shapes-and-colours',
  '/api': '/docs/developers/rest-api/overview',
  '/api/v2/overview': '/docs/developers/rest-api/overview',
  '/api/quickstart': '/docs/developers/quickstarts/rest',
  '/concepts/taxonomy': '/docs/concepts#taxonomy',
  '/concepts/variables': '/docs/concepts#variable',
  '/concepts/localization': '/docs/concepts#locale',
  '/changelog': '/docs/developers/changelog',
  '/sitemap.xml': '/sitemap.xml',
  '/robots.txt': '/robots.txt',
}

// The guide images that came across, now as WebP under /images/docs/.
const DOCS_SITE_IMAGES = new Set([
  'digital-channel-prototype-1',
  'digital-channel-prototype-2',
  'dtpr-logo-shapes',
  'hexagon-dtpr-usage',
  'honeycomb-formation',
  'road-sign-shapes',
  'signage-bristol',
  'signage-charlotte-ev',
  'signage-charlotte-road-safety',
  'signage-dc-traffic',
  'signage-detroit-drone',
  'signage-innisfil-waste',
  'signage-porto',
  'signage-sydney-crowd',
])

function fromDocsSite(path: string): Target | null {
  if (DOCS_SITE_PAGES[path]) return { path: DOCS_SITE_PAGES[path] }
  if (/^\/api\/v1(\/|$)/.test(path)) return { path: '/docs/developers/changelog#v1-frozen' }
  const image = path.match(/^\/images\/guide\/([^/]+)\.png$/)
  if (image && DOCS_SITE_IMAGES.has(image[1]!)) return { path: `/images/docs/${image[1]}.webp` }
  return null
}
