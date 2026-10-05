import { z } from 'zod'
import { LocaleCodeSchema } from './locale.ts'

export const TranslationLocaleStatusSchema = z
  .enum(['unverified', 'machine_draft', 'machine_reviewed', 'human_reviewed'])
  .describe('How far a locale has been reviewed')

export const TranslationFlagKindSchema = z
  .enum(['term_choice', 'native_review', 'divergence', 'source_issue', 'layout'])
  .describe('What kind of question a flag raises')

export const TranslationFlagStatusSchema = z.enum(['open', 'resolved', 'wontfix'])

const TranslationLocaleEntrySchema = z.strictObject({
  locale: LocaleCodeSchema,
  status: TranslationLocaleStatusSchema,
  register: z.string().optional(),
  translated_by: z.string().optional(),
  reviewed_by: z.string().optional(),
  updated_at: z.string(),
  summary: z.string(),
})

const TranslationFlagSchema = z.strictObject({
  id: z.string(),
  locale: LocaleCodeSchema,
  kind: TranslationFlagKindSchema,
  status: TranslationFlagStatusSchema,
  raised_by: z.enum(['translator', 'reviewer', 'human']),
  keys: z.array(z.string()).min(1),
  note: z.string(),
  alternatives: z.array(z.string()).optional(),
})

/**
 * `translations.yaml`: per-version record of how each locale was
 * produced, how far it has been reviewed, and what reviewers flagged.
 * Review metadata, not taxonomy content: `schema:build` emits it as
 * `translations.json` beside the manifest but keeps it out of
 * `content_hash`.
 */
export const TranslationStatusSchema = z.strictObject({
  source_locale: LocaleCodeSchema,
  locales: z.array(TranslationLocaleEntrySchema),
  flags: z.array(TranslationFlagSchema),
})

export type TranslationStatus = z.infer<typeof TranslationStatusSchema>

/**
 * What a flag key points at, so clients do not parse file paths.
 * `field` is the path after `#` in the key.
 */
export const TranslationFlagTargetSchema = z.object({
  type: z.enum(['element', 'category', 'datachain_type']),
  id: z.string(),
  field: z.string(),
})

export type TranslationFlagTarget = z.infer<typeof TranslationFlagTargetSchema>

/**
 * `translations.json` as emitted by `schema:build`: the source file
 * with each flag's `targets` derived from its `keys`.
 */
export const EmittedTranslationStatusSchema = TranslationStatusSchema.extend({
  flags: z.array(TranslationFlagSchema.extend({ targets: z.array(TranslationFlagTargetSchema) })),
})

export type EmittedTranslationStatus = z.infer<typeof EmittedTranslationStatusSchema>
