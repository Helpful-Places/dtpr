import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provider = getProvider()
  const iconsDir = getIconsDir()
  const symbolsDir = join(iconsDir, 'symbols')

  const elements = await provider.getAllElements('en')
  const icons = await provider.listIcons()
  const iconSet = new Set(icons)

  // List symbols
  let symbolSet: Set<string>
  try {
    const symbolFiles = await readdir(symbolsDir)
    symbolSet = new Set(symbolFiles.filter((f) => f.endsWith('.svg')))
  } catch {
    symbolSet = new Set()
  }

  // If requesting SVG content for a specific file
  if (query.file) {
    const fileName = query.file as string
    if (!fileName.endsWith('.svg')) {
      throw createError({ statusCode: 400, message: 'Only SVG files supported' })
    }
    // Support symbols/ subdirectory
    const filePath = fileName.startsWith('symbols/')
      ? join(symbolsDir, fileName.replace('symbols/', ''))
      : join(iconsDir, fileName)
    const content = await readFile(filePath, 'utf-8')
    return { fileName, content }
  }

  // Return all elements with icon and symbol status
  return elements.map((el) => {
    const iconPath = el.frontmatter.icon || ''
    const iconFileName = iconPath.split('/').pop() || ''
    return {
      id: el.frontmatter.id,
      name: el.frontmatter.name,
      icon: iconPath,
      iconFileName,
      hasIcon: iconSet.has(iconFileName),
      hasSymbol: symbolSet.has(iconFileName),
    }
  })
})
