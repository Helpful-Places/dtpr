---
date: 2026-05-07
topic: dtpr-datachain-instance-resolved-form
---

# DatachainInstance Evolution: Thin Reference Form + Resolved Self-Contained Form

## Problem Frame

The DTPR v2 API publishes a `DatachainInstance` Zod / JSON-schema type that is a **thin reference shape**: every element is a pointer (`element_id`, optional `variables`/`label`/`citation`, plus instance-level fields like `priority` and `context_type_id`). To render it, a consumer must also fetch the pinned schema (categories, elements, locales, context definitions) and run the merge themselves — `deriveElementDisplay(element, instance, locale, {category})` in `packages/ui/src/core/element-display.ts` is exactly that merge in code form today.

This works for validating and storing authored content compactly, but it is not enough for two real, named consumers:

- **hp-app** (Helpful Places' algorithm transparency app) persists a richer denormalized snapshot per algorithm: full element records inlined (per-locale title, description, variable declarations, icon, symbol_id), instance overrides, an `ai_generation` provenance block from the LLM-driven authoring flow, plus a snapshot of the pinned schema's categories. Consumers (transparency page, admin UI, signage PDF generator) render without re-fetching the schema. Today this shape is **paved privately** — it is not a first-class DTPR type.
- **DTPR agent skills** (e.g. `dtpr-describe-system`) produce datachains that may include LLM-proposed elements not in the pinned schema. Today there is nowhere to put them — `validate` rejects unknown element_ids, and the authoring tool's draft state is not portable. Reviewers cannot package and swap an AI-authored draft for review before promoting the proposed elements into a real schema version.

The decision space is **what wire shape to evolve toward** so consumers do not pave incompatible cow paths, while keeping the thin form as a compact validate-input format.

## Requirements

**Two wire forms (additive — thin contract unchanged)**

- R1. `DatachainInstance` (thin) keeps today's shape, today's contract, and today's `validate` semantics. No breaking change to v2 consumers.
- R2. A new sibling type `ResolvedDatachain` is defined as a **strict superset** of `DatachainInstance`:
  - Every field of `DatachainInstance`, unchanged.
  - `schema_snapshot: { datachain_type, categories, elements }` — `datachain_type` is the **full** pinned datachain-type metadata; `categories` and `elements` are the **referenced subset** (per R6). All locales the schema declared are preserved as-is.
  - `suggested_elements: Element[]` — LLM-proposed elements not present in the pinned schema (sibling array, separate from `schema_snapshot.elements`).
  - `authoring_provenance?: AuthoringProvenance` — optional, structured authoring-time provenance (the home for the LLM `ai_generation` block).
- R3. `ResolvedDatachain → DatachainInstance` is a structural strip (`omit(['schema_snapshot', 'suggested_elements', 'authoring_provenance'])`), not a transformation. Round-trip is a literal field drop when `suggested_elements` is empty.

**Resolve contract**

- R4. A documented operation `resolve(thin: DatachainInstance, schema) → ResolvedDatachain`. Pure function with stable serialization (sorted keys, deterministic locale and placement ordering): identical *parsed* inputs produce **structurally equivalent** output that re-parses to the same value. (Round-trip `resolve → strip → re-parse` is identity; we do not promise byte-identity against pre-parse author payloads, since Zod default population means an input that omitted a default will not match the post-parse form.)
- R5. Exposed as `POST /schemas/:version/resolve` (REST) and `resolve_datachain` (MCP tool). REST returns the resolved JSON; MCP returns the same in the standard envelope. Non-functional baseline (extends parent brainstorm R29–R31):
  - **Rate limit**: dedicated `RL_RESOLVE` bucket, ceiling at or below `RL_VALIDATE`'s 20 req/min per IP, mounted ahead of the wildcard `RL_READ`. Resolve runs validate internally and returns a 10–100× larger response, so it gets a tighter bucket than validate.
  - **Response size cap**: 512 KB serialized JSON. Requests whose resolved bundle would exceed the cap return `413 Payload Too Large` (REST) or a typed error envelope (MCP).
  - **CPU/wall-clock budget**: 1000 ms (twice validate's 500 ms) to cover validate + snapshot assembly + sorted-key serialization. Wrangler `limits.cpu_ms` plus a Worker `AbortController` enforce the bound.
- R6. `schema_snapshot.categories` and `schema_snapshot.elements` carry the **referenced subset** — only categories and elements referenced by the instance's placements (plus categories transitively required by the datachain-type's required-categories rule). `schema_snapshot.datachain_type` is the full pinned datachain-type record (subchain definitions, locale allow-list, etc.) — it is not subset. Full-schema snapshots of categories/elements are out of scope; reachable later if a real consumer needs render-flexibility beyond the pinned placements.
- R7. `resolve` operates on already-valid thin instances. If the input does not pass `validate`, `resolve` returns the same error envelope `validate` would. Resolve never produces `suggested_elements` — those only enter `ResolvedDatachain` when an authoring tool produces a resolved form directly.

**Validate contract**

- R8. `validate` (REST `POST /schemas/:version/validate` and MCP `validate_datachain`) keeps its current input contract — thin form only. Today's call sites see zero behavior change.
- R9. A `ResolvedDatachain` is checked by a **separate** validation surface (working name `validate_resolved` — exact shape deferred; see Open Questions). It checks: every placement's `element_id` resolves in `schema_snapshot.elements ∪ suggested_elements`; the `suggested ⟹ ai_generated` refinement (R14); the **collision rule** (R15a); standard semantic rules (cardinality, required categories, context refs); and that `schema_snapshot` is consistent with the pinned `schema_version` **when that version is still served** — when the pinned version has been retired, snapshot consistency is not enforced (graceful degradation: the artifact remains renderable from its snapshot alone). Whether the artifact's `schema_snapshot` is integrity-bound to the pinned version (so that forged snapshots for retired versions cannot be backdated) is a threat-model decision; see Open Questions.

**Authoring provenance**

- R10. `AuthoringProvenance` is a discriminated union on `kind`:
  - `{ kind: 'human' }` — marker only. Useful for explicitly asserting human authorship in a mixed pipeline.
  - `{ kind: 'ai_generated', ...fields }` — the home for the LLM `ai_generation` block. **Field set TBD** pending the hp-app + agent-skill audit (see Open Questions). Candidate fields under consideration: `rationale`, `confidence`, `source_references`, `variable_rationale`, `model`, `generated_at`. Field names and required/optional decisions land after the audit; the schema commits to the discriminated-union shape now and to the field set later.
  - **`source_references` shape constraint**: when present, every entry is a URL with scheme restricted to `https:` or `http:` (Zod refinement). This blocks `javascript:`/`data:` URI injection if a renderer surfaces references as anchors. The richer structural-typing question (`{ label, url? }` vs raw URL strings) is deferred to planning.
  - **Render-time escape policy**: renderers that surface `rationale`, `variable_rationale` values, or any other free-text `AuthoringProvenance` field MUST treat the content as plain text — HTML-escape at every HTML insertion boundary; if Markdown is applied, use a sanitizing processor that strips raw HTML tags. LLM-authored free text reaches `<DtprDatachain>` / `renderDatachainDocument` via persisted `ResolvedDatachain` artifacts; this is a renderer contract, not an ad-hoc per-implementation decision.
- R11. `AuthoringProvenance` is attachable at instance level only in v1. Per-placement override is **deferred** — the doc's own audit gate (Open Questions) will decide whether real consumers carry per-placement provenance; if so, it lands as a future additive change (no breaking modification to InstanceElement). Until then, the whole-disclosure case ("this entire datachain was AI-authored on 2026-05-07 with model X") covers the named consumer set.
- R12. `AuthoringProvenance` is deliberately **distinct** from `sources` / `ProvenanceRef`. `sources` is *citation* provenance (the model card row this element was derived from). `AuthoringProvenance` is *authoring telemetry* (why the LLM picked this element, with what confidence). They coexist on the same shape and the renderer treats them as different surfaces.

**Suggested elements**

- R13. `suggested_elements: Element[]` lives on `ResolvedDatachain` only. The thin `DatachainInstance` form **never** carries suggested elements; `validate` (thin) continues to reject unknown `element_id` references unchanged.
- R14. Zod refinement on `ResolvedDatachain`: `suggested_elements.length > 0 ⟹ authoring_provenance.kind === 'ai_generated'` (instance-level). One rule, one path: a non-empty `suggested_elements` requires the whole-disclosure provenance to be AI-attributed. (The earlier two-branch "instance-level OR per-placement" framing conflated whole-disclosure attribution with per-element attribution; the simpler rule keeps R11's instance-only commitment honest.)
- R15. Element-id resolution in renderers and validators: look in `schema_snapshot.elements` first; fall through to `suggested_elements`. The fallthrough rule is part of the schema contract — every renderer implements it identically.
- R15a. **Element-id collision is a hard error.** `validate_resolved` rejects when any `suggested_elements[i].id` collides with a `schema_snapshot.elements[j].id`. Collision is almost always an authoring mistake (the LLM proposes what already exists); silent shadowing destroys reviewer signal at exactly the moment it is most needed.
- R15b. **Renderers MUST surface a visible "proposed" indicator** when an element resolves into `suggested_elements` rather than `schema_snapshot.elements`. The shipping renderers (`<DtprDatachain>`, `<DtprElement>`, `<DtprElementDetail>`, `renderDatachainDocument`, MCP `render_datachain`) all default the indicator on; consumers may opt out, not in. Without this, the agent-authored-draft review flow has no visible safety net — drafts render identically to canonical disclosures and the structural `suggested ⟹ ai_generated` guarantee becomes invisible to humans deciding whether to trust the content. Exact visual treatment (badge, border, label) is a planning decision; the requirement here is "visible by default."
- R15c. **`AuthoringProvenance` render surface** when `kind: 'ai_generated'` and the element/instance is being detail-rendered (`<DtprElementDetail>`, equivalent HTML view): `rationale` and `variable_rationale` surface as a distinct expandable "AI proposal context" section beneath variables. `confidence` is rendered as a qualitative label (low / medium / high — bucketing thresholds picked in planning) rather than a raw decimal; surfacing `0.7` reads as numeric theater. `model` and `generated_at` are reviewer-facing metadata, optional in the surface. Compact views (`<DtprElement>`) carry only the "proposed" indicator from R15b; provenance detail is the detail view's job.
- R15d. **Rejection / discard flow**: when a reviewer rejects an LLM-authored draft, the documented path is "caller discards the artifact and re-invokes the skill (with feedback) to produce a new resolved form." The schema does not model a stateful in-product "edit out a single suggested element" mutation; that would require a mutate-and-revalidate loop the schema is not yet shaped for. Each authoring round produces a fresh `ResolvedDatachain`; rejection is operational.
- R16. **Round-trip is conditional**: `ResolvedDatachain → DatachainInstance` is only legal when `suggested_elements.length === 0`. A resolved form carrying suggested elements is **not** round-trippable to a valid thin form until those elements have been **promoted** into a pinned schema (via `schema:new` adding the element to a real schema version, after which `resolve` against the new version produces a clean form). Promotion is an explicit out-of-band step, not implicit drift.
- R17. Suggested elements use the same `Element` shape as schema-resolved elements. Promotion is a literal "move this entry from `suggested_elements` to a schema version's `elements/`" operation. No discriminator field on the element itself; the array placement is the type tag.
- R17a. **Post-promotion lifecycle (fork-forever)**: `ResolvedDatachain` artifacts persisted before promotion remain pinned to their original `schema_version` and continue to carry the entry in `suggested_elements` indefinitely. They do not auto-rebase. To adopt a promoted element, a consumer re-resolves a thin instance against the new schema version (which yields a clean form with the element in `schema_snapshot.elements`); the prior persisted artifact is not mutated. This is intentional — every persisted artifact reflects the schema-version + suggestion-set it was authored against, and consumers choose when to re-author. A `rebase_resolved(resolved, new_schema_version)` operation is reachable later if a real consumer needs it.

**Renderer contract**

- R18. `<DtprDatachain>`, `renderDatachainDocument`, and the MCP `render_datachain` tool can render a `ResolvedDatachain` end-to-end with **no further schema fetches**. The existing `(thin instance + schema)` render paths remain — `ResolvedDatachain` rendering is additive. All render-entry-point APIs accept an explicit `locale` parameter; locale selection is a **caller responsibility** (e.g., hp-app's signage PDF dialog picks a locale before invoking the renderer), not bundled into the wire shape. The snapshot preserves all locales precisely so consumers retain that choice at render time.
- R19. The element-id fallthrough rule (R15) is part of the renderer contract — renderers look up by id in `schema_snapshot.elements` first, then `suggested_elements`. No new helper is mandated; if multiple call sites converge on the lookup, planning may extract a helper, but the requirement is the rule, not the abstraction.

**Documentation**

- R20. Update `dtpr-ai/content/en/6.concepts/1.datachains.md` to: describe both forms; describe the resolve operation; describe the round-trip rule (and its conditional break under suggested elements); describe the position of `AuthoringProvenance` (including a brief disambiguation paragraph distinguishing it from `sources` — citation vs authoring-telemetry); and **correct the existing example** by removing the stale `category_id` field from the placement object (it does not exist on `InstanceElementSchema`). The thin form is still introduced first; the resolved form is positioned as the **persisted, render-ready, optionally-LLM-authored** sibling.
- R21. Update `dtpr-ai/content/en/3.rest/6.validate.md` with a "See also: resolve" callout in the cross-reference section. The body — request shape, response shape, error codes — is unchanged.
- R22. Add a new page `dtpr-ai/content/en/3.rest/10.resolve.md` documenting `POST /schemas/:version/resolve`: request shape, response shape (a `ResolvedDatachain`), error codes (passes through validate's envelope on bad input), the rate-limit / response-cap / CPU-budget regime from R5, and a worked example.
- R23. Update MCP tool docs to add `resolve_datachain` as a sibling tool to `validate_datachain` under `dtpr-ai/content/en/2.mcp/4.tools/`.

## Success Criteria

- **hp-app's persistence pattern is blessed**: hp-app can persist a `ResolvedDatachain` (after a one-time field-name + snapshot-shape audit; the lean-subset commitment in R6 is a real shape change from hp-app's current full-categories pattern, not a pure rename) and hand it directly to `<DtprDatachain>` or `renderDatachainDocument` with no API access at render time. The shape is no longer a private cow path.
- **Agent skills produce portable artifacts**: an LLM-driven skill (e.g. `dtpr-describe-system`) emits a `ResolvedDatachain` carrying `suggested_elements` + `authoring_provenance.kind = 'ai_generated'`, a reviewer renders it for review, and the round-trip rule (R16) prevents accidental promotion-bypass.
- **Thin contract preserved**: every existing v2 `validate` caller sees zero behavior change. Existing test fixtures in `api/test/` continue to parse and validate without modification.
- **Round-trip equivalence**: `resolve(thin_parsed, schema)` → strip → re-parse yields the same `DatachainInstance` value as `thin_parsed`. (Stronger byte-identity claims against pre-parse author payloads are not promised — Zod default population breaks them in the trivial case.)
- **Schema-driven docs land**: `dtpr.ai/concepts/datachains` and `dtpr.ai/rest/validate` no longer say the published shape is provisional — they describe both forms and the documented bridge.

## Scope Boundaries

- **Out of scope (deferred):**
  - **Full-schema (rather than referenced-subset) `categories` / `elements` snapshot.** Reachable later additively if a consumer surfaces a render-flexibility need (e.g. swap-elements-without-API).
  - **Locale-resolved render-tier wire shape** (`RenderedDatachain` ≈ `RenderedSection[]`). Already exists in code as the input to `renderDatachainDocument`; formalizing it as a wire schema waits for a real consumer.
  - **Content-hashing the resolved artifact** (DTPR-Content-Hash on resolved bundles). Reachable additively if downstream caching needs it. Note: this is also the mechanism that would close the forged-snapshot integrity gap; see Open Questions.
  - **Symbol (icon SVG) inlining** in the snapshot. Symbols continue to be URL-resolved at render time; the snapshot inlines element records (which carry `symbol_id`), not the SVG bodies.
  - **`rebase_resolved(resolved, new_schema_version)`** operation that re-pins prior artifacts after suggested-element promotion. Per R17a, fork-forever is the v1 lifecycle.
  - **Per-placement `AuthoringProvenance` override.** Deferred per R11 pending audit; additive when needed.
  - **Structural typing for `source_references`** (e.g. `{ label, url? }` shape). v1 keeps `string[]` with URL-scheme refinement; richer shape lands when a real consumer surfaces it.
  - **In-product mutate-a-suggested-element edit loop.** Per R15d, rejection is "caller discards and re-invokes the skill"; stateful per-element edit + revalidate is a separate scope.
  - **hp-app's migration** to consume the new shape. That is downstream consumer work; this brainstorm only blesses the upstream type.
- **Out of scope (rejected):**
  - **Frame A — type collapse** (rename thin to `AuthoredDatachain`, make `DatachainInstance` rich-only). Too breaking for a contract that already has v2 consumers, and forces every non-render use case to pay for hp-app's persistence concern.
  - **Frame C — content-hashed bundle pinning, no new type.** Frame C punts the offline-render requirement onto consumer-side bundle caching: each consumer fetches a content-addressed schema bundle once and stores it alongside a thin instance. The cost it asks consumers to pay is real for hp-app specifically — hp-app's named consumer constraint is per-algorithm signage PDFs that travel without API access (sometimes printed, sometimes embedded, sometimes archived years later). For that consumer, "(thin instance, bundle blob, cache logic)" is materially more moving parts than "one self-contained artifact." Frame C might still win for a future high-volume consumer where N instances pin one schema and dedup matters; that consumer doesn't yet exist, and Frame B's strict-superset shape can be additively augmented with content-hashing later (the deferred "content-hashing the resolved artifact" item) if it does. We pick Frame B because hp-app's constraints are concrete today; Frame C remains a coherent alternative for a different consumer profile.
  - **Approach 4 — resolved form *is* the locale-resolved render snapshot** (lossy, locale-locked, not round-trippable). It's a render-tier shape, not a persistence-tier shape. Belongs in a separate scope.
  - **`suggested: true` on the thin `DatachainInstance` form**. The thin form's contract — "every element_id resolves in the pinned schema" — is load-bearing for `validate`. Suggested elements live only on `ResolvedDatachain`.
  - **Encoding suggested elements via element_id prefix in the thin form** (e.g. `_proposed:foo`). Same reason; pollutes the thin contract.
  - **Changes to `validate`'s thin-form input or output**. The new validation surface is additive.

## Key Decisions

- **Sibling type, additive evolution** — `DatachainInstance` keeps its name, shape, and contract. `ResolvedDatachain` is new, additive, and a strict structural superset. No v2 consumer breaks.
- **Strict-superset shape** — `ResolvedDatachain` literally extends `DatachainInstance` with three optional/derived blocks. Round-trip is a structural strip, not a transformation, so the bridge is mechanical and obviously correct.
- **Lean subset for categories/elements; full datachain_type** — only categories/elements referenced by this instance are inlined; `datachain_type` (subchains, locale allow-list, etc.) is full because it is small and load-bearing for renderer ordering.
- **All locales preserved in snapshot** — the snapshot mirrors the schema's canonical form. Locale selection stays at render time, where `deriveElementDisplay` already does it; the caller picks the locale per-render. One artifact serves N languages.
- **`suggested_elements` as sibling array, not flag** — keeps `schema_snapshot` semantically pure ("pinned schema content as resolved"), makes promotion a literal array move, and lets element-id fallthrough be the single resolution rule.
- **Single satisfaction rule for `suggested ⟹ ai_generated`** — instance-level only. The two-branch "instance-level OR per-placement" framing was conflating whole-disclosure attribution with per-element attribution; the simpler rule lines up with the v1 instance-only `AuthoringProvenance` placement.
- **Element-id collision is a hard error, not silent shadow** — protects reviewer signal at the moment a real-vs-suggested confusion occurs.
- **Default-on "proposed" indicator at the renderer contract level** — UX safety net for the LLM-authored review flow lives in the schema-renderer contract, not delegated to each consumer.
- **Round-trip is conditional, by design** — a resolved form with suggested elements does not round-trip to thin until promotion. This prevents accidental schema bypass: you cannot `validate` (thin) a resolved form's suggested content into existence.
- **Round-trip is equivalence, not byte-identity** — the contract is over post-parse normalized values, not raw author bytes. Zod default population (e.g. `priority: 0`, `default([])`) makes a stronger byte-identity claim trivially false.
- **Fork-forever post-promotion lifecycle** — prior persisted artifacts stay pinned. Re-authoring is the path to adopting a promoted element. A `rebase_resolved` operation is reachable later if a consumer needs it.
- **`AuthoringProvenance` distinct from `sources`** — citation and authoring-telemetry are different concerns. Coexist on the same shape; the renderer treats them as different surfaces.
- **`AuthoringProvenance` instance-level only in v1** — pending the hp-app + agent-skill audit. Per-placement override is additive when needed.
- **Resolve as additive endpoint with explicit non-functional baseline** — `POST /schemas/:version/resolve` and `resolve_datachain` MCP tool, with their own rate-limit bucket, response-size cap, and CPU budget. `validate`'s surface is untouched.

## Dependencies / Assumptions

- **Zod refinement → JSON Schema emission**: the `suggested ⟹ ai_generated` conditional refinement (and the `source_references` URL/scheme refinement) emit cleanly via Zod v4's `z.toJSONSchema` (codebase uses `z.toJSONSchema` with `unrepresentable: 'any'`, not `zod-to-json-schema`). **Unverified assumption** — confirm during planning that the emit is well-formed and that downstream LLM consumers parse it. With `unrepresentable: 'any'`, refinements that cannot be represented are silently dropped from the emitted schema; planning must assert constraint presence in the emitted JSON Schema rather than trusting silent success. If emit is awkward, the constraint can be expressed as a semantic-validator rule instead (R9 path) without changing the wire shape.
- **Renderer extension is additive**: `<DtprDatachain>`, `renderDatachainDocument`, and `deriveElementDisplay` can be extended additively to accept a `ResolvedDatachain` without breaking their current `RenderedSection[]` / `(element, instance, locale, options)` contracts. **Verify by inspection before /ce-plan** — a 30-minute code read against `packages/ui` confirms or refutes; deferring it into planning risks discovering an architectural break after planning has committed to the additive frame.
- **`DatachainInstanceSchema.extend(...).refine(...)`** on a `z.object().describe()` base is well-formed in Zod v4 — the `.describe` metadata composes through the extend, and the post-extend `.refine` runs on the combined shape. To be confirmed empirically in planning; falls out of the same code-read as the renderer-additivity check.
- **hp-app field-name + snapshot-shape compatibility**: hp-app's persisted-artifact shape is structurally compatible with `ResolvedDatachain` modulo field-name normalization **and** snapshot reshape (hp-app today snapshots the full categories list; R6 commits to lean-subset). **Unverified assumption** — a side-by-side audit of hp-app's actual shape vs the proposed Zod surface is required **before** finalizing field names so we adopt names hp-app already uses where they don't conflict with DTPR conventions, and so success criterion 1 (hp-app blessed) reflects the actual migration cost.
- **Resolve determinism**: `resolve(thin_parsed, schema_version)` produces structurally equivalent output for identical post-parse inputs. Implies stable serialization — sorted object keys, deterministic locale ordering, deterministic placement ordering inside `schema_snapshot.elements` and `schema_snapshot.categories`. To be confirmed in planning, including which serializer to use.
- **No new symbols infrastructure**: the snapshot inlines element records (which already carry `symbol_id`), not SVG bodies. Symbols continue to be served at `/elements/:id/icon.svg` and resolved at render time. If a future consumer wants truly-offline rendering including icons, that's a separate scope.

## Outstanding Questions

### Resolve before planning

- **Exact `AuthoringProvenance` field set for `kind: 'ai_generated'`** — candidate fields: `rationale`, `confidence`, `source_references`, `variable_rationale`, `model`, `generated_at`. hp-app's current artifact already carries some of these under names that may differ. A direct audit of hp-app's `ai_generation` shape, plus a survey of the agent-skills (`dtpr-describe-system`, `dtpr-element-design`) outputs, will surface field-name and required/optional decisions before Zod is written.
- **`validate_resolved` shape — first-class commitment** — the agent-skills success criterion (a reviewer renders an AI-authored draft, the round-trip rule prevents promotion-bypass) is load-bearing on `validate_resolved` having a real, named shape. Resolve before /ce-plan: separate REST endpoint (`POST /schemas/:version/validate_resolved`)? Polymorphic `validate` that branches on input shape via discriminator? Content-type discriminator? Each has tradeoffs — separate endpoint is the most boring choice and probably right; commit before planning so the rest of the doc's "validate_resolved" references aren't placeholder text.
- **Zod refinement → JSON Schema emit verification** — empirically check that Zod v4's `z.toJSONSchema` with `unrepresentable: 'any'` emits the `suggested ⟹ ai_generated` and URL-scheme refinements as well-formed JSON Schema constraints (likely via `allOf` / `if-then`/`else`), or silently drops them. If dropped, the constraints move to the semantic-validator path; either way, planning needs to know which.
- **Renderer-additivity verification** — confirm by inspection that `<DtprDatachain>`, `renderDatachainDocument`, and `deriveElementDisplay` can be extended additively (signature + behavior) before /ce-plan commits to the additive frame.
- **Schema-snapshot integrity / forged-snapshot threat model** — decide whether DTPR's threat model considers forged schema attribution within scope. R9 currently graceful-degrades: when a pinned version has been retired, snapshot consistency is not enforced, so a forged `ResolvedDatachain` could backdate fabricated content to a real prior version. If in scope, the snapshot needs a content-hash binding (SHA-256 of canonical JSON of the schema version's elements + categories at build time) carried on the artifact and verifiable while the version is live; consumers can display the hash as an attestation fingerprint. If out of scope, document the trust-boundary decision in `concepts/datachains.md` so consumers know not to rely on `schema_snapshot` for provenance guarantees.

### Deferred to planning

- **Zod module layout**: new file `api/src/schema/datachain-instance-resolved.ts`, or extend `api/src/schema/datachain-instance.ts`? Likely the former to keep the thin shape file unchanged and grep-friendly.
- **MCP `resolve_datachain` envelope** — should it return the resolved JSON inline, or use the same `resourceUri` indirection that `render_datachain` uses for HTML output? Inline is simpler; URI indirection is consistent with the render-tool pattern. Probably inline (resolved JSON is small; capped at 512 KB per R5).
- **`<DtprDatachain>` Vue API extension** — new prop variant on the existing component? Separate component (e.g. `<DtprResolvedDatachain>`)? Single entry that branches on input shape? `packages/ui` consumers are few and reachable; pick whichever has the cleaner type story. Whichever shape is chosen, R15b's "default-on proposed indicator" must be the integrator-default, not opt-in.
- **R15c qualitative confidence buckets** — pick the low/medium/high thresholds against `confidence: 0..1` (e.g., `<0.4` low, `0.4–0.7` medium, `>0.7` high) once we see real agent-skill output distributions.
- **`source_references` structural typing** — defer to planning whether to keep `string[]` (with URL-scheme refinement only) or move to `{ label, url? }`. Decision waits for hp-app + agent-skills audit; structural typing is additive if we land on `string[]` first.
- **hp-app migration story** — does hp-app consume the new shape directly post-ship (a single port), or maintain its private shape with a documented mapping for some compat window? Out of this brainstorm's scope but worth flagging to hp-app maintainers as the deliverable lands.

## Next Steps

→ `/ce-plan` for structured implementation planning, after the **Resolve before planning** items above are settled (in particular: `AuthoringProvenance` field set audit, `validate_resolved` shape commitment, Zod-refinement → JSON-Schema emit verification, renderer-additivity verification, and the schema-snapshot integrity / threat-model decision).

## Strawman Zod surface (non-binding sketch — planning owns the final surface)

The sketch below is illustrative. Field names on `AuthoringProvenance.ai_generated` and the structural typing of `source_references` are **subject to the hp-app + agent-skill audit**; the discriminated-union shape and the `ResolvedDatachain` layout are committed.

```ts
// api/src/schema/datachain-instance-resolved.ts (new)
import { z } from 'zod'
import {
  DatachainInstanceSchema,
  type DatachainInstance,
} from './datachain-instance.ts'
import { CategorySchema } from './category.ts'
import { ElementSchema } from './element.ts'
import { DatachainTypeSchema } from './datachain-type.ts'

const HttpsOrHttpUrl = z
  .string()
  .url()
  .refine(
    (u) => u.startsWith('https://') || u.startsWith('http://'),
    { message: 'source_references entries must use https: or http: scheme' },
  )

export const AuthoringProvenanceSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('human') }),
  z.object({
    kind: z.literal('ai_generated'),
    // Field set TBD pending hp-app + agent-skill audit; candidates below.
    rationale: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    source_references: z.array(HttpsOrHttpUrl).default([]),
    variable_rationale: z.record(z.string(), z.string()).optional(),
    model: z.string().optional(),
    generated_at: z.string().datetime().optional(),
  }),
])

export const SchemaSnapshotSchema = z
  .object({
    datachain_type: DatachainTypeSchema,           // full pinned record (R6)
    categories: z.array(CategorySchema),           // referenced subset (R6)
    elements: z.array(ElementSchema),              // referenced subset (R6)
  })
  .describe('Frozen snapshot of the pinned schema this datachain references.')

export const ResolvedDatachainSchema = DatachainInstanceSchema.extend({
  schema_snapshot: SchemaSnapshotSchema,
  suggested_elements: z.array(ElementSchema).default([]),
  authoring_provenance: AuthoringProvenanceSchema.optional(),
})
  // R14: instance-level rule.
  .refine(
    (r) =>
      r.suggested_elements.length === 0 ||
      r.authoring_provenance?.kind === 'ai_generated',
    {
      message:
        'suggested_elements requires instance-level authoring_provenance.kind === "ai_generated".',
      path: ['suggested_elements'],
    },
  )
  // R15a: collision rule.
  .refine(
    (r) => {
      const snapshotIds = new Set(r.schema_snapshot.elements.map((e) => e.id))
      return r.suggested_elements.every((e) => !snapshotIds.has(e.id))
    },
    {
      message:
        'suggested_elements id collides with schema_snapshot.elements id; promote or rename.',
      path: ['suggested_elements'],
    },
  )

export type ResolvedDatachain = z.infer<typeof ResolvedDatachainSchema>
```

## Deferred / Open Questions

### From 2026-05-07 review

- **`validate_resolved` is half-deferred — promote to first-class requirement before /ce-plan** (P1, product-lens). The agent-skills success criterion ("LLM-driven skill emits a `ResolvedDatachain`, a reviewer renders it for review") is load-bearing on `validate_resolved` having an explicit shape and behavior. Decisions to make: (a) accepts a `ResolvedDatachain` with `suggested_elements`; (b) runs the full semantic rule set against `schema_snapshot ∪ suggested_elements`; (c) returns the same error envelope as `/validate`; (d) commit polymorphic-vs-separate-endpoint shape (separate-endpoint is the boring default and probably right).
- **Schema-snapshot integrity for retired schema versions — threat-model decision** (P3, security-lens). R9 currently graceful-degrades when a pinned version has been retired (no consistency check), which means a forged `ResolvedDatachain` could backdate fabricated content. Decide whether DTPR's threat model includes forged schema attribution. If yes: the snapshot needs a content-hash binding (build-time SHA-256 over canonical JSON of the schema version's `elements` + `categories`) carried on the artifact and verified while the version is live, plus a consumer-displayable attestation fingerprint. If no: document the trust-boundary decision in `concepts/datachains.md` so consumers don't treat `schema_snapshot` as a provenance guarantee.
