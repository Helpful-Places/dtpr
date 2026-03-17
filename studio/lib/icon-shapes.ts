export type ShapeType = 'hexagon' | 'circle' | 'rounded-square' | 'octagon'
export type ShapeVariant = 'light' | 'dark' | 'colored'

export interface ShapeOptions {
  fill?: string
  stroke?: string
  strokeWidth?: number
}

// Shape element templates (inner content only, no <svg> wrapper)
// Sourced from dtpr-v2/dtpr_icons/container/

const SHAPES: Record<ShapeType, { element: string; viewBox: number }> = {
  hexagon: {
    element: `<path d="M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z" {{attrs}}/>`,
    viewBox: 36,
  },
  circle: {
    element: `<rect x="2" y="2" width="32" height="32" rx="16" {{attrs}}/>`,
    viewBox: 36,
  },
  'rounded-square': {
    element: `<rect x="3" y="3" width="30" height="30" rx="3" {{attrs}}/>`,
    viewBox: 36,
  },
  octagon: {
    // Normalized to viewBox 36 (shifted +0.5 from original 35-based coords)
    element: `<path d="M24.1191 1.41309L24.3174 1.42285C24.7751 1.46907 25.2056 1.6733 25.5332 2.00195L34.0898 10.585C34.4172 10.9135 34.6183 11.3442 34.6631 11.8018L34.6729 11.999L34.6533 24.1191C34.6526 24.5833 34.4914 25.0313 34.1992 25.3867L34.0654 25.5332L25.4824 34.0898C25.1538 34.4173 24.7224 34.6183 24.2646 34.6631L24.0674 34.6729L11.9473 34.6533C11.4171 34.6524 10.9085 34.4409 10.5342 34.0654L1.97754 25.4824C1.60327 25.1069 1.39281 24.5976 1.39355 24.0674L1.41309 11.9482C1.41392 11.4178 1.62629 10.9087 2.00195 10.5342L10.585 1.97754L10.7314 1.84473C11.0876 1.55395 11.5352 1.39299 11.999 1.39355L24.1191 1.41309Z" {{attrs}}/>`,
    viewBox: 36,
  },
}

// Regex signatures to identify shapes in existing SVGs during extraction
export const SHAPE_SIGNATURES: Record<ShapeType, RegExp> = {
  hexagon: /d="M31\.8564|d="M31\.9|d="M17\.1172|d="M17 1\.422|d="M29,23\.362|d="M29\.8564|1\.42265.*8\.8453|Stroke-26/,
  circle: /rx="1[56]"/,
  'rounded-square': /rx="3"/,
  octagon: /d="M23\.6191|d="M23\.4697|d="M23\.4699/,
}

// Known octagon outline d-attribute prefix for compound-path extraction
// Both the viewBox=35 original and the outline-only variant
export const OCTAGON_OUTLINE_D_PREFIX = 'M23.6191'
export const OCTAGON_INNER_OUTLINE_D_PREFIX = 'M2.91309' // second subpath (inner stroke)

// Category ID → shape mapping
const CATEGORY_SHAPE_MAP: Record<string, ShapeType> = {
  // Hexagon categories
  device__tech: 'hexagon',
  device__purpose: 'hexagon',
  device__process: 'hexagon',
  ai__purpose: 'hexagon',
  ai__processing: 'hexagon',
  ai__decision: 'hexagon',
  // Circle categories
  device__data: 'circle',
  ai__input_dataset: 'circle',
  ai__output_dataset: 'circle',
  // Rounded square categories
  device__access: 'rounded-square',
  ai__access: 'rounded-square',
  device__storage: 'rounded-square',
  ai__storage: 'rounded-square',
  device__retention: 'rounded-square',
  ai__retention: 'rounded-square',
  device__accountable: 'rounded-square',
  ai__accountable: 'rounded-square',
  // Octagon categories
  ai__rights: 'octagon',
  ai__risks_mitigation: 'octagon',
}

function buildAttrs(options?: ShapeOptions): string {
  const fill = options?.fill ?? 'none'
  const stroke = options?.stroke ?? 'black'
  const strokeWidth = options?.strokeWidth ?? 2
  return `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}"`
}

export function getShapeSvg(shape: ShapeType, options?: ShapeOptions): string {
  const def = SHAPES[shape]
  return def.element.replace('{{attrs}}', buildAttrs(options))
}

export function getShapeViewBox(shape: ShapeType): number {
  return SHAPES[shape].viewBox
}

export function getCategoryShape(categoryId: string): ShapeType {
  return CATEGORY_SHAPE_MAP[categoryId] || 'hexagon'
}

export function getShapeFromCategories(categories: string[]): ShapeType {
  const first = categories[0]
  if (!first) return 'hexagon'
  return getCategoryShape(first)
}

export function getVariantOptions(variant: ShapeVariant, color?: string): ShapeOptions {
  switch (variant) {
    case 'light':
      return { fill: 'none', stroke: 'black' }
    case 'dark':
      return { fill: 'black', stroke: 'black' }
    case 'colored':
      return { fill: color || '#FFDD00', stroke: color || '#FFDD00' }
  }
}

export function getInnerFill(variant: ShapeVariant): string {
  return variant === 'dark' ? 'white' : 'black'
}
