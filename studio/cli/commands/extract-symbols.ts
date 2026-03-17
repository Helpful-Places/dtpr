import { Command } from 'commander'
import { readFile, writeFile, readdir, mkdir } from 'fs/promises'
import { join, basename } from 'path'
import { resolve } from 'path'
import { SHAPE_SIGNATURES, type ShapeType } from '../../lib/icon-shapes'

interface ExtractionResult {
  elementId: string
  sourceFile: string
  pattern: 'shape-first' | 'shape-last' | 'compound-path' | 'mask-based' | 'foreign' | 'unknown'
  detectedShape: ShapeType | null
  symbolSvg: string | null
  warnings: string[]
}

// Known octagon outline d-prefix (both outer and inner stroke paths)
const OCTAGON_OUTER_PREFIX = 'M23.6191'
const OCTAGON_INNER_PREFIX = 'M2.91309'
// Also handle the shifted variant from rights_forgotten
const OCTAGON_OUTER_PREFIX_ALT = 'M23.6191 0.248047'

export const extractSymbolsCommand = new Command('extract-symbols')
  .description('Extract symbol SVGs from existing composed icons')
  .option('--dry-run', 'Report what would happen without writing files')
  .option('--id <id>', 'Extract a single element by ID')
  .option('-i, --icons-dir <dir>', 'Icons directory', resolve(process.cwd(), '..', 'app', 'public', 'dtpr-icons'))
  .action(async (opts) => {
    const iconsDir = opts.iconsDir
    const symbolsDir = join(iconsDir, 'symbols')

    if (!opts.dryRun) {
      await mkdir(symbolsDir, { recursive: true })
    }

    const files = await readdir(iconsDir)
    const svgFiles = files.filter((f) => f.endsWith('.svg'))

    const results: ExtractionResult[] = []
    let successCount = 0
    let skipCount = 0
    let failCount = 0

    for (const file of svgFiles) {
      const elementId = basename(file, '.svg')

      if (opts.id && elementId !== opts.id) continue

      const svgContent = await readFile(join(iconsDir, file), 'utf-8')
      const result = extractSymbol(svgContent, elementId, file)
      results.push(result)

      if (result.symbolSvg) {
        successCount++
        if (!opts.dryRun) {
          await writeFile(join(symbolsDir, file), result.symbolSvg, 'utf-8')
        }
        const shapeLabel = result.detectedShape || '?'
        console.log(`  ✅ ${elementId} [${result.pattern}] shape=${shapeLabel}`)
      } else {
        failCount++
        console.log(`  ❌ ${elementId} [${result.pattern}] ${result.warnings.join('; ')}`)
      }
    }

    console.log(`\n📊 Results: ${successCount} extracted, ${failCount} failed, ${skipCount} skipped`)

    if (opts.dryRun) {
      console.log('  (dry run — no files written)')
    } else {
      console.log(`  Symbols written to: ${symbolsDir}`)
    }

    // Show failed extractions
    const failed = results.filter((r) => !r.symbolSvg)
    if (failed.length > 0) {
      console.log('\n⚠️  Failed extractions:')
      for (const r of failed) {
        console.log(`  ${r.elementId}: ${r.warnings.join('; ')}`)
      }
    }
  })

