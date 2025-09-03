# DTPR Category Schema Documentation

## Overview

The DTPR (Digital Trust for Places & Routines) Category schema defines the structure for categories that organize and group elements within datachains. Categories provide semantic grouping of elements (e.g., "tech", "purpose", "data") and define shared variables that elements within the category can use.

## API Endpoint

`/api/dtpr/v1/categories/[datachain_type]`

### Parameters

- **`datachain_type`** (path parameter, required): Must be either "ai" or "device"
- **`locales`** (query parameter, optional): Comma-separated list of locale codes to filter localized content (e.g., `?locales=en,fr,es`)

## Schema Structure

### Root Level

The API endpoint returns an array of category objects, each containing:

- **`schema`**: Metadata about the schema specification itself
- **`category`**: The core category definition

## Schema Section

```json
"schema": {
  "name": "DTPR Category",
  "id": "dtpr_category",
  "version": "0.1",
  "namespace": "https://dtpr.io/schemas/category/v0.1"
}
```

### Properties

- **`name`** (string, required): The name of the schema specification ("DTPR Category")
- **`id`** (string, required): A unique identifier for this schema
- **`version`** (string, required): The version of the DTPR schema being used
- **`namespace`** (string, required): A URL that uniquely identifies this schema version

## Category Section

The `category` section contains the core definition of a DTPR category, including its metadata, content, and configuration options.

### Basic Identification

```json
"id": "device__tech",
"order": 0,
"required": true,
"version": "2024-06-11T00:00:00Z"
```

- **`id`** (string, required): A unique identifier for this category (format: `{datachain_type}__{category_name}`)
- **`order`** (integer, optional): Display order for the category (0-based, lower numbers display first)
- **`required`** (boolean, optional): Whether this category must have at least one element when used in a datachain
- **`version`** (string, required): ISO 8601 timestamp indicating when this category version was last updated

### Localized Content

All user-facing text in DTPR categories supports internationalization through locale-specific arrays:

```json
"name": [{
  "locale": "en",
  "value": "Technology"
}],
"description": [{
  "locale": "en",
  "value": "Describes the data collection technologies being used"
}],
"prompt": [{
  "locale": "en",
  "value": "What technologies are collecting data?"
}]
```

#### Properties

- **`name`** (array, required): The display name of the category
- **`description`** (array, required): Detailed explanation of what the category represents
- **`prompt`** (array, required): A prompt or question that helps users understand what elements should be in this category

#### Localized Content Format

Each localized content array contains objects with:
- **`locale`** (string): Language/region code (e.g., "en", "fr", "es", "km", "pt", "tl")
- **`value`** (string): The localized text content

### Element Variables

Categories can define variables that are available to all elements within the category:

```json
"element_variables": [
  {
    "id": "duration",
    "label": [{
      "locale": "en",
      "value": "Retention Duration"
    }],
    "required": true
  }
]
```

#### Variable Properties

- **`id`** (string, required): Unique identifier for the variable within the category
- **`required`** (boolean, required): Whether elements in this category must provide a value for this variable
- **`label`** (array, required): Localized labels for the variable

These variables can be referenced by elements in the category and used for customization when elements are instantiated.

## Response Structure

The endpoint returns an array of category objects, sorted by the `order` field (categories without an order value appear at the end):

```json
[
  {
    "schema": { ... },
    "category": { ... }
  },
  {
    "schema": { ... },
    "category": { ... }
  }
]
```

## Locale Filtering

When the `locales` query parameter is provided, the API filters all localized content to only include the requested locales:

- `name` array is filtered
- `description` array is filtered
- `prompt` array is filtered
- `element_variables[].label` arrays are filtered

## Usage Notes

### Category Organization

Categories provide semantic grouping for elements:
- **tech**: Technology and sensors used for data collection
- **purpose**: Why data is being collected
- **data**: What types of data are collected
- **process**: How data is processed
- **storage**: Where and how data is stored
- **access**: Who can access the data
- **retention**: How long data is kept
- **accountable**: Who is responsible for the data

