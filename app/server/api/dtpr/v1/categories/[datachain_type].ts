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

interface CategoryContent {
  id: string
  order?: number
  required?: boolean
  name: LocaleValue[]
  description: LocaleValue[]
  prompt: LocaleValue[]
  version: string
  element_variables: Variable[]
}

interface CategoryData {
  schema: SchemaMetadata
  category: CategoryContent
}

export default eventHandler(async event => {
  // Get and validate the datachain_type from route parameters
  const datachain_type = validateDatachainType(event.context.params?.datachain_type)

  // Get query parameters
  const query = getQuery(event)
  // Parse locales from query parameter (e.g., ?locales=en,fr,es)
  const requestedLocales = parseLocalesQuery(query)

  // Query categories filtered by datachain_type
  const categories = await queryCollection(event, 'categories')
    .where('datachain_type', '=', datachain_type)
    .all()

  // Group categories by id to handle multiple locales
  const categoriesById = categories.reduce<Record<string, CategoryData>>((acc, category: any) => {
    // Extract just the category id from the full path (e.g., "ai__access" from the full path)
    const categoryId = category.id.split('/').pop()?.replace('.md', '') || category.id
    const locale = category._locale

    // Initialize category object if not exists
    if (!acc[categoryId]) {
      // Collect all timestamps for version calculation
      const timestamps: string[] = []
      
      acc[categoryId] = {
        schema: {
          name: "DTPR Category",
          id: "dtpr_category",
          version: "0.1",
          namespace: "https://dtpr.io/schemas/category/v0.1"
        },
        category: {
          id: categoryId,
          // Include order if it exists
          ...(category.order !== undefined && { order: category.order }),
          // Include required if it exists
          ...(category.required !== undefined && { required: category.required }),
          // Initialize locale arrays
          name: [],
          description: [],
          prompt: [],
          version: "2024-06-11T00:00:00Z", // Will be updated later
          element_variables: []
        },
        _timestamps: timestamps, // Temporarily store timestamps
        _variablesMap: new Map<string, Variable>() // Initialize variables map
      } as any
    }

    // Add timestamp if available
    if (category.updated_at) {
      (acc[categoryId] as any)._timestamps.push(category.updated_at)
    }

    // Process element_variables
    if (category.element_variables) {
      category.element_variables.forEach((variable: any) => {
        processVariableWithLocale(variable, locale, (acc[categoryId] as any)._variablesMap)
      })
    }

    // Add locale-specific data
    // Add name
    if (category.name) {
      acc[categoryId].category.name.push({
        locale,
        value: category.name
      })
    }

    // Add description
    if (category.description) {
      acc[categoryId].category.description.push({
        locale,
        value: category.description
      })
    }

    // Add prompt (optional field)
    if (category.prompt) {
      acc[categoryId].category.prompt.push({
        locale,
        value: category.prompt
      })
    }

    // Copy over order and required from any locale (they should be the same)
    if (category.order !== undefined && acc[categoryId].category.order === undefined) {
      acc[categoryId].category.order = category.order
    }
    if (category.required !== undefined && acc[categoryId].category.required === undefined) {
      acc[categoryId].category.required = category.required
    }

    return acc
  }, {})

  // Process each category to finalize structure
  Object.values(categoriesById).forEach((item: any) => {
    // Calculate the latest version based on all timestamps
    if (item._timestamps && item._timestamps.length > 0) {
      item.category.version = calculateLatestVersion(item._timestamps)
    }
    
    // Convert variables map to array
    if (item._variablesMap) {
      item.category.element_variables = Array.from(item._variablesMap.values())
    }
    
    // Remove temporary fields
    delete item._timestamps
    delete item._variablesMap
  })

  // Convert to array
  let formattedCategories: CategoryData[] = Object.values(categoriesById)

  // Filter localized fields if requestedLocales is provided
  if (requestedLocales && requestedLocales.length > 0) {
    formattedCategories = formattedCategories.map(categoryWrapper => {
      const filteredWrapper = { ...categoryWrapper }
      const category = { ...categoryWrapper.category }
      
      // Filter name by requested locales
      category.name = filterLocaleValues(categoryWrapper.category.name, requestedLocales)
      
      // Filter description by requested locales
      category.description = filterLocaleValues(categoryWrapper.category.description, requestedLocales)
      
      // Filter prompt by requested locales (if it exists and has entries)
      if (categoryWrapper.category.prompt && categoryWrapper.category.prompt.length > 0) {
        category.prompt = filterLocaleValues(categoryWrapper.category.prompt, requestedLocales)
      }
      
      // Filter element_variables labels by requested locales
      if (category.element_variables && category.element_variables.length > 0) {
        category.element_variables = filterVariablesByLocale(category.element_variables, requestedLocales)
      }
      
      filteredWrapper.category = category
      return filteredWrapper
    })
  }

  // Sort by order field if present, categories without order go to the end
  formattedCategories.sort((a: CategoryData, b: CategoryData) => {
    // If both have order, sort by order
    if (a.category.order !== undefined && b.category.order !== undefined) {
      return a.category.order - b.category.order
    }
    // If only a has order, a comes first
    if (a.category.order !== undefined) return -1
    // If only b has order, b comes first
    if (b.category.order !== undefined) return 1
    // Neither has order, maintain original order
    return 0
  })

  return formattedCategories
})