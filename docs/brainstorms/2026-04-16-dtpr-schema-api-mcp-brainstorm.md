---
date: 2026-04-16
topic: dtpr-schema-api-mcp
---

# DTPR Schema Drafting, Standalone API, and MCP Server

## Problem Frame

DTPR for AI is a moving target. The schema that describes AI-system transparency (what categories exist, what fields elements carry, what context values apply, how datachains assemble) needs to evolve quickly, and the current setup makes that hard:

- The schema **structure** is implicit in TypeScript route code and Nuxt Content collections, versioned via hardcoded strings like `0.1` / `0.2`. There's no clean way to cut, test, and publish a new structural revision without editing shared code paths.
- Content is stored as one markdown file per element per locale (6× fan-out for 6 locales), which concentrates translation churn and makes element-level changes span many files.
- The API is embedded in the Worcester Nuxt app and coupled to Nuxt Content's `queryCollection`. It cannot be deployed separately, cannot be consumed by AI agents natively, and has no path to add a Model Context Protocol (MCP) surface.
- There is no mechanism for AI agents to understand the schema, validate generated datachains, or propose new elements — blocking a planned family of Agent skills that depend on DTPR awareness.

The live endpoints on `dtpr.io/api/dtpr/v0|v1` have real consumers and must keep serving. A parallel, standalone API at `api.dtpr.io` will host the new architecture with zero cutover pressure, and eventually move to its own repo once churn stabilizes.

## Requirements

**Packaging and Deployment**
- R1. A new pnpm workspace `api/` is added to this repo, rigorously self-contained (no imports from `app/`, its own `package.json`, its own types) so later extraction to a dedicated repo is mechanical. `pnpm-workspace.yaml` must be extended to include `api` alongside the existing `app`, `docs-site`, and `studio` entries.
- R2. The new app targets Cloudflare Workers via Wrangler and deploys to `api.dtpr.io`. Preview deployments are available for beta schema versions.
- R3. The existing `app/server/api/dtpr/v0` and `v1` endpoints on `dtpr.io` continue to serve unchanged. No cutover, no deprecation in this scope.
- R4. The new app exposes two surfaces on a single Worker: a REST API and an MCP server. **MCP is a first-class citizen from day one**, not a future add-on — architectural decisions (schema representation, tool surface, error envelopes, content bundling) are made with MCP consumption as a primary concern alongside REST. Moving MCP to a sibling deploy is a future option only for load isolation, not a scope-change lever.

**Schema Versioning**
- R5. Schemas are versioned with a canonical string form `{datachain_type}@{YYYY-MM-DD}[-beta]` (e.g. `ai@2026-05-01-beta`, `device@2026-04-15`).
- R6. `-beta` versions are mutable and published for in-flight testing. Versions without the `-beta` suffix are treated as immutable stable releases.
- R7. A schema version is a full self-contained snapshot on disk (directory per version), not a set of diffs against a prior version. Content duplication across versions is accepted in exchange for simplicity.
- R8. The schema **structure** version (R5) is the only versioning dimension. Per-element content timestamps are dropped for now — git history is sufficient provenance while we move fast. If a consumer later needs element-level content versions, we add them back with a named use case.

