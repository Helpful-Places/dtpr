// Browser-safe Recraft configuration — no Node imports.
// Used by both client pages and server-side generator.

export interface IconGenerationRequest {
  elementId: string
  elementName: string
  elementDescription: string
  categories: string[]
}

export interface RecraftOptions {
  prompt?: string
  model?: string
  style?: string
}

export const RECRAFT_MODELS = [
  { id: 'recraftv3', label: 'Recraft V3', vector: false },
  { id: 'recraftv3', label: 'Recraft V3 Vector', vector: true, style: 'vector_illustration' },
] as const

export const RECRAFT_STYLES = [
  { id: 'vector_illustration', label: 'Vector Illustration' },
  { id: 'vector_illustration/line_art', label: 'Line Art' },
  { id: 'vector_illustration/engraving', label: 'Engraving' },
  { id: 'vector_illustration/line_circuit', label: 'Line Circuit' },
  { id: 'vector_illustration/linocut', label: 'Linocut' },
  { id: 'digital_illustration', label: 'Digital Illustration' },
  { id: 'digital_illustration/hand_drawn', label: 'Hand Drawn' },
  { id: 'digital_illustration/hand_drawn_outline', label: 'Hand Drawn Outline' },
  { id: 'digital_illustration/engraving_color', label: 'Color Engraving' },
  { id: 'digital_illustration/2d_art_poster', label: '2D Art Poster' },
] as const

export function buildDefaultPrompt(request: IconGenerationRequest): string {
  return `Simple icon symbol of "${request.elementName}": ${request.elementDescription}. Black fill on transparent background. No border, no outer shape, no background circle, square, hexagon, or octagon. Just the icon symbol itself. Clean minimal line art style, centered.`
}
