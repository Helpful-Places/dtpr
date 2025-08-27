import { getQuery } from 'h3'

interface LocaleValue {
  locale: string
  value: string
}

interface CategoryData {
  id: string
  order?: number
  required?: boolean
  name: LocaleValue[]
  description: LocaleValue[]
  prompt: LocaleValue[]
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
      acc[categoryId] = {
        id: categoryId,
        // Include order if it exists
        ...(category.order !== undefined && { order: category.order }),
        // Include required if it exists
        ...(category.required !== undefined && { required: category.required }),
        // Initialize locale arrays
        name: [],
        description: [],
        prompt: []
      }
    }

    // Add locale-specific data
    // Add name
    if (category.name) {
      acc[categoryId].name.push({
        locale,
        value: category.name
      })
    }

    // Add description
    if (category.description) {
      acc[categoryId].description.push({
        locale,
        value: category.description
      })
    }

    // Add prompt (optional field)
    if (category.prompt) {
      acc[categoryId].prompt.push({
        locale,
        value: category.prompt
      })
    }

    // Copy over order and required from any locale (they should be the same)
    if (category.order !== undefined && acc[categoryId].order === undefined) {
      acc[categoryId].order = category.order
    }
    if (category.required !== undefined && acc[categoryId].required === undefined) {
      acc[categoryId].required = category.required
    }

    return acc
  }, {})

  // Convert to array
  let formattedCategories: CategoryData[] = Object.values(categoriesById)

  // Filter localized fields if requestedLocales is provided
  if (requestedLocales && requestedLocales.length > 0) {
    formattedCategories = formattedCategories.map(category => {
      const filteredCategory = { ...category }
      
      // Filter name by requested locales
      filteredCategory.name = category.name.filter((item: LocaleValue) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter description by requested locales
      filteredCategory.description = category.description.filter((item: LocaleValue) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter prompt by requested locales (if it exists and has entries)
      if (category.prompt && category.prompt.length > 0) {
        filteredCategory.prompt = category.prompt.filter((item: LocaleValue) => 
          requestedLocales.includes(item.locale)
        )
      }
      
      return filteredCategory
    })
  }

  // Sort by order field if present, categories without order go to the end
  formattedCategories.sort((a: CategoryData, b: CategoryData) => {
    // If both have order, sort by order
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order
    }
    // If only a has order, a comes first
    if (a.order !== undefined) return -1
    // If only b has order, b comes first
    if (b.order !== undefined) return 1
    // Neither has order, maintain original order
    return 0
  })

  return formattedCategories
})