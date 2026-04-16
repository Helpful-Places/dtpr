import { z } from 'zod'
import { LocaleCodeSchema } from './locale.ts'

/**
 * Canonical version string: `{type}@{YYYY-MM-DD}[-beta]`. Parser +
 * validator live in cli/lib/version-parser.ts; Zod enforces the
 * format here so bad manifests fail fast.
 */
export const VersionStringSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_-]+@\d{4}-\d{2}-\d{2}(-beta)?$/)
  .describe('Canonical version string: `{type}@{YYYY-MM-DD}[-beta]`')

export const SchemaStatusSchema = z
  .enum(['beta', 'stable'])
  .describe('beta is mutable; stable is immutable once promoted')

export const SchemaManifestSchema = z
  .object({
    version: VersionStringSchema,
    status: SchemaStatusSchema,
    created_at: z.string().datetime().describe('ISO 8601 timestamp of version creation'),
    notes: z.string().default('').describe('Free-form authoring notes'),
    content_hash: z
      .string()
      .regex(/^sha256-[0-9a-f]{64}$/)
      .describe('sha256 of the canonicalized bundle (CLI-computed at build time)'),
    locales: z
      .array(LocaleCodeSchema)
      .min(1)
      .describe('Locale allow-list mirrored from datachain-type.yaml'),
  })
  .describe('Schema version manifest served at /api/v2/schemas/:version/manifest')

export type SchemaManifest = z.infer<typeof SchemaManifestSchema>
