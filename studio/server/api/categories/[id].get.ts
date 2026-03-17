import { getProvider } from '~/server/utils/provider'
import { LOCALES } from '~/lib/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing category id' })

  const provider = getProvider()
  const result: Record<string, any> = { id, locales: {} }

  for (const locale of LOCALES) {
    try {
      const file = await provider.readFile('categories', locale, id)
      result.locales[locale] = {
        ...file.frontmatter,
        content: file.content,
      }
      if (!result.datachain_type) {
        result.datachain_type = file.frontmatter.datachain_type
        result.order = file.frontmatter.order
        result.required = file.frontmatter.required
        result.element_variables = file.frontmatter.element_variables
        result.updated_at = file.frontmatter.updated_at
      }
    } catch {
      // Locale not available
    }
  }

  if (Object.keys(result.locales).length === 0) {
    throw createError({ statusCode: 404, message: `Category not found: ${id}` })
  }

  // Also fetch elements in this category
  const elements = await provider.query('elements', { locale: 'en', category: id })
  result.elements = elements.map((el) => ({
    id: el.frontmatter.id,
    name: el.frontmatter.name,
    icon: el.frontmatter.icon,
  }))

  return result
})
