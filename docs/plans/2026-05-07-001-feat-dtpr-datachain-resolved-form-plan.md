---
title: "feat: ResolvedDatachainInstance — strict-superset wire shape with snapshot, suggested elements, and authoring provenance"
type: feat
status: completed
date: 2026-05-07
origin: docs/brainstorms/2026-05-07-dtpr-datachain-instance-resolved-form-brainstorm.md
---

# feat: ResolvedDatachainInstance — strict-superset wire shape with snapshot, suggested elements, and authoring provenance

## Summary

Add `ResolvedDatachainInstance` as a strict structural superset of `DatachainInstanceSchema`, attaching a referenced-subset `schema_snapshot` (full `datachain_type` + lean `categories`/`elements`), an optional `suggested_elements: Element[]` array for LLM-proposed elements, and an optional discriminated-union `authoring_provenance`. Ship two new REST endpoints (`POST /schemas/:version/resolve`, `POST /schemas/:version/validate_resolved`), two sibling MCP tools (`resolve_datachain`, `validate_resolved`), and a snapshot-aware section builder in `@dtpr/ui/core` that drives the existing `<DtprDatachain>` / `<DtprElementDetail>` / `renderDatachainDocument` / MCP `render_datachain` paths additively. The thin `DatachainInstance` contract, `validate` semantics, and existing v2 fixtures stay byte-for-byte unchanged.

(see origin: `docs/brainstorms/2026-05-07-dtpr-datachain-instance-resolved-form-brainstorm.md`)

---

## Problem Frame

DTPR's v2 thin `DatachainInstance` is a pointer shape — every element is `{element_id, variables?, label?, ...}` and consumers must fetch the pinned schema and run `deriveElementDisplay()` themselves to render. Two named consumers have already paved private cow paths around this:

