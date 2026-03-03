import { translateElement } from '~/lib/claude-translator'
import type { Locale } from '~/lib/types'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  if (!config.anthropicApiKey) {
    throw createError({ statusCode: 500, message: 'ANTHROPIC_API_KEY not configured' })
  }

  const body = await readBody(event)
  const { sourceLocale = 'en', targetLocale, name, description, prompt, context } = body as {
    sourceLocale?: Locale
    targetLocale: Locale
    name: string
    description: string
    prompt?: string
    context?: string
  }

  if (!targetLocale || !name) {
    throw createError({ statusCode: 400, message: 'targetLocale and name are required' })
  }

  const result = await translateElement(config.anthropicApiKey, {
    sourceLocale,
    targetLocale,
    name,
    description,
    prompt,
    context,
  })

  return result
})
