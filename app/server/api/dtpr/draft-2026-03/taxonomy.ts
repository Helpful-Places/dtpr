import { getQuery } from 'h3'
import type { SchemaMetadata, DatachainCategory, Element, LocaleMap, ElementVariable, ContextValue } from './types'
import { parseLocalesQuery, filterLocaleMap } from './utils'

interface CategoryResponse {
  schema: SchemaMetadata
  category: DatachainCategory
}

interface ElementResponse {
  schema: SchemaMetadata
  element: Element
}

interface TaxonomyResponse {
  datachain_categories: CategoryResponse[]
  elements: ElementResponse[]
}

export default eventHandler(async (event): Promise<TaxonomyResponse> => {
  const query = getQuery(event)
  const requestedLocales = parseLocalesQuery(query)

  const [rawCategories, rawElements] = await Promise.all([
    queryCollection(event, 'draft_2026_03_datachain_categories').all(),
    queryCollection(event, 'draft_2026_03_elements').all(),
  ])

  const datachain_categories: CategoryResponse[] = rawCategories.map((raw: any) => {
    const category: DatachainCategory = {
      id: raw.dtpr_id,
      name: filterLocaleMap(raw.name, requestedLocales),
      description: filterLocaleMap(raw.description, requestedLocales),
      prompt: filterLocaleMap(raw.prompt, requestedLocales),
      version: raw.updated_at || new Date().toISOString(),
    }

    if (raw.required !== undefined) category.required = raw.required
    if (raw.order !== undefined) category.order = raw.order

    if (raw.element_variables) {
      category.element_variables = raw.element_variables.map((v: any): ElementVariable => {
        const variable: ElementVariable = { id: v.id }
        if (v.label) variable.label = filterLocaleMap(v.label, requestedLocales)
        if (v.required !== undefined) variable.required = v.required
        if (v.type) variable.type = v.type
        return variable
      })
    }

    if (raw.context) {
      category.context = {
        id: raw.context.id,
        name: filterLocaleMap(raw.context.name, requestedLocales),
        description: filterLocaleMap(raw.context.description, requestedLocales),
        values: raw.context.values.map((v: any): ContextValue => ({
          id: v.id,
          name: filterLocaleMap(v.name, requestedLocales),
          description: filterLocaleMap(v.description, requestedLocales),
          color: v.color,
        })),
      }
    }

    return {
      schema: {
        name: 'DTPR Category',
        id: 'dtpr_category',
        version: '0.1',
        namespace: 'https://dtpr.io/schemas/draft-2026-03/category',
      },
      category,
    }
  })

  // Sort categories by order
  datachain_categories.sort((a, b) => {
    if (a.category.order !== undefined && b.category.order !== undefined) {
      return a.category.order - b.category.order
    }
    if (a.category.order !== undefined) return -1
    if (b.category.order !== undefined) return 1
    return 0
  })

  const elements: ElementResponse[] = rawElements.map((raw: any) => {
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

  return { datachain_categories, elements }
})
