import { getQuery } from 'h3'
import type { SchemaMetadata, Element } from './types'
import { parseLocalesQuery, filterLocaleMap } from './utils'

interface ElementResponse {
  schema: SchemaMetadata
  element: Element
}

export default eventHandler(async (event) => {
  const query = getQuery(event)
  const requestedLocales = parseLocalesQuery(query)

  const elements = await queryCollection(event, 'draft_2026_03_elements').all()

  const results: ElementResponse[] = elements.map((raw: any) => {
    const element: Element = {
      id: raw.dtpr_id,
      category: raw.category,
      name: filterLocaleMap(raw.name, requestedLocales),
      description: filterLocaleMap(raw.description, requestedLocales),
      icon: raw.icon,
      version: raw.updated_at || new Date().toISOString(),
    }

    if (raw.symbol) element.symbol = raw.symbol

    return {
      schema: {
        name: 'DTPR Element',
        id: 'dtpr_element',
        version: '0.1',
        namespace: 'https://dtpr.io/schemas/draft-2026-03/element',
      },
      element,
    }
  })

  return results
})
