import { getContentDir } from '~/server/utils/paths'
import { writeMarkdownFile, buildElementFileName, serializeFrontmatter } from '~/lib/content-writer'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, name, description, category, icon } = body

  if (!id || !name || !category?.length) {
    throw createError({ statusCode: 400, message: 'id, name, and category are required' })
  }

  const contentDir = getContentDir()
  const fileName = buildElementFileName(id, category)
  const now = new Date().toISOString().split('T')[0] + 'T00:00:00Z'

  const frontmatter = serializeFrontmatter({
    category,
    name,
    id,
    description: description || '',
    icon: icon || `/dtpr-icons/${id}.svg`,
    updated_at: now,
  })

  const filePath = await writeMarkdownFile(contentDir, 'elements', 'en', fileName, frontmatter)

  return { success: true, filePath, fileName }
})