function extractSymbol(svgContent: string, elementId: string, fileName: string): ExtractionResult {
  const result: ExtractionResult = {
    elementId,
    sourceFile: fileName,
    pattern: 'unknown',
    detectedShape: null,
    symbolSvg: null,
    warnings: [],
  }

  // Detect foreign SVGs (Adobe Illustrator, etc.)
  if (svgContent.includes('<?xml') || svgContent.includes('xlink')) {
    result.pattern = 'foreign'
    return extractForeign(svgContent, result)
  }

  // Parse children of the <svg> element
  const children = parseSvgChildren(svgContent)
  if (children.length === 0) {
    result.warnings.push('No children found in SVG')
    return result
  }

  // Detect compound-path octagon (single <path> with octagon + symbol combined)
  if (children.length === 1 && children[0].tag === 'path') {
    const d = children[0].attrs.d || ''
    if (d.startsWith('M23.6191') || d.startsWith('M23.4699') || d.startsWith('M23.4697')) {
      result.pattern = 'compound-path'
      result.detectedShape = 'octagon'
      return extractCompoundOctagon(svgContent, d, result)
    }
  }

  // Detect shape and determine variant (dark vs light)
  // Dark variant: shape has a fill (e.g., fill="black") — symbol is in white/light color
  // Light variant: shape is outline only (stroke, no fill) — symbol is in black/dark color
  const firstChild = children[0]
  const lastChild = children[children.length - 1]
  const detectedFirst = detectShape(firstChild.raw)
  const detectedLast = children.length > 1 ? detectShape(lastChild.raw) : null

  if (detectedFirst || detectedLast) {
    const isShapeFirst = !!detectedFirst
    const shapeChild = isShapeFirst ? firstChild : lastChild
    const shapeType = (isShapeFirst ? detectedFirst : detectedLast)!
    const symbolChildren = isShapeFirst ? children.slice(1) : children.slice(0, -1)

    // Determine variant: does the shape have a fill attribute (not "none")?
    const hasFill = /fill="(?!none)[^"]*"/.test(shapeChild.raw)
    const variant = hasFill ? 'dark' : 'light'

    result.pattern = isShapeFirst ? 'shape-first' : 'shape-last'
    result.detectedShape = shapeType
    result.symbolSvg = buildSymbolSvg(symbolChildren.map((c) => c.raw), 36, variant)
    return result
  }

  // Check for mask-based icons — shape is first but may use class-based styling
  const hasMask = children.some((c) => c.tag === 'mask')
  if (hasMask) {
    result.pattern = 'mask-based'
    // Shape is typically the first filled path
    const shapeIdx = children.findIndex((c) => detectShape(c.raw))
    if (shapeIdx >= 0) {
      result.detectedShape = detectShape(children[shapeIdx].raw)
      const symbolChildren = children.filter((_, i) => i !== shapeIdx)
      result.symbolSvg = buildSymbolSvg(symbolChildren.map((c) => c.raw), 36)
      return result
    }
    result.warnings.push('Mask-based icon but could not identify shape element')
    return result
  }

  result.warnings.push('Could not classify SVG structure')
  return result
}

function extractForeign(svgContent: string, result: ExtractionResult): ExtractionResult {
  // Try to extract from Adobe Illustrator / Sketch SVGs
  const children = parseSvgChildren(svgContent)

  // Strategy 1: Find shape via CSS class (Illustrator style)
  const classShapeIdx = children.findIndex((c) => {
    if (!c.attrs.class) return false
    return detectShape(c.raw) !== null
  })

  if (classShapeIdx >= 0) {
    result.detectedShape = detectShape(children[classShapeIdx].raw)
    const symbolChildren = children.filter((_, i) => i !== classShapeIdx && children[i].tag !== 'style')
    result.symbolSvg = buildSymbolSvg(symbolChildren.map((c) => c.raw), 36)
    return result
  }

  // Strategy 2: Direct shape detection in any child
  for (let i = 0; i < children.length; i++) {
    const shape = detectShape(children[i].raw)
    if (shape) {
      result.detectedShape = shape
      const symbolChildren = children.filter((_, idx) => idx !== i && children[idx].tag !== 'style')
      result.symbolSvg = buildSymbolSvg(symbolChildren.map((c) => c.raw), 36)
      return result
    }
  }

  // Strategy 3: Sketch SVGs — search for container group by id pattern like "dtpr_icons-/-container-/-hexagon"
  const containerMatch = svgContent.match(/id="dtpr_icons-\/-container-\/-(hexagon|circle|rounded-square|octagon)"/)
  if (containerMatch) {
    result.detectedShape = containerMatch[1] as ShapeType
    // Remove the entire container group and extract the rest
    // The container group and its content is the shape; everything else is the symbol
    const containerGroupRegex = new RegExp(`<g[^>]*id="dtpr_icons-\\/-container-\\/-${containerMatch[1]}"[^>]*>[\\s\\S]*?</g>\\s*</g>`)
    // For Sketch SVGs, the structure is: <g id="outer"><g id="symbol-content">...</g><g id="container">...</g></g>
    // Extract symbol content groups (all <g> children except the container one)
    const outerChildren = children.filter((c) => c.tag === 'g')
    if (outerChildren.length === 1) {
      // Single outer <g> wrapper — parse its children
      const innerChildren = parseSvgChildren(`<svg>${outerChildren[0].raw.replace(/^<g[^>]*>/, '').replace(/<\/g>$/, '')}</svg>`)
      const symbolParts: string[] = []
      for (const inner of innerChildren) {
        if (inner.raw.includes(`dtpr_icons-/-container-/`)) continue
        symbolParts.push(inner.raw)
      }
      if (symbolParts.length > 0) {
        result.symbolSvg = buildSymbolSvg(symbolParts, 36)
        return result
      }
    }
  }

  result.warnings.push('Foreign SVG — could not identify shape element')
  return result
}

