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
    element: `<path d="M23.6191 0.913086L23.8174 0.922852C24.2751 0.969071 24.7056 1.1733 25.0332 1.50195L33.5898 10.085C33.9172 10.4135 34.1183 10.8442 34.1631 11.3018L34.1729 11.499L34.1533 23.6191C34.1526 24.0833 33.9914 24.5313 33.6992 24.8867L33.5654 25.0332L24.9824 33.5898C24.6538 33.9173 24.2224 34.1183 23.7646 34.1631L23.5674 34.1729L11.4473 34.1533C10.9171 34.1524 10.4085 33.9409 10.0342 33.5654L1.47754 24.9824C1.10327 24.6069 0.892806 24.0976 0.893555 23.5674L0.913086 11.4482C0.913921 10.9178 1.12629 10.4087 1.50195 10.0342L10.085 1.47754L10.2314 1.34473C10.5876 1.05395 11.0352 0.892993 11.499 0.893555L23.6191 0.913086Z" {{attrs}}/>`,
    viewBox: 35,
  },
}

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
