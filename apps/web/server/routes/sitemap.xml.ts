import { getSiteConfig } from '#site-config/server/composables'

export default defineEventHandler(async (event) => {
  const base = getSiteConfig(event).url.replace(/\/$/, '')

  const [pages, docs, privacy] = await Promise.all([
    queryCollection(event, 'pages').select('path').all(),
    queryCollection(event, 'docs').where('extension', '=', 'md').select('path').all(),
    queryCollection(event, 'privacy').select('path').all(),
  ])

  // Taxonomy pages come from the DTPR API. If it is unreachable the sitemap
  // still lists the section's fixed pages.
  const taxonomy = ['/taxonomy', '/taxonomy/all', '/taxonomy/translations']
  if (useRuntimeConfig(event).public.features.builder) taxonomy.push('/taxonomy/builder')
  try {
    const { categories, elements } = await getDtprTaxonomy(event)
    taxonomy.push(...categories.map(c => `/taxonomy/categories/${c.id}`), ...elements.map(e => `/taxonomy/elements/${e.id}`))
  }
  catch {}

  const paths = [...new Set([...[...pages, ...docs, ...privacy].map(p => p.path), ...taxonomy])].sort()
  const urls = paths.map(p => `  <url><loc>${base}${p}</loc></url>`).join('\n')

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
})