### Variable Inheritance

Variables defined at the category level are inherited by all elements within that category. This allows for consistent configuration across related elements.

### Version Management

The `version` field is automatically calculated as the latest timestamp from:
- The category's own `updated_at` timestamp
- Any updates to the category's metadata or variables

## Full Example

### API Response Example

```json
[
  {
    "schema": {
      "name": "DTPR Category",
      "id": "dtpr_category",
      "version": "0.1",
      "namespace": "https://dtpr.io/schemas/category/v0.1"
    },
    "category": {
      "id": "device__tech",
      "order": 0,
      "required": true,
      "name": [
        {
          "locale": "en",
          "value": "Technology"
        },
        {
          "locale": "fr",
          "value": "Technologie"
        }
      ],
      "description": [
        {
          "locale": "en",
          "value": "Describes the specific technologies, sensors, and devices used to collect data"
        },
        {
          "locale": "fr",
          "value": "Décrit les technologies, capteurs et appareils spécifiques utilisés pour collecter des données"
        }
      ],
      "prompt": [
        {
          "locale": "en",
          "value": "What technologies are collecting data?"
        },
        {
          "locale": "fr",
          "value": "Quelles technologies collectent des données?"
        }
      ],
      "version": "2024-06-11T00:00:00Z",
      "element_variables": [
        {
          "id": "additional_description",
          "label": [
            {
              "locale": "en",
              "value": "Additional Description"
            },
            {
              "locale": "fr",
              "value": "Description supplémentaire"
            }
          ],
          "required": false
        }
      ]
    }
  },
  {
    "schema": {
      "name": "DTPR Category",
      "id": "dtpr_category",
      "version": "0.1",
      "namespace": "https://dtpr.io/schemas/category/v0.1"
    },
    "category": {
      "id": "device__purpose",
      "order": 1,
      "required": true,
      "name": [
        {
          "locale": "en",
          "value": "Purpose"
        },
        {
          "locale": "fr",
          "value": "Objectif"
        }
      ],
      "description": [
        {
          "locale": "en",
          "value": "Explains why data is being collected and how it will be used"
        },
        {
          "locale": "fr",
          "value": "Explique pourquoi les données sont collectées et comment elles seront utilisées"
        }
      ],
      "prompt": [
        {
          "locale": "en",
          "value": "Why is data being collected?"
        },
        {
          "locale": "fr",
          "value": "Pourquoi les données sont-elles collectées?"
        }
      ],
      "version": "2024-06-11T00:00:00Z",
      "element_variables": []
    }
  }
]
```

### Example with Locale Filter

Request: `/api/dtpr/v1/categories/device?locales=en`

Response includes only English locale content:

```json
[
  {
    "schema": {
      "name": "DTPR Category",
      "id": "dtpr_category",
      "version": "0.1",
      "namespace": "https://dtpr.io/schemas/category/v0.1"
    },
    "category": {
      "id": "device__tech",
      "order": 0,
      "required": true,
      "name": [
        {
          "locale": "en",
          "value": "Technology"
        }
      ],
      "description": [
        {
          "locale": "en",
          "value": "Describes the specific technologies, sensors, and devices used to collect data"
        }
      ],
      "prompt": [
        {
          "locale": "en",
          "value": "What technologies are collecting data?"
        }
      ],
      "version": "2024-06-11T00:00:00Z",
      "element_variables": [
        {
          "id": "additional_description",
          "label": [
            {
              "locale": "en",
              "value": "Additional Description"
            }
          ],
          "required": false
        }
      ]
    }
  }
]
```

## Related Schemas

- **Element Schema**: Defines the structure of individual elements that belong to categories
- **Datachain Schema**: Defines how categories and elements are organized into complete transparency disclosures