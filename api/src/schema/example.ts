import { z } from 'zod'
import { LocaleValueArraySchema } from './locale.ts'

/**
 * Author-facing example of a category or element in use. Stored as
 * structured pairs (`scenario` + `narrative`) rather than free-text
 * markdown so the authoring UI can render them as cards and the
 * public renderer can omit them entirely.
 *
 * Examples are exempt from the public comprehension rubric — they are
 * for stewards drafting datachains, not for commuters reading them.
 */
export const ExampleSchema = z
  .object({
    scenario: LocaleValueArraySchema.describe(
      'Short description of the deployment context this example illustrates.',
    ),
    narrative: LocaleValueArraySchema.describe(
      'Longer narrative showing how the category or element is used in this scenario.',
    ),
  })
  .describe('Author-facing example')

export type Example = z.infer<typeof ExampleSchema>
