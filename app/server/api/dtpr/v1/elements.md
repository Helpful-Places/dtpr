# DTPR Element Schema Documentation

## Overview

The DTPR (Digital Trust for Places & Routines) Element schema defines the structure for individual transparency elements that can be used to describe technologies, data practices, and other aspects of digital systems in public spaces. Elements are reusable components that can be instantiated within datachains to create comprehensive transparency disclosures.

## Schema Structure

### Root Level

The schema consists of three main sections:

- **`schema`**: Metadata about the schema specification itself
- **`element`**: The core element definition
- **`instance`**: The specific instantiation with values and configuration

## Schema Section

```json
"schema": {
  "name": "DTPR Element",
  "id": "dtpr_element",
  "version": "0.1",
  "namespace": "https://dtpr.io/schemas/element/v0.1"
}
```

### Properties

- **`name`** (string, required): The name of the schema specification ("DTPR Element")
- **`id`** (string, required): A unique identifier for this schema
- **`version`** (string, required): The version of the DTPR schema being used
- **`namespace`** (string, required): A URL that uniquely identifies this schema version

## Element Section

The `element` section contains the core definition of a DTPR element, including its metadata, content, and configuration options.

### Basic Identification

```json
"id": "identifiable_video",
"category_ids": ["tech"],
"version": "2024-06-11T00:00:00Z"
```

- **`id`** (string, required): A unique identifier for this element
- **`category_ids`** (array, required): The categories this element can belong to (e.g., "tech", "purpose", "data")
- **`version`** (string, required): ISO 8601 timestamp indicating when this element version was created

### Localized Content

All user-facing text in DTPR elements supports internationalization through locale-specific arrays:

```json
"title": [{"locale": "en", "value": "Identifiable Video"}],
"description": [
  {"locale": "en", "value": "Generates video footage of a sufficient resolution..."}
],
"citation": [
  {"locale": "en", "value": "Find out more about [computer vision](https://en.wikipedia.org/wiki/Computer_vision)."}
]
```

#### Properties

- **`title`** (array, required): The display name of the element
- **`description`** (array, required): Detailed explanation of what the element represents. Supports variable interpolation using `{{variable_name}}` syntax and Markdown formatting
- **`citation`** (array, optional): Additional reference information, typically including external links for more information

#### Localized Content Format

Each localized content array contains objects with:
- **`locale`** (string): Language/region code (e.g., "en", "fr-CA")
- **`value`** (string): The localized text content

### Icon Configuration

```json
"icon": {
  "url": "https://dtpr-io-static.onrender.com/dtpr-icons/identifiable_video.svg",
  "alt_text": [{"locale": "en", "value": "Identifiable video icon"}],
  "format": "svg"
}
```

#### Properties

- **`url`** (string, required): Full URL to the icon file
- **`alt_text`** (array, required): Localized alternative text for accessibility
- **`format`** (string, required): File format of the icon (e.g., "svg", "png")

### Context Information

Context provides visual and semantic cues about the element's characteristics:

```json
"context": {
  "type": "pii",
  "color": "#FFCC00",
  "label": [{"locale": "en", "value": "Collects Identifiable Information"}],
  "description": [{"locale": "en", "value": "This technology can collect data that may identify individuals."}]
}
```

#### Properties

- **`type`** (string, required): Identifier that should match a context type defined in the parent category
- **`color`** (string, required): Hex color code for visual representation
- **`label`** (array, required): Localized short description of the context
- **`description`** (array, required): Localized detailed explanation of what this context means

### Variables

Variables allow elements to be customized when instantiated in a datachain:

```json
"variables": [
  {
    "id": "additional_description",
    "type": "string",
    "required": false,
    "default": ""
  }
]
```

#### Variable Properties

- **`id`** (string, required): Unique identifier for the variable within the element
- **`type`** (string, required): Data type ("string", "number", "boolean", etc.)
- **`required`** (boolean, required): Whether this variable must be provided when instantiating
- **`default`** (any, required if required is false): Default value if not provided in instance

Note: Variables in the element definition specify the structure and constraints, but do not include localized labels as these are provided in the instance when the variable is used.

#### Variable Interpolation

Variables can be referenced in the description text using double curly braces:

```json
"description": [
  {"locale": "en", "value": "This system stores data for {{duration}} and {{additional_description}}"}
]
```

## Instance Section

The `instance` section contains the specific instantiation of the element with actual values and configuration for use in a datachain.

### Instance Properties

```json
"instance": {
  "priority": 0,
  "variables": [
    {
      "id": "additional_description",
      "value": [
        {
          "locale": "en",
          "value": "This technology can also capture audio data."
        }
      ]
    }
  ]
}
```

#### Properties

- **`priority`** (integer, required): Display order within the category when used in a datachain (0-based, lower numbers display first)
- **`variables`** (array, optional): Variable values for this specific instance

#### Instance Variable Format

Each variable in the instance contains:
- **`id`** (string, required): Must match a variable defined in the element
- **`value`** (any, required): The value for this variable. For user-facing text, this should be a localized array; for other types, a simple value

## Usage Notes

### Element vs Instance Separation

The element definition provides the reusable template with structure, constraints, and default content. The instance provides the specific values, configuration, and localized content for a particular use case. This separation allows:

- Elements to be maintained in a central library
- Instances to be customized for specific deployments
- Multiple instances of the same element with different configurations

### Element Reusability

Elements are designed to be reusable across multiple datachains. The element definition provides the template, while specific instances (created in datachain instances) provide the variable values and contextual information.

### Extensibility

The schema supports extension through:
- Additional variable types as needed
- New localization locales
- Additional icon formats
- Custom context types (defined at the category level)

### Validation

Implementations should validate:
- Required fields are present
- Locale codes follow standard formats
- Variable references in descriptions match defined variables
- Context types exist in the parent category
- URLs are properly formatted
- Color codes are valid hex values

## Example Use Cases

1. **Technology Description**: Elements in the "tech" category describe how data collection technologies work
2. **Purpose Declaration**: Elements in the "purpose" category explain why technologies are deployed
3. **Data Classification**: Elements in the "data" category specify what types of data are collected
4. **Access Control**: Elements in the "access" category define who can access collected data

## Related Schemas

- **Datachain Schema**: Defines how elements are organized and instantiated
- **Category Schema**: Defines the categories that elements belong to, including available context types

## Full Example

```json
{
  "schema": {
    "name": "DTPR",
    "version": "0.1",
    "namespace": "https://dtpr.io/schemas/element/v0.1"
  },
  "element": {
    "id": "identifiable_video",
    "category_ids": ["tech"],
    "version": "2024-06-11T00:00:00Z",
    "icon": {
      "url": "https://dtpr-io-static.onrender.com/dtpr-icons/identifiable_video.svg",
      "alt_text": [{"locale": "en", "value": "Identifiable video icon"}],
      "format": "svg"
    },
    "title": [{"locale": "en", "value": "Identifiable Video"}],
    "description": [
      {"locale": "en", "value": "Generates video footage of a sufficient resolution where individuals can be identified, for example by capturing images of faces or unique numbers such as vehicle license plates."}
    ],
    "citation": [
      {"locale": "en", "value": "Find out more about [computer vision](https://en.wikipedia.org/wiki/Computer_vision)."}
    ],
    "variables": [
      {
        "id": "additional_description",
        "type": "string",
        "required": false,
        "default": ""
      }
    ]
  },
  "instance": {
    "priority": 0,
    "category_id": "tech",
    "variables": {
      "additional_description": [
        {
          "locale": "en",
          "value": "This technology can also capture audio data."
        }
      ]
    }
  }
}
```
