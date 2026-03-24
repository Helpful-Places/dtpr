import { z } from 'zod'

// Locale map: { en: "...", fr: "..." }
export const LocaleMapSchema = z.record(z.string(), z.string())

export const SchemaMetadataSchema = z.object({
  name: z.string(),
  id: z.string(),
  version: z.string(),
  namespace: z.string().url(),
})

export const ElementVariableSchema = z.object({
  id: z.string(),
  label: LocaleMapSchema.optional(),
  required: z.boolean().optional(),
  type: z.enum(['text', 'select', 'multiselect']).optional(),
})

export const ContextValueSchema = z.object({
  id: z.string(),
  name: LocaleMapSchema,
  description: LocaleMapSchema,
  color: z.string(),
})

export const ContextSchema = z.object({
  id: z.string(),
  name: LocaleMapSchema,
  description: LocaleMapSchema,
  values: z.array(ContextValueSchema),
})

// Category response
export const CategoryDataSchema = z.object({
  schema: SchemaMetadataSchema,
  category: z.object({
    id: z.string(),
    name: LocaleMapSchema,
    description: LocaleMapSchema,
    prompt: LocaleMapSchema,
    required: z.boolean().optional(),
    order: z.number().optional(),
    element_variables: z.array(ElementVariableSchema).optional(),
    context: ContextSchema.optional(),
    version: z.string(),
  }),
})

export const CategoriesResponseSchema = z.array(CategoryDataSchema)

// Element response
export const ElementDataSchema = z.object({
  schema: SchemaMetadataSchema,
  element: z.object({
    id: z.string(),
    category: z.array(z.string()),
    name: LocaleMapSchema,
    description: LocaleMapSchema,
    icon: z.string(),
    symbol: z.string().optional(),
    version: z.string(),
  }),
})

export const ElementsResponseSchema = z.array(ElementDataSchema)

// Taxonomy combined response
export const TaxonomyResponseSchema = z.object({
  datachain_categories: CategoriesResponseSchema,
  elements: ElementsResponseSchema,
})
