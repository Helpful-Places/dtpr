import { readFile } from 'fs/promises'
import { join, basename } from 'path'
import matter from 'gray-matter'
import { getContentDir } from '~/server/utils/paths'
import { writeMarkdownFile, serializeFrontmatter } from '~/lib/content-writer'
import { getProvider } from '~/server/utils/provider'
import type { Locale } from '~/lib/types'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Missing element id' })

  const body = await readBody(event)
  const { locale, name, description } = body as {
    locale: Locale
    name?: string
    description?: string
  }

  if (!locale) throw createError({ statusCode: 400, message: 'locale is required' })

  const contentDir = getContentDir()
  const provider = getProvider()

  // Find the existing file to get the filename and structural fields
  let existingFile
  try {
    existingFile = await provider.readFile('elements', 'en', id)
  } catch {
    // If no English file, try the target locale
    existingFile = await provider.readFile('elements', locale, id)
  }

  const fileName = basename(existingFile.filePath)

  // Read the existing locale file if it exists, or start from English
  let currentFrontmatter: Record<string, any>
  let currentBody = ''
  try {
    const localeFilePath = join(contentDir, 'elements', locale, fileName)
    const raw = await readFile(localeFilePath, 'utf-8')
    const parsed = matter(raw)
    currentFrontmatter = parsed.data
    currentBody = parsed.content.trim()
  } catch {
    // Creating new locale file — copy structural fields from English
    currentFrontmatter = { ...existingFile.frontmatter }
  }

  // Update translatable fields
  if (name !== undefined) currentFrontmatter.name = name
  if (description !== undefined) currentFrontmatter.description = description
  currentFrontmatter.updated_at = new Date().toISOString().split('T')[0] + 'T00:00:00Z'

  const ordered = serializeFrontmatter(currentFrontmatter)
  await writeMarkdownFile(contentDir, 'elements', locale, fileName, ordered, currentBody)

  return { success: true, locale, id }
})
