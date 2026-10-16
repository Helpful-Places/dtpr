const SITE_TITLE = 'DTPR – Digital Trust for Places and Routines'
const SITE_DESCRIPTION = 'DTPR (Digital Trust for Places and Routines) is an open standard that explains how technology uses data, in plain language and icons anyone can understand.'

type SeoPage = { title?: string, description?: string } | null | undefined

// Sets title, description, canonical and social tags for a content page.
export function usePageSeo(page: MaybeRefOrGetter<SeoPage>) {
  const route = useRoute()
  const site = useSiteConfig()

  const title = computed(() => {
    const t = toValue(page)?.title
    return t && t !== site.name ? `${t} · ${site.name}` : SITE_TITLE
  })
  const description = computed(() => toValue(page)?.description || SITE_DESCRIPTION)
  const url = computed(() => site.url.replace(/\/$/, '') + (route.path === '/' ? '/' : route.path.replace(/\/$/, '')))
  const image = site.url.replace(/\/$/, '') + '/og-image.png'

  useHead({ link: [{ rel: 'canonical', href: url }] })
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogType: 'website',
    ogSiteName: site.name,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: 'DTPR logo',
    twitterCard: 'summary_large_image',
  })
}
