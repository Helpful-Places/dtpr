import { z } from 'zod'

/**
 * Zod mirror of the frozen legacy v0 and v1 wire shapes.
 *
 * Test-only, and maintained apart from `api/src/schema/` for the same
 * reason `test/api/schemas.ts` keeps its own copy of the v2 envelope:
 * an accidental shape change then has to be expressed in two places
 * before the suite goes green. Here the argument is stronger still.
 * The v2 surface at least has a source of truth in `src/schema/`; the
 * legacy surface has none — `src/rest/legacy-locales.ts` carries
 * TypeScript interfaces for the same records, but those are erased at
 * runtime and exist to let the filter compile, not to police the wire.
 * If this file imported them, a widened interface would widen the
 * conformance check with it.
 *
 * Three properties make this mirror stricter than the v2 one, all for
 * the same underlying reason — the surface is frozen, so *any* change
 * is a defect rather than an evolution:
 *
 *  1. Every object is `strictObject`. An added key fails, which is the
 *     point: a well-meaning `headline` back-fill on a v0 record, or a
 *     `label` added to the untyped `/api/v1/elements` variables, is
 *     exactly the kind of repair R10 forbids.
 *  2. The shapes encode the R10 defects rather than the shape a
 *     healthy taxonomy would have. `LegacyV0RecordSchema` has no
 *     `headline` and makes `title`/`description` optional;
 *     `LegacyUntypedElementRecordSchema` carries a variable with
 *     `type`/`default` and no `label`, which is the literal cause of
 *     the 500 the untyped route preserves.
 *  3. Icon URLs are pinned to the frozen surface's own namespace. That
 *     makes the mirror a second, independent statement of the
 *     one-time icon-URL rewrite's *target*: a rewrite that leaked
 *     `https://dtpr.io/dtpr-icons/…` through, or that pointed v0's
 *     documents at v1's icon path, fails to parse here as well as
 *     failing the byte comparison.
 *
 * These describe the **served** bytes, not the raw capture under
 * `api/legacy/raw/`. The raw documents still carry absolute
 * `dtpr.io` icon URLs and would not satisfy the URL patterns below.
 */

/* ------------------------------------------------------------------ *
 * Shared leaves
 * ------------------------------------------------------------------ */

/**
 * The `{ locale, value }` pair every localised array in both majors is
 * made of. Note there is no `LocaleCode` union here and there must not
 * be one: the legacy filter is case-sensitive and unnormalised, so a
 * captured document is free to carry a locale the v2 schema has never
 * heard of, and pinning this to v2's union would couple a frozen
 * artifact to a list that is still moving.
 */
export const LegacyLocaleValueSchema = z.strictObject({
  locale: z.string(),
  value: z.string(),
})

/* ------------------------------------------------------------------ *
 * v0 — six flat, single-locale documents
 * ------------------------------------------------------------------ */

/** Where the frozen surface serves v0's 123 icons from, post-rewrite. */
export const LEGACY_V0_ICON_URL_PATTERN =
  /^https:\/\/api\.dtpr\.io\/api\/v0\/icons\/[A-Za-z0-9_-]+\.svg$/

/**
 * One v0 record.
 *
 * Two R10 defects are pinned by this declaration rather than by an
 * assertion:
 *
 *  - there is no `headline` key, and the object is strict, so a v0
 *    document that grew one fails to parse (R10 defect 1);
 *  - `title` and `description` are **optional**, because the retired
 *    handler's intended English fallback never matched and simply
 *    omitted the keys for a locale that lacked the field (R10 defect
 *    2). Making them required would be the "obvious" mirror and would
 *    reject five of the six captured locales.
 *
 * `icon` is a bare string rather than the nested object v1 uses — the
 * two majors genuinely disagree about this, and flattening the
 * difference away would hide it.
 */
export const LegacyV0RecordSchema = z.strictObject({
  id: z.string(),
  icon: z.string().regex(LEGACY_V0_ICON_URL_PATTERN),
  category: z.string(),
  description: z.string().optional(),
  title: z.string().optional(),
})

/**
 * A whole v0 document. Also the shape of the `[]` answer an
 * unrecognised locale gets at 200 (AE4), which is why this is a plain
 * array with no minimum length.
 */
export const LegacyV0DocumentSchema = z.array(LegacyV0RecordSchema)

/* ------------------------------------------------------------------ *
 * v1 — five record-wrapped documents
 * ------------------------------------------------------------------ */

/** Where the frozen surface serves v1's 148 icons from, post-rewrite. */
export const LEGACY_V1_ICON_URL_PATTERN =
  /^https:\/\/api\.dtpr\.io\/api\/v1\/icons\/[A-Za-z0-9_-]+\.svg$/

/**
 * The `schema` block every v1 record is wrapped in.
 *
 * `namespace` is deliberately a plain string. It holds
 * `https://dtpr.io/schemas/element/v0.2` — an identifier, not a
 * locator — and R2 requires it to survive the icon-URL rewrite
 * verbatim. Constraining it to a non-`dtpr.io` host, as one might do
 * reflexively while retiring that domain, would invert the
 * requirement.
 */
export const LegacySchemaMetadataSchema = z.strictObject({
  name: z.string(),
  id: z.string(),
  version: z.string(),
  namespace: z.string(),
})

/**
 * The variable shape the **typed** endpoints emit: `label` present,
 * so the locale filter's unguarded `variable.label` dereference
 * succeeds.
 */
export const LegacyLabelledVariableSchema = z.strictObject({
  id: z.string(),
  label: z.array(LegacyLocaleValueSchema),
  required: z.boolean(),
})

