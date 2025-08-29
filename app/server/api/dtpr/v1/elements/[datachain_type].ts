import { getQuery } from 'h3'

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
  const elementsByDtprId = elements.reduce((acc: any, element: any) => {
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
      const variablesMap = new Map<string, any>()
      
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
              if (!variablesMap.has(variable.id)) {
                variablesMap.set(variable.id, {
                  id: variable.id,
                  label: [],
                  required: variable.required !== undefined ? variable.required : false
                })
              }
              // Add locale-specific label if it exists
              if (variable.label) {
                const existingVariable = variablesMap.get(variable.id)!
                const catLocale = cat._locale
                // Check if we already have this locale's label
                const hasLocale = existingVariable.label.some((l: any) => l.locale === catLocale)
                if (!hasLocale) {
                  existingVariable.label.push({
                    locale: catLocale,
                    value: variable.label
                  })
                }
                // Update required field if this category specifies it as true
                if (variable.required === true) {
                  existingVariable.required = true
                }
              }
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
      }
    }

    // Add locale-specific data
    const title = element.name || ""
    const description = element.description || ""
    
    // Add element's timestamp to the collection
    if (element.updated_at) {
      acc[key]._timestamps.push(element.updated_at)
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
      // Find the latest timestamp
      const latestTimestamp = item._timestamps.reduce((latest: string, current: string) => {
        return new Date(current) > new Date(latest) ? current : latest
      })
      item.element.version = latestTimestamp
    }
    // Remove the temporary _timestamps field
    delete item._timestamps
  })

  // Convert the object back to an array
  let formattedElements = Object.values(elementsByDtprId)
  
  // Filter localized fields if requestedLocales is provided
  if (requestedLocales && requestedLocales.length > 0) {
    formattedElements = formattedElements.map((formattedElement: any) => {
      const element = { ...formattedElement }
      
      // Filter title by requested locales
      element.element.title = element.element.title.filter((item: any) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter description by requested locales
      element.element.description = element.element.description.filter((item: any) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter icon alt_text by requested locales
      element.element.icon.alt_text = element.element.icon.alt_text.filter((item: any) => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter citation by requested locales (if it exists)
      if (element.element.citation && element.element.citation.length > 0) {
        element.element.citation = element.element.citation.filter((item: any) => 
          requestedLocales.includes(item.locale)
        )
      }
      
      // Filter variables labels by requested locales (if they have labels)
      element.element.variables = element.element.variables.map((variable: any) => {
        if (variable.label && variable.label.length > 0) {
          return {
            ...variable,
            label: variable.label.filter((item: any) => requestedLocales.includes(item.locale))
          }
        }
        return variable
      })
      
      return element
    })
  }

  return formattedElements
})