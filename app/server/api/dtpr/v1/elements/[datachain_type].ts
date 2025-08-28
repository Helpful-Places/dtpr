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
  
  // Extract unique category IDs
  const categoryIds = [...new Set(categories.map((cat: any) => 
    cat.id.split('/').pop()?.replace('.md', '') || cat.id
  ))]

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
          version: "2024-06-11T00:00:00Z",
          icon: {
            url: element.icon ? `${baseUrl}${element.icon}` : "",
            alt_text: [],
            format: "svg"
          },
          title: [],
          description: [],
          citation: [],
          variables: [
            {
              id: "additional_description",
              type: "string",
              required: true,
              default: ""
            }
          ]
        }
      }
    }

    // Add locale-specific data
    const title = element.name || ""
    const description = element.description || ""
    
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
        if (variable.label) {
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