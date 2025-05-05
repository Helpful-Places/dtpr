
import { getQuery } from 'h3'

export default eventHandler(async event => {
  // Get the query parameters
  const query = getQuery(event)
  // Parse locales from query parameter (e.g., ?locales=en,fr,es)
  const requestedLocales = query.locales 
    ? (Array.isArray(query.locales) ? query.locales : query.locales.toString().split(','))
    : null
    
  const elements = await queryCollection(event, 'elements').all()

  // Group elements by filename to handle multiple locales for the same element
  const elementsByFilename = elements.reduce((acc, element) => {
    // Extract element ID from the stem (e.g., "access__available_for_resale")
    const pathParts = element.stem.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    const elementId = lastPart.split('__')[1] || lastPart
    const categoryIds = element.category || []
    
    // Extract locale from stem (e.g., "en", "es", "fr")
    const locale = pathParts[pathParts.length - 2]

    // Key for grouping - extract the base filename without locale
    // This ensures proper grouping across different locales
    const key = lastPart

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
          category_ids: categoryIds,
          version: "2024-06-11T00:00:00Z",
          icon: {
            url: element.icon ? `https://dtpr-io-static.onrender.com${element.icon}` : "",
            alt_text: [],
            format: "svg"
          },
          title: [],
          description: [],
          citation: [],
          variables: [
            {
              id: "additional_description",
              label: [],
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
    
    // Add to label array for the additional_description variable
    const varIndex = acc[key].element.variables.findIndex(v => v.id === "additional_description")
    if (varIndex >= 0 && !acc[key].element.variables[varIndex].label.some(l => l.locale === locale)) {
      acc[key].element.variables[varIndex].label.push({
        locale,
        value: "Additional Details"
      })
    }
    
    return acc
  }, {})

  // Convert the object back to an array
  let formattedElements = Object.values(elementsByFilename)
  
  // Filter localized fields if requestedLocales is provided
  if (requestedLocales && requestedLocales.length > 0) {
    formattedElements = formattedElements.map(formattedElement => {
      const element = { ...formattedElement }
      
      // Filter title by requested locales
      element.element.title = element.element.title.filter(item => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter description by requested locales
      element.element.description = element.element.description.filter(item => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter icon alt_text by requested locales
      element.element.icon.alt_text = element.element.icon.alt_text.filter(item => 
        requestedLocales.includes(item.locale)
      )
      
      // Filter citation by requested locales (if it exists)
      if (element.element.citation && element.element.citation.length > 0) {
        element.element.citation = element.element.citation.filter(item => 
          requestedLocales.includes(item.locale)
        )
      }
      
      // Filter variables labels by requested locales
      element.element.variables = element.element.variables.map(variable => {
        return {
          ...variable,
          label: variable.label.filter(item => requestedLocales.includes(item.locale))
        }
      })
      
      return element
    })
  }

  return formattedElements
});

