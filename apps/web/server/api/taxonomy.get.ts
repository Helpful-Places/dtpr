// The taxonomy for one schema version and locale, as the site's pages consume it.
export default defineEventHandler(async (event) => {
  const { v, locale } = getQuery(event)
  try {
    return await getDtprTaxonomy(event, typeof v === 'string' ? v : undefined, typeof locale === 'string' ? locale : undefined)
  }
  catch (error: any) {
    if (error?.statusCode === 502) throw error
    throw createError({ statusCode: 502, statusMessage: 'The DTPR API is not responding' })
  }
})
