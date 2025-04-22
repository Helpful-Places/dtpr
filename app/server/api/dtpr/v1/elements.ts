export default eventHandler(async event => {
  const elements = await queryCollection(event, 'elements').all()

  // Group elements by title to handle multiple locales for the same element
  const elementsByTitle = elements.reduce((acc, element) => {
    // Extract element ID from the path (e.g., "purpose__wayfinding_services")
    const pathParts = element.path.split('/')
    const lastPart = pathParts[pathParts.length - 1]
    const elementId = lastPart.split('__')[1] || lastPart
    const categoryIds = element.meta.category
    
    // Extract locale from path (e.g., "en", "es", "fr")
    const locale = pathParts[pathParts.length - 2]

    // If this title is not in our accumulator yet, initialize it
    if (!acc[element.title]) {
      acc[element.title] = {
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
            url: element.meta.icon ? `https://dtpr-io-static.onrender.com${element.meta.icon}` : "",
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
    const title = element.meta.name || element.title
    const description = element.description || ""
    
    // Add to title array
    acc[element.title].element.title.push({
      locale,
      value: title
    })
    
    // Add to description array
    acc[element.title].element.description.push({
      locale,
      value: description
    })
    
    // Add to alt_text array for the icon
    acc[element.title].element.icon.alt_text.push({
      locale,
      value: `${title} icon`
    })
    
    // Add to label array for the additional_description variable
    const varIndex = acc[element.title].element.variables.findIndex(v => v.id === "additional_description")
    if (varIndex >= 0 && !acc[element.title].element.variables[varIndex].label.some(l => l.locale === locale)) {
      acc[element.title].element.variables[varIndex].label.push({
        locale,
        value: "Additional Details"
      })
    }
    
    return acc
  }, {})

  // Convert the object back to an array
  const formattedElements = Object.values(elementsByTitle)

  return formattedElements
});

