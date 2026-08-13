// Build Open Graph / Twitter share meta for a canvas so deep links preview
// on LinkedIn, the newsletter, and social (R15). Pure and useHead-shaped:
// the page resolves title/description/url and passes them in.

export interface CanvasShareInput {
  title: string
  description: string
  url: string
  siteName?: string
  image?: string
}

export interface HeadMeta {
  title: string
  meta: Array<{ property?: string, name?: string, content: string }>
  link: Array<{ rel: string, href: string }>
}

export function buildCanvasMeta(input: CanvasShareInput): HeadMeta {
  const { title, description, url, siteName = 'DTPR AI Register', image } = input
  const meta: HeadMeta['meta'] = [
    { name: 'description', content: description },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: siteName },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
  ]
  if (image) {
    meta.push({ property: 'og:image', content: image })
    meta.push({ name: 'twitter:image', content: image })
  }
  return {
    title,
    meta,
    link: [{ rel: 'canonical', href: url }],
  }
}
