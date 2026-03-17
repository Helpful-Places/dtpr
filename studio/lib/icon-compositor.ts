import {
  type ShapeType,
  type ShapeVariant,
  getShapeSvg,
  getShapeViewBox,
  getVariantOptions,
  getInnerFill,
} from './icon-shapes'

export function compositeIcon(
  innerSvg: string,
  shape: ShapeType,
  variant: ShapeVariant = 'light',
  color?: string,
): string {
  const viewBox = getShapeViewBox(shape)
  const shapeOptions = getVariantOptions(variant, color)
  const shapeElement = getShapeSvg(shape, shapeOptions)
  const innerFill = getInnerFill(variant)

  // Extract path elements from the inner SVG
  const innerPaths = extractPaths(innerSvg)
  if (innerPaths.length === 0) {
    // If no paths found, try to extract the whole SVG content
    const fallback = extractSvgContent(innerSvg)
    if (!fallback) {
      throw new Error('No path elements found in inner SVG')
    }
    return wrapSvg(viewBox, shapeElement, applyFillToContent(fallback, innerFill))
  }

  // Calculate bounding box of inner paths to scale them into the shape
  // Apply ~20% padding inside the shape
  const padding = viewBox * 0.2
  const innerSize = viewBox - padding * 2

  // Build inner group with scaling/centering transform
  const innerGroup = buildInnerGroup(innerPaths, innerFill, viewBox, innerSize, padding)

  return wrapSvg(viewBox, shapeElement, innerGroup)
}

function wrapSvg(viewBox: number, shapeElement: string, innerContent: string): string {
  return `<svg width="${viewBox}" height="${viewBox}" viewBox="0 0 ${viewBox} ${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
${shapeElement}
${innerContent}
</svg>`
}

function extractPaths(svg: string): string[] {
  const pathRegex = /<path\s+[^>]*d="[^"]*"[^>]*\/?>/g
  const matches = svg.match(pathRegex)
  return matches || []
}

function extractSvgContent(svg: string): string | null {
  // Try to extract content between <svg> tags
  const match = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i)
  return match?.[1]?.trim() ?? null
}

function applyFillToContent(content: string, fill: string): string {
  // Replace fill attributes on paths/rects/circles/etc
  return content
    .replace(/fill="[^"]*"/g, `fill="${fill}"`)
    .replace(/stroke="[^"]*"/g, `stroke="${fill}"`)
}

function buildInnerGroup(
  paths: string[],
  fill: string,
  viewBox: number,
  innerSize: number,
  padding: number,
): string {
  // Recraft generates SVGs at 1024x1024 typically — we need to scale down
  // Parse the original viewBox from the paths' parent SVG if available
  // For now, assume source is 1024x1024 (Recraft default) and scale to fit
  const sourceSize = 1024
  const scale = innerSize / sourceSize
  const tx = padding
  const ty = padding

  // Rewrite each path with the correct fill and strip existing fill/stroke
  const rewrittenPaths = paths.map((path) => {
    return path
      .replace(/fill="[^"]*"/g, '')
      .replace(/stroke="[^"]*"/g, '')
      .replace(/stroke-width="[^"]*"/g, '')
      .replace(/<path\s+/, `<path fill="${fill}" `)
  })

  return `<g transform="translate(${tx}, ${ty}) scale(${scale})">
${rewrittenPaths.join('\n')}
</g>`
}

export function extractSourceViewBox(svg: string): number {
  const match = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)"/)
  if (match?.[1] && match[2]) {
    return Math.max(parseFloat(match[1]), parseFloat(match[2]))
  }
  // Check width/height attrs as fallback
  const widthMatch = svg.match(/width="(\d+(?:\.\d+)?)"/)
  if (widthMatch?.[1]) return parseFloat(widthMatch[1])
  return 1024 // Recraft default
}

export function compositeIconFromFullSvg(
  fullSvg: string,
  shape: ShapeType,
  variant: ShapeVariant = 'light',
  color?: string,
): string {
  const viewBox = getShapeViewBox(shape)
  const shapeOptions = getVariantOptions(variant, color)
  const shapeElement = getShapeSvg(shape, shapeOptions)
  const innerFill = getInnerFill(variant)

  // Extract source dimensions
  const sourceSize = extractSourceViewBox(fullSvg)

  // Extract all graphical content from the SVG
  const content = extractSvgContent(fullSvg)
  if (!content) {
    throw new Error('Could not extract content from SVG')
  }

  // Calculate scaling to fit within shape with padding
  const padding = viewBox * 0.2
  const innerSize = viewBox - padding * 2
  const scale = innerSize / sourceSize

  // Apply fill color to all inner elements
  const coloredContent = applyFillToContent(content, innerFill)

  const innerGroup = `<g transform="translate(${padding}, ${padding}) scale(${scale})">
${coloredContent}
</g>`

  return wrapSvg(viewBox, shapeElement, innerGroup)
}
