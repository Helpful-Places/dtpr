import { getQuery } from 'h3'

interface LocaleValue {
  locale: string
  value: string
}

interface Variable {
  id: string
  label: LocaleValue[]
  required: boolean
}

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
  schema: {
    name: string
    id: string
    version: string
    namespace: string
  }
  category: CategoryContent
}

export default eventHandler(async event => {
  // Get the datachain_type from route parameters
  const datachain_type = event.context.params?.datachain_type
  
  // Validate datachain_type
  if (!datachain_type || !['ai', 'device'].includes(datachain_type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid datachain_type. Must be "ai" or "device"'
    })
  }

  // Get query parameters
  const query = getQuery(event)
  // Parse locales from query parameter (e.g., ?locales=en,fr,es)
  const requestedLocales = query.locales 
    ? (Array.isArray(query.locales) ? query.locales : query.locales.toString().split(','))
    : null

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
      
      // Initialize variables map for element_variables
      const variablesMap = new Map<string, Variable>()
      
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
        _timestamps: timestamps // Temporarily store timestamps
      } as any
    }

    // Add timestamp if available
    if (category.updated_at) {
      (acc[categoryId] as any)._timestamps.push(category.updated_at)
    }

    // Process element_variables
    if (category.element_variables) {
      category.element_variables.forEach((variable: any) => {
        let existingVar = (acc[categoryId] as any)._variablesMap?.get(variable.id)
        
        if (!existingVar) {
          if (!(acc[categoryId] as any)._variablesMap) {
            (acc[categoryId] as any)._variablesMap = new Map<string, Variable>()
          }
          existingVar = {
            id: variable.id,
            label: [],
            required: variable.required !== undefined ? variable.required : false
          };
          (acc[categoryId] as any)._variablesMap.set(variable.id, existingVar)
        }
        
        // Add locale-specific label if it exists
        if (variable.label) {
          // Check if we already have this locale's label
          const hasLocale = existingVar.label.some((l: LocaleValue) => l.locale === locale)
          if (!hasLocale) {
            existingVar.label.push({
              locale,
              value: variable.label
            })
          }
        }
        
        // Update required field if this category specifies it as true
        if (variable.required === true) {
          existingVar.required = true
        }
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
      const latestTimestamp = item._timestamps.reduce((latest: string, current: string) => {
        return new Date(current) > new Date(latest) ? current : latest
      })
      item.category.version = latestTimestamp
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
      category.name = categoryWrapper.category.name.filter((item: LocaleValue) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter description by requested locales
      category.description = categoryWrapper.category.description.filter((item: LocaleValue) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter prompt by requested locales (if it exists and has entries)
      if (categoryWrapper.category.prompt && categoryWrapper.category.prompt.length > 0) {
        category.prompt = categoryWrapper.category.prompt.filter((item: LocaleValue) => 
          requestedLocales.includes(item.locale)
        )
      }
      
      // Filter element_variables labels by requested locales
      if (category.element_variables && category.element_variables.length > 0) {
        category.element_variables = category.element_variables.map((variable: Variable) => ({
          ...variable,
          label: variable.label.filter((item: LocaleValue) => 
            requestedLocales.includes(item.locale)
          )
        }))
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