function extractCompoundOctagon(svgContent: string, d: string, result: ExtractionResult): ExtractionResult {
  // Split the d attribute into subpaths at top-level M commands
  const subpaths = splitDAttribute(d)

  if (subpaths.length < 2) {
    result.warnings.push('Compound path has fewer than 2 subpaths')
    return result
  }

  // The octagon is typically the first 1-2 subpaths:
  // - First subpath: outer octagon outline
  // - Second subpath (starting with M2.91309): inner octagon stroke
  // Everything after that is the symbol
  let symbolStartIdx = 1

  // Check if second subpath is the inner octagon outline
  if (subpaths.length > 2 && subpaths[1].startsWith(OCTAGON_INNER_PREFIX)) {
    symbolStartIdx = 2
  }

  const symbolPaths = subpaths.slice(symbolStartIdx)
  if (symbolPaths.length === 0) {
    result.warnings.push('No symbol subpaths found after removing octagon')
    return result
  }

  // Parse source viewBox
  const viewBoxMatch = svgContent.match(/viewBox="0 0 (\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/)
  const sourceViewBox = viewBoxMatch ? Math.max(parseFloat(viewBoxMatch[1]), parseFloat(viewBoxMatch[2])) : 35

  // Reconstruct symbol as a single path
  const symbolD = symbolPaths.join('')
  const symbolPath = `<path d="${symbolD}" fill="currentColor"/>`

  // If source viewBox was 35, we need to account for that in the symbol
  // by wrapping in a group that normalizes to 36
  if (sourceViewBox !== 36) {
    const scale = 36 / sourceViewBox
    result.symbolSvg = buildSymbolSvgRaw(
      `<g transform="scale(${scale})">\n${symbolPath}\n</g>`,
      36,
    )
  } else {
    result.symbolSvg = buildSymbolSvgRaw(symbolPath, 36)
  }

  return result
}

function splitDAttribute(d: string): string[] {
  // Split on top-level M commands while preserving each subpath
  const subpaths: string[] = []
  let current = ''

  for (let i = 0; i < d.length; i++) {
    if (d[i] === 'M' && current.length > 0) {
      subpaths.push(current.trim())
      current = 'M'
    } else {
      current += d[i]
    }
  }
  if (current.trim()) {
    subpaths.push(current.trim())
  }

  return subpaths
}

interface ParsedChild {
  tag: string
  raw: string
  attrs: Record<string, string>
}

function parseSvgChildren(svgContent: string): ParsedChild[] {
  // Extract content between <svg ...> and </svg>
  const innerMatch = svgContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  if (!innerMatch) return []

  const inner = innerMatch[1].trim()
  if (!inner) return []

  // Parse top-level elements (handling nested elements like <mask>...<g>...</g></mask>)
  const children: ParsedChild[] = []
  let i = 0

  while (i < inner.length) {
    // Skip whitespace
    while (i < inner.length && /\s/.test(inner[i])) i++
    if (i >= inner.length) break

    if (inner[i] !== '<') {
      i++
      continue
    }

    // Find the tag name
    const tagStart = i
    const tagNameMatch = inner.slice(i).match(/^<(\w+)/)
    if (!tagNameMatch) {
      i++
      continue
    }

    const tag = tagNameMatch[1]

    // Handle self-closing tags
    const selfCloseEnd = findSelfCloseEnd(inner, i)
    if (selfCloseEnd > 0) {
      const raw = inner.slice(tagStart, selfCloseEnd)
      children.push({ tag, raw, attrs: parseAttrs(raw) })
      i = selfCloseEnd
      continue
    }

    // Handle tags with content (mask, g, defs, etc.)
    const closeTag = `</${tag}>`
    let depth = 0
    let j = i

    while (j < inner.length) {
      if (inner.slice(j).startsWith(`<${tag}`)) {
        depth++
        j += tag.length + 1
      } else if (inner.slice(j).startsWith(closeTag)) {
        depth--
        if (depth === 0) {
          j += closeTag.length
          break
        }
        j += closeTag.length
      } else {
        j++
      }
    }

    const raw = inner.slice(tagStart, j)
    children.push({ tag, raw, attrs: parseAttrs(raw) })
    i = j
  }

  return children
}

function findSelfCloseEnd(str: string, start: number): number {
  // Find /> before the next < or end of the first tag
  let i = start + 1
  let inQuote = false
  let quoteChar = ''

  while (i < str.length) {
    if (inQuote) {
      if (str[i] === quoteChar) inQuote = false
      i++
      continue
    }

    if (str[i] === '"' || str[i] === "'") {
      inQuote = true
      quoteChar = str[i]
      i++
      continue
    }

    if (str[i] === '/' && i + 1 < str.length && str[i + 1] === '>') {
      return i + 2
    }

    if (str[i] === '>' && str[i - 1] !== '/') {
      // Not self-closing
      return -1
    }

    i++
  }

  return -1
}

function parseAttrs(element: string): Record<string, string> {
  const attrs: Record<string, string> = {}
  const regex = /(\w[\w-]*)="([^"]*)"/g
  let match
  while ((match = regex.exec(element)) !== null) {
    attrs[match[1]] = match[2]
  }
  return attrs
}

