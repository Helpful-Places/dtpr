import Anthropic from '@anthropic-ai/sdk'
import type { Locale } from './types'

export interface TranslationResult {
  name: string
  description: string
  prompt?: string
}

export interface TranslationRequest {
  sourceLocale: Locale
  targetLocale: Locale
  name: string
  description: string
  prompt?: string
  context?: string // e.g. category name, existing translations for reference
}

const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  km: 'Khmer',
  pt: 'Portuguese',
  tl: 'Tagalog',
}

export async function translateElement(
  apiKey: string,
  request: TranslationRequest,
): Promise<TranslationResult> {
  const client = new Anthropic({ apiKey })

  const fields: string[] = [`name: "${request.name}"`, `description: "${request.description}"`]
  if (request.prompt) {
    fields.push(`prompt: "${request.prompt}"`)
  }

  const systemPrompt = `You are a professional translator for the DTPR (Digital Trust for Places & Routines) project. DTPR is a taxonomy standard for digital transparency in public spaces. Translate the provided fields from ${LOCALE_NAMES[request.sourceLocale]} to ${LOCALE_NAMES[request.targetLocale]}.

Rules:
- Maintain technical accuracy and consistent terminology
- Keep the same tone and level of formality as the source
- Do not translate proper nouns or acronyms (e.g., "DTPR", "AI", "LLM")
- Return ONLY a JSON object with the translated fields, no explanation`

  const userMessage = `Translate these fields to ${LOCALE_NAMES[request.targetLocale]}:

${fields.join('\n')}${request.context ? `\n\nContext: ${request.context}` : ''}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Parse JSON from response (handle potential markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse translation response')
  }

  return JSON.parse(jsonMatch[0]) as TranslationResult
}

export async function translateBatch(
  apiKey: string,
  requests: TranslationRequest[],
  concurrency: number = 3,
): Promise<{ id: string; result: TranslationResult | null; error?: string }[]> {
  const results: { id: string; result: TranslationResult | null; error?: string }[] = []

  // Process in batches for concurrency control
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency)
    const batchResults = await Promise.allSettled(
      batch.map((req) => translateElement(apiKey, req)),
    )

    for (let j = 0; j < batchResults.length; j++) {
      const req = batch[j]
      const res = batchResults[j]
      if (res.status === 'fulfilled') {
        results.push({ id: req.name, result: res.value })
      } else {
        results.push({ id: req.name, result: null, error: res.reason?.message })
      }
    }
  }

  return results
}
