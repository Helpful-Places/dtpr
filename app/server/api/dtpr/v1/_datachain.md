# DTPR Datachain Schema Documentation

## Overview

The DTPR (Digital Transparency in Public Realm) Datachain schema defines the structure for organizing and presenting collections of DTPR elements in a meaningful, ordered way. A datachain represents a complete transparency disclosure for a specific technology deployment, organizing elements by categories and providing the context needed to render a comprehensive transparency interface.

Datachains come in different types (e.g., "device", "sensor", "ai") and define both the template structure and specific instances of that structure with real-world data.

## Schema Structure

### Root Level

The schema consists of three main sections:

- **`schema`**: Metadata about the schema specification itself
- **`datachain`**: The template definition including categories and their configuration
- **`instance`**: The specific instantiation with actual elements and values

## Schema Section

```json
"schema": {
  "name": "DTPR",
  "version": "0.1",
  "namespace": "https://dtpr.io/schemas/datachain/v0.1"
}
```

### Properties

- **`name`** (string, required): The name of the schema specification ("DTPR")
- **`version`** (string, required): The version of the DTPR schema being used
- **`namespace`** (string, required): A URL that uniquely identifies this schema version

## Datachain Section

The `datachain` section defines the template structure, categories, and configuration for a specific type of datachain.

### Basic Properties

```json
"type": "device",
"version": "2024-06-11T00:00:00Z",
"title": [{"locale": "en", "value": "Device datachain"}],
"description": [{"locale": "en", "value": "A datachain for describing data-collecting devices in public space."}]
```

#### Properties

- **`type`** (string, required): The type of datachain (e.g., "device", "sensor", "ai")
- **`version`** (string, required): ISO 8601 timestamp indicating when this datachain template was created
- **`title`** (array, required): Localized display name for this datachain type
- **`description`** (array, required): Localized explanation of what this datachain type represents

### Categories

Categories define the organizational structure and display order for elements within the datachain:

```json
"categories": [
  {
    "id": "tech",
    "order": 1,
    "name": [{"locale": "en", "value": "Technology"}],
    "prompt": [{"locale": "en", "value": "How does this technology work?"}],
    "description": [{"locale": "en", "value": "The core technology components that collect or process data"}],
    "context_types": [
      {
        "id": "pii",
        "name": [{"locale": "en", "value": "Personal Information"}],
        "description": [{"locale": "en", "value": "Technologies that collect personally identifiable information"}],
        "color": "#FFCC00"
      }
    ]
  }
]
```

#### Category Properties

- **`id`** (string, required): Unique identifier for the category
- **`order`** (integer, required): Display order for categories (0-based)
- **`name`** (array, required): Localized display name for the category
- **`prompt`** (array, required): Localized question or prompt for this category
- **`description`** (array, required): Localized explanation of what elements in this category represent
- **`context_types`** [TODO] (array, optional): Available context types for elements in this category

### Context Types

Context types provide visual and semantic indicators for elements within a category:

```json
"context_types": [
  {
    "id": "pii",
    "name": [{"locale": "en", "value": "Personal Information"}],
    "description": [{"locale": "en", "value": "Technologies that collect personally identifiable information"}],
    "color": "#FFCC00"
  }
]
```

#### Context Type Properties

- **`id`** (string, required): Unique identifier for the context type within the category
- **`name`** (array, required): Localized short name for the context type
- **`description`** (array, required): Localized explanation of what this context type means
- **`color`** (string, required): Hex color code for visual representation

### Localized Content Format

All user-facing text supports internationalization through locale-specific arrays:

```json
[{"locale": "en", "value": "Technology"}]
```

Each localized content array contains objects with:
- **`locale`** (string): Language/region code (e.g., "en", "fr-CA", "es-MX")
- **`value`** (string): The localized text content

## Instance Section

The `instance` section contains the specific instantiation of the datachain template with real-world data and selected elements.

### Basic Properties

```json
"title": [{"locale": "en", "value": "Intersection 5th & Main"}],
"created_at": "2024-06-11T14:32:00Z"
```

#### Properties

- **`title`** (array, required): Localized name for this specific instance
- **`created_at`** (string, required): ISO 8601 timestamp when this instance was created

### Elements

Elements are the specific DTPR elements selected for this datachain instance:

```json
"elements": [
  {
    "element_id": "identifiable_video",
    "category_id": "tech",
    "priority": 0,
    "context_type_id": "pii",
    "variables": [
      {"id": "resolution", "value": "1080p"}
    ]
  }
]
```

#### Element Properties

- **`element_id`** (string, required): References a DTPR element definition
- **`category_id`** (string, required): The category this element belongs to (must match a category defined in the datachain)
- **`priority`** (integer, required): Display order within the category (0-based, lower numbers display first)
- **`context_type_id`** (string, optional): References a context type from the element's category
- **`variables`** (array, optional): Variable values for customizing the element

### Element Variables

Variables allow customization of element content for the specific instance:

```json
"variables": [
  {"id": "resolution", "value": "1080p"},
  {"id": "additional_description", "value": "Used for traffic flow analysis"}
]
```

Each variable object contains:
- **`id`** (string): Must match a variable defined in the referenced element
- **`value`** (any): The value to use for this variable in this instance

## Display Logic

### Category Ordering

Categories are displayed in ascending order based on their `order` property.

### Element Ordering

Within each category, elements are displayed in ascending order based on their `priority` property.

### Context Visualization

Elements with `context_type_id` should be visually styled using the corresponding color and may display additional context information.

### Variable Interpolation

When displaying elements, variable values from the instance should be interpolated into the element's description text using the `{{variable_name}}` syntax.

## Usage Patterns

### Creating a New Instance

1. Choose a datachain type template
2. Provide instance-specific title and metadata  
3. Select appropriate elements for each category
4. Set priority values to control display order
5. Assign context types where applicable
6. Provide values for any element variables

### Rendering a Datachain

1. Load the complete datachain document
2. Sort categories by `order` property
3. Group elements by `category_id`
4. Sort elements within categories by `priority`
5. Resolve context types to get colors and labels
6. Interpolate variable values into element descriptions
7. Render in the determined order

## Validation Requirements

Implementations should validate:

- All required fields are present
- Category IDs in elements match defined categories
- Context type IDs exist in the appropriate category
- Variable IDs match those defined in referenced elements
- Locale codes follow standard formats
- Timestamps are valid ISO 8601 format
- Color codes are valid hex format
- Priority and order values are non-negative integers

## Datachain Types

Different datachain types may have different category structures:

- **device**: For physical devices that collect data
- **sensor**: For sensor networks and IoT deployments
- **ai**: For AI systems and algorithmic decision-making
- **service**: For digital services and platforms

Each type defines its own set of relevant categories and context types appropriate to its domain.

## Related Schemas

- **Element Schema**: Defines the structure of individual DTPR elements that are referenced in datachains
- **Cache Schema**: Defines the resolved, display-ready format that combines datachain and element data for efficient rendering