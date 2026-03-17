import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { getProvider } from '~/server/utils/provider'
import { getIconsDir } from '~/server/utils/paths'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const provider = getProvider()
  const iconsDir = getIconsDir()
  const symbolsDir = join(iconsDir, 'symbols')
  const shapesDir = join(iconsDir, 'shapes')

  const elements = await provider.getAllElements('en')
  const icons = await provider.listIcons()
  const iconSet = new Set(icons)

  // List symbols
  let symbolFiles: string[] = []
  try {
    symbolFiles = (await readdir(symbolsDir)).filter((f) => f.endsWith('.svg'))
  } catch {}
  const symbolSet = new Set(symbolFiles)

  // List shapes
  let shapeFiles: string[] = []
  try {
    shapeFiles = (await readdir(shapesDir)).filter((f) => f.endsWith('.svg'))
  } catch {}

  // If requesting SVG content for a specific file
  if (query.file) {
    const fileName = query.file as string
    if (!fileName.endsWith('.svg')) {
      throw createError({ statusCode: 400, message: 'Only SVG files supported' })
    }
    const filePath = fileName.startsWith('symbols/')
      ? join(symbolsDir, fileName.replace('symbols/', ''))
      : fileName.startsWith('shapes/')
        ? join(shapesDir, fileName.replace('shapes/', ''))
        : join(iconsDir, fileName)
    const content = await readFile(filePath, 'utf-8')
    return { fileName, content }
  }

  // Build symbol → elements mapping
  const symbolToElements = new Map<string, { id: string; name: string }[]>()
  for (const el of elements) {
    const symbolPath = el.frontmatter.symbol || ''
    const symbolFileName = symbolPath.split('/').pop() || ''
    if (symbolFileName && symbolSet.has(symbolFileName)) {
      if (!symbolToElements.has(symbolFileName)) {
        symbolToElements.set(symbolFileName, [])
      }
      symbolToElements.get(symbolFileName)!.push({
        id: el.frontmatter.id,
        name: el.frontmatter.name,
      })
    }
  }

  // Build elements list
  const elementsList = elements.map((el) => {
    const iconPath = el.frontmatter.icon || ''
    const iconFileName = iconPath.split('/').pop() || ''
    const symbolPath = el.frontmatter.symbol || ''
    const symbolFileName = symbolPath.split('/').pop() || ''
    return {
      id: el.frontmatter.id,
      name: el.frontmatter.name,
      icon: iconPath,
      iconFileName,
      symbolFileName,
      hasIcon: iconSet.has(iconFileName),
      hasSymbol: symbolSet.has(symbolFileName),
    }
  })

  // Build symbols list
  const symbolsList = symbolFiles.map((fileName) => {
    const id = fileName.replace('.svg', '')
    return {
      id,
      fileName,
      elements: symbolToElements.get(fileName) || [],
    }
  })

  // Build shapes list
  const shapesList = shapeFiles.map((fileName) => ({
    id: fileName.replace('.svg', ''),
    fileName,
  }))

  return {
    elements: elementsList,
    symbols: symbolsList,
    shapes: shapesList,
  }
})