**Content Storage**
- R9. Element and category content is stored as YAML, one file per element, with all locale translations embedded in the same file (replacing today's one-file-per-locale layout).
- R9a. Category and datachain-type top-level metadata also move to YAML-with-embedded-locales, following the same one-file-per-entity pattern as elements. (No per-locale file splits for categories or datachain-type manifests.)
- R10. YAML files are the source of truth in git. A build step (`pnpm schema:build`) validates YAML against the version's **Zod schema (per R12, the source of truth)**, runs DTPR-specific semantic checks, and emits per-version JSON bundles for runtime consumption. The Zod-derived JSON Schema is emitted alongside the bundles for MCP consumer use.
- R10a. Runtime content delivery targets **R2 with per-version JSON assets** (not Parquet, not D1). Keys are deterministic by version: `schemas/{datachain_type}/{version}/manifest.json`, `schemas/{datachain_type}/{version}/categories.json`, `schemas/{datachain_type}/{version}/elements.json` (all elements for list reads), `schemas/{datachain_type}/{version}/elements/{element_id}.json` (point reads), and `schemas/{datachain_type}/{version}/schema.json` (Zod-derived JSON Schema for agent consumption). The R2 bucket is **not publicly readable** — all client access goes through the Worker via a private service binding. The Worker uses the Cache API to hold hot objects in-region memory.
- R10b. Inline bundle (build-time imports of JSON assets into the Worker bundle) is permitted only while the total size of all actively served schema versions' JSON bundles is under **512 KB uncompressed**. Once any version push crosses that threshold, R2 becomes the exclusive runtime path and the inline fallback is removed. This gives P1 a simpler cold-start profile without creating a permanent dual-path architecture.
- R10c. **Deploy flow**: `schema:build` emits versioned bundles locally. On PR merge to `main`, CI uploads the bundle to R2 atomically — stage under a `staging/` prefix, verify all files present, then rename/copy to the final version prefix. CI then updates a top-level `schemas/index.json` enumerating available versions; the Worker reads `index.json` for `list_schema_versions` rather than live-listing the bucket.
- R11. Long-form prose fields (`description`, `citation`) support markdown formatting inside YAML multiline strings so prose ergonomics are preserved.

**Schema Definition**
- R12. A schema version's structural shape is defined in **Zod** (TypeScript) modules stored alongside the content in the version directory. Zod is the source of truth. Inferred TS types (`z.infer<...>`) are used throughout the Worker.
- R13. JSON Schema is emitted at build time from the Zod definitions via `zod-to-json-schema`. The emitted JSON Schema is what MCP tool descriptors, LLM consumers, and the CLI use — Zod is never exposed externally.
- R14. Schemas define both syntactic shape (Zod) and DTPR-specific semantic rules (e.g. an element's `context_type_id` must match a value defined in its category's context). Semantic validation lives in a small API-side validator layer, expressed as TS functions operating on Zod-parsed values.

**REST Surface (v2)**
- R15. All REST resource paths pin a specific schema version (e.g. `/api/v2/schemas/ai@2026-05-01-beta/elements`). Route matchers must accept both the literal `@` and the percent-encoded `%40` form in version segments, and the resolver normalizes them before loading the schema version.
- R16. There are no unversioned/`latest` convenience routes. Clients discover available versions via the schema-version list endpoint (and the equivalent MCP `list_schema_versions` tool) and pin explicitly.
- R17. REST endpoints provide read access to: schema version list, schema manifest, categories, elements, individual element by ID, datachain validation.
- R18. Locale filtering (`?locales=en,fr`) continues to work as it does in v1.

**MCP Server (read-side, v1)**
- R19. The MCP server exposes the following tools for AI agents, designed for context-efficient agent use (default to minimal payloads, let the agent opt into more):
  - `list_schema_versions(datachain_type?)` — enumerate versions and their status.
  - `get_schema(version, include?)` — returns the schema manifest by default (`include='manifest'`: categories, context definitions, JSON Schema). With `include='full'`, inlines elements — reserved for agents with ample context budgets.
  - `list_categories(version, locale?)` — compact list; categories are small.
  - `list_elements(version, category_id?, locale?, query?, fields?, limit?, offset?)` — the primary element-search tool. `query` does substring match across title + description. `fields` is a projection array with default `['id', 'title', 'category_ids']`; available: `description`, `variables`, `icon`, `citation`. `limit` defaults to 50, max 200.
  - `get_element(version, element_id, locale?, fields?)` — point read; default returns all element fields.
  - `validate_datachain(version, datachain_json)` — structural + semantic validation. Returns a typed envelope `{ ok: boolean, errors?: [{ code, message, path? }] }`.
- R20. MCP tool inputs and outputs are described with JSON Schema emitted from the same Zod definitions that validate REST inputs. One source of truth.
- R20a. MCP tools define error behavior scoped to the parameters they actually accept:
  - **All version-aware tools** (every tool with a `version` param): unknown `version` → `errors[].code='unknown_version'`.
  - **Locale-aware tools** (`list_categories`, `list_elements`, `get_element`): unsupported `locale` → silent fallback to `en` with a warning field in the response.
  - **`validate_datachain` only**: empty or malformed `datachain_json` → `errors[].code='empty_input'` / `'parse_error'`; semantic-rule violations → `ok:false` with per-rule errors.
  - **`list_elements` search semantics**: `query=''` or omitted returns unfiltered results (equivalent). Substring match is case-insensitive and Unicode-normalized (NFC). Search runs against the requested locale's `title`+`description`; no results in that locale returns an empty array (no cross-locale fallback for `query`).

**Schema Drafting Workflow**
- R21. A CLI command copies the most recent version of a datachain type into a new directory, creating a drafting starting point (e.g. `api schema:new ai 2026-05-01-beta`).
- R22. A CLI command validates a schema version locally — structural (JSON Schema well-formed), semantic (context references resolve, required fields present, etc.) — before commit (e.g. `api schema:validate ai@2026-05-01-beta`). This CLI ships in P1 alongside the initial port; the ported `v1→v2` content is validated by this command before it is tagged as the first stable version.
- R23. A CLI command promotes a beta to stable by renaming the directory (drops `-beta` suffix) in a feature branch (e.g. `api schema:promote ai@2026-05-01-beta`). **Promotion is gated by merging the resulting PR to `main`** — GitHub branch protection + reviewer approval is the only gate. No additional CLI-level access control. Branch protection is assumed to require at least one non-author reviewer; before the first stable promotion lands, `enforce_admins` should be enabled on `main` so admins cannot bypass the review gate (current repo setting: `enforce_admins: false`).
- R24. Preview deployments on `*-preview.api.dtpr.io` (or equivalent Wrangler preview URLs) serve beta schema versions so they can be tested end-to-end before promotion.

**Migration of Current v1 Content**
- R25. Only the **AI datachain** categories and elements from `app/content/dtpr.v1/` are ported to the new YAML format. The `device` datachain is not migrated in this scope and continues to be served solely by `dtpr.io/api/dtpr/v1`. This is the minimum needed to prove the architecture and give MCP something real to serve.
- R25a. **Element selection criterion**: existing element markdown files do not carry an `ai__`/`device__` filename prefix (categories do, elements don't). The migration selects elements whose frontmatter `category` array contains at least one `ai__*` entry. Any `device__*` category IDs on a migrated element are dropped from the new YAML's `category_ids`. A shared element may therefore diverge between the YAML tree (AI view) and the markdown tree (device view) going forward; this is consistent with R27.
- R25b. **`context_type_id` placement**: in the existing v1 markdown tree, some AI elements (e.g. `list-ai__decision__accept_deny.md`) carry a `context_type_id` in element frontmatter, but the v1 API documentation treats `context_type_id` as an instance-level field. The new schema retains `context_type_id` as an **instance-level field only** (on an element's entry within a datachain instance, not on the element definition). Existing element-level `context_type_id` values are discarded during migration; agents and authors supply them when composing a datachain.
- R26. The ported AI version is tagged as the first stable version of the new system (date-stamped to the port date, e.g. `ai@2026-04-16`). Per-element timestamps are not ported forward — R8 drops that dimension; original per-element history remains in git on the `app/content/dtpr.v1/` tree.
- R27. YAML in `api/schemas/ai/{version}/` is canonical for AI content going forward. The `app/content/dtpr.v1/` AI tree is left in place for the existing `dtpr.io` endpoint to continue serving its current consumers, but it is not kept in sync with the YAML. Drift between the two is acceptable and expected; any AI content change lands only in the YAML.

**Non-Functional Requirements (Baseline)**
- R28. The API is **public and unauthenticated** by deliberate choice — REST and MCP both. No API keys, no OAuth, no per-user surface. This is a stated scope decision, not an omission.
- R29. **Rate limiting** is enforced at the Cloudflare WAF layer, not in Worker code. Baseline rules: (a) a generous per-IP request rate (e.g. 120 req/min) on GET endpoints; (b) a tighter rate (e.g. 20 req/min per IP) on the `validate_datachain` path since it is the most expensive. Exact thresholds tunable.
- R30. **Payload limits** on any endpoint that accepts a caller-supplied `datachain_json` body (REST and MCP `validate_datachain`): 64 KB raw JSON, maximum nesting depth 32, maximum array length 1000. Requests exceeding these return `413 Payload Too Large` (REST) or a typed error envelope (MCP).
- R31. **CPU/time guards**: each REST/MCP request has a CPU-time budget configured via Wrangler `limits.cpu_ms` — 50 ms for read handlers, 500 ms for `validate_datachain`. Wall-clock enforcement (for slow upstream R2 reads that consume little CPU) uses a Worker-level `AbortController` with a matching timeout wrapping the handler. In either case, exceeded budgets return a structured timeout error.
- R32. **CORS** is restrictive, enforced via an explicit allow-list maintained in `wrangler.toml` (or equivalent) under source control. Baseline allow-list: `https://dtpr.io`, the Worcester app's production origin, `https://studio.nuxt.com`. Preview origins must match `*-preview.api.dtpr.io` under the team's controlled subdomain only (never `*.workers.dev` or wildcard Cloudflare domains). A CI lint step rejects new entries containing wildcards other than the explicit preview pattern.
- R33. **Wrangler credentials** for CI deploys use a scoped API token (deploy-only, bound to the `dtpr-api` Worker and its R2 bucket write access), stored in the CI secrets manager. Production and preview deploys use distinct tokens. (Rotation cadence is operational policy, kept in the team runbook, not in requirements.)

## Success Criteria

- **Wow-factor demo**: an AI agent (via MCP) goes from a natural-language description of an AI system ("license plate reader at the parking entrance that flags expired permits for a parking officer") to a complete, validated datachain — categories filled, elements selected, context values assigned, variables populated — in a single short session. This is the north-star outcome; every architectural decision is evaluated against whether it helps or hurts this demo.
- A new schema version can typically be cut, validated, deployed, tested, and promoted using YAML edits + the CLI — with TypeScript changes required only when a schema revision introduces a new *kind* of semantic rule the existing validator doesn't cover. Fast iteration for the common case, not a "zero TS" absolute.
- An AI agent using the MCP server can: enumerate available schemas, fetch one, search elements, read element details only as needed, construct a datachain in memory, and validate it — all without reading any app code.
- The current Worcester app continues serving `dtpr.io/api/dtpr/v0|v1` with no behavioral change.
- The `api/` workspace has zero runtime imports from `app/`, making extraction to a dedicated repo a move-files operation.
- A first AI-schema revision after the port can be drafted, tested, and shipped in **days, not weeks**.

## Scope Boundaries

- **Out of scope now, planned for future**: agent-submitted drafts (MCP write tools that open PRs via the GitHub API). Architecture must not preclude this, but no write endpoints ship in this scope.
- **Out of scope**: deprecating or sunsetting the existing `app/server/api/dtpr/v0|v1` endpoints on `dtpr.io`. They stay.
- **Out of scope**: migrating `dtpr.v0` content to YAML. Only `dtpr.v1` → new format is required for the first stable version.
- **Out of scope**: `suggest_new_element` or any LLM-powered generation tools on MCP. Only deterministic read tools in v1.
- **Out of scope**: an editor/UI for drafting schemas. Drafting is git + CLI + editor-of-choice. A web UI may come later.
- **Out of scope**: element-level content versioning of any kind (per-locale `updated_at`, per-element timestamps). Git is the provenance system while we iterate.
- **Out of scope**: schema *compatibility* reasoning across versions (e.g. "this element is compatible with schemas X through Y"). Full snapshot model sidesteps this.
- **Out of scope**: `/latest` convenience routes (removed per R16). Clients always pin an explicit version.
- **Out of scope**: D1 and Parquet as runtime stores. R2 with per-version JSON is the committed path (R10a), with inline bundle as a temporary fallback (R10b).
- **Out of scope**: migrating the `device` datachain. Only AI content is ported in this scope (R25). `device` continues to be served from `dtpr.io/api/dtpr/v1` indefinitely.
- **Out of scope**: content synchronization between `app/content/dtpr.v1/` and the new YAML tree. The YAML is canonical for AI going forward; drift is acceptable (R27).
- **Out of scope**: authentication, API keys, or per-user surfaces. The API is deliberately public and unauthenticated (R28).
- **Out of scope**: `describe_datachain` as an MCP tool. Agents can narrate from the structured element data they already receive via `get_element` and `list_elements`.
- **Out of scope**: CLI-level access control on `schema:promote`. Promotion happens through a merge to `main`; GitHub's branch protection and review workflow is the gate, not an additional CLI check.
- **Out of scope**: content integrity guarantees on beta responses (etag, hash pin). Beta is explicitly mutable and published; consumers caching beta by version string accept that bytes may change.

## Key Decisions

- **New workspace first, extract later**: avoids repo-split overhead during the rapid-iteration period; the workspace's self-containment rule makes extraction a move operation.
- **Single Worker hosting both REST and MCP**: simpler ops; load-isolation split deferred until it is actually needed.
- **YAML per element, all locales embedded**: chosen over JSON (less human-friendly for prose), markdown-per-locale (current fan-out problem), and hybrid metadata+body-files (extra indirection). Single source of truth per element, diff-friendly, validates cleanly, ships well to Workers.
- **Zod as source of truth for schema structure; JSON Schema emitted at build time**: Zod reads like a type definition, gives inferred TS types for free, and is the canonical way to describe runtime-validated shapes in TypeScript. `zod-to-json-schema` emits lossless JSON Schema for MCP tool descriptors and LLM consumption. The alternative (hand-written JSON Schema + generated Zod) has known coverage gaps (`allOf`/`oneOf`/conditional subschemas) and adds a second source to keep in sync. Zod-first also aligns with the loosened success criterion — structural shape changes are rare and TS edits are acceptable when they occur.
- **Full snapshot per schema version**: simpler than shared-content-plus-compatibility-ranges; duplication acceptable because most version diffs are small and copy tooling is trivial.
- **Version naming `{datachain_type}@{YYYY-MM-DD}[-beta]`**: `@` reads as "at version" (familiar from npm/pip), dates sort lexically, `-beta` is an optional suffix instead of a prefix so the date remains primary sort key.
- **Beta = mutable and published, stable = immutable**: lets beta be rolled forward in place during testing; promotion locks the artifact.
- **Per-element content timestamps dropped (simplification)**: schema structural version is the only versioning dimension today. Git log is sufficient content provenance. Add element-level versioning back when a named consumer needs it.
- **Runtime content delivery: R2 with per-version JSON, not D1 and not Parquet**: R2 matches our read pattern (scoped-by-version immutable blobs), requires no cross-version relational schema (which D1 would need), and requires no bundled analytics reader (which Parquet would need). D1 would earn its weight only for cross-version analytics queries we don't have. Parquet is analytics-oriented and mismatched to small per-version point/bulk reads. Inline bundle is allowed as a short-term optimization while versions are small (R10b).
- **MCP as first-class citizen**: architectural decisions are evaluated for both REST and MCP consumers from day one. MCP is not a phase-deferred add-on.
- **No `/latest` convenience routes**: every consumer pins a version explicitly. Reduces confusion about what a beta "is" at any moment and matches the immutable-stable contract.
- **Humans and agents share the same drafting workflow (today = git)**: agent write tools arrive later but use the same substrate.

## Dependencies / Assumptions

- Cloudflare Workers account with Wrangler access and ability to point `api.dtpr.io` at it.
- Wrangler preview URLs (or custom `*-preview.api.dtpr.io` routing) are available for beta testing before promotion. **Unverified assumption**: confirm our Wrangler setup supports preview routing during planning.
- The `@modelcontextprotocol/sdk` (or equivalent) has a Cloudflare Workers-compatible transport. **Unverified assumption**: current MCP SDK Workers compatibility needs to be confirmed during planning.
- JSON-Schema-to-Zod generation at build time (not runtime in the Worker) is acceptable for DX. **Unverified assumption**: confirm tool-chain choice (`json-schema-to-zod` vs `json-schema-to-ts` + Zod hand-write vs TypeBox) during planning.
- The current `app/content/dtpr.v1/` element schema maps cleanly to the YAML-per-element shape. Reading the content confirmed a field-for-field translation of stored fields (id, category_ids, title, description, icon, per-locale content). **Two caveats surfaced during review**: (1) `citation` is currently hardcoded to `[]` in the v1 API response (grep of `app/content/dtpr.v1` shows zero element-level citation fields today) — migration must decide whether to port as empty, sunset, or add as a new authored field; (2) `variables` in the v1 API response are synthesized from the category's `element_variables`, not stored on elements — migration must decide whether the new YAML keeps this category-derived behavior or materializes variables onto elements.

## Outstanding Questions

### Resolve Before Planning

- [Affects R14, R22] Enumerate the full list of DTPR-specific semantic rules beyond JSON Schema (context reference integrity, variable-to-description interpolation, required-category-has-at-least-one-element, etc.) before planning. R22's `schema:validate` CLI cannot be scoped without this list, and its size determines whether the validator stays "small" or warrants a different design.

### Deferred to Planning

- [Affects R12/R13][Technical] Confirm `zod-to-json-schema` covers the shapes we actually author (nested unions, `z.record`, discriminated unions). Validate during planning with a sample of ported AI elements.
- [Affects R10a][Technical] Exact R2 bucket layout, deploy-step wiring (how `schema:build` pushes JSON to R2 in CI), and Cache API TTLs. R2 is the committed destination; details belong in planning.
- [Affects R25][Technical] One-time migration script shape: parse markdown + frontmatter for the AI datachain only, group per-locale files by element ID, emit YAML. Belongs in planning.
- [Affects R24][Technical] Exact preview-deployment hostname strategy: Wrangler-generated preview URLs, per-beta custom route, or a single `staging.api.dtpr.io` that always points at latest commit.
- [Affects R29/R30/R31][Technical] Tune exact rate-limit thresholds, payload caps, and CPU budgets based on observed traffic after P2 ships. Baseline values in requirements are starting points, not final.

## Next Steps

-> `/ce:plan` for structured implementation planning

## Phasing Reference (for planning)

| Phase | Ships |
|---|---|
| P1 – Foundation | `api/` workspace, Wrangler config, CI/deploy, YAML content format, Zod-based schema definition + `zod-to-json-schema` emit, `schema:build` + `schema:validate` CLI, **AI-only** port from `app/content/dtpr.v1/` validated by the CLI before being tagged stable as `ai@2026-04-16` |
| P2 – REST v2 + MCP read | Version-pinned REST endpoints at `api.dtpr.io` **and** the 6 read-side MCP tools on the same Worker (R19). Baseline rate limits, payload caps, and CORS policy (R29–R32) in place. MCP ships in the same phase as REST; it is not gated behind REST parity. |
| P3 – Drafting tooling + demo | `schema:new` + `schema:promote` CLI commands; preview-deployment routing for betas; **a runnable demo script** (committed to the repo, e.g. a notebook or CLI that connects an MCP-capable agent to `api.dtpr.io` and drives the license-plate-reader scenario) as the acceptance test for the wow-factor success criterion |
| P4 – Repo extraction (trigger-gated) | Move `api/` + schemas to dedicated `dtpr-api` repo when a concrete trigger lands (e.g. a second non-Worcester consumer, or schema cadence exceeds monthly). Until the trigger, R1's self-containment keeps this cheap. |
| P5 – Agent write path (future, out of scope) | `suggest_new_element`, GitHub PR automation |
