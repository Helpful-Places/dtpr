import { getProvider } from '~/server/utils/provider'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provider = getProvider()

  const datachain_type = query.datachain_type as string | undefined

  const summaries = await provider.getCategorySummaries()

  if (datachain_type) {
    return summaries.filter((c) => c.datachain_type === datachain_type)
  }

  return summaries
})
