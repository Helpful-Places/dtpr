import { getProvider } from '~/server/utils/provider'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provider = getProvider()

  const locale = query.locale as string | undefined
  const category = query.category as string | undefined
  const search = query.search as string | undefined
  const datachain_type = query.datachain_type as string | undefined
  const hasIcon = query.hasIcon !== undefined ? query.hasIcon === 'true' : undefined

  if (locale || category || search || datachain_type || hasIcon !== undefined) {
    const elements = await provider.query('elements', {
      locale: locale as any,
      category,
      datachain_type: datachain_type as any,
      search,
      hasIcon,
    })
    return elements.map((el) => ({
      ...el.frontmatter,
      locale: el.locale,
      fileName: el.filePath.split('/').pop(),
    }))
  }

  // Default: return summaries (aggregated across locales)
  const summaries = await provider.getElementSummaries()
  return summaries
})
