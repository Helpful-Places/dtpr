import { readFile } from 'fs/promises'
import { join } from 'path'
import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provider = getProvider()
  const iconsDir = getIconsDir()

  const elements = await provider.getAllElements('en')
  const icons = await provider.listIcons()
  const iconSet = new Set(icons)

  // If requesting SVG content for a specific icon
  if (query.file) {
    const fileName = query.file as string
    if (!fileName.endsWith('.svg')) {
      throw createError({ statusCode: 400, message: 'Only SVG files supported' })
    }
    const content = await readFile(join(iconsDir, fileName), 'utf-8')
    return { fileName, content }
  }

  // Return all elements with icon status
  return elements.map((el) => {
    const iconPath = el.frontmatter.icon || ''
    const iconFileName = iconPath.split('/').pop() || ''
    return {
      id: el.frontmatter.id,
      name: el.frontmatter.name,
      icon: iconPath,
      iconFileName,
      hasIcon: iconSet.has(iconFileName),
    }
  })
})