- **hp-app** persists a richer denormalized snapshot per algorithm (full element records inlined per-locale, instance overrides, `ai_generation` provenance, snapshot of the pinned schema's categories) so transparency pages, admin UI, and signage PDFs render without API access. Today this shape is private.
- **DTPR agent skills** (`dtpr-describe-system`, `dtpr-element-design`) produce datachains that may carry LLM-proposed elements not in the pinned schema. `validate` rejects unknown `element_id` references, and authoring-tool draft state is not portable. Reviewers cannot package and swap an AI-authored draft for review before promoting proposed elements to a real schema version.

The brainstorm committed to a sibling `ResolvedDatachainInstance` Zod type — strict structural superset, additive endpoints, additive renderer surface — so the thin contract stays load-bearing for `validate` while the resolved form blesses both consumer paths.

---

## Requirements

All requirement IDs trace to `docs/brainstorms/2026-05-07-dtpr-datachain-instance-resolved-form-brainstorm.md`.

**Two wire forms (additive)**
- R1 — thin `DatachainInstance` shape and `validate` contract preserved → **U1, U5, U6**
- R2 — new `ResolvedDatachainInstance` strict superset with `schema_snapshot`, `suggested_elements`, `authoring_provenance?` → **U1**
- R3 — `ResolvedDatachainInstance → DatachainInstance` is a structural strip when `suggested_elements.length === 0` → **U1, U3**

**Resolve contract**
- R4 — `resolve(thin, schema) → ResolvedDatachainInstance` is pure with stable serialization (round-trip is post-parse equivalence, not byte-identity) → **U3**
- R5 — `POST /schemas/:version/resolve` REST endpoint and `resolve_datachain` MCP tool with `RL_RESOLVE` rate-limit bucket, 512 KB response cap, per-route wall-clock budget (the brainstorm's "1000ms via `limits.cpu_ms`" is structurally inconsistent with Wrangler — see Key Technical Decisions) → **U4, U5, U6**
- R6 — `schema_snapshot.datachain_type` is full; `categories` and `elements` are referenced-subset → **U3**
- R7 — the `resolve` operation (REST + MCP entry points) runs `validate` internally before calling the pure `resolve(thin, schema)` function; the pure function trusts the parsed input and never produces `suggested_elements` → **U3, U5**

**Validate contract**
- R8 — existing `validate` (REST `POST /schemas/:version/validate` + MCP `validate_datachain`) input contract unchanged → **(no-op verification only)**
- R9 — `validate_resolved` is a separate surface that checks placement-id resolution against `schema_snapshot.elements ∪ suggested_elements`, the `suggested ⟹ ai_generated` refinement (R14), the collision rule (R15a), standard semantic rules, and snapshot consistency **only when the pinned version is still served** → **U2, U5, U6**

**Authoring provenance**
- R10 — `AuthoringProvenance` discriminated union on `kind: 'human' | 'ai_generated'`; `source_references` constrained to `https:`/`http:` URLs at the schema layer; render-time escape policy mandatory at every HTML insertion boundary → **U1, U7, U8**
- R11 — `AuthoringProvenance` instance-level only in v1; per-placement override deferred → **U1**
- R12 — `AuthoringProvenance` distinct from `sources`/`ProvenanceRef`; coexist on the same shape → **U1, U8, U10**

**Suggested elements**
- R13 — `suggested_elements` lives on `ResolvedDatachainInstance` only; thin `DatachainInstance` never carries them → **U1, U2**
- R14 — `suggested_elements.length > 0 ⟹ authoring_provenance.kind === 'ai_generated'` (instance-level Zod refinement) → **U1**
- R15 — element-id resolution: `schema_snapshot.elements` first, fall through to `suggested_elements` → **U7**
- R15a — element-id collision is a hard error in `validate_resolved` → **U2**
- R15b — renderers MUST surface a default-on visible "proposed" indicator for fallthrough resolutions → **U7, U8, U9**
- R15c — `<DtprElementDetail>` surfaces an "AI proposal context" expandable section with `rationale` / `variable_rationale`; `confidence` rendered as qualitative low/medium/high; compact `<DtprElement>` carries only the indicator → **U8**
- R15d — rejection / discard flow is operational ("caller discards and re-invokes the skill"); no in-product mutate-suggested-element loop → **(documented in U10)**
- R16 — round-trip is conditional: resolved → thin only when `suggested_elements.length === 0` → **U1, U2**
- R17 — suggested elements use the same `Element` shape; promotion is an array-move via `schema:new` → **(documented in U10)**
- R17a — fork-forever post-promotion lifecycle; persisted artifacts do not auto-rebase → **(documented in U10)**

**Renderer contract**
- R18 — `<DtprDatachain>`, `renderDatachainDocument`, MCP `render_datachain` render `ResolvedDatachainInstance` end-to-end with no further schema fetches; locale stays a caller responsibility → **U7, U9**
- R19 — element-id fallthrough is part of the renderer contract → **U7**

**Documentation**
- R20 — `dtpr-ai/content/en/6.concepts/1.datachains.md` covers both forms, resolve, conditional round-trip, `AuthoringProvenance` position + citation/authoring-telemetry disambiguation, and removes the stale `category_id` example field → **U10**
- R21 — `dtpr-ai/content/en/3.rest/6.validate.md` adds a "See also: resolve" callout → **U11**
- R22 — new `dtpr-ai/content/en/3.rest/10.resolve.md` documents the resolve endpoint → **U11**
- R23 — new `dtpr-ai/content/en/2.mcp/4.tools/10.resolve-datachain.md` documents the MCP tool → **U11**

**Plan-time additions (not in the brainstorm; surfaced by repo research)**
- R24 — sweep stale `category_id` reference from two additional doc files (`3.rest/6.validate.md`, `2.mcp/4.tools/7.validate-datachain.md`) beyond R20's named target → **U11**
- R25 — `validate_resolved` ships as a separate REST endpoint (`POST /schemas/:version/validate_resolved`) and a sibling MCP tool, mirroring `validate_datachain`'s soft-failure semantics; documentation for the new surfaces is part of the same release → **U2, U5, U6, U11**
- R26 — schema-snapshot integrity is **out of scope for v1** (per user decision); `concepts/datachains.md` documents the trust boundary so consumers do not treat `schema_snapshot` as a forgery-resistant attestation → **U10**

---

## Scope Boundaries

- Full-schema (rather than referenced-subset) `categories`/`elements` snapshots
- Locale-resolved render-tier wire shape (`RenderedDatachain`) — code-level only today, formalizing waits for a real consumer
- Content-hashing the resolved artifact (`DTPR-Content-Hash`) — also closes the forged-snapshot integrity gap; reachable additively
- Symbol (icon SVG) inlining in the snapshot; symbols continue to be URL-resolved at render time
- `rebase_resolved(resolved, new_schema_version)` operation; fork-forever is the v1 lifecycle
- Per-placement `AuthoringProvenance` override; instance-level only in v1
- Structural typing for `source_references` (e.g. `{ label, url? }`); v1 keeps `string[]` with URL-scheme refinement
- In-product mutate-a-suggested-element edit loop; rejection is operational
- hp-app's downstream migration to consume `ResolvedDatachainInstance`; out-of-band consumer work
- Frame A type collapse, Frame C content-hashed bundle pinning, "suggested: true" on the thin form, element-id prefix encoding of suggested in the thin form, and any change to `validate`'s thin input/output (all rejected in the brainstorm)
- Schema-snapshot integrity / forged-snapshot threat model — explicitly **out of scope for v1** per user decision; trust-boundary documented in `concepts/datachains.md`. Re-entry path is the deferred content-hash-on-resolved-artifact item above.

### Deferred to Follow-Up Work

- **hp-app shape audit and migration**: hp-app is not reachable from this repo (no sibling worktree, no workspace package). The `AuthoringProvenance.ai_generated` field set ships in v1 with the discriminated-union shape committed and all candidate fields (`rationale`, `confidence`, `source_references`, `variable_rationale`, `model`, `generated_at`) optional. A side-by-side audit against hp-app's persisted artifact happens out-of-band when hp-app is reachable; field-name normalization or required/optional tightening lands in a follow-up if needed.
- **`dtpr-describe-system` and other skill output updates** to emit `ResolvedDatachainInstance` (with `authoring_provenance.kind === 'ai_generated'`) when proposed elements are surfaced. The schema layer ships first; skill `SKILL.md` updates follow in a separate PR so the schema is reviewable independently.

---

## Context & Research

### Relevant Code and Patterns

**Schema layer** (all under `api/src/schema/`):
- `datachain-instance.ts` — `DatachainInstance` (lines 143-181), `InstanceElement` (lines 52-92). Confirmed: `InstanceElementSchema` has no `category_id` field; the brainstorm's "stale field in docs" call is correct. Defaults that defeat byte-identity round-trip: `priority: 0`, `variables: []`, `subchain_instances: []`, `sources: []`, `linked_instance_ids: []`.
- `category.ts`, `element.ts`, `datachain-type.ts`, `locale.ts`, `manifest.ts`, `provenance.ts`, `index.ts` (barrel)
- `emit-json-schema.ts` — `emitAllContentSchemas()` at lines 43-51 emits `Manifest, DatachainType, Category, Element, DatachainInstance`. Add `ResolvedDatachainInstance` and `AuthoringProvenance` here so they ship in `schema_json` and reach the MCP `get_schema` tool. The header comment at line 26 mandates `emitJsonSchema()` for consistency across CLI/REST/MCP.

**API surface**:
- `api/src/rest/routes.ts:375-423` — `POST /schemas/:version/validate` handler. Soft-failure: `ZodError` and semantic failures both return HTTP 200 with `{ ok: false, errors }`. Reuse this convention for `validate_resolved`.
- `api/src/middleware/errors.ts` — `ApiErrorEnvelope`, factories. **`payloadTooLarge` already exists at line 54** — R5's 512 KB cap leans on it.
- `api/src/app.ts:42-110` — middleware stack. Per-route timeouts mounted explicitly per-route (lines 50-99); a wildcard `'*'` mount silently caps the route at the read budget per the inline comment at lines 56-66. Rate-limit binding mount order: line 104 (`RL_VALIDATE` for `/validate`) runs first, then the wildcard `RL_READ` at line 105. New `RL_RESOLVE` mount must be placed **above line 105**.
- `api/src/middleware/timeout.ts:14` — `DEFAULT_VALIDATE_BUDGET_MS = 5_000`. The route's wall-clock budget. Distinct from the Worker-wide CPU ceiling.
- `api/wrangler.jsonc` — `limits.cpu_ms: 500` is **Worker-wide**, not per-route. `RL_VALIDATE` is `30 / 60` (the brainstorm misquoted this as 20).
- `api/src/store/index.ts`, `api/src/rest/version-resolver.ts` — `INDEX_KEY` membership defines whether a pinned version is live. Versions absent from the index are 404. R9's "retired" graceful-degradation keys off this membership (no schema "retired" status enum exists today and adding one would be unnecessary churn).

**MCP**:
- `api/src/mcp/tools.ts:104-121` — `buildToolRegistry(ctx, sessionId)`. New tools slot in here.
- `api/src/mcp/tools.ts:470-561` — `validate_datachain` soft-failure pattern (`toSoftFailureResult(errEnvelope(...))`, `isError: false`).
- `api/src/mcp/tools/render_datachain.ts:30-34, 102-136, 216-233` — `render_datachain` input shape, `buildSections()`, and the `_meta.ui.resourceUri` indirection for HTML output. `resolve_datachain` returns inline JSON in `structuredContent` (matches `validate_datachain`); resolved JSON is bounded at 512 KB so URI indirection costs an extra round-trip with no benefit.
- `api/src/mcp/envelope.ts:13-23, 50-71` — `OkEnvelope` / `ErrEnvelope` / `toToolResult`. Every tool emits both `structuredContent` and `content[].text` for client back-compat.

**Renderer surfaces**:
- `packages/ui/src/core/element-display.ts:61-132` — `deriveElementDisplay()`. Already locale-resolved and category-aware. The wire-shape extension is hidden behind `ElementDisplay`, NOT pushed up into Vue components.
- `packages/ui/src/vue/DtprDatachain.vue:5-24` — accepts `sections: readonly SectionDescriptor[]`. Does not import `DatachainInstance` or `Element` directly. **No Vue API change required** to support `ResolvedDatachainInstance`.
- `packages/ui/src/vue/DtprElement.vue:6-15` — `display: ElementDisplay` prop only. Compact view; carries the proposed indicator.
- `packages/ui/src/vue/DtprElementDetail.vue:12-26, 239-241` — detail view. R15c's "AI proposal context" expandable slots between `<slot name="after-variables" />` and the citation.
- `packages/ui/src/html/document.ts:55-108` — `renderDatachainDocument(sections, options)`. Same story as `<DtprDatachain>` — accepts `RenderedSection[]`, no surgery needed.

**Test infrastructure**:
- `api/test/api/seed.ts` — shared R2 seed harness. Reusable end-to-end for resolve and validate_resolved tests.
- `api/test/api/rest.test.ts:264-339` — REST validate fixtures. Stay valid under the additive plan (success criterion 3).
- `api/test/unit/json-schema-emit.test.ts:30-49` — covers emit keys list and asserts byte-stable emission. Refinement-emit verification (R14) lands here as a new assertion that the emitted `ResolvedDatachainInstanceSchema` carries an `allOf` (or `if-then-else`) constraint expressing the rule.
- `api/test/unit/semantic.test.ts` — pattern for new semantic-rule tests (R15a, R9 snapshot consistency).

### Institutional Learnings

`docs/solutions/` does not exist in this repo — net-new territory for institutional knowledge. After this lands, candidates worth capturing via `/ce-compound`: (1) Zod sibling-schema additive pattern with `z.toJSONSchema` emit verification including `unrepresentable: 'any'` traps; (2) Workers `RL_*` rate-limit bucket addition checklist and middleware mount order; (3) wall-clock vs Worker-wide-CPU budget topology; (4) snapshot-aware section builder pattern; (5) HTML-escape policy for LLM-authored free-text fields.

### External References

External research skipped — local patterns are strong (REST endpoint addition, MCP tool addition, Zod `.extend(...).refine(...)`, renderer extension all have direct exemplars in the repo). Brainstorm cites Zod v4's `z.toJSONSchema` behavior; verification is empirical via the new emit assertion in U1.

---

## Key Technical Decisions

- **Sibling type, additive evolution.** `DatachainInstanceSchema` is unchanged. `ResolvedDatachainInstanceSchema = DatachainInstanceSchema.extend({...}).refine(...).refine(...)`. Rationale per origin (R1, R2): zero v2 consumer breakage and round-trip is a structural strip, not a transformation.

- **Lean subset for `categories`/`elements`; full `datachain_type`.** The snapshot inlines only categories transitively required by the instance's placements plus the categories the required-categories rule (computed from `Category.required === true`, since required-ness lives on each Category record per `api/src/schema/category.ts`, not on a `DatachainType.required_categories` field) pulls in. `datachain_type` is full because it is small and load-bearing for renderer ordering (subchains, locale allow-list). Per origin R6.

- **All locales preserved in snapshot; locale stays a render-time caller responsibility.** Per origin (R18); `deriveElementDisplay()` already does locale resolution downstream. One artifact serves N languages.

- **`suggested_elements` as sibling array, not flag.** Per origin Key Decisions: keeps `schema_snapshot` semantically pure ("pinned schema content as resolved"), makes promotion a literal array-move, and lets element-id fallthrough be the single resolution rule.

- **Single-rule `suggested ⟹ ai_generated`, instance-level only.** Per origin R14 + R11. Two-branch framing was conflating whole-disclosure with per-element attribution.

- **Element-id collision is a hard error.** Per origin R15a. Silent shadowing destroys reviewer signal at exactly the moment it is most needed.

- **`validate_resolved` ships as a separate REST endpoint.** `POST /schemas/:version/validate_resolved` is the boring default. Mirrors `validate_datachain`'s soft-failure semantics. Polymorphic-on-shape `validate` was rejected as it would silently change the existing endpoint's contract under a discriminator branch. (R25 — surfaced during planning per the brainstorm's "Resolve before planning" gate.)

- **`RL_RESOLVE` rate-limit value: 15 req/min, half of `RL_VALIDATE`.** The brainstorm's "ceiling at or below `RL_VALIDATE`'s 20 req/min" was based on an outdated config read. `RL_VALIDATE` is actually 30/60 in `api/wrangler.jsonc:38`. Resolve is roughly 10–100× heavier per request than validate (it bundles a snapshot), so the half-rate ceiling preserves the brainstorm's intent at the actual numbers. `validate_resolved` shares the bucket since both endpoints emit the same heavy shape on the wire.

- **CPU budget vs wall-clock budget topology.** The brainstorm asks for "1000 ms (twice validate's 500 ms) … Wrangler `limits.cpu_ms` plus a Worker `AbortController` enforce". This is structurally inconsistent: Wrangler `cpu_ms` is a Worker-wide ceiling (currently 500 ms in `api/wrangler.jsonc:14-16`), not a per-route value. **Decision:** keep the Worker-wide `cpu_ms: 500` ceiling as-is; set a per-route wall-clock budget of 5000 ms via the existing `timeout` middleware (mirroring `DEFAULT_VALIDATE_BUDGET_MS`), and acknowledge the asymmetry in the resolve REST doc — CPU is bounded by the Worker config, wall-clock by the per-route timeout. Raising the Worker CPU ceiling is out of scope; the additional cost over `validate` is serialization (sorted-key, deterministic ordering) plus snapshot assembly, both of which are I/O-bound on R2 reads, not CPU-bound.

- **512 KB response cap reuses existing `apiErrors.payloadTooLarge`.** Already in `api/src/middleware/errors.ts:54`. No new error envelope needed.

- **"Retired" version status keys off `INDEX_KEY` membership, not a manifest enum.** No `'retired'` status exists in `api/src/schema/manifest.ts:14-16` (current shape: `'beta' | 'stable'`). Adding a third enum value would propagate change across the index emitter and version-resolver. **Decision:** treat "version absent from `INDEX_KEY`" as the retirement signal. The `validate_resolved` snapshot-consistency rule (R9) skips when the pinned version is no longer in `INDEX_KEY`, which gives the brainstorm's graceful-degradation behavior with zero schema enum churn.

- **Schema-snapshot integrity is out of scope for v1.** Per user decision on the brainstorm's "Resolve before planning" threat-model gate. Documented as a trust boundary in `concepts/datachains.md`: consumers MUST NOT treat `schema_snapshot` as a forgery-resistant attestation. Re-entry path is the deferred content-hashed-resolved-artifact item in Scope Boundaries.

- **No `<DtprDatachain>` Vue API change.** The component already accepts `RenderedSection[]`; the wire-shape change is absorbed by the section-builder layer. **Decision:** add a new `buildResolvedSections(resolved, locale)` helper to `@dtpr/ui/core` (sibling to `deriveElementDisplay`) that consumes a `ResolvedDatachainInstance` directly and emits `RenderedSection[]` with the R15 fallthrough rule and R15b's default-on `proposed` indicator. Both MCP `render_datachain` and external `<DtprDatachain>` consumers use the same helper. Cleaner than the brainstorm's "new prop variant / separate component / single entry that branches" framing because it preserves a single component API and keeps the wire-shape concern in `core`.

- **Promoted-element lifecycle: fork-forever.** Per origin R17a. Persisted resolved artifacts stay pinned; re-resolving a thin instance against a new schema version is the path to adopt a promoted element.

---

## Open Questions

### Resolved During Planning

- **`validate_resolved` shape commitment** — separate REST endpoint, sibling MCP tool, mirrors `validate_datachain` soft-failure semantics. Per Key Technical Decisions and R25.
- **CPU/wall-clock budget topology** — wall-clock 5000 ms per-route via timeout middleware; CPU stays at the existing 500 ms Worker-wide ceiling. Per Key Technical Decisions.
- **Retired-version detection** — `INDEX_KEY` membership, not a manifest enum. Per Key Technical Decisions.
- **`<DtprDatachain>` Vue API extension** — none required; new section builder helper in `@dtpr/ui/core`. Per Key Technical Decisions.
- **MCP `resolve_datachain` envelope** — inline JSON in `structuredContent` (mirrors `validate_datachain`); URI indirection rejected because resolved JSON is bounded at 512 KB and the extra round-trip has no offsetting benefit.
- **Doc numbering** — new pages slot at `10.resolve.md` and `11.validate-resolved.md` (REST + MCP) at the end of their respective directories. Renumbering existing 7-9 to keep resolve adjacent to validate is multi-file rename churn with no reader benefit beyond doc-tree ordering.
- **Schema-snapshot integrity threat model** — out of scope for v1; trust boundary documented. Per user decision (option 1).
- **`AuthoringProvenance.ai_generated` field set** — ship discriminated-union shape with all candidate fields optional (`rationale`, `confidence`, `source_references`, `variable_rationale`, `model`, `generated_at`); audit-driven tightening deferred per Scope Boundaries. Agent skills don't currently emit a structured shape (verified), so there is no prior art to reconcile against.

### Deferred to Implementation

- **Refinement → JSON Schema emit verification** — empirical assertion in `api/test/unit/json-schema-emit.test.ts` that the emitted `ResolvedDatachainInstanceSchema` carries an `allOf` / `if-then-else` constraint expressing R14 (`suggested ⟹ ai_generated`). If `unrepresentable: 'any'` silently drops the conditional, the rule moves to the semantic validator path (R9 surface). Either way the wire shape stays unchanged. Lands in U1.
- **Qualitative confidence-bucket thresholds** for R15c (`<0.4` low / `0.4-0.7` medium / `>0.7` high is the strawman) — pick once real agent-skill output distributions are observed. Lands in U8.
- **Sorted-key serializer choice** for R4 deterministic resolve — likely a small in-house `canonicalStringify(value)` over a third-party dep (the only consumer is resolve; `JSON.stringify` does not promise key order). Lands in U3.
- **Exact field name for the proposed indicator badge** in `<DtprElement>` and `<DtprElementDetail>` — visual treatment (badge vs border vs label) chosen during U8 implementation; the requirement is "visible by default."
- **`buildResolvedSections` helper signature** — `(resolved: ResolvedDatachainInstance, locale: string, options?) => RenderedSection[]`. Final option-bag fields land during U7 implementation.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Wire shape relationship

```
DatachainInstance                    ResolvedDatachainInstance (strict superset)
─────────────────────                ──────────────────────────────────
id                                   id
schema_version                       schema_version
created_at                           created_at
elements: InstanceElement[]          elements: InstanceElement[]
priority (default 0)                 priority (default 0)
context_type_id?                     context_type_id?
variables (default [])               variables (default [])
sources (default [])                 sources (default [])
subchain_instances (default [])      subchain_instances (default [])
linked_instance_ids (default [])     linked_instance_ids (default [])
                                  +  schema_snapshot {
                                  +    datachain_type: DatachainType   (full)
                                  +    categories: Category[]          (referenced subset)
                                  +    elements: Element[]             (referenced subset)
                                  +  }
                                  +  suggested_elements: Element[] (default [])
                                  +  authoring_provenance?: AuthoringProvenance
                                  +    | { kind: 'human' }
                                  +    | { kind: 'ai_generated', rationale?, confidence?, ... }
                                  +
                                  +  refine: suggested.length > 0 ⟹ provenance?.kind === 'ai_generated'
                                  +  refine: ∀ s ∈ suggested_elements, ¬∃ e ∈ schema_snapshot.elements where s.id === e.id
```

### Element-id resolution path (R15)

```
                  element_id
                       │
                       ▼
            schema_snapshot.elements
                       │
                  ┌────┴────┐
                hit?      miss?
                  │          │
                  ▼          ▼
      proposed=false   suggested_elements
                            │
                       ┌────┴────┐
                     hit?      miss?
                       │          │
                       ▼          ▼
            proposed=true   error (validate_resolved rejects)
```

### Resolve / validate_resolved request flow

```
POST /schemas/:version/resolve              POST /schemas/:version/validate_resolved
─────────────────────────────────           ──────────────────────────────────────────
1. version-resolver (404 on miss)           1. version-resolver (404 on miss)
2. parse request as DatachainInstance       2. parse request as ResolvedDatachainInstance
   (Zod soft-fail → HTTP 200 + ok:false)       (Zod soft-fail → HTTP 200 + ok:false)
3. semantic validate (existing)             3. validateResolvedInstance:
4. assemble schema_snapshot:                   - placement IDs ∈ snapshot ∪ suggested
   - load DT, categories, elements              (R15)
     from store (existing helpers)            - collision check (R15a)
   - subset categories/elements to             - if version ∈ INDEX_KEY:
     placements + required-categories           snapshot consistency check (R9)
4. canonical-stringify (sorted keys,            - existing semantic rules vs
   deterministic locale + placement              snapshot ∪ suggested
   ordering)                                  - cardinality, required cats, ctx refs
5. enforce 512 KB cap (413 envelope)        4. Soft-fail HTTP 200 + ok:false on errors
6. HTTP 200 + JSON body
```

### Renderer additivity (no Vue API change)

```
ResolvedDatachainInstance ──┐
                    │
                    ▼
       buildResolvedSections(resolved, locale)
       (new in @dtpr/ui/core; sibling to deriveElementDisplay)
                    │  builds element-id Map from snapshot ∪ suggested
                    │  applies R15 fallthrough; tags display.proposed=true on suggested
                    │  attaches resolved.authoring_provenance to each display (R15c)
                    │  honors required-categories ordering from datachain_type
                    ▼
              RenderedSection[]
                    │
            ┌───────┴───────┬──────────────────────────┐
            ▼               ▼                          ▼
   <DtprDatachain>   renderDatachainDocument    MCP render_datachain
   (no API change)   (no API change)            (consumes new helper)
                              │
                              ▼
         h(DtprElementDetail, { display, locale })
            │
            ├─ if display.proposed === true → render visible badge (R15b)
            └─ if display.provenance?.kind === 'ai_generated' →
                 render "AI proposal context" expandable section (R15c)
                   ├─ rationale, variable_rationale: HTML-escaped at boundary
                   ├─ confidence: bucketed to low/medium/high label
                   └─ model, generated_at: optional reviewer metadata
```

---

## Implementation Units

### U1. Add `ResolvedDatachainInstance` Zod schema layer + JSON Schema emit verification

**Goal:** Land `AuthoringProvenanceSchema`, `SchemaSnapshotSchema`, and `ResolvedDatachainInstanceSchema` (with R14 `suggested ⟹ ai_generated` and R15a collision refinements) as a strict superset of `DatachainInstanceSchema`. Verify empirically that `z.toJSONSchema` with `unrepresentable: 'any'` emits the conditional refinement as a well-formed constraint OR document the rule's home in the semantic validator.

**Requirements:** R1, R2, R3, R10, R11, R13, R14, R16

**Dependencies:** none

**Files:**
- Create: `api/src/schema/datachain-instance-resolved.ts`
- Modify: `api/src/schema/index.ts` (barrel export)
- Modify: `api/src/schema/emit-json-schema.ts` (add `ResolvedDatachainInstance` and `AuthoringProvenance` to `emitAllContentSchemas()` at lines 43-51)
- Test: `api/test/unit/datachain-instance-resolved.test.ts`
- Test (extend): `api/test/unit/json-schema-emit.test.ts:30-49` (expected-keys list + new refinement-emit assertion)

**Approach:**
- `AuthoringProvenanceSchema` is a `z.discriminatedUnion('kind', [...])` with `'human'` (marker only) and `'ai_generated'` (all candidate fields optional per Scope Boundaries — `rationale`, `confidence` clamped `0..1`, `source_references` array of URLs constrained by a `.refine` to `https:`/`http:` schemes, `variable_rationale` record, `model`, `generated_at` ISO datetime).
- `SchemaSnapshotSchema` carries `datachain_type: DatachainTypeSchema` (full), `categories: z.array(CategorySchema)`, `elements: z.array(ElementSchema)`.
- `ResolvedDatachainInstanceSchema = DatachainInstanceSchema.extend({ schema_snapshot, suggested_elements: z.array(ElementSchema).default([]), authoring_provenance: AuthoringProvenanceSchema.optional() }).refine(R14).refine(R15a)`.
- Every field carries `.describe(...)` per the repo convention asserted in `api/test/unit/json-schema-emit.test.ts:22-28`.
- New emit assertion: parse the emitted JSON Schema, walk it for an `allOf` (or `if/then/else`) member whose effect is "if `suggested_elements.length > 0` then `authoring_provenance.kind === 'ai_generated'`". If absent — Zod silently dropped the refinement under `unrepresentable: 'any'` — flag clearly, leave the Zod refinement in place (it still runs at parse time), and route the runtime enforcement through `validate_resolved`'s semantic path in U2 instead. Either way the wire shape and parse-time behavior are unchanged.

**Patterns to follow:**
- Discriminator + describe convention: `api/src/schema/provenance.ts:20-58`
- `.extend(...)` chaining on a `.describe`'d base: not yet in use; verify behavior in test
- Emit-list update: `api/src/schema/emit-json-schema.ts:43-51`

**Test scenarios:**
- Happy path: parsing a thin `DatachainInstance` literal through `ResolvedDatachainInstanceSchema` rejects (missing `schema_snapshot`) — strict superset is enforced.
- Happy path: parsing a literal with `schema_snapshot` and empty `suggested_elements` succeeds without `authoring_provenance` (R14's antecedent is false).
- Happy path: parsing a literal with non-empty `suggested_elements` and `authoring_provenance: { kind: 'ai_generated' }` succeeds.
- Edge case: `suggested_elements.length === 0` with `authoring_provenance: { kind: 'human' }` succeeds (R14 is implication, not biconditional).
- Edge case: `source_references: ['https://example.com']` succeeds; `['ftp://example.com']`, `['javascript:alert(1)']`, `['data:text/html,foo']` all reject at the schema layer.
- Edge case: `confidence: 0`, `confidence: 1` succeed; `confidence: -0.1`, `confidence: 1.1` reject.
- Error path: non-empty `suggested_elements` with `authoring_provenance: { kind: 'human' }` rejects on R14.
- Error path: non-empty `suggested_elements` with `authoring_provenance` undefined rejects on R14.
- Error path: collision rule (R15a) — `schema_snapshot.elements: [{ id: 'foo', ... }]`, `suggested_elements: [{ id: 'foo', ... }]` rejects with the path `['suggested_elements']`.
- Round-trip equivalence (R3, R4): parsing a `ResolvedDatachainInstance`, omitting the three new fields, and parsing as `DatachainInstance` yields a value equivalent (post-parse, post-default-population) to a directly-parsed thin `DatachainInstance` of the same elements.
- JSON Schema emit (R13): the emitted `schema_json` includes `ResolvedDatachainInstance` and `AuthoringProvenance` as top-level keys.
- JSON Schema emit refinement assertion: walk the emitted `ResolvedDatachainInstance` schema for the R14 conditional. PASS if present (record the JSON Schema shape used). FAIL — flag clearly, the Zod refinement still runs, U2 picks up runtime enforcement.

**Verification:**
- Existing `api/test/unit/json-schema-emit.test.ts` byte-stability assertion still passes for the unchanged shapes.
- New tests pass.
- `pnpm -w typecheck` clean.

---

### U2. Semantic validator for `ResolvedDatachainInstance` (collision, fallthrough, snapshot consistency)

**Goal:** Add `validateResolvedInstance(resolved, schema?)` that runs the R15 fallthrough resolution, the R15a collision rule, and the R9 snapshot-consistency check (only when the pinned version is in `INDEX_KEY`), plus the existing semantic rules adapted to operate against `schema_snapshot.elements ∪ suggested_elements`. This is the runtime backstop if Zod's JSON-Schema emit dropped the R14 refinement under `unrepresentable: 'any'`.

**Requirements:** R9, R13, R14, R15, R15a, R16, R25

**Dependencies:** U1

**Files:**
- Modify: `api/src/validator/semantic.ts` (new exported `validateResolvedInstance`)
- Create: `api/src/validator/rules/element-id-collision.ts` (R15a)
- Create: `api/src/validator/rules/snapshot-consistency.ts` (R9 — diffs `schema_snapshot.{categories, elements, datachain_type}` against the live store load when version is in `INDEX_KEY`)
- Modify: `api/src/validator/rules/element-resolution.ts` or create a new `resolved-element-resolution.ts` (R15 fallthrough)
- Test: `api/test/unit/validator-resolved.test.ts`

**Approach:**
- Build the lookup map once: `Map<id, { element: Element, source: 'snapshot' | 'suggested' }>`. Snapshot wins on collision but the validator detects collision before traversal so the order does not matter for behavior — only for error-path defense.
- Snapshot consistency check (R9): if `version ∈ INDEX_KEY`, load the canonical `categories`, `elements`, `datachain_type` from the store and compare structurally to `schema_snapshot`. Mismatch is a `snapshot_drift` error. If `version ∉ INDEX_KEY`, skip the check (graceful degradation per R9). The trust-boundary doc note at U10 makes this surface explicit to consumers.
- The existing semantic rules (cardinality, required categories, context refs) operate against the merged element pool; reuse the rule-runner harness at `api/src/validator/semantic.ts` and pass the merged pool.
- `validate_resolved` REST/MCP entry points (U5, U6) call: Zod parse → `validateResolvedInstance` → soft-failure envelope on error.

**Patterns to follow:**
- Existing rule files in `api/src/validator/rules/` for the rule-callback shape
- `api/src/validator/semantic.ts` for the rule-runner harness
- `api/src/store/index.ts` for `INDEX_KEY` membership lookup (semantic.ts can take the schema-load function as a dependency injection point so unit tests don't need R2)

**Test scenarios:**
- Happy path: `validateResolvedInstance(resolved)` returns `{ ok: true }` for a well-formed resolved with empty `suggested_elements` and a snapshot matching the live store.
- Happy path: same but with `suggested_elements` and `authoring_provenance: { kind: 'ai_generated' }`; placement IDs that resolve into `suggested_elements` are accepted.
- Edge case: a placement element_id that exists only in `suggested_elements` (not in `schema_snapshot.elements`) resolves under R15 fallthrough.
- Edge case: snapshot consistency skipped when `INDEX_KEY` does not list the pinned version (graceful degradation per R9). Test by stubbing the version-list dependency.
- Edge case: collision (R15a) `schema_snapshot.elements: [{id: 'foo'}]`, `suggested_elements: [{id: 'foo'}]` returns a `collision` error; verify the error path includes `suggested_elements` and the colliding id.
- Error path: a placement element_id absent from both `schema_snapshot.elements` and `suggested_elements` returns an `unknown_element_id` error.
- Error path: snapshot drift — `schema_snapshot.elements[0]` has different `title` than the live-store element with the same id while `version ∈ INDEX_KEY` returns a `snapshot_drift` error.
- Error path: a placement category_id (computed from element) not in `schema_snapshot.categories` returns a `missing_required_category` error (existing rule behavior, vs the merged pool).
- Error path: required-categories rule violation — an instance missing a required category (any `Category` where `category.required === true`) fails. (Reuses the existing `checkInstance` rule path at `api/src/validator/rules/instance.ts:39-58`, now operating against the snapshot's `categories` plus `datachain_type` ordering.)
- Integration: round trip with U1 — Zod parse + `validateResolvedInstance` returns `ok: true` for the canonical fixture.

**Verification:**
- Existing semantic tests (`api/test/unit/semantic.test.ts`) pass unchanged.
- New tests pass.

---

### U3. `resolve(thin, schema)` — deterministic snapshot assembler

**Goal:** Implement the pure `resolve(thin: DatachainInstance, schema: SchemaContext) → ResolvedDatachainInstance` function with stable serialization (sorted object keys, deterministic locale ordering, deterministic placement ordering inside `schema_snapshot.elements`/`schema_snapshot.categories`). Round-trip: `resolve(thin_parsed, schema) → strip(['schema_snapshot', 'suggested_elements', 'authoring_provenance']) → re-parse` yields the same parsed `DatachainInstance` value.

**Requirements:** R3, R4, R6, R7

**Dependencies:** U1

**Files:**
- Create: `api/src/resolver/resolve.ts`
- Create: `api/src/resolver/canonical-stringify.ts` (sorted-key JSON serializer for cap-check + determinism)
- Test: `api/test/unit/resolver.test.ts`
- Test: `api/test/unit/canonical-stringify.test.ts`

**Approach:**
- Input is an already-Zod-parsed thin `DatachainInstance` (R7: resolve runs validate first; the REST/MCP entry points in U5/U6 enforce that ordering). Resolve does not run validate itself — it trusts the parsed input.
- Walk `instance.elements` to compute the referenced element-id set and the referenced category-id set (each placement's element's `category_id` plus every `category` where `category.required === true`, matching the existing `checkInstance` rule at `api/src/validator/rules/instance.ts:39-58` per R6).
- Subset `elements` and `categories` from the `schema` argument by membership; preserve all locales as-is.
- Sort: `categories` by `id` ascending; `elements` by `id` ascending; locales within each `LocaleValueArray` by the locale code's position in `manifest.locales`. Object keys via `canonicalStringify`.
- Resolve never produces `suggested_elements` (R7); the field stays at default `[]`.
- `authoring_provenance` is not set by resolve; it only enters `ResolvedDatachainInstance` when an authoring tool produces a resolved form directly.
- `canonicalStringify(value)`: depth-first stringify with `Object.keys(value).sort()` at every object boundary, arrays preserved in input order. Keep it small (~30 LOC) so consumers don't have to pull a third-party canonical-JSON dep. **Always operates on the post-Zod-parsed value, never on raw author bytes** — Zod default population (`priority: 0`, `variables: []`, etc.) is the canonicalization input, so two thin instances differing only in elided defaults produce byte-identical resolved bundles.

**Patterns to follow:**
- Existing store-load helpers in `api/src/store/` for category/element retrieval
- Pure-function placement: sibling to `api/src/validator/`

**Test scenarios:**
- Happy path: resolve a thin instance referencing two elements across two categories yields a `ResolvedDatachainInstance` with snapshot containing exactly those two elements + two categories + the full datachain-type.
- Happy path: required-categories rule (R6) — schema declares `Category { id: 'cat-a', required: true, ... }`; instance places no elements in `cat-a`. Snapshot still includes `cat-a` because the rule pulls in every required category regardless of placement.
- Edge case: instance with no placements yields a snapshot with empty `categories`/`elements` and the full `datachain_type`. (Behavior under degenerate input is well-defined.)
- Edge case: locale ordering — schema declares `manifest.locales: ['en', 'fr']`; element has locales declared in `[fr, en]` order. After resolve, the locale array within each element is `[en, fr]` regardless of input order.
- Edge case: object-key ordering — running resolve twice on the same parsed input produces structurally-equivalent values that `canonicalStringify` to byte-identical strings.
- Edge case: default-population determinism — two thin inputs differing only in elided Zod defaults (e.g., one with `priority: 0` written explicitly, one omitting `priority` entirely) produce byte-identical resolved bundles after `parse → resolve → canonicalStringify`. Defends the contract that hash-stable downstream consumers (caches, audit logs) see one identity per logical instance.
- Round-trip equivalence (R3, R4): `parse(thin) → resolve → strip → parse` equals `parse(thin)`. (Stronger byte-identity vs raw author bytes is explicitly NOT promised — Zod default population breaks it.)
- Error path: resolve called with `instance.elements[0].element_id` not present in `schema.elements` throws or returns an error envelope. (Caller responsibility per R7 is to validate first; this is a defensive guard for the programming-error case, not the user-input path.)
- Integration with U1: canonical-stringify of a resolved fixture is bounded under 512 KB for representative datachains (also the cap input for U5).

**Verification:**
- New tests pass.
- Determinism test: 100 runs of the same input produce the same stringified output.

---

### U4. `RL_RESOLVE` Wrangler binding + middleware mount layer

**Goal:** Add a new unsafe rate-limit binding `RL_RESOLVE` in `api/wrangler.jsonc` and wire it into the middleware stack ahead of the wildcard `RL_READ` so resolve and `validate_resolved` consume the dedicated bucket first.

**Requirements:** R5, R25

**Dependencies:** none (independent of schema work; can land first or in parallel)

**Files:**
- Modify: `api/wrangler.jsonc` (add `RL_RESOLVE` to `unsafe.bindings` for prod and preview)
- Modify: `api/src/app.ts` (mount `rateLimit({ binding: 'RL_RESOLVE' })` for `/api/v2/schemas/:version/resolve` and `/api/v2/schemas/:version/validate_resolved` — both above the wildcard `RL_READ` mount at line 105)
- Modify: `api/src/middleware/rate-limit.ts` if the rate-limiter assumes specific binding names (read first; likely binding-string-only)
- Modify: `api/src/types.ts` or wherever `Bindings` lives so `RL_RESOLVE` is typed
- Test: `api/test/api/rate-limit.test.ts` if it exists; else add coverage for resolve in `api/test/api/rest.test.ts` (U5)

**Approach:**
- Bucket sizing: `limit: 15, period: 60` — half of `RL_VALIDATE`'s `30 / 60`. `validate_resolved` shares the bucket because the response shape is symmetric and the 10-100× heavier-than-validate cost applies to both.
- Namespace IDs: `1003 / 2003` (next free after `1002 / 2002` for `RL_VALIDATE`). Verify no collision with existing namespace allocations.
- Mount order: per the in-file pattern at `api/src/app.ts:104-106`, `app.use('<path>', ...)` runs in declaration order; `RL_RESOLVE` mounts must precede the `app.use('/api/v2/*', rateLimit({ binding: 'RL_READ' }))` line.

**Patterns to follow:**
- Existing `RL_VALIDATE` binding shape in `api/wrangler.jsonc`
- Existing rate-limit mount lines in `api/src/app.ts:104-106`

**Test scenarios:**
- Happy path: 15 successive resolve requests within 60s succeed; the 16th returns the rate-limited envelope.
- Edge case: a resolve request and a `validate_resolved` request together count against the same bucket.
- Edge case: resolve does not consume the `RL_VALIDATE` bucket. (Send 15 resolve + 30 validate within 60s; both succeed.)
- Note: the rate-limiter middleware itself is unchanged by this unit; existing tests cover its mechanics. New coverage is the binding and routing.

**Verification:**
- `pnpm -w build` produces a Wrangler config that passes `wrangler --dry-run` validation.
- Local Wrangler dev with the new binding starts cleanly.

---

### U5. REST endpoints `POST /schemas/:version/resolve` + `POST /schemas/:version/validate_resolved`

**Goal:** Wire the resolve and validate_resolved handlers in `api/src/rest/routes.ts` and mount their per-route timeouts in `api/src/app.ts`. Both endpoints follow the existing `validate` pattern (soft-failure HTTP 200 on parse/semantic errors) and apply the 512 KB response cap (resolve only; validate_resolved returns small `ok:false` envelopes on miss and a small `ok:true` envelope on success).

**Requirements:** R5, R7, R9, R25

**Dependencies:** U1 (schemas), U2 (validator), U3 (resolve fn), U4 (rate-limit binding)

**Files:**
- Modify: `api/src/rest/routes.ts:279-516` (add two route handlers in `createRestApp()`)
- Modify: `api/src/app.ts:50-99` (mount per-route timeout for both new endpoints, mirroring `validate`'s pattern)
- Test: `api/test/api/rest.test.ts` (extend the `validate` test cluster with resolve and validate_resolved cases)

**Approach:**
- Handlers reuse the validate handler's pre-flight: `resolveKnownVersion` → 404 envelope on miss; JSON parse → `bad_request` 400 on failure; Zod parse → soft-failure HTTP 200 on `ZodError` (R8 contract preserved).
- Resolve flow: thin Zod parse → existing `validateInstance` (semantic) → `resolve(thin, schemaCtx)` → `canonicalStringify` → byte-length check against `512 * 1024`. If over the cap, return `apiErrors.payloadTooLarge('resolved bundle exceeds 512 KB cap')` envelope with HTTP 413.
- Validate_resolved flow: `ResolvedDatachainInstanceSchema.parse` → `validateResolvedInstance` → soft-failure envelope on error; HTTP 200 on success.
- Per-route timeout mount: 5000 ms wall-clock via the existing `timeoutMiddleware`. Mounted explicitly per-route (per the `app.ts:56-66` comment about wildcard pitfalls).
- Both handlers use `loadCtx(c)` for R2 + execution context (existing pattern).

**Patterns to follow:**
- `api/src/rest/routes.ts:375-423` — validate handler shape, soft-failure envelope, error envelope helpers
- `api/src/app.ts:64-99` — per-route timeout mount pattern
- `api/src/middleware/errors.ts:54` — `payloadTooLarge` envelope factory

**Test scenarios:**
- Happy path: resolve a known thin fixture; response status 200, body parses as `ResolvedDatachainInstance`, contains `schema_snapshot`/`suggested_elements: []`/no `authoring_provenance`.
- Happy path: validate_resolved a known good resolved fixture; response status 200, body `{ ok: true }`.
- Edge case: resolve returns a snapshot with `categories.length` matching the lean-subset rule (R6); explicit assertion against the placement set.
- Edge case: 413 cap — resolve a fixture engineered to exceed 512 KB (e.g., schema with 10 categories × 1000 elements × 6 locales). Response status 413, body `apiErrors.payloadTooLarge` envelope.
- Error path: resolve with a thin fixture that fails semantic validate returns soft-failure HTTP 200 with the same error envelope as `/validate` would (R7 contract).
- Error path: resolve against an unknown version returns 404 with `apiErrors.notFound` envelope.
- Error path: validate_resolved with a `ResolvedDatachainInstance` carrying `suggested_elements` colliding with snapshot returns soft-failure HTTP 200 with R15a error.
- Error path: validate_resolved with `suggested_elements` non-empty and no `authoring_provenance` returns soft-failure HTTP 200 with R14 error.
- Edge case: validate_resolved against a version absent from `INDEX_KEY` skips the snapshot-consistency check (R9 graceful degradation); other rules still apply.
- Integration: existing `validate` REST tests at `api/test/api/rest.test.ts:264-339` continue to pass byte-for-byte (success criterion 3).
- Integration: rate-limit interaction — 15 resolve requests succeed; the 16th returns rate-limited envelope. (Covers U4's wiring through the route.)
- **Covers AE: success criterion 3** (existing v2 validate fixtures parse and validate without modification).

**Verification:**
- `pnpm -F @dtpr/api test` passes.
- Manual `curl` against local Wrangler dev returns the expected envelopes.

---

### U6. MCP tools `resolve_datachain` and `validate_resolved`

**Goal:** Sibling MCP tools to `validate_datachain` and `render_datachain`, mirroring the soft-failure semantics from `validate_datachain` and the inline-`structuredContent` envelope.

**Requirements:** R5, R7, R8, R9, R25

**Dependencies:** U1, U2, U3, U5 (REST handlers establish the canonical flow; MCP reuses the same internal helpers)

**Files:**
- Create: `api/src/mcp/tools/resolve_datachain.ts`
- Create: `api/src/mcp/tools/validate_resolved.ts`
- Modify: `api/src/mcp/tools.ts:104-121` (add to `buildToolRegistry`)
- Test: `api/test/api/mcp/resolve_datachain.test.ts`
- Test: `api/test/api/mcp/validate_resolved.test.ts`

**Approach:**
- Both tools share the request-parse + version-resolution pre-flight with `validate_datachain` (`api/src/mcp/tools.ts:470-561`); extract a shared helper if duplication exceeds two cases.
- `resolve_datachain` input schema: `{ version: string, datachain: unknown }`. Output: `OkEnvelope<ResolvedDatachainInstance>` with the resolved JSON inline in `structuredContent` and the same payload mirrored in `content[].text` (envelope back-compat per `api/src/mcp/envelope.ts:1-11`).
- `validate_resolved` input schema: `{ version: string, datachain: unknown }`. Output: `OkEnvelope<{ valid: true }>` on success; `toSoftFailureResult(errEnvelope(...))` with `isError: false` on validation failure, mirroring `validate_datachain`'s posture.
- 512 KB cap on `resolve_datachain` follows the REST handler's check (U5); over-cap returns the same error envelope.
- The MCP envelope already carries `meta.budget_ms` / similar metadata patterns; mirror what `validate_datachain` emits.

**Patterns to follow:**
- `api/src/mcp/tools.ts:470-561` — `validate_datachain` envelope and soft-failure pattern
- `api/src/mcp/envelope.ts:50-71` — `toToolResult` dual-emit (`structuredContent` + `content[].text`)
- `api/test/api/mcp/render_datachain.test.ts` — MCP tool test fixtures, seeding pattern

**Test scenarios:**
- Happy path: `resolve_datachain` against a known thin fixture returns `OkEnvelope<ResolvedDatachainInstance>` with `structuredContent.data` parseable as `ResolvedDatachainInstance` and `content[0].text` carrying the same JSON.
- Happy path: `validate_resolved` against a known good resolved fixture returns `OkEnvelope<{ valid: true }>`.
- Error path: `resolve_datachain` with a Zod-failing input returns soft-failure (`isError: false`, error envelope in result); the older-protocol `content[]` text mirrors the structured payload.
- Error path: `validate_resolved` with R15a collision input returns soft-failure with the collision error in the envelope's `errors[]`.
- Error path: `resolve_datachain` against unknown version returns soft-failure with the same `notFound` envelope as REST.
- Edge case: `resolve_datachain` 413-equivalent — when the resolved bundle exceeds 512 KB, the soft-failure envelope carries a typed payload-too-large error code (no HTTP semantics in MCP, so the envelope code is the contract).
- Integration: tool registry membership — `buildToolRegistry` includes `resolve_datachain` and `validate_resolved` alongside the existing 9 tools.

**Verification:**
- `pnpm -F @dtpr/api test` passes (MCP test cluster).

---

### U7. UI core: extend `ElementDisplay`, add `buildResolvedSections` snapshot-aware section builder

**Goal:** Add `proposed?: boolean` and `provenance?: AuthoringProvenance` to `ElementDisplay` (additive, all existing callers ignore the new optional fields) and ship a new `buildResolvedSections(resolved, locale, options?)` helper in `@dtpr/ui/core` that consumes a `ResolvedDatachainInstance` and emits `RenderedSection[]` with the R15 fallthrough rule and R15b's default-on `proposed` indicator.

**Requirements:** R10, R12, R15, R15b, R18, R19

**Dependencies:** U1 (schemas exported; `ResolvedDatachainInstance` and `AuthoringProvenance` types reachable from `@dtpr/ui` either by re-export or by sibling type definition)

**Files:**
- Modify: `packages/ui/src/core/element-display.ts:61-132` (extend `ElementDisplay` type with `proposed?` and `provenance?`)
- Modify: `packages/ui/src/core/types.ts` or equivalent re-export barrel (surface `AuthoringProvenance` and `ResolvedDatachainInstance` types — types only; the Zod runtime stays in `@dtpr/api`)
- Create: `packages/ui/src/core/build-resolved-sections.ts`
- Test: `packages/ui/test/core/element-display.test.ts` (extend if exists)
- Test: `packages/ui/test/core/build-resolved-sections.test.ts`

**Approach:**
- `ElementDisplay` extension is type-only; no runtime change to `deriveElementDisplay()`.
- `buildResolvedSections(resolved, locale, options?)`:
  - Build `Map<element_id, { element: Element, source: 'snapshot' | 'suggested' }>` from `resolved.schema_snapshot.elements` then `resolved.suggested_elements` (snapshot first; collisions are caller responsibility — `validate_resolved` already rejected them, but the helper is defensive: snapshot wins).
  - Walk `resolved.elements` placements; resolve each via the map.
  - Per placement, compute `display = deriveElementDisplay(def, placement, locale, { category })` then merge `display.proposed = (source === 'suggested')` and `display.provenance = resolved.authoring_provenance`.
  - Bucket by `category_id`; preserve `datachain_type.categories` declared order.
  - Emit `RenderedSection[]` matching the existing `buildSections` output shape in `api/src/mcp/tools/render_datachain.ts:102-136` so downstream rendering is identical.
- `options?: { proposedIndicator?: boolean }` defaults to `true` per R15b ("default-on").
- Type re-export: `@dtpr/ui` consumers should not need to install `@dtpr/api`; ship the `AuthoringProvenance` and `ResolvedDatachainInstance` types from `@dtpr/ui/core` as `import type` re-exports (workspace-relative). If that creates a dependency loop, ship a structural type local to `@dtpr/ui/core` whose shape is asserted-equal to the API type via a typecheck-only test.

**Patterns to follow:**
- `packages/ui/src/core/element-display.ts:61-132` — the existing locale-resolved derivation
- `api/src/mcp/tools/render_datachain.ts:102-136` — existing `buildSections` for the section-building shape

**Test scenarios:**
- Happy path: a `ResolvedDatachainInstance` with two snapshot elements, no suggested, returns two `RenderedSection`s; every `display.proposed === false`; `display.provenance === undefined`.
- Happy path: a `ResolvedDatachainInstance` with one snapshot + one suggested element + `authoring_provenance: { kind: 'ai_generated', rationale: 'foo' }` returns sections where `display.proposed === false` for the snapshot element and `display.proposed === true` for the suggested element; both carry the same `display.provenance`.
- Edge case: `options.proposedIndicator: false` opt-out — `display.proposed` is `false` on suggested elements (caller-controlled override). R15b's default-on requirement is preserved because the parameter is opt-out, not opt-in.
- Edge case: locale fallthrough — locale not in the element's `LocaleValueArray`; `deriveElementDisplay` falls back per existing semantics; `buildResolvedSections` does not interfere.
- Edge case: collision (snapshot wins) — the helper does not enforce R15a (validator's job); on collision input the snapshot's element record is used. Defensive behavior, not a contract.
- Edge case: required-categories ordering — `datachain_type.categories` declared order is honored in the section output even when `instance.elements[]` declares placements out-of-order; required-vs-optional status comes from each `Category.required` flag.
- Error path: a placement element_id that resolves into neither map raises an explicit error (defensive; in production this case is caught by `validate_resolved` upstream).
- Integration: feed the helper output into `renderDatachainDocument` (existing) and assert the rendered HTML contains both elements. (Light integration; main HTML-shape test lives in U8.)

**Verification:**
- `pnpm -F @dtpr/ui test` passes.
- `pnpm -w typecheck` clean across api + ui workspaces.

---

### U8. Vue components — `<DtprElement>` proposed indicator + `<DtprElementDetail>` AI-proposal-context section

**Goal:** Wire the R15b "proposed" indicator (default-on) in `<DtprElement>` and the R15c "AI proposal context" expandable section in `<DtprElementDetail>`. Apply HTML-escape policy for all free-text `AuthoringProvenance` fields (R10) at the rendering boundary. Render `confidence` as a qualitative low/medium/high label, not a raw decimal.

**Requirements:** R10, R12, R15b, R15c

**Dependencies:** U7 (`ElementDisplay` carries `proposed` + `provenance`)

**Files:**
- Modify: `packages/ui/src/vue/DtprElement.vue:6-15` (proposed indicator template branch)
- Modify: `packages/ui/src/vue/DtprElementDetail.vue:12-26, 239-241` (AI proposal context expandable, slotted between `<slot name="after-variables" />` and citation)
- Create: `packages/ui/src/core/confidence-bucket.ts` (`bucketConfidence(value: number): 'low' | 'medium' | 'high'` with thresholds `<0.4` low, `0.4-0.7` medium, `>0.7` high — strawman; see Open Questions / Deferred to Implementation)
- Test: `packages/ui/test/vue/DtprElement.test.ts` (extend)
- Test: `packages/ui/test/vue/DtprElementDetail.test.ts` (extend)
- Test: `packages/ui/test/core/confidence-bucket.test.ts`

**Approach:**
- `<DtprElement>` template: conditional badge on `display.proposed`. Visual treatment is the implementer's call (deferred per Open Questions); requirement is "visible by default" per R15b.
- `<DtprElementDetail>` template: when `display.provenance?.kind === 'ai_generated'`, render an expandable `<details>`/`<summary>` section labeled "AI proposal context" containing:
  - `rationale` (escaped at boundary; if Markdown is applied, route through a sanitizing processor that strips raw HTML — `marked` + `DOMPurify`-equivalent pattern, depending on what's already in `packages/ui`)
  - `variable_rationale` entries (each value escaped)
  - `confidence` rendered as `bucketConfidence(value)` label
  - `model`, `generated_at` as plain reviewer metadata at the bottom of the section
- Vue `<DtprElement>` carries only the indicator (R15c: compact view does not surface provenance detail).
- Escape policy: prefer Vue's built-in `{{ ... }}` interpolation (auto-escapes); never use `v-html` on `rationale` / `variable_rationale` values. If Markdown is intentionally rendered, do it via the same path the existing `descriptionHtml` prop uses (verify that path's sanitization behavior during implementation; flag if it does not strip raw HTML).

**Patterns to follow:**
- Existing `<DtprElementDetail>` slot/section shape at lines 239-241
- Existing `descriptionHtml` prop's render path for the markdown-with-sanitization decision

**Test scenarios:**
- Happy path: `<DtprElement>` renders without the proposed indicator when `display.proposed` is `undefined` or `false`.
- Happy path: `<DtprElement>` renders the proposed indicator when `display.proposed === true`.
- Happy path: `<DtprElementDetail>` does not render the AI proposal context section when `display.provenance` is `undefined`.
- Happy path: `<DtprElementDetail>` renders the section when `display.provenance.kind === 'ai_generated'` with a `rationale`.
- Edge case: `<DtprElementDetail>` does NOT render the section when `display.provenance.kind === 'human'` (the human marker is reviewer-explicit but does not produce a render surface).
- Edge case: `confidence` qualitative buckets — `0.0` → low, `0.39` → low, `0.4` → medium, `0.7` → medium, `0.71` → high, `1.0` → high (strawman thresholds; revisit per Deferred to Implementation).
- Error path: `rationale` containing `<script>alert(1)</script>` renders as visible escaped text, not as an executing script tag. Snapshot the rendered HTML and assert the string is present in escaped form.
- Error path: `variable_rationale` value containing `<img src=x onerror=alert(1)>` is HTML-escaped. Same assertion.
- Error path: when the rendering path applies Markdown, raw HTML in `rationale` is stripped (depends on the existing sanitization library — flag the asserted behavior in the test).
- Integration: feed a resolved fixture through `buildResolvedSections` (U7) → `<DtprDatachain>` → assert the rendered DOM contains both proposed indicators and AI-proposal-context sections in the expected positions.

**Verification:**
- `pnpm -F @dtpr/ui test` passes.
- Visual smoke: a fixture page in the studio or the Nuxt content site renders correctly with the new surfaces.

---

### U9. MCP `render_datachain` accepts `ResolvedDatachainInstance`

**Goal:** Extend the MCP `render_datachain` tool to accept either a thin `DatachainInstance` (existing) or a `ResolvedDatachainInstance` (new). When given a resolved input, skip the schema fetch and use `buildResolvedSections` (U7) directly.

**Requirements:** R18, R19

**Dependencies:** U1, U7

**Files:**
- Modify: `api/src/mcp/tools/render_datachain.ts:30-34, 102-136`
- Test: `api/test/api/mcp/render_datachain.test.ts` (extend)

**Approach:**
- Input schema becomes a discriminated union or an unknown that the handler tries to parse as `ResolvedDatachainInstance` first, falling back to `DatachainInstance`. **Recommended:** add an explicit input shape signal — `{ version, datachain, locale }` where `datachain` is `unknown`; try `ResolvedDatachainInstanceSchema.safeParse(datachain)` first; if success, branch to `buildResolvedSections(resolved, locale)`; if failure, fall through to the existing thin-input path. Document the precedence in the tool description so MCP clients are not surprised.
- When the input is resolved, no R2 schema load is required (the snapshot is self-contained per R18). Skips `loadCtx` for the schema-fetch path; the handler still needs `sessionId` and `setDatachainHtml`.
- HTML output is identical in shape to the thin-input path (same `RenderedSection[]` → `renderDatachainDocument` pipeline).

**Patterns to follow:**
- Existing `render_datachain` handler shape (input parse, section build, render, store HTML, return `_meta.ui.resourceUri`)

**Test scenarios:**
- Happy path: thin-input call still works byte-identically against an existing fixture. (Backward compat.)
- Happy path: resolved-input call returns the `_meta.ui.resourceUri` and the stored HTML matches what a thin-input call against the same underlying placements would produce (modulo proposed indicators and provenance sections, which the thin-input path does not produce).
- Edge case: resolved-input call with `suggested_elements` non-empty produces HTML containing the proposed indicator for the suggested element.
- Edge case: input is neither valid thin nor valid resolved (a totally bogus shape) returns the existing soft-failure error envelope.
- Edge case: input is valid against BOTH schemas — the resolved path is preferred (precedence rule). Test: an input that strictly matches `DatachainInstance` (no extra fields) parses thin. An input that adds `schema_snapshot` parses resolved.
- Integration: locale flow — `locale` parameter is honored regardless of input shape; reuse the existing locale-flow tests against the resolved-input case.

**Verification:**
- `pnpm -F @dtpr/api test` passes including the new MCP `render_datachain` cases.

---

### U10. Concept docs — `dtpr-ai/content/en/6.concepts/1.datachains.md`

**Goal:** Update the canonical concepts doc to describe both wire forms, the resolve operation, the conditional round-trip rule, the position of `AuthoringProvenance` (with the citation-vs-authoring-telemetry disambiguation), the trust-boundary statement on `schema_snapshot` integrity (per the user decision), the fork-forever post-promotion lifecycle, and the rejection / discard flow. Remove the stale `category_id` field from the existing example.

**Requirements:** R10, R11, R12, R15d, R16, R17, R17a, R20, R26

**Dependencies:** U1 (the schemas exist and can be linked to from the doc)

**Files:**
- Modify: `dtpr-ai/content/en/6.concepts/1.datachains.md`

**Approach:**
- The thin form is still introduced first; the resolved form is positioned as the persisted, render-ready, optionally-LLM-authored sibling.
- Add a "Resolve" subsection describing `POST /schemas/:version/resolve` and `resolve_datachain`, with a worked example whose response is bounded under 512 KB.
- Add a "Round-trip rule" callout explaining R3 (structural strip) and R16 (conditional break under suggested elements).
- Add an "Authoring provenance" subsection: discriminated union, instance-level placement only in v1, the citation vs authoring-telemetry distinction (the `sources` field is citation provenance; `authoring_provenance` is authoring telemetry), and the render-time escape policy callout.
- Add a "Trust boundary on schema_snapshot" callout: `schema_snapshot` is a convenience for offline rendering, NOT a forgery-resistant attestation. Consumers MUST NOT treat it as a provenance guarantee. Re-entry path is a deferred content-hash binding (link to Scope Boundaries).
- Add a "Promoted-element lifecycle (fork-forever)" subsection: prior persisted artifacts stay pinned; re-resolve is the path to adopt a promoted element.
- Add a "Rejection / discard flow" callout: the schema does not model in-product mutate-suggested-element; rejection is "caller discards and re-invokes the skill."
- Remove the stale `"category_id": "purpose"` line from the example at line 18.

**Patterns to follow:**
- Existing structure of `1.datachains.md`
- Existing concept docs that describe both a wire shape and an operation (e.g., the existing validate concept material)

**Test expectation:** none — pure docs change. Manual review during U11 cross-link work plus a build of `dtpr-ai/` (`pnpm -F dtpr-ai-docs build` or equivalent) to catch broken links / frontmatter.

**Verification:**
- `pnpm -F dtpr-ai-docs build` passes.
- Rendered page renders the new sections in reading order.
- The stale `category_id` is gone.

---

### U11. Reference docs — REST, MCP, and stale-`category_id` sweep

**Goal:** (a) add See-also callouts pointing existing validate docs at the new resolve docs; (b) author the four new endpoint/tool reference pages; (c) sweep the two additional doc files where the stale `category_id` example propagated.

**Requirements:** R20, R21, R22, R23, R24, R25 (R25's `validate_resolved` surfaces require their own reference pages alongside resolve's; R23 predates R25 and named only the resolve doc)

**Dependencies:** U10 (concept doc lands first so the reference pages can link to the canonical "both forms" treatment), U5 (REST endpoints have stable shapes), U6 (MCP tools have stable shapes)

**Files:**
- Modify: `dtpr-ai/content/en/3.rest/6.validate.md` (See-also callout + stale `category_id` removal at lines 59-61, 121)
- Create: `dtpr-ai/content/en/3.rest/10.resolve.md`
- Create: `dtpr-ai/content/en/3.rest/11.validate-resolved.md`
- Create: `dtpr-ai/content/en/2.mcp/4.tools/10.resolve-datachain.md`
- Create: `dtpr-ai/content/en/2.mcp/4.tools/11.validate-resolved.md`
- Modify: `dtpr-ai/content/en/2.mcp/4.tools/7.validate-datachain.md` (stale `category_id` removal at lines 51, 94)

**Approach:**
- New REST pages document: request shape (link to schema), response shape (link to schema), error codes (passthrough of validate's envelope on bad input + `payload_too_large` on resolve), the rate-limit / response-cap / wall-clock-budget regime from R5 + Key Technical Decisions, and a worked example.
- New MCP pages document: tool input schema, output envelope (inline `structuredContent`), soft-failure semantics, and a worked example.
- See-also callouts in `6.validate.md` follow the existing footer pattern at lines 134-138.
- Doc numbering decision: new pages slot at 10/11, NOT renumbered into 7-9. Renumbering churn is multi-file rename + cross-link update for no reader benefit beyond ordering.

**Patterns to follow:**
- `dtpr-ai/content/en/3.rest/6.validate.md` for endpoint reference shape
- `dtpr-ai/content/en/2.mcp/4.tools/7.validate-datachain.md` for MCP tool reference shape

**Test expectation:** none — pure docs change. Build verification:

**Verification:**
- `pnpm -F dtpr-ai-docs build` passes.
- Cross-links resolve (See-also between validate and resolve; concepts/datachains.md links from each reference page).
- The stale `category_id` is gone from all three files.
- Visual smoke: navigate the rendered docs site and confirm the new pages are reachable from the navigation tree.

---

## System-Wide Impact

- **Interaction graph:** new endpoints share the validate handler's `resolveKnownVersion` + soft-failure pattern; new MCP tools share `validate_datachain`'s envelope semantics. The `<DtprDatachain>` family is unchanged at the component API level — the wire-shape change is absorbed by the new `buildResolvedSections` helper in `@dtpr/ui/core`. MCP `render_datachain` gains a new input branch but the existing thin-input path is unchanged.
- **Error propagation:** all new failures route through the existing `apiErrorEnvelope` shape. New error codes: `snapshot_drift` (R9 mismatch when version is in `INDEX_KEY`), `element_id_collision` (R15a), `unknown_element_id` extended to operate against the merged pool, `payload_too_large` reused for the 512 KB resolve cap.
- **State lifecycle risks:** none on the API side (resolve is pure; validate_resolved is read-only). Renderer side: `buildResolvedSections` allocates a small lookup map per call; no caching introduced.
- **API surface parity:** `validate` (thin) and `validate_resolved` (resolved) are sibling surfaces with the same soft-failure HTTP-200 contract. `resolve_datachain` (MCP) and `POST /schemas/:version/resolve` (REST) are sibling surfaces with the same wire shape. The MCP `validate_resolved` and REST `validate_resolved` are sibling surfaces with the same envelope.
- **Integration coverage:** REST end-to-end tests exercise the full pipeline (parse → validate → resolve → cap → respond). MCP tests exercise the same through the `buildToolRegistry` path. Renderer integration test exercises `buildResolvedSections` → `<DtprDatachain>` end-to-end against a fixture with both snapshot and suggested elements.
- **Unchanged invariants:** `DatachainInstanceSchema` shape, `validate` request/response contract, `validate_datachain` MCP envelope, `<DtprDatachain>`/`<DtprElement>`/`<DtprElementDetail>`/`renderDatachainDocument` component APIs, `deriveElementDisplay` signature, `INDEX_KEY` shape, `manifest.status` enum, the `RL_VALIDATE` and `RL_READ` rate-limit buckets and their values. Existing v2 fixtures continue to parse and validate without modification (success criterion 3).

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Zod's `unrepresentable: 'any'` silently drops the R14 conditional refinement under JSON-Schema emit | Empirical assertion in `api/test/unit/json-schema-emit.test.ts` (U1 test scenarios). The Zod refinement still runs at parse time regardless; if emit drops, U2's semantic validator carries the runtime guard. Wire shape is unchanged either way. |
| Forged-snapshot scenario (a `ResolvedDatachainInstance` with hand-edited `schema_snapshot` claiming attribution to a real prior version) | Out of scope for v1 per user decision; documented as a trust boundary in `concepts/datachains.md` (U10). Re-entry path is the deferred content-hash-on-resolved-artifact item in Scope Boundaries. |
| Resolved-bundle size exceeds 512 KB for representative fixtures | Lean-subset rule (R6) keeps the snapshot small; `categories`/`elements` are only those referenced. Cap-check in U5 returns 413 with a clear error envelope, not a silent truncation. If real fixtures hit the cap, raise it deliberately or revisit the lean-subset rule. |
| `buildResolvedSections` and existing `buildSections` (in `render_datachain.ts`) drift apart over time, producing different `RenderedSection[]` shapes for thin vs resolved inputs | Use the same helper internals where possible; assert structural equivalence in a snapshot test for one canonical fixture (build sections both ways and compare). When MCP `render_datachain` accepts resolved inputs (U9), have it use `buildResolvedSections` exclusively for that branch — keeps the helper as the single owner of resolved-input section building. |
| HTML-escape policy slippage — a downstream consumer of `<DtprElementDetail>` `v-html`'s a `rationale` field by mistake | Document the policy in the component prop's TSDoc; assert the renderer-test invariant (`<script>` and `<img onerror>` round-trip as escaped text); in U10 explicitly call out the policy in `1.datachains.md`. |
| `validate_resolved`'s snapshot-consistency rule (R9) needs to load the live store to compare; cost grows with snapshot size | The check skips when `version ∉ INDEX_KEY`; for live versions the cost is bounded by the lean-subset rule. CPU stays under the existing Worker `cpu_ms: 500` ceiling. If real validation latency exceeds that, the rule moves to a sample-and-flag posture. |
| hp-app's eventual consumption of `ResolvedDatachainInstance` requires a field-name pass we cannot anticipate without reading hp-app | Field set is intentionally optional-only in v1 per Scope Boundaries; tightening / renaming is a future additive change. The discriminated-union shape is committed; that's the load-bearing structural decision. |
| Doc numbering for new reference pages disrupts deep links into the dtpr.ai content tree | New pages slot at the end (10/11); existing files keep their numbers. Trade-off: resolve and validate_resolved are not adjacent to validate in the rendered nav. Acceptable per the doc-numbering decision in Open Questions. |

---

## Documentation / Operational Notes

- **`concepts/datachains.md` is the canonical place** for both forms, the round-trip rule, the trust boundary, and the lifecycle story. Reference pages link back to it.
- **No migration is required for existing v2 consumers.** Thin `DatachainInstance` and `validate` are unchanged.
- **Operational: new `RL_RESOLVE` binding requires a Cloudflare deploy with the Wrangler config update.** The rate-limit binding's namespace IDs (`1003 / 2003`) need to be allocated before merge if the team uses pre-deployed namespace ranges; verify against any unfamiliar bookkeeping practice.
- **Monitoring:** existing Workers logs / metrics surface 4xx + 5xx counts per route. Add the new routes to whatever dashboards already track validate's request / cap / rate-limit counts.
- **Skill output update follow-up (`dtpr-describe-system` etc.):** the `SKILL.md` files currently say "produce a `DatachainInstance` JSON". Once the resolved form ships, those skills should switch their output instruction to `ResolvedDatachainInstance` (with `authoring_provenance.kind === 'ai_generated'`) when proposed elements are surfaced. That edit is downstream of this plan and lives in a separate PR; not blocking.

---

## Sources & References

- **Origin document:** [docs/brainstorms/2026-05-07-dtpr-datachain-instance-resolved-form-brainstorm.md](../brainstorms/2026-05-07-dtpr-datachain-instance-resolved-form-brainstorm.md)
- Schema layer: `api/src/schema/datachain-instance.ts`, `api/src/schema/element.ts`, `api/src/schema/category.ts`, `api/src/schema/datachain-type.ts`, `api/src/schema/manifest.ts`, `api/src/schema/locale.ts`, `api/src/schema/provenance.ts`, `api/src/schema/emit-json-schema.ts`
- Validator: `api/src/validator/semantic.ts`, `api/src/validator/rules/`
- REST: `api/src/rest/routes.ts`, `api/src/app.ts`, `api/src/middleware/timeout.ts`, `api/src/middleware/errors.ts`, `api/wrangler.jsonc`
- MCP: `api/src/mcp/tools.ts`, `api/src/mcp/envelope.ts`, `api/src/mcp/tools/render_datachain.ts`, `api/src/mcp/server.ts`
- Renderer: `packages/ui/src/core/element-display.ts`, `packages/ui/src/vue/DtprDatachain.vue`, `packages/ui/src/vue/DtprElement.vue`, `packages/ui/src/vue/DtprElementDetail.vue`, `packages/ui/src/html/document.ts`
- Tests: `api/test/api/rest.test.ts`, `api/test/api/seed.ts`, `api/test/unit/json-schema-emit.test.ts`, `api/test/unit/semantic.test.ts`, `api/test/api/mcp/render_datachain.test.ts`
- Docs: `dtpr-ai/content/en/6.concepts/1.datachains.md`, `dtpr-ai/content/en/3.rest/6.validate.md`, `dtpr-ai/content/en/2.mcp/4.tools/7.validate-datachain.md`
- Related plan: [docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md](2026-04-16-001-feat-dtpr-api-mcp-plan.md) (origin of the v2 API + MCP surface this plan extends)

---

## Post-completion amendment — 2026-05-08: `authoring_provenance` moved to per-element

After shipping, `authoring_provenance.{rationale, confidence, source_references, variable_rationale}` were moved off the whole-disclosure level and onto a per-element keyed map (`authoring_provenance.element_provenance[<element_id>]`). Drove the change: the canonical Ruby generator (`hp-app` `DatachainGenerator`) emits one `ai_generation` block per element pick, not one per disclosure — the original whole-disclosure shape collapsed that fidelity and made the proposal context unusable for an agent justifying each element pick.

Concrete deltas vs the original plan:

- `confidence` is now an enum `'high' | 'medium' | 'low'` (was numeric `[0, 1]`). The `bucketConfidence` helper and its `ConfidenceBucket` type were deleted; renderers display the value verbatim.
- `source_references` is now `{ quote: string, context?: string }[]` (was `URL[]` with https/http scheme refinement). They are verbatim quotes lifted from input documents, not URLs.
- `rationale`, `variable_rationale`, `confidence`, and `source_references` are nested under `authoring_provenance.element_provenance[<element_id>]`. Whole-disclosure level retains only `kind`, `model`, and `generated_at`.
- New semantic-validator rule `element_provenance_unknown_element` rejects orphan keys whose `element_id` does not match any placement.
- Renderer (`buildResolvedSections`) composes per-element entries with whole-disclosure `model` / `generated_at` and attaches them to each `ElementDisplay.provenance`. Human-authored disclosures and AI disclosures lacking an entry leave `provenance` undefined for that placement.

Schema is in beta — no migration shim. Old payloads that ship the legacy whole-disclosure fields parse cleanly but lose those fields (Zod's default strip behavior).