/**
 * The variable shape the **untyped** `/api/v1/elements` endpoint
 * emits: `type` and `default` instead of `label`.
 *
 * This is R10 defect 4 stated as a shape. The retired untyped handler
 * hardcoded `variables: [{ id, type, required, default }]` and the
 * shared filter then read `variable.label`, so any effective
 * `?locales=` value threw a TypeError that h3 rendered as a 500. The
 * frozen surface answers 500 without ever running the filter; this
 * schema is what proves the document it declines to filter is still
 * the malformed one, rather than something that has been quietly
 * repaired into filterability.
 */
export const LegacyUnlabelledVariableSchema = z.strictObject({
  id: z.string(),
  type: z.string(),
  required: z.boolean(),
  default: z.string(),
})

/** The nested icon block on a v1 element. */
export const LegacyElementIconSchema = z.strictObject({
  url: z.string().regex(LEGACY_V1_ICON_URL_PATTERN),
  alt_text: z.array(LegacyLocaleValueSchema),
  format: z.string(),
})

/**
 * A record from `/api/v1/elements/{ai,device}`.
 *
 * `category_ids` is a plain `string[]` with no cross-reference to the
 * matching categories endpoint, and that is R10 defect 5 held open on
 * purpose: 50 of these records name a category of the *other*
 * datachain type. A schema that resolved the reference would reject
 * the captured documents.
 */
export const LegacyTypedElementRecordSchema = z.strictObject({
  schema: LegacySchemaMetadataSchema,
  element: z.strictObject({
    id: z.string(),
    category_ids: z.array(z.string()),
    version: z.string(),
    icon: LegacyElementIconSchema,
    title: z.array(LegacyLocaleValueSchema),
    description: z.array(LegacyLocaleValueSchema),
    citation: z.array(LegacyLocaleValueSchema),
    variables: z.array(LegacyLabelledVariableSchema),
  }),
})

/**
 * A record from the untyped `/api/v1/elements`.
 *
 * Spelled out rather than derived from the typed schema by
 * `.extend()`/`.omit()`. The one field that differs is the whole
 * reason the untyped route 500s, and a derivation would make it a
 * detail of how this file is factored instead of something a reader
 * sees.
 */
export const LegacyUntypedElementRecordSchema = z.strictObject({
  schema: LegacySchemaMetadataSchema,
  element: z.strictObject({
    id: z.string(),
    category_ids: z.array(z.string()),
    version: z.string(),
    icon: LegacyElementIconSchema,
    title: z.array(LegacyLocaleValueSchema),
    description: z.array(LegacyLocaleValueSchema),
    citation: z.array(LegacyLocaleValueSchema),
    variables: z.array(LegacyUnlabelledVariableSchema),
  }),
})

export const LegacyContextValueSchema = z.strictObject({
  id: z.string(),
  name: z.array(LegacyLocaleValueSchema),
  description: z.array(LegacyLocaleValueSchema),
  color: z.string(),
})

/**
 * The optional `context` block. Exactly one captured category carries
 * one, which is what makes it easy to drop in a refactor and worth
 * naming here.
 */
export const LegacyContextSchema = z.strictObject({
  id: z.string(),
  name: z.array(LegacyLocaleValueSchema),
  description: z.array(LegacyLocaleValueSchema),
  values: z.array(LegacyContextValueSchema),
})

/**
 * A record from `/api/v1/categories/{ai,device}`.
 *
 * `order` is nullable because it genuinely is: the ai categories
 * number 1–11 and every device category has `null`.
 */
export const LegacyCategoryRecordSchema = z.strictObject({
  schema: LegacySchemaMetadataSchema,
  category: z.strictObject({
    id: z.string(),
    order: z.number().nullable(),
    required: z.boolean(),
    name: z.array(LegacyLocaleValueSchema),
    description: z.array(LegacyLocaleValueSchema),
    prompt: z.array(LegacyLocaleValueSchema),
    version: z.string(),
    element_variables: z.array(LegacyLabelledVariableSchema),
    context: LegacyContextSchema.optional(),
  }),
})

export const LegacyTypedElementDocumentSchema = z.array(LegacyTypedElementRecordSchema)
export const LegacyUntypedElementDocumentSchema = z.array(LegacyUntypedElementRecordSchema)
export const LegacyCategoryDocumentSchema = z.array(LegacyCategoryRecordSchema)

/* ------------------------------------------------------------------ *
 * The h3 error envelope
 * ------------------------------------------------------------------ */

/**
 * Key order in the captured error bodies, which is load-bearing: the
 * envelopes are pretty-printed with two spaces, so a reordered key is
 * a byte difference. Zod cannot express order, so the conformance
 * suite asserts `Object.keys(body)` against these directly.
 */
export const LEGACY_ERROR_KEYS = [
  'error',
  'url',
  'statusCode',
  'statusMessage',
  'message',
] as const

/** As above, for the 404 — the only captured envelope carrying `data`. */
export const LEGACY_ERROR_KEYS_WITH_DATA = [...LEGACY_ERROR_KEYS, 'data'] as const

/**
 * The h3 error envelope, in both its forms.
 *
 * `error` is `z.literal(true)` rather than `z.boolean()` because the
 * captured bodies always carry `true` and a `false` here would mean
 * something has started rendering successes through the error path.
 * `data` is optional and, when present, holds nothing but `path` —
 * strict, so an envelope that grew a `stack` or a `statusMessage`
 * duplicate inside `data` fails.
 */
export const LegacyErrorEnvelopeSchema = z.strictObject({
  error: z.literal(true),
  url: z.string(),
  statusCode: z.number(),
  statusMessage: z.string(),
  message: z.string(),
  data: z.strictObject({ path: z.string() }).optional(),
})
