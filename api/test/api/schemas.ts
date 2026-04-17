import { z } from 'zod'

/**
 * Zod schemas mirroring the API's public response shapes. These are
 * test-only; the Worker uses the Zod sources in `src/schema/` for
 * content validation. Keeping a separate set here forces us to think
 * about the wire contract — accidental shape changes must be
 * expressed in both places.
 *
 * Ported from `app/test/api/schemas.ts` and adapted to the v2
 * envelope (`{ ok, ... }` rather than the v1 `{ schema, item }[]`).
 */

export const LocaleValueSchema = z.object({
  locale: z.string(),
  value: z.string(),
})

export const VariableSchema = z.object({
  id: z.string(),
  label: z.array(LocaleValueSchema),
  required: z.boolean(),
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

export const CategorySchema = z.object({
  id: z.string(),
  order: z.number().optional(),
  required: z.boolean().optional(),
  datachain_type: z.string(),
  shape: z.enum(['hexagon', 'circle', 'rounded-square', 'octagon']),
  name: z.array(LocaleValueSchema),
  description: z.array(LocaleValueSchema),
  prompt: z.array(LocaleValueSchema),
  element_variables: z.array(VariableSchema),
  context: ContextSchema.optional(),
})

export const ElementSchema = z.object({
  id: z.string(),
  category_id: z.string(),
  title: z.array(LocaleValueSchema),
  description: z.array(LocaleValueSchema),
  citation: z.array(LocaleValueSchema),
  symbol_id: z.string(),
  variables: z.array(VariableSchema),
})

// Response envelopes (v2 shape)

export const SchemaIndexEntrySchema = z.object({
  id: z.string(),
  status: z.enum(['beta', 'stable']),
  created_at: z.string(),
  content_hash: z.string(),
})

export const SchemaIndexResponseSchema = z.object({
  ok: z.literal(true),
  versions: z.array(SchemaIndexEntrySchema),
})

export const ManifestResponseSchema = z.object({
  ok: z.literal(true),
  manifest: z.object({
    version: z.string(),
    status: z.enum(['beta', 'stable']),
    created_at: z.string(),
    notes: z.string(),
    content_hash: z.string(),
    locales: z.array(z.string()),
  }),
})

export const CategoriesResponseSchema = z.object({
  ok: z.literal(true),
  version: z.string(),
  categories: z.array(CategorySchema),
})

export const ElementsResponseSchema = z.object({
  ok: z.literal(true),
  version: z.string(),
  elements: z.array(ElementSchema.partial().required({ id: true })),
  meta: z.object({
    total: z.number(),
    returned: z.number(),
    next_cursor: z.string().nullable(),
  }),
})

export const SingleElementResponseSchema = z.object({
  ok: z.literal(true),
  version: z.string(),
  element: ElementSchema.partial().required({ id: true }),
})
