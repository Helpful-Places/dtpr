import { getQuery } from 'h3'
import type { LocaleValue, Variable, SchemaMetadata } from '../types'
import { 
  validateDatachainType, 
  parseLocalesQuery, 
  calculateLatestVersion,
  filterLocaleValues,
  processVariableWithLocale,
  filterVariablesByLocale
} from '../utils'

interface Icon {
  url: string
  alt_text: LocaleValue[]
  format: string
}

interface ElementContent {
  id: string
  category_ids: string[]
  version: string
  icon: Icon
  title: LocaleValue[]
  description: LocaleValue[]
  citation: LocaleValue[]
  variables: Variable[]
}

interface ElementData {
  schema: SchemaMetadata
  element: ElementContent
}

export default eventHandler(async event => {
  // Get and validate the datachain_type from route parameters
  const datachain_type = validateDatachainType(event.context.params?.datachain_type)

  // Get query parameters
  const query = getQuery(event)
  // Parse locales from query parameter (e.g., ?locales=en,fr,es)
  const requestedLocales = parseLocalesQuery(query)

  // Get the base URL from environment variable or default to localhost
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000'

  // Step 1: Get all categories for this datachain_type
  const categories = await queryCollection(event, 'categories')
    .where('datachain_type', '=', datachain_type)
    .all()
  
  // Extract unique category IDs and build a map of category_id -> category data
  const categoryMap = new Map<string, any[]>()
  categories.forEach((cat: any) => {
    const categoryId = cat.id.split('/').pop()?.replace('.md', '') || cat.id
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, [])
    }
    categoryMap.get(categoryId)!.push(cat)
  })
  const categoryIds = [...categoryMap.keys()]

  // Step 2: Get all elements and filter by categories
  // Since category is an array field in elements, we need to filter after fetching
  const allElements = await queryCollection(event, 'elements').all()
  
  // Filter elements that have at least one category matching our category IDs
  const elements = allElements.filter((element: any) => {
    const elementCategories = element.category || []
    return elementCategories.some((cat: string) => categoryIds.includes(cat))
  })

  // Group elements by dtpr_id to handle multiple locales for the same element
  const elementsByDtprId = elements.reduce<Record<string, ElementData>>((acc, element: any) => {
    // Use dtpr_id as the unique identifier for elements
    const elementId = element.dtpr_id
    const elementCategories = element.category || []
    
    // Use _locale attribute directly from the element
    const locale = element._locale
    
    // Use dtpr_id as the key for grouping elements across different locales
    const key = elementId

    // If this element is not in our accumulator yet, initialize it
    if (!acc[key]) {
      // Collect all unique variables from all categories this element belongs to
      const variablesMap = new Map<string, Variable>()
      
      // Collect all timestamps for version calculation
      const timestamps: string[] = []
      
      elementCategories.forEach((catId: string) => {
        const categoryData = categoryMap.get(catId) || []
        categoryData.forEach((cat: any) => {
          // Collect category timestamps
          if (cat.updated_at) {
            timestamps.push(cat.updated_at)
          }
          
          if (cat.element_variables) {
            cat.element_variables.forEach((variable: any) => {
              processVariableWithLocale(variable, cat._locale, variablesMap)
            })
          }
        })
      })
      
      acc[key] = {
        schema: {
          name: "DTPR Element",
          id: "dtpr_element",
          version: "0.1",
          namespace: "https://dtpr.io/schemas/element/v0.1"
        },
        element: {
          id: elementId,
          category_ids: elementCategories,
          version: "2024-06-11T00:00:00Z", // Will be updated after collecting all element timestamps
          icon: {
            url: element.icon ? `${baseUrl}${element.icon}` : "",
            alt_text: [],
            format: "svg"
          },
          title: [],
          description: [],
          citation: [],
          variables: Array.from(variablesMap.values())
        },
        _timestamps: timestamps // Temporarily store timestamps for later processing
      } as any // Temporary any for _timestamps field
    }

    // Add locale-specific data
    const title = element.name || ""
    const description = element.description || ""
    
    // Add element's timestamp to the collection
    if (element.updated_at) {
      (acc[key] as any)._timestamps.push(element.updated_at)
    }
    
    // Add to title array
    acc[key].element.title.push({
      locale,
      value: title
    })
    
    // Add to description array
    acc[key].element.description.push({
      locale,
      value: description
    })
    
    // Add to alt_text array for the icon
    acc[key].element.icon.alt_text.push({
      locale,
      value: `${title} icon`
    })
    
    return acc
  }, {})

  // Calculate the latest version for each element based on all timestamps
  Object.values(elementsByDtprId).forEach((item: any) => {
    if (item._timestamps && item._timestamps.length > 0) {
      item.element.version = calculateLatestVersion(item._timestamps)
    }
    // Remove the temporary _timestamps field
    delete item._timestamps
  })

  // Convert the object back to an array
  let formattedElements: ElementData[] = Object.values(elementsByDtprId)
  
  // Filter localized fields if requestedLocales is provided
  if (requestedLocales && requestedLocales.length > 0) {
    formattedElements = formattedElements.map((formattedElement: ElementData) => {
      const element = { ...formattedElement }
      const elementContent = { ...formattedElement.element }
      
      // Filter title by requested locales
      elementContent.title = filterLocaleValues(formattedElement.element.title, requestedLocales)
      
      // Filter description by requested locales
      elementContent.description = filterLocaleValues(formattedElement.element.description, requestedLocales)
      
      // Filter icon alt_text by requested locales
      elementContent.icon = {
        ...formattedElement.element.icon,
        alt_text: filterLocaleValues(formattedElement.element.icon.alt_text, requestedLocales)
      }
      
      // Filter citation by requested locales (if it exists)
      if (formattedElement.element.citation && formattedElement.element.citation.length > 0) {
        elementContent.citation = filterLocaleValues(formattedElement.element.citation, requestedLocales)
      }
      
      // Filter variables labels by requested locales
      elementContent.variables = filterVariablesByLocale(formattedElement.element.variables, requestedLocales)
      
      element.element = elementContent
      return element
    })
  }

  return formattedElements
})