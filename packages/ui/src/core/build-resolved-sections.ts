import type { Category, Element, ResolvedDatachainInstance } from './types.js'
import { deriveElementDisplay } from './element-display.js'
import { extract } from './locale.js'

/**
 * A rendered section as consumed by `<DtprDatachain>` and
 * `renderDatachainDocument` — `id`, locale-resolved `title`, and the
 * ordered `elements` (each an `ElementDisplay`).
 *
 * Mirrors the structural shape of the section type declared in
 * `@dtpr/ui/html` (`RenderedSection`). It is duplicated here as a
 * `core`-local interface to avoid the otherwise-circular dep
 * (`html` already depends on `core` for `ElementDisplay`); the two
 * shapes are intentionally identical and consumers should be free
 * to pass the output of `buildResolvedSections` straight into
 * `renderDatachainDocument`.
 */
import type { ElementDisplay } from './types.js'

export interface RenderedSection {
  id: string
  title: string
  elements: ElementDisplay[]
}

/**
 * Options for `buildResolvedSections`.
 *
 * - `proposedIndicator` (default `true`): when `false`, suppress the
 *   `display.proposed` flag on suggested elements. Default-on per
 *   R15b — the proposed indicator is "default-on" so readers can
 *   immediately see which elements were AI-proposed. Callers can opt
 *   out (e.g. an authoring tool that has already accepted the
 *   suggestion and no longer wants to flag it).
 *
 * - `fallbackLocale` (default `'en'`): forwarded to
 *   `deriveElementDisplay` when the requested locale is missing on a
 *   given `LocaleValueArray`.
 */
export interface BuildResolvedSectionsOptions {
  proposedIndicator?: boolean
  fallbackLocale?: string
}

type SourceTag = 'snapshot' | 'suggested'

/**
 * Build the ordered list of `RenderedSection`s from a
 * `ResolvedDatachainInstance` — the resolved-form analogue to the existing
 * non-resolved `buildSections` (api/src/mcp/tools/render_datachain.ts).
 *
 * Behavior:
 *
 *   - Element-id resolution: snapshot first, then suggested. Snapshot
 *     wins on collision. Collisions are caller responsibility (the
 *     R15a refinement on `ResolvedDatachainInstanceSchema` and U2's semantic
 *     validator both reject them); this helper is defensive — it
 *     simply prefers the snapshot record.
 *
 *   - `display.proposed` is set to `true` for every placement whose
 *     element was resolved from `suggested_elements` (R15b — default).
 *     Pass `options.proposedIndicator: false` to opt out (the field
 *     is then `false` on every element regardless of source).
 *
 *   - `display.provenance` is composed from
 *     `authoring_provenance.element_provenance[element_id]` merged
 *     with whole-disclosure `model` / `generated_at`. Only attached
 *     for AI-authored disclosures with an entry for this placement;
 *     `undefined` otherwise (human-authored, no provenance, or no
 *     per-element entry).
 *
 *   - Section order honors `schema_snapshot.datachain_type.categories`
 *     (R18) — categories declared but absent from the instance still
 *     appear, with an empty `elements` array. The instance's
 *     placement order within each category is preserved.
 *
 *   - Locale fallthrough is handled by the underlying
 *     `deriveElementDisplay` call — this helper does not interfere.
 *
 * Errors:
 *
 *   - Throws when an `instance.elements[].element_id` resolves into
 *     neither map. In production this case is caught upstream by
 *     `validate_resolved`; the throw is a defensive belt to surface
 *     malformed input rather than render an empty datachain silently.
 */
