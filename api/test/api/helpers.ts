import type { z } from 'zod'
import type {
  CategoriesResponseSchema,
  ElementsResponseSchema,
} from './schemas.ts'

/**
 * Structural fingerprint helpers. Ported from `app/test/api/helpers.ts`
 * and adapted to the v2 response shape.
 *
 * Fingerprints intentionally strip prose and URLs so editorial or
 * translation changes don't require snapshot updates. Structural
 * regressions (missing categories, fields, locales, variables) still
 * surface as snapshot diffs.
 */

type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>
type ElementsResponse = z.infer<typeof ElementsResponseSchema>

export function categoriesFingerprint(data: CategoriesResponse) {
  return data.categories
    .map((category) => ({
      id: category.id,
      datachain_type: category.datachain_type,
      has_context: !!category.context,
      order: category.order ?? null,
      required: category.required ?? false,
      shape: category.shape,
      locales: [...new Set(category.name.map((n) => n.locale))].sort(),
      variable_ids: category.element_variables.map((v) => v.id).sort(),
      context_value_ids: category.context
        ? category.context.values.map((v) => v.id).sort()
        : [],
    }))
    .sort((a, b) => a.id.localeCompare(b.id))
}

export function elementsFingerprint(data: ElementsResponse) {
  return data.elements
    .map((element) => {
      const title = element.title ?? []
      const categoryId = element.category_id ?? ''
      const variables = element.variables ?? []
      return {
        id: element.id,
        category_id: categoryId,
        locales: [...new Set(title.map((t) => t.locale))].sort(),
        variable_ids: variables.map((v) => v.id).sort(),
      }
    })
    .sort((a, b) => a.id.localeCompare(b.id))
}