function detectShape(element: string): ShapeType | null {
  for (const [shape, regex] of Object.entries(SHAPE_SIGNATURES)) {
    if (regex.test(element)) {
      return shape as ShapeType
    }
  }
  return null
}

function buildSymbolSvg(childElements: string[], viewBox: number, variant: 'dark' | 'light' = 'dark'): string {
  // Replace fill colors with currentColor for theme-ability
  const content = childElements
    .map((el) => recolorElement(el, variant))
    .join('\n')

  return buildSymbolSvgRaw(content, viewBox)
}

function buildSymbolSvgRaw(content: string, viewBox: number): string {
  return `<svg viewBox="0 0 ${viewBox} ${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
${content}
</svg>
`
}

function recolorElement(element: string, variant: 'dark' | 'light' = 'dark'): string {
  let result = element

  if (variant === 'dark') {
    // Dark variant: white is foreground (symbol), black is background
    result = result
      .replace(/fill="(?:white|#fff(?:fff)?)"/gi, 'fill="currentColor"')
      .replace(/fill="(?:black|#000(?:000)?)"/gi, 'fill="var(--symbol-bg, white)"')
      .replace(/stroke="(?:white|#fff(?:fff)?)"/gi, 'stroke="currentColor"')
      .replace(/stroke="(?:black|#000(?:000)?)"/gi, 'stroke="var(--symbol-bg, white)"')
  } else {
    // Light variant: black is foreground (symbol), white is background
    result = result
      .replace(/fill="(?:black|#000(?:000)?)"/gi, 'fill="currentColor"')
      .replace(/fill="(?:white|#fff(?:fff)?)"/gi, 'fill="var(--symbol-bg, white)"')
      .replace(/stroke="(?:black|#000(?:000)?)"/gi, 'stroke="currentColor"')
      .replace(/stroke="(?:white|#fff(?:fff)?)"/gi, 'stroke="var(--symbol-bg, white)"')
  }

  // For elements without any fill attribute, add fill="currentColor"
  // These come from Illustrator SVGs that rely on the default SVG fill (black)
  result = result.replace(/<(path|rect|circle|ellipse|polygon)\b([^>]*?)\/?>/g, (fullMatch, tag, attrs) => {
    if (/fill=/.test(attrs)) return fullMatch
    return fullMatch.replace(`<${tag}`, `<${tag} fill="currentColor"`)
  })

  return result
}
