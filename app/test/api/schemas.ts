import { z } from 'zod'

// Shared sub-schemas

export const LocaleValueSchema = z.object({
  locale: z.string(),
  value: z.string(),
})

export const SchemaMetadataSchema = z.object({
  name: z.string(),
  id: z.string(),
  version: z.string(),
  namespace: z.string().url(),
})

export const VariableSchema = z.object({
  id: z.string(),
  label: z.array(LocaleValueSchema),
  required: z.boolean(),
})

// The /api/dtpr/v1/elements (all, no datachain_type) endpoint uses a simpler variable format
export const SimpleVariableSchema = z.object({
  id: z.string(),
  type: z.string(),
  required: z.boolean(),
  default: z.string(),
})

export const ContextValueSchema = z.object({
  id: z.string(),
  name: z.array(LocaleValueSchema),
  description: z.array(LocaleValueSchema),
  color: z.string(),
})

export const ContextSchema = z.object({
  id: z.string(),
  name: z.array(LocaleValueSchema),
  description: z.array(LocaleValueSchema),
  values: z.array(ContextValueSchema),
})

export const IconSchema = z.object({
  url: z.string(),
  alt_text: z.array(LocaleValueSchema),
  format: z.string(),
})

// Category response

export const CategoryDataSchema = z.object({
  schema: SchemaMetadataSchema,
  category: z.object({
    id: z.string(),
    order: z.number().nullable().optional(),
    required: z.boolean().optional(),
    name: z.array(LocaleValueSchema),
    description: z.array(LocaleValueSchema),
    prompt: z.array(LocaleValueSchema),
    version: z.string(),
    element_variables: z.array(VariableSchema),
    context: ContextSchema.optional(),
  }),
})

export const CategoriesResponseSchema = z.array(CategoryDataSchema)

// Element response (typed by datachain_type)

export const ElementDataSchema = z.object({
  schema: SchemaMetadataSchema,
  element: z.object({
    id: z.string(),
    category_ids: z.array(z.string()),
    version: z.string(),
    icon: IconSchema,
    title: z.array(LocaleValueSchema),
    description: z.array(LocaleValueSchema),
    citation: z.array(LocaleValueSchema),
    variables: z.array(VariableSchema),
    context_type_id: z.string().optional(),
  }),
})

export const ElementsResponseSchema = z.array(ElementDataSchema)

// Element response (all elements, /api/dtpr/v1/elements)

export const AllElementDataSchema = z.object({
  schema: SchemaMetadataSchema,
  element: z.object({
    id: z.string(),
    category_ids: z.array(z.string()),
    version: z.string(),
    icon: IconSchema,
    title: z.array(LocaleValueSchema),
    description: z.array(LocaleValueSchema),
    citation: z.array(LocaleValueSchema),
    variables: z.array(SimpleVariableSchema),
    context_type_id: z.string().optional(),
  }),
})

export const AllElementsResponseSchema = z.array(AllElementDataSchema)
