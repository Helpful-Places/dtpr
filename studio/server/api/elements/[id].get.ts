import { basename } from 'path'
import { getProvider } from '~/server/utils/provider'
import { LOCALES } from '~/lib/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing element id' })

  const provider = getProvider()
  const result: Record<string, any> = { id, locales: {} }

  for (const locale of LOCALES) {
    try {
      const file = await provider.readFile('elements', locale, id)
      result.locales[locale] = {
        ...file.frontmatter,
        content: file.content,
      }
      // Set structural fields from any locale (they should be the same across locales)
      if (!result.category) {
        result.category = file.frontmatter.category
        result.icon = file.frontmatter.icon
        result.updated_at = file.frontmatter.updated_at
        result.fileName = basename(file.filePath)
      }
    } catch {
      // Locale not available
    }
  }

  if (Object.keys(result.locales).length === 0) {
    throw createError({ statusCode: 404, message: `Element not found: ${id}` })
  }

  return result
})