export function buildResolvedSections(
  resolved: ResolvedDatachainInstance,
  locale: string,
  options: BuildResolvedSectionsOptions = {},
): RenderedSection[] {
  const proposedIndicator = options.proposedIndicator ?? true
  const fallbackLocale = options.fallbackLocale ?? 'en'

  // Build element-id resolution map: snapshot first, suggested fills
  // the gaps. Collision: snapshot wins (defensive — validate_resolved
  // already rejects collisions, but this helper does not enforce R15a).
  const elementById = new Map<string, { element: Element; source: SourceTag }>()
  for (const el of resolved.schema_snapshot.elements) {
    elementById.set(el.id, { element: el, source: 'snapshot' })
  }
  for (const el of resolved.suggested_elements) {
    if (!elementById.has(el.id)) {
      elementById.set(el.id, { element: el, source: 'suggested' })
    }
  }

  const categories = resolved.schema_snapshot.categories
  const categoryById = new Map<string, Category>()
  for (const c of categories) categoryById.set(c.id, c)

  // Bucket placements by category id. Initialize buckets for every
  // declared category so we honor `datachain_type.categories` order
  // even for categories with no instance placements.
  const declaredCategoryIds = resolved.schema_snapshot.datachain_type.categories
  const byCategory = new Map<string, ElementDisplay[]>()
  for (const id of declaredCategoryIds) byCategory.set(id, [])

  const provenance = resolved.authoring_provenance
  const aiProvenance =
    provenance && provenance.kind === 'ai_generated' ? provenance : undefined

  // Count placements per element_id so the per-element provenance
  // lookup can decide when a bare `element_id` key is unambiguous
  // (placed exactly once, no `element_instance_id` on the placement).
  const placementCountByElementId = new Map<string, number>()
  for (const p of resolved.elements) {
    placementCountByElementId.set(
      p.element_id,
      (placementCountByElementId.get(p.element_id) ?? 0) + 1,
    )
  }

  for (const placement of resolved.elements) {
    const resolvedDef = elementById.get(placement.element_id)
    if (!resolvedDef) {
      throw new Error(
        `buildResolvedSections: placement element_id "${placement.element_id}" ` +
          'resolves into neither schema_snapshot.elements nor suggested_elements. ' +
          'In production this is caught by validate_resolved upstream.',
      )
    }
    const { element, source } = resolvedDef
    const category = categoryById.get(element.category_id)
    const display = deriveElementDisplay(element, placement, locale, {
      fallbackLocale,
      ...(category ? { category } : {}),
    })

    // R15b: proposed indicator is default-on. Opting out
    // (`proposedIndicator: false`) flattens the flag to `false`
    // unconditionally so downstream renderers see no badge.
    display.proposed = proposedIndicator && source === 'suggested'

    // Per-element AI provenance: compose the per-element entry with
    // whole-disclosure `model` / `generated_at`. Only attach when an
    // entry exists for this placement; human-authored disclosures and
    // AI disclosures without an entry leave `provenance` undefined.
    //
    // Key resolution mirrors `checkElementProvenanceKeys`:
    //   1. Prefer `placement.element_instance_id`.
    //   2. Fall back to `placement.element_id` only when the placement
    //      has no `element_instance_id` AND that element_id is placed
    //      exactly once. Two placements of the same element_id with no
    //      `element_instance_id` and a single bare-element_id entry are
    //      ambiguous; leave both `provenance` undefined rather than
    //      attaching the same entry to both.
    if (aiProvenance) {
      const map = aiProvenance.element_provenance
      let entry = undefined as
        | NonNullable<typeof aiProvenance.element_provenance>[string]
        | undefined
      if (map) {
        if (placement.element_instance_id !== undefined) {
          entry = map[placement.element_instance_id]
        } else if ((placementCountByElementId.get(placement.element_id) ?? 0) === 1) {
          entry = map[placement.element_id]
        }
      }
      if (entry !== undefined) {
        display.provenance = {
          kind: 'ai_generated',
          ...entry,
          ...(aiProvenance.model !== undefined ? { model: aiProvenance.model } : {}),
          ...(aiProvenance.generated_at !== undefined
            ? { generated_at: aiProvenance.generated_at }
            : {}),
        }
      }
    }

    // Category placement: drop into the element's declared category
    // bucket. The schema-level CATEGORY_REF_MISSING rule guarantees
    // every element.category_id resolves to a defined category, but
    // it does not guarantee that category appears in
    // datachain_type.categories[] — a suggested element promoted into
    // the snapshot can land on a category that the type does not
    // declare. validateResolvedInstance re-runs checkInstance against
    // the merged pool, not a full schema-level validation, so this
    // case isn't caught upstream. Throw to surface the mismatch
    // rather than silently rendering a section list with the
    // placement dropped.
    const bucket = byCategory.get(element.category_id)
    if (!bucket) {
      throw new Error(
        `buildResolvedSections: element "${element.id}" has category_id ` +
          `"${element.category_id}" which is not in ` +
          `schema_snapshot.datachain_type.categories. The placement cannot ` +
          'be rendered. Add the category to datachain_type.categories or ' +
          'pick an element whose category is declared.',
      )
    }
    bucket.push(display)
  }

  // Materialize sections in declared category order. Categories that
  // are declared but missing from the snapshot's category list still
  // produce a section; the title falls back to the bare id.
  return declaredCategoryIds.map((id) => {
    const c = categoryById.get(id)
    const title = c ? extract(c.name, locale, fallbackLocale) || id : id
    return {
      id,
      title,
      elements: byCategory.get(id) ?? [],
    }
  })
}
