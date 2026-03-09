import type { z } from 'zod'
import type { CategoriesResponseSchema, ElementsResponseSchema } from './schemas'

type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>
type ElementsResponse = z.infer<typeof ElementsResponseSchema>

/**
 * Extracts a structural fingerprint from categories response.
 * Captures IDs, schema metadata, locale coverage, variable IDs, and context value IDs.
 * Ignores content text (name/description values) so that editorial changes
 * don't trigger snapshot failures.
 */
export function categoriesFingerprint(data: CategoriesResponse) {
  return data.map((item) => ({
    id: item.category.id,
    schema: item.schema,
    has_context: !!item.category.context,
    order: item.category.order,
    required: item.category.required,
    locales: [...new Set(item.category.name.map((n) => n.locale))].sort(),
    variable_ids: item.category.element_variables.map((v) => v.id).sort(),
    context_value_ids: item.category.context
      ? item.category.context.values.map((v) => v.id).sort()
      : [],
  }))
}

/**
 * Extracts a structural fingerprint from elements response.
 * Captures IDs, schema metadata, category IDs, locale coverage, and variable IDs.
 * Ignores content text and icon URLs so that editorial/domain changes
 * don't trigger snapshot failures.
 */
export function elementsFingerprint(data: ElementsResponse) {
  return data
    .map((item) => ({
      id: item.element.id,
      schema: item.schema,
      category_ids: [...item.element.category_ids].sort(),
      locales: [...new Set(item.element.title.map((t) => t.locale))].sort(),
      variable_ids: item.element.variables.map((v) => v.id).sort(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}
