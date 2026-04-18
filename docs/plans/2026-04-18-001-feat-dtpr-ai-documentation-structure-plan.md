---
title: "feat: Documentation structure for dtpr.ai microsite (REST v2, MCP, icons, @dtpr/ui)"
type: feat
status: active
date: 2026-04-18
---

# feat: Documentation structure for dtpr.ai microsite (REST v2, MCP, icons, @dtpr/ui)

## Overview

The DTPR-for-AI microsite at `dtpr.ai` (package `dtpr-ai/`) is currently a one-page Docus placeholder. This plan turns it into the canonical public documentation surface for everything we shipped in the recent API / UI / icon waves: the v2 REST API served from `api.dtpr.io`, the MCP server at `/mcp` (9 tools + 1 resource), the DTPR icon composition pipeline (shapes + symbols + composed variants), and the `@dtpr/ui` component library (core / vue / html). The output is (a) a concrete information architecture and Docus content layout, and (b) per-unit scope for the first docs pass — not the docs themselves.

## Problem Frame

Over the last two weeks we've landed substantial platform surface area:

- `@dtpr/api` — v2 REST + MCP on Cloudflare Workers (PR #262/#263 era, reinforced by icon composition in #270)
- `@dtpr/ui` — framework-neutral core + Vue SFCs + SSR HTML renderer (#267)
- `dtpr-ai/` microsite skeleton on Cloudflare Workers (#271)
- DTPR icon composition pipeline (shape × symbol × variant) with MCP `get_icon_url` and composed-icon REST endpoints (#270)

None of this is documented publicly. Internal READMEs exist (`api/README.md`, `packages/ui/README.md`) but they target contributors, not consumers. MCP clients, REST consumers, and UI adopters currently have to read source or commit messages to learn the surface. `dtpr-ai/` is the AI-focused web surface and — because the MCP server, the `render_datachain` MCP App, and `get_icon_url` all exist for AI clients — it is the natural home for this documentation.

The AI-focused framing matters for structure: developers arriving from AI tooling (Claude, MCP hosts, agentic frameworks) should find MCP-first quickstart and reference, with the REST API available as the underlying HTTP contract and `@dtpr/ui` available for anyone rendering DTPR content in their own surface.

## Requirements Trace

- R1. Publish a coherent IA in `dtpr-ai/content/` that covers MCP, REST v2, icons, `@dtpr/ui`, and a minimal conceptual foundation.
- R2. Every MCP tool (`list_schema_versions`, `get_schema`, `list_categories`, `list_elements`, `get_element`, `get_elements`, `validate_datachain`, `render_datachain`, `get_icon_url`) has its own reference page with input/output schema, example call, and error/fix-hint coverage.
- R3. Every REST v2 endpoint (schemas list, manifest, categories, elements list, element detail, validate, shapes, symbols, composed icons) has its own reference page with request/response, headers (version, cache, cors), and error shape.
- R4. Every `@dtpr/ui` export (6 Vue SFCs, 6 core helpers, 1 SSR helper) has prop/parameter docs with at least one usage example.
- R5. An MCP-first quickstart walks a reader from "zero" to a working `tools/call` + `resources/read` for `render_datachain`, including required headers.
- R6. A conceptual section explains DTPR-level ideas (datachain, element, category, version / release, icon composition) enough to read the reference docs without hunting through `docs.dtpr.io`.
- R7. Navigation is Docus-native — numeric-prefixed directories, `index.md` per section, `app.config.ts` header populated.
- R8. The existing `dtpr.ai` placeholder landing is replaced with a landing page that orients developers toward the four pillars (MCP, REST, UI, icons).
- R9. `pnpm --filter ./dtpr-ai build` stays green and the Cloudflare Worker deploys without regressions.

## Scope Boundaries

- Not re-documenting the broader DTPR standard — `docs.dtpr.io` owns design principles, signage, governance, v0/v1 REST. Cross-link, don't duplicate.
- Not migrating v1 REST docs from `docs-site/` to `dtpr-ai/`. v1 stays where it is; dtpr-ai documents v2 only.
- Not auto-generating reference from Zod schemas in this pass. Hand-written docs first; the Zod-in, markdown-out toolchain is a future optimization (see Deferred).
- Not publishing an OpenAPI spec. The v2 REST surface is small enough to hand-author; OpenAPI can follow if third-party consumers need it.
- Not writing contributor-facing docs (how to add a new category, promote a schema, etc.) — those live in `api/README.md` today and can migrate later if we decide `dtpr-ai/` should host both audiences.
- Not changing the public API surface of `@dtpr/api` or `@dtpr/ui` in this plan. Documentation reflects what exists; any API tweaks discovered while writing are filed as separate issues.
- Not introducing interactive / live-runner tooling (e.g., embedded MCP explorer). Markdown + curl + copy-pasteable JSON is sufficient for v1.

### Deferred to Separate Tasks

- **Reference auto-generation from Zod**: once IA is stable, we can generate per-tool and per-endpoint pages from the same Zod schemas the API uses (`api/src/mcp/tools.ts`, `api/src/schema/*`). Separate plan, separate PR.
- **Contributor/authoring docs in `dtpr-ai/`**: if we want `dtpr-ai/` to host the schema-authoring CLI docs too, that's a follow-up. For this plan, contributor docs stay in `api/README.md` and we link to them.
- **Docs-site cross-surface decisions**: whether v2 REST docs should *also* be mirrored into `docs-site/content/4.api/v2/` (following the v1 pattern) is an open strategic question — see Open Questions.
- **Interactive MCP explorer / REST playground**: nice-to-have, not in scope.
- **OpenAPI / AsyncAPI spec generation**: can follow after the hand-authored pass validates the surface shape.

## Context & Research

### Relevant Code and Patterns

- `api/src/app.ts` — Hono app wiring; shows exact middleware order, route mounts (`/api/v2`, `/mcp`, `/healthz`), and per-route wall-clock budgets. Source of truth for what `dtpr.ai` docs say about base URL + paths.
- `api/src/rest/routes.ts` — all v2 REST handlers. Endpoints to document: `GET /schemas`, `GET /schemas/:version/manifest`, `GET /schemas/:version/categories`, `GET /schemas/:version/elements` (category_id + query + locale + fields + cursor), `GET /schemas/:version/elements/:element_id`, `POST /schemas/:version/validate`, `GET /shapes/:shape.svg`, `GET /schemas/:version/symbols/:symbol_id.svg`, `GET /schemas/:version/elements/:element_id/icon[.<variant>].svg`.
- `api/src/mcp/server.ts` — hand-rolled JSON-RPC over HTTP handler (no SSE); documents the wire format (`initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `ping`), `mcp-session-id` header, and batch behavior. Source of truth for the "Connecting to MCP" page.
- `api/src/mcp/tools.ts` — 9 tool registry. Each tool has a Zod `inputSchema`, a stable envelope (`ok`/`err` + `meta.content_hash` + `meta.version`), and — for some — `toSoftFailureResult` semantics (validate, render, bulk-get partial). Each tool gets its own reference page.
- `api/src/mcp/tools/render_datachain.ts` + `api/src/mcp/resources/datachain_resource.ts` — the MCP Apps (SEP-1865) flow: tool returns `_meta.ui.resourceUri = ui://dtpr/datachain/view.html`, `resources/read` returns `text/html;profile=mcp-app`. Sessions keyed by `mcp-session-id`.
- `api/src/icons/compositor.ts` + `api/src/icons/shapes.ts` + `api/src/icons/color.ts` — shape × symbol × variant composition model. Three variant forms: `default`, `dark`, `{ kind: 'colored', color }`. Source of truth for the "Icon composition" concept page and for `get_icon_url` docs.
- `api/src/rest/responses.ts` — `X-DTPR-Content-Hash`, `X-DTPR-Version`, `Cache-Control` behavior; `fields` + `locales` projection semantics. Referenced across every REST endpoint doc.
- `api/src/rest/pagination.ts` — opaque cursor scheme + `MAX_LIMIT`. One dedicated reference page plus inline references.
- `api/src/middleware/errors.ts` — `ApiError` shape and error codes (`bad_request`, `not_found`, `parse_error`, `unknown_version`, `element_not_found`, `unknown_variant`, etc.). Source of truth for the unified "Errors" page.
- `api/src/rest/version-resolver.ts` — `ai@2026-04-16` canonical form, alias resolution, error shape on unknown version. Referenced by every version-scoped route.
- `packages/ui/src/core/index.ts` — 7 framework-neutral exports (`extract`, `extractWithLocale`, `interpolate`, `interpolateSegments`, `groupElementsByCategory`, `sortCategoriesByOrder`, `findCategoryDefinition`, `deriveElementDisplay`, `validateDatachain`, `HEXAGON_FALLBACK_DATA_URI`).
- `packages/ui/src/vue/index.ts` — 6 SFCs (`DtprIcon`, `DtprElement`, `DtprElementDetail`, `DtprCategorySection`, `DtprDatachain`, `DtprElementGrid`). Each SFC file contains `defineProps` — read each to lift prop signatures into the doc page.
- `packages/ui/src/html/index.ts` — `renderDatachainDocument` + `RenderedSection` + `RenderDatachainOptions`. SSR pathway for MCP App iframes.
- `packages/ui/README.md` — existing internal-facing README; valuable as a starting point for the `@dtpr/ui` section but reframe for public consumers.
- `api/README.md` — existing internal-facing README; valuable context for the authoring section but keep contributor detail out of public docs for now.
- `docs-site/content/4.api/v1/*.md` — established reference-doc shape: numeric-prefixed files, `title` + `description` frontmatter, Docus MDC components (`::callout`, `::version-switcher`), sample REST shapes with `GET` / `POST` headings. Mirror this structure for `dtpr.ai` REST and MCP references so a reader moving between surfaces feels consistent.
- `docs-site/content/3.implementation/` — pattern for conceptual/narrative sections (numbered files, single `description`, free-form MDC). Mirror for the concepts section.
- `dtpr-ai/app.config.ts` / `dtpr-ai/nuxt.config.ts` — existing Docus + Nuxt 4 config. Header title is already `DTPR for AI`; SEO and socials are populated. The `$production` block has the `agents/mcp` stub Docus requires. Extending navigation goes through Docus, not custom Vue pages.
- `docs-site/` deployment pattern — Nuxt Content auto-switches to D1 on the `cloudflare-module` preset. `dtpr-ai/wrangler.jsonc` already has the D1 binding (`dtpr-ai-content`). Adding content files does not require new bindings.

### Institutional Learnings

- `docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md` established the envelope shape (`ok` / `errors[]` / `meta`), `content_hash` discipline, soft-failure semantics for validate/render, and `mcp-session-id`-keyed render state — all are user-facing contracts that must be documented.
- `docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md` captured why `default` + `dark` are universal and colored variants are per-category (context values) — this is a critical mental model the icon docs must convey.
- `api/docs/mcp-fallback.md` — why we hand-rolled JSON-RPC instead of using `@modelcontextprotocol/sdk` on workerd. This is operator-relevant and belongs in an "Architecture" appendix rather than on the hot path, but reference docs should note "MCP Streamable HTTP, read-only subset."
- `docs/plans/2026-04-17-001-feat-dtpr-ai-microsite-placeholder-plan.md` — the placeholder skeleton deliberately shipped with no IA decisions so this documentation plan could make them. The `agents/mcp` stub and `NODE_OPTIONS=--max-old-space-size=4096` quirks are established; don't rediscover them.
- Recent PRs (#267, #270, #271) show that UI + icons + microsite landed roughly in parallel. Documentation must reflect the shipped state at `2026-04-18`, not a mid-flight snapshot.

### External References

- Docus Content docs — numeric-prefixed directories drive nav order; `navigation.title` frontmatter overrides display name; `::callout` and other MDC components are first-class.
- Nuxt Content v3 collections — Docus already configures the default collection (`content/`). No additional `content.config.ts` work is required for a text-only docs site; collections only matter if we need typed queries, which we don't.
- MCP spec 2025-06-18 — read-only subset (`initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`). Our wire-format docs should reference this version explicitly, matching `PROTOCOL_VERSION` in `api/src/mcp/server.ts`.
- MCP Apps SEP-1865 — `text/html;profile=mcp-app` mime type and `_meta.ui.resourceUri` convention. `render_datachain` docs must cite this.

## Key Technical Decisions

- **Single docs home at `dtpr.ai`**: the v2 REST, MCP, icons, and `@dtpr/ui` are the "AI-era" surfaces and belong together on the AI-focused microsite. Rationale: developers integrating an AI client don't care whether a URL they hit is MCP or REST — they care that both are on the same doc surface with shared vocabulary. Splitting across `dtpr.ai` (MCP/UI) and `docs.dtpr.io` (REST) would fracture that. Cross-linking from `docs.dtpr.io/api` to `dtpr.ai` covers the legacy-consumer path.
- **MCP-first IA, REST as underlying HTTP contract**: top-level sections follow the expected developer journey — "Getting started" → "MCP server" → "REST API" → "Icons" → "UI library" → "Concepts" → "Changelog". MCP sits above REST because the positioning statement (`DTPR for AI`) implies that's the primary integration surface for the audience we're courting.
- **Hand-written reference in this pass**: emitting pages from Zod schemas is attractive but premature. The surface is small (9 tools, ~9 REST routes, ~13 UI exports). Hand-authoring validates the IA and sets a template; auto-gen can slot in later without rearranging the tree. See Deferred.
- **Numeric-prefixed directories mirroring `docs-site/`**: reader muscle memory and Docus navigation both benefit from the shared convention. New readers moving between `docs.dtpr.io` and `dtpr.ai` shouldn't have to re-learn layout rules.
- **`::callout` + `::code-group` MDC, not custom Vue components**: Docus ships these out of the box. A custom "Try it" component or embedded MCP runner is tempting but violates the "no interactive tooling" scope.
- **One page per MCP tool, one page per REST endpoint**: matches the v1 pattern and gives each unit-of-surface its own stable URL for deep-linking (important for support, Slack, and AI-tool-generated references).
- **Concepts section comes after reference, not before**: the reference docs are the destination for most sessions; concepts exist to unblock readers who get lost in terminology. Putting concepts first risks making readers scroll past the thing they came for.
- **`@dtpr/ui` docs target consumers, not internal-only audiences**: the neutrality rule, R2 governance, and build scripts from the current README are contributor-facing and will not be surfaced on `dtpr.ai`. The public docs stay focused on props, slots, and examples.
- **Changelog is a single page, not per-surface**: one chronological stream, grouped by area via headings. Matches the `docs-site/content/7.changelog/` pattern (a single file there works fine) and avoids forcing readers to merge four separate streams mentally.
- **No redirects, no sitemap work in this pass**: Docus defaults are adequate for a new docs site. SEO and redirects become interesting once we have inbound traffic to preserve.
- **Do not block on `docs-site` v2 mirroring decision**: that decision (open question below) affects what we cross-link to, not what we author. Authoring proceeds; cross-links adapt when the decision lands.

## Open Questions

### Resolved During Planning

- **Which surfaces are in scope?** All four from the user's request: REST v2, MCP server (tools + resources), icon composition, and `@dtpr/ui`. The schema-authoring CLI is explicitly deferred to contributor docs.
- **Should we auto-generate from Zod?** Not in this pass. Hand-authored is faster to iterate on IA; auto-gen follows once IA is proven.
- **Do we need a content config?** No. Docus's default content collection handles the tree we're adding.
- **How do we handle the placeholder `content/index.md`?** Replace it in Unit 1 with the new landing page; no redirect history to preserve.
- **Tone / framing?** Developer-reference, third-person, terse. Match `docs-site/` voice.

### Deferred to Implementation

- **Which exact `::callout` variants to use for "note", "warning", "danger"**: Docus defaults are `info`, `warning`, `tip`, `note`. Confirm at first authoring, standardize across pages.
- **Whether to show curl or fetch first in REST examples**: bikeshed — pick one at first authoring. Weak preference for curl (AI-copy-pasteable).
- **Whether each MCP tool page includes the tool's full `inputSchema` JSON**: yes in principle, but exact formatting (collapsible? code block? rendered table?) is a first-authoring decision.
- **Whether `@dtpr/ui` examples use the package name or relative imports**: package name (`import { DtprDatachain } from '@dtpr/ui/vue'`) — matches the current README and is what external consumers will write.

### Deferred to Product / Team

- **Should `docs-site/content/4.api/` get a `v2/` sibling pointing at `dtpr.ai`?** Two options: (a) mirror the v1 structure with a thin v2 index that redirects readers to `dtpr.ai`, or (b) add a prominent callout on `docs.dtpr.io/api` linking out. Weak preference for (b) — avoids maintaining two indices. Flagging for the team; this plan's authoring does not depend on the answer.
- **Is there an audience for contributor-facing docs (`schema:build`, R2 layout) on `dtpr.ai`?** If yes, add a future "Authoring" section. If no, `api/README.md` stays canonical.

## Output Structure

The plan creates a new Docus content tree under `dtpr-ai/content/`. This is the expected shape at the end of Unit 2–6; Unit 7 populates the changelog.

    dtpr-ai/
      content/
        index.md                               # landing (replaces placeholder)
        1.getting-started/
          0.index.md                           # "What is DTPR for AI?"
          1.mcp-quickstart.md                  # zero-to-tools-call in 5 minutes
          2.rest-quickstart.md                 # zero-to-manifest via curl
          3.ui-quickstart.md                   # DtprDatachain in a Vue app
        2.mcp/
          0.index.md                           # MCP server overview
          1.connection.md                      # endpoint, headers, wire format, batches
          2.envelope.md                        # ok / err / _meta + soft-failure semantics
          3.resources.md                       # ui://dtpr/datachain/view.html + sessions
          4.tools/
            0.index.md                         # tool registry + common patterns
            1.list-schema-versions.md
            2.get-schema.md
            3.list-categories.md
            4.list-elements.md
            5.get-element.md
            6.get-elements.md
            7.validate-datachain.md
            8.render-datachain.md
            9.get-icon-url.md
        3.rest/
          0.index.md                           # base URL, versioning, CORS, rate limits
          1.schemas.md                         # GET /schemas
          2.manifest.md                        # GET /schemas/:version/manifest
          3.categories.md                      # GET /schemas/:version/categories
          4.elements-list.md                   # GET /schemas/:version/elements
          5.element-detail.md                  # GET /schemas/:version/elements/:id
          6.validate.md                        # POST /schemas/:version/validate
          7.icons.md                           # GET /shapes, /symbols, /icon[.<variant>]
          8.pagination-and-fields.md           # cursor, limit, fields, locales
          9.errors.md                          # shared error shape + codes
        4.icons/
          0.index.md                           # shape × symbol × variant mental model
          1.shapes.md                          # shape primitives
          2.symbols.md                         # release-pinned symbol SVGs
          3.composed-variants.md               # default / dark / context colors
          4.urls.md                            # how to resolve a URL (REST + get_icon_url)
        5.ui/
          0.index.md                           # package layout, three subpath exports
          1.core.md                            # framework-neutral helpers + types
          2.vue.md                             # 6 SFCs with props + examples
          3.html.md                            # renderDatachainDocument SSR
          4.theming.md                         # cascade layer, CSS custom properties
        6.concepts/
          0.index.md
          1.datachains.md
          2.elements-categories.md
          3.versions-and-releases.md
          4.content-hash.md
        7.changelog.md

**Note:** the per-unit `**Files:**` fields remain authoritative. The implementer may adjust this tree if an authoring pass reveals a cleaner split (e.g., folding `5.ui/3.html.md` into `5.ui/2.vue.md`).

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

Per-page skeleton for reference docs (both MCP tools and REST endpoints):

```markdown
---
title: <tool or endpoint name>
description: <one-line purpose>
---

# <H1: same name>

::callout{type="info"}
<one-sentence positioning — what this is for, when to reach for it>
::

## Summary
<2–4 lines of prose>

## Request  (REST)  |  Input  (MCP)
<table or fenced JSON: params, types, required?, description>

## Response  (REST)  |  Output  (MCP)
<fenced JSON example of success envelope>

## Errors
<table: code · http (REST only) · meaning · fix hint>

## Example
::code-group
```bash [curl]
curl ...
```
```json [tools/call]
{ "jsonrpc": "2.0", ... }
```
::

## See also
- link to adjacent endpoint / tool
- link to concept page
```

This shape carries intentionally across MCP and REST so a reader switching surfaces finds the same sections in the same order.

For `@dtpr/ui` pages, the skeleton is slightly different:

```markdown
## Import
<fenced import line>

## Props  |  Parameters
<table>

## Slots  (Vue only)
<table>

## Example
<fenced template + script>

## Notes
- cascade layer implications
- SSR caveats (if any)
```

## Implementation Units

- [ ] **Unit 1: IA scaffolding + navigation config**

**Goal:** Stand up the empty numbered-directory tree, populate the landing page, and wire Docus navigation so every future unit can drop files in place without config changes.

**Requirements:** R1, R7, R8, R9

**Dependencies:** None.

**Files:**
- Modify: `dtpr-ai/content/index.md`
- Create: `dtpr-ai/content/1.getting-started/0.index.md` (stub)
- Create: `dtpr-ai/content/2.mcp/0.index.md` (stub)
- Create: `dtpr-ai/content/3.rest/0.index.md` (stub)
- Create: `dtpr-ai/content/4.icons/0.index.md` (stub)
- Create: `dtpr-ai/content/5.ui/0.index.md` (stub)
- Create: `dtpr-ai/content/6.concepts/0.index.md` (stub)
- Create: `dtpr-ai/content/7.changelog.md` (stub)
- Modify (if needed): `dtpr-ai/app.config.ts` (header links or socials updates)
- Modify (if needed): `dtpr-ai/nuxt.config.ts`

**Approach:**
- Replace the placeholder `content/index.md` with a landing page that orients to four pillars: MCP server, REST API, icons, UI library. Keep copy under ~200 words; Docus landing renders from frontmatter + first paragraph.
- Write each section's `0.index.md` as a 1-paragraph section intro + a bulleted list of the section's pages (short, so each later unit can extend in place).
- Do not introduce custom Vue pages, custom layouts, or Docus overrides. Any navigation tweak should be done via `navigation.title` frontmatter or Docus config — not by hand-rolling a sidebar.
- Verify `pnpm --filter ./dtpr-ai build` succeeds before moving on; the new tree must not regress the production build.

**Patterns to follow:**
- `docs-site/content/index.md` + `docs-site/content/1.getting-started/0.index.md` for landing + section-intro shape.
- `docs-site/nuxt.config.ts` for Docus config style (no custom overrides beyond what's already in `dtpr-ai/nuxt.config.ts`).

**Test scenarios:**
- Happy path: `pnpm --filter ./dtpr-ai dev` renders landing + six section index pages without console errors.
- Happy path: navigation (Docus sidebar) lists each section in the numeric order the directories imply.
- Happy path: `pnpm --filter ./dtpr-ai build` exits 0 with no new warnings beyond the pre-existing `agents/mcp` stub notice.
- Edge case: each `0.index.md` stub has `title` + `description` frontmatter; Docus does not emit "untitled" in nav.

**Verification:**
- Local dev server renders the new tree; production build passes.

- [ ] **Unit 2: MCP reference (server + connection + envelope + 9 tools + resource)**

**Goal:** Document the entire MCP surface such that an agent author can go from zero to a working `tools/call` + `resources/read` cycle, including the MCP Apps iframe flow, without reading source.

**Requirements:** R1, R2, R5

**Dependencies:** Unit 1 (section scaffolding).

**Files:**
- Modify: `dtpr-ai/content/2.mcp/0.index.md` (expand from stub)
- Create: `dtpr-ai/content/2.mcp/1.connection.md`
- Create: `dtpr-ai/content/2.mcp/2.envelope.md`
- Create: `dtpr-ai/content/2.mcp/3.resources.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/0.index.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/1.list-schema-versions.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/2.get-schema.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/3.list-categories.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/4.list-elements.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/5.get-element.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/6.get-elements.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/7.validate-datachain.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/8.render-datachain.md`
- Create: `dtpr-ai/content/2.mcp/4.tools/9.get-icon-url.md`

**Approach:**
- `connection.md` covers endpoint (`POST /mcp`), `Content-Type: application/json`, `mcp-session-id` header semantics (from `api/src/mcp/server.ts`), protocol version (`2025-06-18`), supported methods, batch + notification behavior, and the "GET returns 405" quirk.
- `envelope.md` covers the `ok`/`err` payload shape, `_meta.content_hash`, `_meta.version`, `_meta.next_cursor`, and the soft-failure split (`isError: false` with `ok: false`) used by `validate_datachain`, `render_datachain`, and `get_elements` partial results.
- `resources.md` covers `ui://dtpr/datachain/view.html`, the `text/html;profile=mcp-app` mime type, session keying, and the placeholder-HTML behavior when `resources/read` arrives before any `render_datachain` call.
- Each tool page follows the MCP reference skeleton in High-Level Technical Design. Pull input shapes straight from `api/src/mcp/tools.ts` Zod schemas; show success and typical-error envelopes; link to related REST endpoints.
- `render_datachain.md` is longer — it must cover the MCP Apps iframe handoff (`_meta.ui.resourceUri`), the session-scoped HTML slot, and why the client must follow the tool call with a `resources/read` on the same `mcp-session-id`.
- `get_icon_url.md` cross-links to the icons section (variants, URL layout) rather than duplicating that content.

**Patterns to follow:**
- `docs-site/content/4.api/v1/1.overview.md` as the overall reference-page shape.
- Skeleton shown in High-Level Technical Design.

**Test scenarios:**
- Happy path: each tool page has title, description, one usage example, and an errors table.
- Happy path: the `render_datachain` page explicitly shows the two-call sequence (`tools/call` → `resources/read`) with matching `mcp-session-id`.
- Happy path: `envelope.md` shows both a success envelope and at least one `err` envelope with `_meta`.
- Edge case: `list_elements` and `get_elements` pages mention pagination + the 100-id cap, linking to REST pagination page.
- Edge case: `validate_datachain` page explains why `ok: false` returns `isError: false` (soft failure).
- Integration: tool page examples use `api.dtpr.io`, not `api-preview.dtpr.io` or localhost, so copy-paste works out of the box.

**Verification:**
- A reader can follow `connection.md` + `4.tools/8.render-datachain.md` + `3.resources.md` end-to-end and understand every step of the MCP Apps flow.

- [ ] **Unit 3: REST v2 reference (endpoints + pagination + errors)**

**Goal:** Document the full v2 REST surface served at `api.dtpr.io`, including cross-cutting headers, pagination, field/locale projection, and the unified error shape.

**Requirements:** R1, R3

**Dependencies:** Unit 1.

**Files:**
- Modify: `dtpr-ai/content/3.rest/0.index.md`
- Create: `dtpr-ai/content/3.rest/1.schemas.md`
- Create: `dtpr-ai/content/3.rest/2.manifest.md`
- Create: `dtpr-ai/content/3.rest/3.categories.md`
- Create: `dtpr-ai/content/3.rest/4.elements-list.md`
- Create: `dtpr-ai/content/3.rest/5.element-detail.md`
- Create: `dtpr-ai/content/3.rest/6.validate.md`
- Create: `dtpr-ai/content/3.rest/7.icons.md`
- Create: `dtpr-ai/content/3.rest/8.pagination-and-fields.md`
- Create: `dtpr-ai/content/3.rest/9.errors.md`

**Approach:**
- `0.index.md` covers base URL (`https://api.dtpr.io`), path prefix (`/api/v2`), authentication (none — public read; validate has a stricter rate limit bucket), `X-DTPR-Content-Hash` / `X-DTPR-Version` response headers, `Cache-Control` behavior (from `responses.ts`), and CORS.
- Each endpoint page follows the REST skeleton in High-Level Technical Design. Pull request/response from `api/src/rest/routes.ts`; use fresh canonical examples (`ai@2026-04-16-beta` if that's the current live version).
- `7.icons.md` merges the three icon routes (`/shapes/:shape.svg`, `/schemas/:version/symbols/:symbol_id.svg`, `/schemas/:version/elements/:element_id/icon[.<variant>].svg`) onto a single page because they're tightly related; dedicated conceptual coverage lives in `4.icons/`.
- `8.pagination-and-fields.md` unifies cursor/limit/fields/locales across `list_elements`, `list_categories`, and their MCP equivalents. Linked from each page that supports these parameters.
- `9.errors.md` enumerates every code surfaced by `api/src/middleware/errors.ts` (`bad_request`, `not_found`, `parse_error`, `unknown_version`, `element_not_found`, `unknown_variant`, etc.) with HTTP status, meaning, and fix_hint example.

**Patterns to follow:**
- `docs-site/content/4.api/v1/1.overview.md` for the page skeleton.
- Skeleton shown in High-Level Technical Design.

**Test scenarios:**
- Happy path: each endpoint page has request, response, headers, errors, and example in consistent order.
- Happy path: `6.validate.md` shows both a valid and an invalid example and notes that the HTTP status stays 200 in both cases (semantic failure is in the body).
- Happy path: `9.errors.md` table includes all eight+ codes found in `errors.ts`.
- Edge case: `4.elements-list.md` shows a cursor round-trip example (first page, then `cursor=<value>`).
- Edge case: `7.icons.md` shows all three variant URL forms (`icon.svg`, `icon.dark.svg`, `icon.<context>.svg`).
- Integration: example curls on each page include the version-header + caching headers in the response output so readers see what the real wire format looks like.

**Verification:**
- A reader with only curl and this section can hit every v2 endpoint successfully and interpret its response.

- [ ] **Unit 4: Icon composition reference (shapes, symbols, variants, URLs)**

**Goal:** Document the shape × symbol × variant mental model, including how categories' `context` field drives per-category colored variants, so a consumer can predict a URL from first principles and understand what they'll get back.

**Requirements:** R1, R3, R4 (partial — covers `DtprIcon` indirectly)

**Dependencies:** Unit 1 (section scaffold); Unit 3 (`rest/7.icons.md` — cross-links).

**Files:**
- Modify: `dtpr-ai/content/4.icons/0.index.md`
- Create: `dtpr-ai/content/4.icons/1.shapes.md`
- Create: `dtpr-ai/content/4.icons/2.symbols.md`
- Create: `dtpr-ai/content/4.icons/3.composed-variants.md`
- Create: `dtpr-ai/content/4.icons/4.urls.md`

**Approach:**
- `0.index.md` presents the compositional model in one diagram or mermaid snippet: `shape (category) + symbol (element) + variant (default | dark | context-colored) → 36×36 SVG`.
- `1.shapes.md` documents the shape primitives bundled in the worker (from `api/src/icons/shapes.ts`), including when each is used and what the underlying SVG fragment looks like.
- `2.symbols.md` documents release-pinned symbol SVGs, where they live (R2), and how `element.symbol_id` ties to them.
- `3.composed-variants.md` is the core conceptual page: `default` (outlined), `dark` (filled), and `{ kind: 'colored', color }` derived from a category's `context.values[].color`. Must explain the `innerColor` luminance rule (from `api/src/icons/color.ts`).
- `4.urls.md` lays out the URL layout (`/api/v2/schemas/:version/elements/:id/icon[.<variant>].svg`) and shows how to discover valid variants for an element (via `element.icon_variants`). Cross-links to the MCP `get_icon_url` tool and the REST icon routes.

**Patterns to follow:**
- `docs-site/content/3.implementation/` section for conceptual pages.
- Existing brainstorm at `docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md` for mental-model vocabulary.

**Test scenarios:**
- Happy path: `0.index.md` contains a diagram showing the three-axis composition.
- Happy path: `3.composed-variants.md` has a worked example of picking a color and showing the resulting `innerColor`.
- Edge case: `4.urls.md` shows the fallback behavior (`icon_miss_fallback` log) and reassures consumers they'll get a byte-identical response.
- Edge case: `4.urls.md` documents the `ID_REGEX` constraint on `element_id` and `variant` with the 400 response shape.

**Verification:**
- A reader can derive the correct icon URL for any (version, element, variant) triple from this section alone.

- [ ] **Unit 5: @dtpr/ui reference (core + vue + html + theming)**

**Goal:** Document every public export across the three `@dtpr/ui` subpaths with props, parameters, slots, usage examples, and theming guidance — focused on consumers, not contributors.

**Requirements:** R1, R4

**Dependencies:** Unit 1.

**Files:**
- Modify: `dtpr-ai/content/5.ui/0.index.md`
- Create: `dtpr-ai/content/5.ui/1.core.md`
- Create: `dtpr-ai/content/5.ui/2.vue.md`
- Create: `dtpr-ai/content/5.ui/3.html.md`
- Create: `dtpr-ai/content/5.ui/4.theming.md`

**Approach:**
- `0.index.md` explains the three-subpath layering (`core` → `vue`, `core` → `html`, `html` uses `vue` via `@vue/server-renderer`), quick install snippet (`pnpm add @dtpr/ui`), and when a consumer reaches for each subpath.
- `1.core.md` documents the 10 `core` exports + type exports. Each has: signature (TypeScript), parameters, return, one-line example.
- `2.vue.md` documents the 6 SFCs with props (read from `defineProps` in each `.vue` file), slots, and a representative example per component. Include a minimal end-to-end example rendering `DtprDatachain` with `@dtpr/ui/vue/styles.css` imported.
- `3.html.md` documents `renderDatachainDocument`, `RenderedSection`, `RenderDatachainOptions`, and `trustAsHtml`. Include the MCP Apps SSR example (`new Response(html, { headers: { 'content-type': 'text/html;profile=mcp-app' } })`).
- `4.theming.md` covers the `dtpr` cascade layer and the CSS custom-property token set (from `src/vue/styles.css`). Show both a color override and a font-family override.
- Do not include the "neutrality governance" rule from the current README — that's a contributor-facing concern.

**Patterns to follow:**
- `packages/ui/README.md` as a starting point, but reframe for external consumers.
- `docs-site/content/4.api/v1/` skeleton for per-page shape.

**Test scenarios:**
- Happy path: `2.vue.md` example uses `@dtpr/ui/vue` + `@dtpr/ui/vue/styles.css` imports and renders a complete datachain.
- Happy path: `1.core.md` documents every export listed in `packages/ui/src/core/index.ts`.
- Happy path: `3.html.md` example shows SSR + MCP Apps mime-type header in one snippet.
- Edge case: `4.theming.md` shows the recommended `@layer` order to integrate with Tailwind.
- Edge case: `1.core.md` documents `HEXAGON_FALLBACK_DATA_URI` and when an app would use it (missing-icon fallback in `deriveElementDisplay`).

**Verification:**
- A reader can install `@dtpr/ui`, render a datachain in a Vue app, and render the same datachain server-side from this section alone.

- [ ] **Unit 6: Quickstarts + concepts**

**Goal:** Connect the reference docs with a pragmatic front door (three quickstarts) and a thin conceptual foundation (five concept pages) so readers don't bounce off reference pages when a term is unfamiliar.

**Requirements:** R1, R5, R6

**Dependencies:** Units 2, 3, 5 (quickstarts link into their references); Unit 4 (icons concepts inform `4.icons/0.index.md` cross-links).

**Files:**
- Modify: `dtpr-ai/content/1.getting-started/0.index.md`
- Create: `dtpr-ai/content/1.getting-started/1.mcp-quickstart.md`
- Create: `dtpr-ai/content/1.getting-started/2.rest-quickstart.md`
- Create: `dtpr-ai/content/1.getting-started/3.ui-quickstart.md`
- Modify: `dtpr-ai/content/6.concepts/0.index.md`
- Create: `dtpr-ai/content/6.concepts/1.datachains.md`
- Create: `dtpr-ai/content/6.concepts/2.elements-categories.md`
- Create: `dtpr-ai/content/6.concepts/3.versions-and-releases.md`
- Create: `dtpr-ai/content/6.concepts/4.content-hash.md`

**Approach:**
- `1.mcp-quickstart.md`: five-minute walkthrough — `initialize` → `tools/list` → `tools/call list_schema_versions` → `tools/call render_datachain` → `resources/read ui://dtpr/datachain/view.html`. One copy-pasteable curl block per step. End with "next: browse the tool reference."
- `2.rest-quickstart.md`: three calls — `GET /api/v2/schemas` → `GET /schemas/:version/elements` → `POST /schemas/:version/validate` with a minimal instance. End with "next: browse the endpoint reference."
- `3.ui-quickstart.md`: minimal Vue 3 app rendering `<DtprDatachain :sections="..." />`, fetched from the REST API. ~30 lines of code in total.
- Each concept page is ≤500 words, focused on what a reader must know to use the reference docs, explicitly linking out to `docs.dtpr.io` for deeper treatment of the standard.
- `4.content-hash.md` covers why `_meta.content_hash` exists and how it helps AI agents detect schema updates (aligning with the "build tools that invalidate on content_hash change" guidance).

**Patterns to follow:**
- `docs-site/content/1.getting-started/` for the quickstart arc.
- `docs-site/content/5.concepts/` for concept-page length and tone.

**Test scenarios:**
- Happy path: MCP quickstart's five curls can be pasted into a terminal and each succeeds against `api.dtpr.io` (session id reused across calls).
- Happy path: UI quickstart's code compiles against Vue 3 + `@dtpr/ui/vue` with no additional deps beyond those listed at the top.
- Edge case: REST quickstart's validate example intentionally triggers one semantic warning so the reader sees the soft-failure body shape.
- Integration: every concept page has at least one outbound link into the relevant reference section.

**Verification:**
- A reader landing on `dtpr.ai/getting-started/mcp-quickstart` can complete the flow in one session.

- [ ] **Unit 7: Changelog + cross-links back to docs.dtpr.io**

**Goal:** Seed the changelog with the four shipping waves (API, UI, microsite skeleton, icon composition) so readers can see the "what landed when" history, and add prominent cross-links from `docs.dtpr.io/api` (or a banner) back to `dtpr.ai` for v2-interested readers.

**Requirements:** R1, R9

**Dependencies:** Units 2–6 (changelog references populated pages).

**Files:**
- Modify: `dtpr-ai/content/7.changelog.md`
- Modify (if team chooses option (b) from Open Questions): `docs-site/content/4.api/0.index.md` or equivalent — add callout linking to `dtpr.ai` for v2 docs.

**Approach:**
- Changelog entries grouped by area (`## API`, `## MCP`, `## Icons`, `## @dtpr/ui`, `## Site`), reverse-chronological. Pull dates and PR numbers from `git log` and recent commits on `main`.
- For `docs-site/` cross-link: a single `::callout{type="info"}` at the top of `4.api/0.index.md` pointing readers at `dtpr.ai` when they're after v2 / MCP / UI reference. Defer the decision whether to do this to the team (see Open Questions).
- Do not backfill changelog entries for pre-2026-04 work; start the stream at the API + MCP landing.

**Patterns to follow:**
- `docs-site/content/7.changelog/` for structure.

**Test scenarios:**
- Happy path: changelog entries map 1:1 to the four shipping waves with correct dates.
- Happy path: each entry links into a reference page in this site.
- Edge case: if the cross-link to `docs-site/` is chosen, the callout renders and does not break the existing `4.api/v1` nav.

**Verification:**
- A reader can find "when did `get_icon_url` land" by browsing the changelog.

## System-Wide Impact

- **Interaction graph:** This plan only adds content files and possibly a short callout in `docs-site/`. No runtime system touched; no API handlers changed.
- **Error propagation:** N/A (static content).
- **State lifecycle risks:** N/A — Docus + Nuxt Content builds deterministically from the filesystem. D1 is used only for content queries; new pages require no schema change.
- **API surface parity:** Documentation adds zero new public surface. Every fact in the docs must already be true in `api/src/**` and `packages/ui/src/**` at author time.
- **Integration coverage:** The only integration boundary at risk is the Cloudflare Workers build (Nitro `cloudflare-module` preset + `agents/mcp` stub + D1 binding). Unit 1's verification gate (`pnpm --filter ./dtpr-ai build` passing) is the canary.
- **Unchanged invariants:**
  - `api/src/**` and `packages/ui/src/**` are read-only for the duration of this plan. Any behavior change discovered during authoring goes to a separate issue or PR.
  - `docs-site/` v1 content is untouched; only a single outbound callout may be added in Unit 7, subject to the team decision.
  - `dtpr-ai/wrangler.jsonc`, `dtpr-ai/nuxt.config.ts`, and the `agents/mcp` stub remain as-is (Unit 1 verifies, doesn't modify).

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| API or UI behavior drifts between authoring and publishing, making docs wrong on day one. | Each unit pulls examples directly from `api/src/**` and `packages/ui/src/**` at authoring time; run a final `pnpm --filter ./api test && pnpm --filter @dtpr/ui test` pass before the unit 6 landing to catch silent drift. |
| Docus D1 binding or `agents/mcp` stub regresses on Cloudflare Workers. | Unit 1's verification gate runs a full build; escalate to the `docs-site` team if the stub needs updating (same pattern was fixed twice in `docs-site/`). |
| The 9-tool MCP + 9-endpoint REST authoring load exceeds one session. | Units 2 and 3 are independent of each other and can land in separate PRs. The plan does not require all of them to ship together. |
| `@dtpr/ui` prop signatures change before Unit 5 lands, invalidating the doc pass. | Unit 5 reads `defineProps` at authoring time and cites version in the page footer; if we ship breaking UI changes between unit drafts, rebaseline by re-reading the SFCs. |
| The open strategic question (mirror v2 into `docs-site/`?) pushes back on the whole plan. | Plan is structured so authoring proceeds regardless; the decision affects only the Unit 7 cross-link, not the content tree. |
| Docus navigation surprises (e.g., nested `4.tools/` directory). | Unit 1 verifies navigation rendering end-to-end; worst case we flatten `4.tools/*` to `4.tools/<name>.md` without nesting — IA degrades gracefully. |
| Docs-site D1 content collisions. | N/A — `dtpr-ai` uses its own D1 (`dtpr-ai-content`, id `27036ee8-bdae-4183-b5a7-d751dc0bac96`); content namespaces are isolated. |

## Documentation / Operational Notes

- Each reference page should include a "Last updated" footer (manual, matching date format `YYYY-MM-DD`) so readers and agents can spot stale content.
- Link strategy: internal links use Docus-style relative URLs (`/rest/elements-list`, `/mcp/tools/get-icon-url`); external links to `docs.dtpr.io` are absolute.
- No new environment variables, secrets, or deploy workflow changes. Cloudflare Workers Builds continues to handle `dtpr-ai/` deploys from `main`.
- Monitoring: `dtpr.ai` has no product analytics configured. That's consistent with `docs.dtpr.io`. Leave unchanged.
- Rollout: this is a docs-only change. Units land in separate PRs; each PR's impact is limited to `dtpr-ai/content/` (and possibly one callout in `docs-site/` for Unit 7).

## Sources & References

- Origin document: none — direct-entry plan; user request was "document [the api, packages, and icons] in @dtpr-ai; suggest a structure and documentation plan."
- Related plan: `docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`
- Related plan: `docs/plans/2026-04-17-001-feat-dtpr-component-library-plan.md`
- Related plan: `docs/plans/2026-04-17-001-feat-dtpr-ai-microsite-placeholder-plan.md`
- Related plan: `docs/plans/2026-04-17-002-feat-dtpr-icon-composition-plan.md`
- Related brainstorm: `docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md`
- Related brainstorm: `docs/brainstorms/2026-04-17-dtpr-component-library-brainstorm.md`
- Related brainstorm: `docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md`
- Source of truth (API): `api/src/app.ts`, `api/src/rest/routes.ts`, `api/src/mcp/server.ts`, `api/src/mcp/tools.ts`, `api/src/mcp/resources/datachain_resource.ts`, `api/src/mcp/tools/render_datachain.ts`, `api/src/rest/responses.ts`, `api/src/rest/pagination.ts`, `api/src/rest/version-resolver.ts`, `api/src/middleware/errors.ts`, `api/src/icons/compositor.ts`, `api/src/icons/shapes.ts`, `api/src/icons/color.ts`
- Source of truth (UI): `packages/ui/src/core/index.ts`, `packages/ui/src/vue/index.ts`, `packages/ui/src/html/index.ts`, `packages/ui/README.md`
- Existing internal READMEs: `api/README.md`, `packages/ui/README.md`
- Existing docs site pattern reference: `docs-site/content/4.api/v1/`, `docs-site/content/1.getting-started/`, `docs-site/nuxt.config.ts`
- Existing dtpr-ai skeleton: `dtpr-ai/content/index.md`, `dtpr-ai/nuxt.config.ts`, `dtpr-ai/app.config.ts`, `dtpr-ai/wrangler.jsonc`
- Recent PRs: #262/#263 (API + MCP), #267 (@dtpr/ui), #270 (icon composition + `get_icon_url`), #271 (dtpr.ai microsite placeholder)
