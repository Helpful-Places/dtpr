// Review status and open reviewer flags for every locale of one schema version.
export default defineEventHandler(async (event) => {
  const { v } = getQuery(event)
  try {
    const versions = await getDtprVersions(event)
    const version = versions.find((x) => x.id === v) ?? versions[0]!
    return { version, ...(await getDtprTranslations(event, version.id)) }
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'The DTPR API is not responding' })
  }
})
