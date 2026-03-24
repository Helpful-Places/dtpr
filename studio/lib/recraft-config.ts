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
  colors?: [number, number, number][]
  n?: number
  styleId?: string
}

export const RECRAFT_MODELS = [
  { id: 'recraftv4_vector', label: 'Recraft V4 Vector' },
  { id: 'recraftv4_pro_vector', label: 'Recraft V4 Pro Vector' },
] as const

export type RecraftModel = (typeof RECRAFT_MODELS)[number]['id']

export function buildDefaultPrompt(request: IconGenerationRequest): string {
  return `Simple icon symbol of "${request.elementName}": ${request.elementDescription}. Black fill on transparent background. No border, no outer shape, no background circle, square, hexagon, or octagon. Just the icon symbol itself. Clean minimal line art style, centered.`
}
