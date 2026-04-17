---
title: "feat: @dtpr/ui component library (core + vue + html)"
type: feat
status: active
date: 2026-04-17
origin: docs/brainstorms/2026-04-17-dtpr-component-library-brainstorm.md
deepened: 2026-04-17
---

# feat: @dtpr/ui component library (core + vue + html)

## Overview

Introduce `@dtpr/ui`, a single pnpm-workspace package at `packages/ui/` with three subpath exports — `@dtpr/ui/core` (framework-neutral TS), `@dtpr/ui/vue` (Vue 3 components), and `@dtpr/ui/html` (server-side HTML-string renderer for MCP App iframes). The library consumes inferred schema types from a new `@dtpr/api/schema` subpath and ships compositional primitives (not full-page browsers). **v1's sole proof point is a working MCP App tool in `@dtpr/api` that renders a datachain in an agent-conversation iframe.** `app/pages/taxonomy/ai.vue` migration, `guide-app` migration, and `admin` migration are deferred to separate tasks. The `/vue` subpath ships in v1 as a complete component set (exercised by Unit 7 snapshot equivalence) so that future consumers land against a tested surface, not a scaffold.

(see origin: `docs/brainstorms/2026-04-17-dtpr-component-library-brainstorm.md`)

## Problem Frame

DTPR has four presentation surfaces — taxonomy browser (`app/`), datachain display (`guide-app`), datachain editor (`admin`), and an imminent MCP App iframe — all rendering the same standard from divergent data shapes and with duplicated helpers (`useDtprLocale`, `interpolateVariables`, `groupElementsByCategory`, `dtpr-hexagon` fallback, accountable-category resolution). Each surface handles schema-bump migrations independently. The library exists to (a) eliminate today's helper duplication, and (b) buy lock-step across surfaces as `@dtpr/api` becomes the canonical source of shape.

v1 proves the design with one in-repo consumer (new MCP App surface in `@dtpr/api`) — `app/` taxonomy migration and external consumer migrations (`guide-app`, `admin`) are expected but explicitly deferred. The MCP App iframe is the v1 visible artifact; the `/vue` subpath ships tested but not yet wired to a page.

## Requirements Trace

All requirement IDs are from `docs/brainstorms/2026-04-17-dtpr-component-library-brainstorm.md`.

**Strategic posture**
- R1 — internally consolidated SDK, shaped for possible future publishing → Unit 1 (package scaffold + `private: true`)
- R2 — neutrality governance (no Clarable-specific exports) → Unit 1 (CONTRIBUTING note + exports lint check)

**Architecture**
- R3 — one `@dtpr/ui` package with `/core`, `/vue`, `/html` subpaths → Units 1, 3, 4, 5
- R4 — subpath barriers are real (core has zero framework deps, vue/html do not cross-import) → Unit 1 (build config), Units 3–5 (source tree)
- R5 — React subpath anticipated but out of scope → documented in Scope Boundaries only

**Source of truth for types**
- R6 — `@dtpr/api/schema` subpath, `@dtpr/ui` depends via `workspace:*` → Unit 2
- R7 — schema-version manifest/elements/categories as data inputs (not globals) → Unit 3 (function signatures)

**v1 core + vue + html**
- R8 — core API surface (`extract`, `interpolate`, `interpolateSegments`, `groupElementsByCategory`, `sortCategoriesByOrder`, `findCategoryDefinition`, `deriveElementDisplay`, `validateDatachain`) → Unit 3
- R9 — vue primitives (`<DtprIcon>`, `<DtprElement>`, `<DtprElementDetail>`, `<DtprCategorySection>`, `<DtprDatachain>`, `<DtprElementGrid>`, `<DtprCategoryNav>`) with named slots and defined states → Unit 4
- R10 — html renderer emits full HTML document (see Key Technical Decisions for the brainstorm-adjusted shape), single inline `<style>` + single inline `<script>` at document level, no external deps → Unit 5
- R11 — new `@dtpr/api` MCP tool returning an HTML-rendered datachain → Unit 6

**v1 consumer migration**
- R13 — MCP App surface in `@dtpr/api` → Unit 6

**Deferred (not in v1)**
- R12 — `app/pages/taxonomy/ai.vue` rewrite → **deferred** (descoped from v1 to prioritize MCP demo feed); tracked in "Deferred to Separate Tasks"
- R14, R15 — `guide-app` / `admin` migration → deferred; tracked in "Deferred to Separate Tasks"

**Styling & accessibility**
- R16 — default stylesheet, `@layer dtpr`, `dtpr-` class prefix → Unit 4 + Unit 5
- R17 — theming via CSS custom properties → Unit 4
- R18 — compositional primitives only; chrome stays in consumer → Unit 4 (scope). Consumer-chrome preservation proof deferred with `app/` migration.
- R19 — container queries, 44×44 px touch targets → Unit 4
- R20 — WCAG 2.1 AA, semantic HTML, ARIA parity between vue DOM and html output → Units 4, 5, 8

**Packaging and distribution**
- R21 — `packages/ui/` sibling to `api/`, `pnpm-workspace.yaml` extended with `packages/*` glob → Unit 1
- R22 — `workspace:*` internal consumption; `"private": true` stays → Unit 1

**Success Criteria**
- **Primary: MCP App iframe renders a DTPR datachain end-to-end** → Unit 6 (agent invokes `render_datachain` tool → iframe renders → accordion interactive)
- Schema-version lock-step (calibrated) → Units 3–5 (data-driven inputs)
- Two surfaces, one logic → Unit 7 (snapshot equivalence between Vue SSR and html output for the component set)
- Neutrality verified → Unit 1 (exports lint check)
- Duplication eliminated in-repo — **deferred with `app/` migration** (tracked in follow-up)

## Scope Boundaries

- Not replacing `@dtpr/api` Zod schemas; the library consumes them.
- Not a full-page browser or application. Compositional primitives only.
- Not a design-system replacement for Nuxt UI; `app/` chrome continues to use Nuxt UI.
- No editor primitives in v1 (no `<DtprElementPicker>`, no `<DtprDatachainEditor>`). See v2 Considerations in the origin document.
- No React, web-components, or Svelte adapter in v1 or v2.
- No public npm publish in v1 or v2. Internal workspace consumption only.
- The `device` datachain type is not migrated (matches `@dtpr/api` v1 scope).
- Existing `app/server/api/dtpr/v0|v1` endpoints continue to serve unchanged.
- PDF / print renders, social-share cards, and docs-site embeds are not v1 consumers.
- AI-rationale primitive (`<DtprAiRationale>`) is deferred to v2 pending schema additions to `ElementInstance`.
- `resolveAccountable` / organization-as-element resolution is deferred until `@dtpr/api` defines the `organizations` concept. `<DtprElementDetail>` ships a `#overlay` slot so consumers can inject accountable-specific content without forking in the meantime.

### Deferred to Separate Tasks

- **`app/pages/taxonomy/ai.vue` rewrite (R12)** — descoped from v1 to prioritize the MCP demo feed. The Nuxt Content → `@dtpr/api` data-source migration plus library-primitive swap is substantive standalone work. Tracked as a follow-up plan once the MCP surface is stable and the `@dtpr/api` data shape is battle-tested. In the meantime, `app/pages/taxonomy/ai.vue` continues to consume Nuxt Content unchanged.
- **`guide-app` migration (R14)** — separate repo (`hp-app`); depends on cross-repo consumption mechanism decision. Tracked as a follow-up.
- **`admin` (Clarable) migration (R15)** — separate repo; depends on v2 editor primitives + cross-repo consumption decision.
- **Cross-repo consumption mechanism** — private npm registry vs. pnpm `file:` link vs. monorepo merge. Blocks R14/R15 but does not block v1 ship.
- **v2 editor primitives** — `<DtprElementPicker>`, `<DtprElementEditor>`, `<DtprDatachainEditor>`, state-management contract. Separate brainstorm/plan.
- **Locale-fallback audit across `hp-app` copies** — canonical chain `requested → en → first-available → ''` is authoritative from Unit 3; auditing divergent hp-app copies happens during R14/R15 migrations.
- **`<DtprCategoryNav>` Vue primitive** — no v1 consumer (MCP iframe uses `/html`; `app/` deferred). Design intent preserved in the brainstorm; ship when a consumer needs it.

## Context & Research

### Relevant Code and Patterns

- `api/src/schema/` — canonical Zod schemas (`element.ts`, `category.ts`, `datachain-type.ts`, `manifest.ts`, `datachain-instance.ts`, `locale.ts`, `variable.ts`, `context.ts`) exported from `api/src/schema/index.ts`. Each file uses the `export const FooSchema = z.object({...}).describe(...); export type Foo = z.infer<typeof FooSchema>` pattern — clean target for a types-only subpath export.
- `api/tsconfig.json` — `moduleResolution: "Bundler"`, `allowImportingTsExtensions: true`, `noEmit: true`. Worker is bundled by wrangler directly from `.ts` source; schema subpath needs a separate build step that does not touch the Worker's config.
- `app/content.config.ts` — current Nuxt Content shape for categories/elements (`dtpr_id`, `name: string`, `description: string`, `icon: string`, `category: string[]`, `_locale`). Migration target (from `api/src/schema/element.ts`): `id`, `title: LocaleValue[]`, `description: LocaleValue[]`, `icon: {url, format, alt_text}`, `category_ids: string[]`.
- `app/pages/taxonomy/ai.vue`, `app/components/TaxonomyLayout.vue`, `app/components/ElementSection.vue` — **deferred migration targets** (post-v1). Captured here so the follow-up plan has direct references.
- `app/tailwind.config.ts` — brand tokens (`dtpr-green`, `dtpr-blue`, `dtpr-red`, `Red Hat Text`). Library's default CSS custom properties mirror these so `app/` renders unchanged visually after migration.
- `api/vitest.config.ts` + `app/vitest.config.ts` — Vitest is the repo's test runner. `@cloudflare/vitest-pool-workers` for Worker tests (`api/`); standard Vitest for `app/`. Snapshot tests already established at `app/test/api/elements.test.ts` — viable precedent for html-renderer snapshots.
- `docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md` Unit 10 — the sibling plan's MCP server + 7 read-side tools that Unit 6 of this plan attaches to.

### Institutional Learnings

`docs/solutions/` does not exist in this repo (confirmed by learnings researcher). No prior-art documentation to reference. Adjacent documents:

- `docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md` — sibling DTPR API/MCP brainstorm
- `docs/brainstorms/2026-02-06-cms-content-conversion-brainstorm.md` — prior Nuxt Content → API-fetched data migration thinking

### External References

- [MCP Apps spec (SEP-1865, Jan 2026)](https://modelcontextprotocol.io/extensions/apps/overview) — content type `text/html;profile=mcp-app`, full HTML document via `_meta.ui.resourceUri`, CSP `'unsafe-inline'` allowed
- [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps) — provides `registerAppResource` and the `App` class; needed in `api/` alongside existing `@modelcontextprotocol/sdk@^1.29.0`
- [Zod v3/v4 coexistence (zod.dev/v4/versioning)](https://zod.dev/v4/versioning) — `api/` and `app/` resolve physically separate `zod` installs under pnpm; `@dtpr/ui/core` consumes only inferred TS types from `@dtpr/api/schema` to avoid cross-install `ZodType` sharing
- [Vite library mode](https://vitejs.dev/guide/build.html#library-mode) + [`vite-plugin-dts`](https://github.com/qmhc/vite-plugin-dts) — recommended stack for Vue 3 SFC library packaging
- [MDN `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) + [container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries) — both fully supported in all 2024+ Chromium/Firefox/Safari

## Architectural Decisions Resolved by Unit 0.5

> **Unit 0.5 complete** (see `docs/plans/2026-04-17-001-spike-notes.md`). Path B adopted; `@modelcontextprotocol/ext-apps` adopted; toolchain (Vite library mode + `vite-plugin-dts` + `@vitejs/plugin-vue`) validated end-to-end. Vue SSR in the Worker measured at +50 KB gzipped, p99 10 ms for a 30-element fixture — all under thresholds. The table below is preserved as decision rationale; implementation units below already reflect the Path B outcome.

### Renderer architecture — parallel vs. single-source (resolved: Path B)

The brainstorm assumed two renderers (`/vue` + `/html`) with a Unit 7 snapshot-equivalence gate. Document review surfaced that a single renderer could eliminate the drift risk entirely. Unit 0.5 confirmed Path B is viable.

| Path | Shape | Pros | Cons | Spike cost |
|---|---|---|---|---|
| **A. Parallel renderers** (current plan) | `/vue` SFCs + `/html` string functions; Unit 7 snapshot equivalence CI gate | Worker bundle stays Vue-free; `/html` is ~1 KB of string functions; renders pre-deterministic | Two implementations drift under pressure; equivalence test is a recurring maintenance cost; scoped-CSS / fragment-marker noise risk | Already planned |
| **B. Vue SSR in the Worker** | `@dtpr/ui/vue` SFCs are the only implementation; `@dtpr/ui/html` becomes a thin wrapper calling `@vue/server-renderer`'s `renderToString` on the same SFCs | Single source of truth; no drift; `/vue` and `/html` are the same code; Unit 7 collapses to "does renderToString output match DOM render?" (trivially true by construction) | Vue + server-renderer add ~80–100 KB gzipped to the Worker bundle (under 10 MB limit but not free); SSR cold-start latency on Cloudflare edges is unverified; non-standard for MCP iframes | ~1 day — bundle a `<DtprCategorySection>` fixture through `renderToString` in a wrangler dev Worker, measure bundle size delta and p50/p99 render latency |
| **C. Pre-compiled render functions (no reactivity runtime)** | `@vue/compiler-sfc` compiles SFCs at build time; Worker ships only the render functions + a minimal runtime shim | Smaller Worker footprint than B; single source of truth; mature pattern for server-only Vue | Non-trivial build plumbing; docs are thin; requires patching `@vue/compiler-sfc` output to drop reactivity imports; `renderToString` still needs some runtime | ~2 days — not recommended to spike unless Path B fails on bundle size |
| **D. Shared template-string function** | One pure function `renderElementToHtml(display): string` used by both `/html` (direct) and `/vue` (via `v-html`) | One implementation; smallest bundle; no Vue needed in Worker | Loses Vue's declarative slot composition (`#overlay`, `#after-description` etc.); styling becomes hand-assembled strings; component ergonomics degrade for future Vue consumers | ~1 day to prototype; likely not worth it given slot/composition loss |

**Outcome**: Path B adopted. `@dtpr/ui/html` is a ~50-line wrapper around `renderToString(<DtprDatachain>)` + document shell. Unit 5 shrinks to one file. Unit 7 shrinks to a smoke test.

## Key Technical Decisions

- **Single `@dtpr/ui` package with three subpath exports** — `/core`, `/vue`, `/html`. Rationale: one versioning surface, one changelog, one release cycle. Splitting into three packages later is mechanical if a forcing function emerges (origin R4).
- **Subpath barriers enforced in build config, not just convention** — `@dtpr/ui/core` has zero framework deps; `@dtpr/ui/vue` and `@dtpr/ui/html` both import from `core` but never from each other. Vite library mode with three discrete entry bundles; Vue is externalized as peer dep for the `/vue` bundle only.
- **`@dtpr/api/schema` subpath via tsup** — `api/` keeps its `noEmit: true` Worker config. A parallel `tsup` build compiles `src/schema/**` → `dist/schema/**` with both `.js` + `.d.ts` output. `@dtpr/ui/core` imports inferred TS types from this subpath; runtime Zod validation (`validateDatachain`) also calls into the compiled schemas. No new `@dtpr/schema` package created.
- **Zod alignment resolved without `app/` upgrade** — `api/` and `app/` resolve two physically separate `zod` installs in the monorepo (`zod@^4.3.6` in `api/`, `zod@^3.25.76` in `app/`); pnpm hoists each under its own workspace. `@dtpr/ui/core` imports **only inferred TS types** from `@dtpr/api/schema` (never `ZodType` values), so no cross-install `ZodType` value ever crosses the library boundary. `validateDatachain` calls Zod 4 internally via `@dtpr/api` and returns plain data (`{success, errors?, data?}`) — the Zod 4 runtime is bundled with `@dtpr/api/schema`'s compiled output and does not collide with `app/`'s Zod 3 install. The brainstorm's "Zod version alignment" concern resolves; `app/` is not touched. (Note: Zod 3.25+ also exposes a `zod/v4` subpath, but this repo does not use that mechanism — each workspace pins a distinct major version.)
- **MCP Apps contract resolved (SEP-1865)** — `@dtpr/ui/html` emits a full `<!doctype html>` document (not a fragment). The `@dtpr/api` MCP tool registers this as a UI resource via `@modelcontextprotocol/ext-apps`'s `registerAppResource`; the tool response carries `_meta.ui.resourceUri` pointing at the resource. CSP `'unsafe-inline'` for `<style>` and `<script>` is permitted by default — R10's inline-only design is compatible.
- **CSS tokens + `@layer dtpr`** — default visual identity ships as one compiled stylesheet at `@dtpr/ui/vue/styles.css`. Tokens (`--dtpr-color-accent`, `--dtpr-color-border`, `--dtpr-font-heading`, `--dtpr-font-body`, `--dtpr-space-*`, `--dtpr-radius-*`) default to DTPR brand values (dtpr-green accent, Red Hat Text) so `app/` looks identical post-migration without explicit overrides. Consumers override on a wrapping element; host Tailwind utilities win over library styles by default layer order (documented in README).
- **Hexagon fallback as URL-encoded SVG data URI** — stored as a string constant in `@dtpr/ui/core/icons.ts`. Zero asset dependencies; shared between `/vue` and `/html`.
- **Compositional primitives, not chrome** — `<DtprCategoryNav>` exposes per-category counts as a data prop; consumers render the actual `<nav>` chrome with their own design system. Sticky positioning, toast, clipboard, scroll-spy, URL hash management all stay in consumers.
- **Semantic accordion equivalence across renderers** — both `@dtpr/ui/vue`'s `<DtprCategorySection>` and `@dtpr/ui/html`'s rendered equivalent emit `<button aria-expanded aria-controls>` + a panel `<div id=...>`; the snapshot equivalence test (Unit 7) asserts structural parity. If Path B is chosen in Unit 0.5, this decision becomes trivially satisfied (single renderer → equivalence by construction) and Unit 7 shrinks to a smoke test.
- **Single-open accordion coordination** — `<DtprDatachain>` owns accordion state via a `v-model:openSectionId?: string` prop. Child `<DtprCategorySection>` receives `expanded: boolean` (computed by parent from `openSectionId === this.id`) and emits `update:openSectionId` on toggle. The `disableAccordion` prop on either parent or section switches to always-expanded mode. This lifts state to the compositional parent so no provide/inject bus is needed; consumers can also pass an uncontrolled initial id and let the parent manage state internally.
- **Variable-type rendering contract** — `<DtprElementDetail>` renders each variable based on its `type` field from the schema's variable-type enum:
  - `text` (default): `<span class="dtpr-variable-value">{escape(value)}</span>` with `interpolateSegments` highlighting when inside description
  - `url`: `<a href="{value}" class="dtpr-variable-url" target="_blank" rel="noopener noreferrer">{truncate(value, 60)}</a>` — validates `value` starts with `https?://` before rendering as link; otherwise falls back to `text` rendering to avoid XSS via `javascript:` URLs
  - `boolean`: `<span class="dtpr-variable-bool" data-value="{true|false}">{yesOrNoI18n(value)}</span>` — yes/no text is localized via a caller-provided i18n option (fallback: `'yes' | 'no'`)
  - `number`: `<span class="dtpr-variable-number">{Intl.NumberFormat(locale).format(value)}</span>`
  - `date`: `<time datetime="{value}" class="dtpr-variable-date">{Intl.DateTimeFormat(locale).format(Date.parse(value))}</time>`
  - Unknown/future types: fall through to `text` rendering with a warning attribute `data-dtpr-unknown-type="{type}"` so future consumers and the equivalence test can see the drift.
  Both Vue and html renderers emit identical HTML structure for each type.
- **First-element-preview when `<DtprCategorySection>` is collapsed** — **dropped from v1 scope**. The brainstorm's R9 mentioned this as matching guide-app UX, but guide-app migration is deferred to R14. Shipping the preview now adds accordion complexity (truncation heuristics, transition choreography) for no v1 consumer. `<DtprCategorySection>` collapsed state is fully hidden (plain `hidden` attribute on panel). Reintroduce when guide-app migration plans.
- **`<DtprCategoryNav>` removed from v1** — no consumer. Restore when the first Vue taxonomy-style consumer arrives.

## Open Questions

### Resolved During Planning

- **`@dtpr/api/schema` subpath export feasibility (origin OQ #1)** — resolved: use `tsup` in `api/` to emit `dist/schema/**`; Worker's `noEmit: true` config is untouched. Exports field added additively.
- **MCP Apps iframe contract (origin OQ #2)** — resolved *directionally*: full HTML document via `_meta.ui.resourceUri` resource URI, `'unsafe-inline'` CSP allowed. Confirmed end-to-end by Unit 0.5 preflight spike before Unit 5/6 commit. Requires `@modelcontextprotocol/ext-apps` OR `@modelcontextprotocol/sdk@1.29`'s native `registerResource` (fallback if ext-apps doesn't bundle on Workers).
- **Zod version alignment (origin Dependencies)** — resolved: physically separate `zod@3` + `zod@4` installs under pnpm; `@dtpr/ui/core` boundary exports only inferred TS types from `@dtpr/api/schema`, so no `ZodType` value crosses installs. No `app/` upgrade needed.
- **Vue library `styles.css` single vs per-component (origin OQ)** — resolved: single stylesheet via Vite `build.cssCodeSplit: false` (R16 is explicit).
- **Sibling plan Unit 10 hard-dependency (document review feedback)** — removed. This plan's Unit 6 ships a **self-contained MCP server bootstrap** that registers the `render_datachain` tool as an independent mount point. When sibling plan's Unit 10 (7 read-side tools) merges, the two converge on the same Hono app via standard route composition — the mount wiring is additive, not competing. No cross-plan sequencing required; whichever lands first sets the shape, the other composes. See Unit 6 approach below.
- **Renderer architecture (Path A vs B vs C vs D)** — deferred to Unit 0.5 preflight spike; plan documents both A and B and picks based on spike evidence.

### Deferred to Implementation

- **Cross-repo consumption mechanism (origin OQ #3)** — deferred; only required when R14/R15 begin. Not in v1 scope.
- **Locale-fallback audit across `hp-app` copies** — deferred to R14/R15 migrations. Unit 3's canonical chain is authoritative for v1.
- **`app/` build-time vs runtime fetch from `@dtpr/api` (origin OQ)** — deferred with `app/` migration.
- **Markdown rendering for `description`** — `<DtprElementDetail>` accepts a `descriptionHtml` prop (pre-rendered) and also renders plaintext with variable-segment highlighting as a fallback. The library does not bundle a markdown renderer. Consumers (or `@dtpr/api`) render markdown to HTML and pass through. Revisit if v2 editor pressure demands a bundled renderer.
- **Exact `tsup` entry shape for `@dtpr/api/schema`** — single-file (`src/schema/index.ts`) vs multi-file. Decide during Unit 2; likely single-entry for simpler exports.
- **MCP tool name** — origin R11 defers to planning. Proposed: `render_datachain`. Finalized in Unit 6.

## Output Structure

```
packages/
  ui/
    package.json              # "private": true, exports map, peer dep on vue
    tsconfig.json             # base config
    tsconfig.build.json       # declaration-emitting for build
    vite.config.ts            # library mode, 3 entries, @vitejs/plugin-vue, vite-plugin-dts
    vitest.config.ts
    README.md                 # consumer usage, R2 neutrality governance checklist
    src/
      core/
        index.ts              # public core exports + type re-exports
        locale.ts             # extract, extractWithLocale
        interpolate.ts        # interpolate, interpolateSegments
        categories.ts         # groupElementsByCategory, sortCategoriesByOrder, findCategoryDefinition
        element-display.ts    # deriveElementDisplay
        validate.ts           # validateDatachain (wraps @dtpr/api Zod)
        icons.ts              # hexagon fallback data URI constant
      vue/
        index.ts              # public vue exports
        DtprIcon.vue
        DtprElement.vue
        DtprElementDetail.vue
        DtprCategorySection.vue
        DtprDatachain.vue
        DtprElementGrid.vue
        styles.css            # compiled output exported at @dtpr/ui/vue/styles.css
      html/
        index.ts              # public html exports
        document.ts           # renderDatachainDocument top-level full-doc emitter
        datachain.ts          # fragment-level renderDatachain (body only)
        category-section.ts
        element-detail.ts
        element.ts
        icon.ts
        styles.ts             # inlined CSS string (built-time-frozen copy of vue/styles.css)
        script.ts             # vanilla JS accordion behavior string
        escape.ts             # HTML escaping
    test/
      fixtures/
        datachain-sample.ts   # pinned ai@2026-04-16-beta fixture
      snapshots/              # vitest __snapshots__
    dist/                     # build output (gitignored)
      core/{index.js,index.d.ts,index.cjs}
      vue/{index.js,index.d.ts,styles.css}
      html/{index.js,index.d.ts,index.cjs}
```

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

**Layered package with tight directional dependencies:**

```
                             @dtpr/api/schema
                              (inferred types +
                               compiled Zod)
                                    │
                                    │ workspace:*
                                    ▼
                            ┌───────────────────┐
                            │  @dtpr/ui/core    │
                            │  (zero framework) │
                            │                   │
                            │  extract          │
                            │  interpolate      │
                            │  group/sort       │
                            │  deriveElementDisp│
                            │  validateDatachain│
                            │  hexagonDataUri   │
                            └───────┬───┬───────┘
                                    │   │
                        ┌───────────┘   └───────────┐
                        ▼                           ▼
                ┌──────────────────┐    ┌──────────────────┐
                │  @dtpr/ui/vue    │    │  @dtpr/ui/html   │
                │  (Vue 3)         │    │  (string render) │
                │                  │    │                  │
                │  DtprIcon        │    │  renderElement   │
                │  DtprElement     │    │  renderElementDtl│
                │  DtprElementDtl  │    │  renderCategory… │
                │  DtprCategorySec │    │  renderDatachain │
                │  DtprDatachain   │    │  renderDatachain │
                │  DtprElementGrid │    │  Document  ← full│
                │  styles.css      │    │       HTML doc   │
                └──────────────────┘    └──────────────────┘
                        ▲                           ▲
                        │                           │
                   (no v1 consumer —           ┌────┴──────────────┐
                    tested via Unit 7          │ @dtpr/api MCP     │
                    snapshot equivalence)      │ render_datachain  │
                                               │ tool (Unit 6)     │
                                               └───────────────────┘
```

**Dependency barriers:**
- `/core` never imports from `/vue` or `/html`.
- `/vue` and `/html` never import from each other.
- Both consume `/core`; enforced by `eslint-plugin-boundaries` (or similar) during Unit 1 tooling setup; also enforceable by separate `tsconfig` `paths` per build entry.

**MCP App data flow (Unit 6):**

1. Agent calls `render_datachain(version, datachain)` MCP tool.
2. Tool validates the datachain via `@dtpr/ui/core`'s `validateDatachain` (which internally uses `@dtpr/api/schema` Zod).
3. Tool calls `@dtpr/ui/html`'s `renderDatachainDocument(datachain, categories, locale, options)` → full HTML document string.
4. Tool registers the document as a UI resource via `@modelcontextprotocol/ext-apps`'s `registerAppResource(...)` → `ui://dtpr/datachain/<id>`.
5. Tool response returns: text body (agent-readable summary) + `_meta: { ui: { resourceUri: 'ui://dtpr/datachain/<id>', csp: {...} } }`.
6. Host renders the resource in a sandboxed iframe with inline styles/scripts allowed.

## Implementation Units

### Phase 0 — Architecture Preflight

- [x] **Unit 0.5: Renderer + MCP SDK + toolchain preflight spike** ✅ (2026-04-17 — notes at `docs/plans/2026-04-17-001-spike-notes.md`)

**Goal:** Resolve the two architectural commitments that would be most expensive to reverse after Unit 5/6 are built — (a) parallel renderers vs Vue SSR in Worker; (b) `@modelcontextprotocol/ext-apps` vs direct SDK `registerResource`. Timebox: **one working day**. Output: a short written decision + an empirical artifact (bundle size delta, cold-start timing, one working resource registration in a wrangler dev Worker).

**Requirements:** R10, R11, R13 (verification before committing).

**Dependencies:** None.

**Files:**
- Create: `packages/ui/spike/` (throwaway; `.gitignored`) — prototype Vue SSR + one render call against a `<DtprCategorySection>` fixture
- Create: `api/spike/mcp-apps-smoke.ts` (throwaway) — minimal `registerAppResource` call against a static HTML string
- Output artifact: `docs/plans/2026-04-17-001-spike-notes.md` (committed) — one-page summary of findings + decision

**Approach:**
1. **Vue SSR bundle test (Path B feasibility):** scaffold a `<DtprCategorySection>` SFC with inline styles. Run `@vue/server-renderer`'s `renderToString` inside a wrangler dev Worker. Measure: (a) Worker bundle size delta vs baseline, (b) `workerd` cold-start time, (c) render time p50/p99 on a 3-section fixture.
2. **MCP Apps SDK smoke test:** install `@modelcontextprotocol/ext-apps` in a scratch `api/spike/` directory. Register one static HTML UI resource. Verify wrangler dry-run bundles cleanly and local `wrangler dev` serves the resource on the MCP endpoint. If it fails, repeat with `@modelcontextprotocol/sdk@1.29`'s native `registerResource` primitive. Record which one worked and at what bundle size.
3. **Toolchain smoke test:** scaffold one real Vue SFC + one core function in `packages/ui/`, wire Vite library mode + `vite-plugin-dts`, confirm `.d.ts` emission includes component prop types and re-exports inferred types from `@dtpr/api/schema`. This catches `vite-plugin-dts` / `@vitejs/plugin-vue` / `<script setup lang="ts">` surprises before Unit 1 closes on stubs.
4. Write the decision summary: which renderer path (A or B), which MCP SDK (ext-apps or native), and any toolchain risks surfaced.

**Verification:**
- `spike-notes.md` lands with a Path-A-or-B recommendation and measured evidence
- Either `@modelcontextprotocol/ext-apps` or `@modelcontextprotocol/sdk`'s `registerResource` is proven to work end-to-end in a wrangler dev Worker
- Subsequent unit scopes (especially Unit 5, Unit 6, Unit 7) are updated in this plan file to reflect the chosen path before those units start

**Decision rule:** if Path B (Vue SSR) bundles under +200 KB gzipped AND p99 render time is under 50ms on a 10-section fixture AND cold-start overhead is under 100ms, adopt Path B and simplify Unit 5 to a thin wrapper around `renderToString`. Otherwise stay with Path A.

### Phase 1 — Foundation

- [ ] **Unit 1: Workspace + `@dtpr/ui` package scaffold**

**Goal:** Create the `packages/ui/` pnpm workspace with subpath-export package shape, build tooling (Vite library mode), test scaffolding, and neutrality governance README. No component or core logic yet.

**Requirements:** R1, R2, R3, R4, R5, R21, R22.

**Dependencies:** None.

**Files:**
- Modify: `pnpm-workspace.yaml` — add `packages/*` glob
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/tsconfig.build.json`
- Create: `packages/ui/vite.config.ts`
- Create: `packages/ui/vitest.config.ts`
- Create: `packages/ui/src/core/index.ts` (stub)
- Create: `packages/ui/src/vue/index.ts` (stub)
- Create: `packages/ui/src/html/index.ts` (stub)
- Create: `packages/ui/src/vue/styles.css` (stub with `@layer dtpr {}`)
- Create: `packages/ui/README.md` (usage + neutrality governance checklist)
- Create: `packages/ui/.gitignore` (dist/)
- Modify: `package.json` (root) — add root `test:ui` / `build:ui` passthrough scripts matching existing convention

**Approach:**
- `package.json` declares `"name": "@dtpr/ui"`, `"private": true`, `"type": "module"`, peer dep on `vue@^3`, `workspace:*` dep on `@dtpr/api`.
- `exports` map:
  - `./core` → `{types, import, require}` → `dist/core/*`
  - `./vue` → `{types, import}` → `dist/vue/*` (no CJS; Vue consumers are always ESM)
  - `./html` → `{types, import, require}` → `dist/html/*`
  - `./vue/styles.css` → `./dist/vue/styles.css`
  - `./package.json` → `./package.json`
  - **No root `.` export** — forces consumers to pick a subpath, preserving R4 barriers
- `vite.config.ts`: library mode with 3 entries (`src/core/index.ts`, `src/vue/index.ts`, `src/html/index.ts`), `@vitejs/plugin-vue`, `vite-plugin-dts` for `.d.ts` emission, `build.cssCodeSplit: false`, `rollupOptions.external: ['vue', '@dtpr/api/schema']`.
- `tsconfig.json` extends loose defaults; `tsconfig.build.json` adds `declaration: true`, `emitDeclarationOnly: true` for vue-tsc pass.
- README includes: (a) per-subpath import usage, (b) CSS custom property tokens reference, (c) host-side `@layer` ordering recipe, (d) **R2 neutrality checklist** (every new exported symbol requires a one-line justification of generic applicability; contributors must run `pnpm --filter @dtpr/ui check:neutrality` — a simple grep for `clarable|pinia|admin-` in exports — before merging).

**Patterns to follow:**
- `api/package.json` — pnpm workspace conventions (`"private": true`, `"type": "module"`, script naming)
- `api/vitest.config.ts` — Vitest config style (per-package, no root aggregation)
- Root `package.json:1-26` — existing `dev:/build:/test:` pnpm-filter passthrough style

**Test scenarios:**
- Happy path: `pnpm install` succeeds with the new package and glob present
- Happy path: `pnpm --filter @dtpr/ui build` produces `dist/core/{index.js,index.d.ts}`, `dist/vue/{index.js,index.d.ts,styles.css}`, `dist/html/{index.js,index.d.ts}`
- Happy path: `pnpm --filter @dtpr/ui test` runs vitest (no tests yet, green empty run)
- Edge case: attempting `import x from '@dtpr/ui'` (no root export) fails with resolution error — subpath barrier enforced
- Integration: `pnpm --filter ./app typecheck` continues to pass (glob addition is additive and does not touch `app/`)
- Integration: `pnpm --filter @dtpr/api typecheck` continues to pass

**Verification:**
- `dist/core/index.d.ts`, `dist/vue/index.d.ts`, `dist/html/index.d.ts` all present after build
- Neutrality-check script runs via `pnpm --filter @dtpr/ui check:neutrality` and returns zero matches on the empty stub exports

---

- [ ] **Unit 2: `@dtpr/api/schema` subpath export**

**Goal:** Add a `./schema` subpath export to `@dtpr/api` that ships compiled `.js` + `.d.ts` from `api/src/schema/**`. Worker Build (wrangler) untouched. Consumers import inferred TS types and (internally) compiled Zod schemas.

**Requirements:** R6, R7.

**Dependencies:** None (parallel to Unit 1 if desired, though Unit 3 depends on this).

**Files:**
- Modify: `api/package.json` — add `exports.["./schema"]`, add `tsup` devDep, add `build:schema` script, add `prepack`/`postinstall` hook (run before Worker build to ensure dist is fresh)
- Create: `api/tsup.schema.config.ts` — tsup config compiling `src/schema/index.ts` → `dist/schema/index.{js,cjs,d.ts}`
- Modify: `api/.gitignore` — add `dist/` if not present
- Create: `api/test/schema/exports.test.ts` — verifies compiled output shape

**Approach:**
- `tsup` chosen because it handles `.ts`→`.js` extension rewriting natively (Worker source uses `.ts` extensions per `allowImportingTsExtensions: true`), emits both ESM + CJS + `.d.ts` in one pass, zero Vue baggage.
- Single entry `src/schema/index.ts` (already re-exports all schema modules). Multi-entry split is deferred unless consumers need sub-sub-paths.
- `exports.["./schema"]` map:
  - `types` → `./dist/schema/index.d.ts`
  - `import` → `./dist/schema/index.js`
  - `require` → `./dist/schema/index.cjs`
- `build:schema` script: `tsup --config tsup.schema.config.ts`.
- Worker's `wrangler` build path is unaffected — it continues to compile `src/index.ts` with `src/schema/**` inlined at bundle time.
- Ensure `@cloudflare/vitest-pool-workers` test runs still resolve `src/schema/*.ts` directly (they do — Worker tests stay on source).

**Patterns to follow:**
- `api/vitest.config.ts:1-18` — `@cloudflare/vitest-pool-workers` config preservation (do not break)
- `api/wrangler.jsonc` — Worker build configuration (do not modify)

**Test scenarios:**
- Happy path: `pnpm --filter @dtpr/api build:schema` emits `dist/schema/index.js`, `dist/schema/index.cjs`, `dist/schema/index.d.ts`
- Happy path: `dist/schema/index.d.ts` contains declarations for `Element`, `ElementSchema`, `Category`, `CategorySchema`, `Manifest`, `DatachainInstance` (all current schema exports)
- Happy path: a test file imports `import { ElementSchema } from '@dtpr/api/schema'` and successfully calls `.parse(validElement)`
- Integration: `pnpm --filter @dtpr/api build` (wrangler dry-run) continues to succeed — Worker build untouched
- Integration: `pnpm --filter @dtpr/api test:workers` continues to pass — `@cloudflare/vitest-pool-workers` still resolves `src/schema/*.ts`
- Error path: importing a non-existent symbol from `@dtpr/api/schema` fails type-check — proves `.d.ts` is authoritative
- Edge case: `pnpm pack` of `@dtpr/api` includes `dist/schema/**` in the tarball (future-proofing, even though package is private)

**Verification:**
- `@dtpr/ui/core`'s future import `import type { Element, Category } from '@dtpr/api/schema'` resolves cleanly
- `pnpm --filter @dtpr/api typecheck` passes

---

- [ ] **Unit 3: `@dtpr/ui/core` — data logic**

**Goal:** Framework-neutral TypeScript primitives: locale extraction, variable interpolation (string + segmented), category grouping / sort, element display-prop derivation, datachain validation, hexagon fallback icon. Zero framework deps.

**Requirements:** R3, R4, R6, R7, R8.

**Dependencies:** Unit 1, Unit 2.

**Files:**
- Create: `packages/ui/src/core/locale.ts` (`extract`, `extractWithLocale`)
- Create: `packages/ui/src/core/interpolate.ts` (`interpolate`, `interpolateSegments`)
- Create: `packages/ui/src/core/categories.ts` (`groupElementsByCategory`, `sortCategoriesByOrder`, `findCategoryDefinition`)
- Create: `packages/ui/src/core/element-display.ts` (`deriveElementDisplay`)
- Create: `packages/ui/src/core/validate.ts` (`validateDatachain`)
- Create: `packages/ui/src/core/icons.ts` (`HEXAGON_FALLBACK_DATA_URI` constant)
- Create: `packages/ui/src/core/types.ts` (local type aliases; public re-exports of `@dtpr/api/schema` inferred types)
- Modify: `packages/ui/src/core/index.ts` (real exports)
- Test: `packages/ui/src/core/locale.test.ts`
- Test: `packages/ui/src/core/interpolate.test.ts`
- Test: `packages/ui/src/core/categories.test.ts`
- Test: `packages/ui/src/core/element-display.test.ts`
- Test: `packages/ui/src/core/validate.test.ts`

**Approach:**
- **Locale fallback chain (canonical):** requested locale → `en` → first-available → `''`. Deterministic. Documented in JSDoc.
- **`interpolate`** returns plain string; unresolved `{{var}}` placeholders pass through literally.
- **`interpolateSegments`** returns `Array<{kind: 'text' | 'variable' | 'missing', value: string, variable_id?: string}>`. Missing variables become `{kind: 'missing', variable_id, value: '{{varname}}'}` for segmented rendering.
- **`groupElementsByCategory(elements, categories)`** — element with `category_ids: ['a', 'b']` appears in both groups.
- **`sortCategoriesByOrder(grouped, categories)`** — sort by `category.order` ascending; missing `order` goes last; ties broken lexicographically by `id`.
- **`deriveElementDisplay(element, instance, locale, options)`** returns `{title, description, icon: {url, alt}, variables: Array<{id, label, value, type}>, citation}` where `type` is drawn from the schema's variable-type enum, `icon.url` falls back to `HEXAGON_FALLBACK_DATA_URI` if empty/missing, all strings are locale-resolved via `extract`.
- **`validateDatachain(version, datachain)`** — wraps **`@dtpr/api/src/validator/validateInstance`** (which already exists and covers structural Zod + semantic rules: `checkCategoryRefs`, `checkVariables`, etc.). Returns `{success: true, data} | {success: false, errors}`. Do NOT reimplement structural-only validation — the semantic layer catches category-ref and variable-rule violations that pure Zod cannot. This implies Unit 2 also exposes a `@dtpr/api/validator` subpath OR re-exports `validateInstance` via `@dtpr/api/schema`; decide in implementation (the subpath is cheaper if the validator has no runtime dependencies beyond schema).
- **`HEXAGON_FALLBACK_DATA_URI`** — URL-encoded SVG (~200 bytes), white dtpr-green hexagon matching current `/icons/dtpr-hexagon.png` semantics.
- Accountable-category + organization-as-element resolution is **deferred** (origin Dependencies). Not implemented in v1; `<DtprElementDetail>`'s `#overlay` slot is the consumer-side escape hatch.

**Execution note:** Test-first for pure functions. Each function has a tight contract (input → deterministic output), well-suited to scenario-based unit testing before implementation.

**Patterns to follow:**
- `api/src/schema/element.ts:1-57` — `export const FooSchema = z.object({...}); export type Foo = z.infer<typeof FooSchema>` pattern
- Vitest usage in `api/test/` and `app/test/unit/`

**Test scenarios:**
- Happy path `extract`: `extract([{locale:'en',value:'Hello'},{locale:'es',value:'Hola'}], 'es')` → `'Hola'`
- Happy path `extract`: `extract(..., 'en')` → English value
- Edge case `extract` fallback: requested `'fr'` with `[en, pt]` present → English (first fallback)
- Edge case `extract` first-available: requested `'fr'` with only `[pt]` → `pt` value
- Edge case `extract` empty input: `extract([], 'en')` → `''`
- Edge case `extract` malformed entry: `{locale: 'en', value: ''}` → returns empty string, does not crash
- Happy path `interpolate`: `"Hello {{name}}"` + `{name: 'world'}` → `'Hello world'`
- Happy path `interpolate` multiple variables: `"{{a}} and {{b}}"` + `{a:'x', b:'y'}` → `'x and y'`
- Edge case `interpolate` missing variable: `"Hello {{name}}"` + `{}` → `'Hello {{name}}'` (literal passthrough)
- Edge case `interpolate` whitespace tolerance: `"{{ name }}"` + `{name:'x'}` → `'x'`
- Happy path `interpolateSegments`: `"Hello {{name}}"` + `{name:'world'}` → `[{kind:'text', value:'Hello '}, {kind:'variable', variable_id:'name', value:'world'}]`
- Edge case `interpolateSegments` missing: `[{kind:'text', value:'Hello '}, {kind:'missing', variable_id:'name', value:'{{name}}'}]`
- Happy path `groupElementsByCategory`: element with `category_ids: ['a']` grouped under `a`
- Edge case `groupElementsByCategory` multi-category: element appears in each of its category groups
- Edge case `groupElementsByCategory` category with no elements: empty array, category key present
- Happy path `sortCategoriesByOrder`: ordered ascending by `order`
- Edge case `sortCategoriesByOrder` missing order: nulls/undefined go last, lexicographically by id within nulls
- Happy path `findCategoryDefinition`: returns matching category by id
- Edge case `findCategoryDefinition` not found: returns `undefined`
- Happy path `deriveElementDisplay`: returns `{title, description, icon, variables, citation}` fully locale-resolved for fixture
- Edge case `deriveElementDisplay` missing icon url: `icon.url === HEXAGON_FALLBACK_DATA_URI`
- Edge case `deriveElementDisplay` required variable with no instance value: `variables[i].value === ''`, `variables[i].type` preserved, `variables[i].required === true` preserved
- Happy path `validateDatachain`: valid fixture for `ai@2026-04-16-beta` → `{success: true, data}`
- Error path `validateDatachain`: missing required field → `{success: false, errors}` with Zod issue list
- Integration: imports `@dtpr/api/schema` types without pulling Worker runtime — dependency graph stays clean

**Verification:**
- All tests green; 100% branch coverage on locale/interpolate (small pure functions)
- `@dtpr/ui/core` bundle size < 10 KB minified (zero framework baggage assertion)

---

### Phase 2 — Renderers

- [ ] **Unit 4: `@dtpr/ui/vue` — Vue 3 primitives + default stylesheet**

**Goal:** Ship the six Vue 3 primitives needed for v1 (`<DtprIcon>`, `<DtprElement>`, `<DtprElementDetail>`, `<DtprCategorySection>`, `<DtprDatachain>`, `<DtprElementGrid>`) backed by `@dtpr/ui/core` data logic. Default stylesheet with CSS custom-property tokens mirrors DTPR brand defaults. `<DtprCategoryNav>` is deferred (no v1 consumer). `<DtprDatachain>` is the ordered-by-category composition primitive; `<DtprElementGrid>` is the layout primitive for element collections.

**Requirements:** R3, R9, R16, R17, R18, R19, R20.

**Dependencies:** Unit 3. If Unit 0.5 chose Path B, the `/vue` components are also what `/html` renders via `renderToString`, so `<script setup>` ergonomics must work server-side (no direct `document`/`window` access).

**Files:**
- Create: `packages/ui/src/vue/DtprIcon.vue`
- Create: `packages/ui/src/vue/DtprElement.vue`
- Create: `packages/ui/src/vue/DtprElementDetail.vue`
- Create: `packages/ui/src/vue/DtprCategorySection.vue`
- Create: `packages/ui/src/vue/DtprDatachain.vue`
- Create: `packages/ui/src/vue/DtprElementGrid.vue`
- Modify: `packages/ui/src/vue/index.ts` (real exports)
- Modify: `packages/ui/src/vue/styles.css` — tokens + `@layer dtpr { ... }` + container queries (**unscoped CSS only** — no `<style scoped>` per Vue SSR equivalence risk)
- Test: `packages/ui/src/vue/DtprIcon.test.ts`
- Test: `packages/ui/src/vue/DtprElement.test.ts`
- Test: `packages/ui/src/vue/DtprElementDetail.test.ts`
- Test: `packages/ui/src/vue/DtprCategorySection.test.ts`
- Test: `packages/ui/src/vue/DtprDatachain.test.ts`
- Test: `packages/ui/src/vue/DtprElementGrid.test.ts`

**Approach:**
- Every component accepts already-derived display data (caller runs `deriveElementDisplay` from core, passes result in).
- **Tokens (CSS custom properties, default values):**
  - `--dtpr-color-accent: #0f5153` (`dtpr-green.DEFAULT` / `.900` per `app/tailwind.config.ts`; note this is NOT `dtpr-green.500` which is `#08c4c1` — the DEFAULT is the canonical brand accent)
  - `--dtpr-color-border: rgba(0,0,0,0.1)`
  - `--dtpr-font-heading: 'Red Hat Text', sans-serif`
  - `--dtpr-font-body: 'Red Hat Text', sans-serif`
  - `--dtpr-space-{xs,sm,md,lg,xl}` and `--dtpr-radius-{sm,md,lg}` scale
- All styles wrapped in `@layer dtpr { ... }` with `dtpr-` class prefix (`.dtpr-element`, `.dtpr-category-section`, etc.).
- **Container queries** via `@container` at primitive roots. Each primitive declares `container-type: inline-size` on its wrapper so nested primitives respond to container width, not viewport.
- **Minimum touch target: 44×44 px** on `<DtprCategorySection>` header button, `<DtprElement>` click targets.
- **`<DtprCategorySection>`** implements collapsible behavior with `<button aria-expanded aria-controls>`, single-open accordion default (matches origin R9). Prop `disableAccordion` switches to always-expanded. Enter/Space on header toggles.
- **`<DtprDatachain>`** exposes `#empty` slot; ships no default empty copy. The `@dtpr/ui/html` renderer mirrors this: when datachain is empty and no `options.emptyHtml` is provided, it emits a single minimal neutral placeholder (`<p class="dtpr-empty" role="status"></p>` with no text content — the consumer/caller chooses the copy by passing `options.emptyHtml`). This keeps parity with Vue's "no default copy" policy while giving the html path a concrete fallback structure.
- **`<DtprElementDetail>`** exposes named slots `#overlay`, `#after-description`, `#after-variables`, `#after-citation`. Accepts `descriptionHtml` prop (pre-rendered markdown) or falls back to plain text with `interpolateSegments` highlighting. **Security contract for `descriptionHtml`**: the prop is documented as **trusted HTML only** — callers MUST sanitize (via DOMPurify or server-side equivalent) before passing. The library binds it via `v-html` without additional sanitization. The plain-text fallback path (used when `descriptionHtml` is not provided) always escapes. Unit 4 includes a test asserting that a `<script>` tag in `descriptionHtml` is rendered verbatim (confirming trust boundary is documented, not silently enforced). This choice keeps the library's bundle small (no bundled sanitizer) while making the caller's responsibility explicit. An alternative — bundle DOMPurify in `@dtpr/ui/core` and sanitize on behalf of callers — is deferred unless a downstream consumer needs it.
- `<DtprCategoryNav>` is **descoped from v1** (no consumer); restore when taxonomy-style consumers arrive.
- **States on `<DtprElementDetail>`**: viewing (default), value-missing-for-required-variable (inline warning), icon-load-error (hexagon fallback via `<DtprIcon>` `@error` handler).

**Patterns to follow:**
- `app/tailwind.config.ts:1-57` — brand token values (`dtpr-green`, `dtpr-blue`, `dtpr-red`, Red Hat Text)
- `app/components/TaxonomyLayout.vue` — current element-rendering patterns to match (at UX level)
- Vue 3 `<script setup lang="ts">` conventions already in `app/components/`

**Test scenarios:**
- Happy path `DtprIcon`: renders `<img src alt>` with provided props
- Edge case `DtprIcon` empty src: renders hexagon fallback data URI
- Edge case `DtprIcon` icon-load-error event: swaps to hexagon fallback
- Edge case `DtprIcon` decorative (`alt=""`): renders empty alt, no `role="img"` announcement
- Happy path `DtprElement`: renders interpolated title + icon
- Happy path `DtprElementDetail`: renders title, descriptionHtml slot, variables list, citation
- Edge case `DtprElementDetail` variable with empty required value: inline warning element rendered with role="alert" (or similar)
- Integration `DtprElementDetail`: `#overlay` slot replaces icon+title as origin-document R9 specifies
- Integration `DtprElementDetail`: `#after-description`, `#after-variables`, `#after-citation` slots render in correct positions
- Happy path `DtprCategorySection` collapsed by default: panel `hidden`, `aria-expanded="false"`
- Happy path `DtprCategorySection` click header: toggles, `aria-expanded="true"`, panel visible
- Edge case `DtprCategorySection` keyboard: Enter on header toggles, Space on header toggles, other keys do nothing
- Happy path `DtprCategorySection` `disableAccordion` prop: always expanded, no button role
- Happy path `DtprDatachain`: renders category sections in provided order
- Edge case `DtprDatachain` empty: renders `#empty` slot; no default text
- Happy path `DtprElementGrid`: renders elements in responsive grid layout (container-query driven)
- Integration A11y: `<button aria-expanded aria-controls>` not `<div tabindex="0">`; `<DtprIcon>` always has `alt` attribute
- Integration: variable-type rendering — `url` variable with `https://...` renders as `<a href rel="noopener noreferrer">`; `url` variable with `javascript:...` falls back to text render; `boolean` renders as `<span data-value>`; `date` renders as `<time datetime>`; unknown type renders as text with `data-dtpr-unknown-type` attribute
- Integration: single-open accordion — `<DtprDatachain v-model:openSectionId="id">` controls which child `<DtprCategorySection>` is expanded; clicking a different section's header updates the model and collapses the previous section
- Integration: container query — primitive in 300px container renders compact, in 800px container renders roomy (use test renderer with fixed container widths)
- Integration: `styles.css` import — file exists at `dist/vue/styles.css` post-build, contains `@layer dtpr` wrapping

**Verification:**
- All tests green; `@vue/test-utils` assertions pass
- Post-build `dist/vue/index.d.ts` contains component prop types derived from `<script setup lang="ts">` via `vue-tsc`
- `dist/vue/styles.css` exists as single file (R16), contains `@layer dtpr`

---

- [ ] **Unit 5: `@dtpr/ui/html` — Vue SSR wrapper + document shell**

**Goal:** A thin wrapper around `@vue/server-renderer`'s `renderToString` that produces a full `<!doctype html>` document wrapping the `<DtprDatachain>` Vue SSR body output, with inline `<style>` (compiled stylesheet) and inline `<script>` (vanilla JS accordion). Per Unit 0.5, the Vue SFCs from `/vue` are the single source of truth — no parallel HTML string functions.

**Requirements:** R3, R10, R16 (inline style block), R20 (ARIA by construction via shared Vue SFCs).

**Dependencies:** Unit 4. Uses `@vue/server-renderer` + `vue` at runtime.

**Files:**
- Create: `packages/ui/src/html/document.ts` — single entry: `renderDatachainDocument(sections, options?): Promise<string>`. Imports `<DtprDatachain>` from `../vue`, calls `createSSRApp` + `renderToString`, wraps in doctype shell.
- Create: `packages/ui/src/html/styles.ts` — exports the compiled `styles.css` content as a string via `import stylesCss from '../vue/styles.css?raw'` (Vite asset-as-string).
- Create: `packages/ui/src/html/script.ts` — exports vanilla JS accordion handler as an IIFE string (delegated click + keydown on `[data-dtpr-collapsible]`).
- Create: `packages/ui/src/html/index.ts` — re-exports `renderDatachainDocument`.
- Test: `packages/ui/src/html/document.test.ts` — asserts (a) output starts with `<!doctype html>`, (b) single inline `<style>` + single inline `<script>`, (c) adversarial XSS fixture is escaped by Vue's default text-node handling.
- Test: `packages/ui/src/html/accordion.test.ts` — jsdom loads the rendered doc, dispatches click/Enter/Space on `[data-dtpr-collapsible]` → `aria-expanded` flips, `hidden` attribute toggles on panel.

**Approach:**
- One function: `renderDatachainDocument(sections, options?)` → Promise<string>.
  1. `createSSRApp(DtprDatachain, { sections })` from `../vue`.
  2. `await renderToString(app)` produces the body HTML.
  3. Wrap: `<!doctype html><html lang="{locale}"><head>…<style>{stylesCss}</style></head><body>{body}<script>{accordionScript}</script></body></html>`.
- **HTML escape safety** is inherited from Vue's text-interpolation — Vue escapes text nodes and attribute values automatically. `v-html` is the only unsafe path; `<DtprElementDetail>` documents `descriptionHtml` as trusted-HTML-only (caller-sanitized). A test fixture feeds `<script>alert(1)</script>` into a plain-text prop and asserts the rendered output contains `&lt;script&gt;`, not `<script>`.
- **Accordion script** listens at document level for `click` on `[data-dtpr-collapsible]`, reads `aria-controls`, toggles target panel's `hidden` attribute + updates `aria-expanded`. Also handles Enter/Space keydown.
- **Locale attribute** comes from `options.locale ?? 'en'`.
- **Unscoped CSS** is a requirement enforced in Unit 4 — no `<style scoped>` in SFCs (prevents `data-v-*` hydration noise in Worker-side SSR output).

**Patterns to follow:**
- Unit 0.5 spike at `api/spike/worker.ts` — the document shell wrapper pattern is already validated. Lift it into this file.

**Test scenarios:**
- Happy path: 10-section × 3-element fixture produces full HTML doc starting with `<!doctype html>`, ending with `</html>`.
- Happy path: `<style>` appears exactly once, `<script>` appears exactly once (regardless of section count).
- Integration: jsdom loads rendered doc, `document.querySelector('[data-dtpr-collapsible]').click()` → target panel's `aria-expanded` flips from `false` to `true`, `hidden` attribute toggles.
- Integration: keydown Enter on button → same toggle.
- Integration: keydown Space on button → same toggle.
- Edge case XSS: section title containing `<script>alert('x')</script>` renders as `&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;` in output.
- Edge case empty datachain: no sections → body contains only the empty-state placeholder element (`<p class="dtpr-empty" role="status">`).
- Performance smoke: p99 render for 30-element fixture under 50 ms in Node (matches Unit 0.5 Worker measurement).

**Verification:**
- `pnpm --filter @dtpr/ui test` green.
- `dist/html/index.d.ts` exports `renderDatachainDocument` with correct types.
- Output byte size for 30-element fixture is under 20 KB (was ~5 KB in spike).

---

### Phase 3 — v1 Consumers

- [ ] **Unit 6: `@dtpr/api` MCP `render_datachain` tool + self-contained server bootstrap**

**Goal:** New MCP tool that produces an MCP App iframe-compatible HTML resource from a datachain. Registers the rendered HTML via `@modelcontextprotocol/ext-apps` (or native `@modelcontextprotocol/sdk@1.29` `registerResource` — chosen in Unit 0.5), returns `_meta.ui.resourceUri` in tool result. **Self-contained: this unit ships whatever minimum MCP server wiring the `render_datachain` tool needs, independent of the sibling plan's Unit 10.** If sibling Unit 10 lands first, Unit 6 registers its tool on the existing server. If Unit 6 lands first, it ships the server; sibling Unit 10 adds its 7 read-side tools to the same server. Either way the composition is additive Hono route mounting + tool registration — no cross-plan sequencing. Satisfies R11 and R13.

**Requirements:** R10, R11, R13.

**Dependencies:** Unit 5 (`@dtpr/ui/html` wraps Unit 4's Vue SFCs via Vue SSR — confirmed feasible in Unit 0.5). Sibling plan's Unit 10 is **no longer a hard blocker** — Unit 6 composes additively with whatever server state exists in `api/` at start time.

**Files:**
- Modify: `api/package.json` — add `@modelcontextprotocol/ext-apps` dep (or none, if Unit 0.5 chose native `registerResource`), add `@dtpr/ui` as `workspace:*` dep
- Create or Modify: `api/src/mcp/server.ts` — if the file does not yet exist (sibling Unit 10 not merged), create the minimum server with `@hono/mcp` `StreamableHTTPTransport` + an `McpServer` instance, mounted on a `/mcp` route in the existing `api/src/app.ts`. If the file exists (sibling Unit 10 landed), modify additively to register the new tool. **Idempotent composition** is the design goal — no conditional wiring, just additive registration calls.
- Create: `api/src/mcp/tools/render_datachain.ts` — tool handler
- Create: `api/src/mcp/resources/datachain_resource.ts` — UI resource registration (stable URI `ui://dtpr/datachain/view.html` with `readCallback`, OR per-call URI — finalized in Unit 0.5)
- Modify: `api/src/app.ts` — mount `/mcp` route if not already mounted
- Test: `api/test/mcp/render_datachain.test.ts`
- Test: `api/test/mcp/server-compose.test.ts` — asserts the server bootstrap is idempotent (calling the setup twice doesn't register duplicate tools; sibling Unit 10's future tools compose cleanly)

**Approach:**
- Tool signature: `render_datachain({ version: string, datachain: DatachainInstance, locale?: string })` → returns `{ content: [{type:'text', text:'<summary>'}], _meta: { ui: { resourceUri: 'ui://dtpr/datachain/view.html', csp: {...} } } }`
- Handler flow (aligned to `@modelcontextprotocol/ext-apps@1.6.x` actual API — `registerAppResource(server, name, uri, config, readCallback)`):
  1. At server startup (not per tool call), register a **stable resource URI** `ui://dtpr/datachain/view.html` via `registerAppResource` with a `readCallback` that reads per-session rendering state.
  2. In the tool handler: validate `datachain` via `@dtpr/ui/core`'s `validateDatachain(version, datachain)` (which wraps `@dtpr/api/src/validator/validateInstance` — see Unit 3, for both structural Zod and semantic category-ref / variable rule checks).
  3. Load the pinned schema version's categories from R2 / inline-fallback (existing sibling-plan behavior).
  4. Call `@dtpr/ui/html`'s `renderDatachainDocument(datachain, categories, locale, options)` → full HTML string.
  5. Store the rendered HTML keyed by a per-call token in session-scoped storage; the `readCallback` returns the HTML for the current token.
  6. Return tool result with text body (agent-readable summary, variable values **XML-tag-wrapped** per sibling-plan's `<dtpr_element>` provenance pattern to prevent prompt injection via agent-supplied variable values) + `_meta.ui.resourceUri` with the tool-call token as a query fragment if needed.
- **Alternative**: register a fresh URI per call with `SHA-256(version + datachain.id + locale + nonce)` as the suffix; choice between stable-URI-with-callback vs per-call-URI finalized during implementation based on `@hono/mcp` transport session semantics (see sibling-plan Unit 10's transport shape).
- `_meta.ui.csp` declares no external origins (all content inline) — default restrictive policy.
- Error envelopes reuse the sibling plan's typed error format (origin R20a).
- **Compatibility spike prerequisite**: before Unit 6 implementation begins, verify (a) `@modelcontextprotocol/ext-apps` installs and bundles inside the Cloudflare Worker (no DOM / Node-only deps blocking), (b) its `App` wrapper composes cleanly with `@hono/mcp`'s `StreamableHTTPTransport`. If either fails, fall back to registering the HTML resource directly via `@modelcontextprotocol/sdk@1.29`'s native `registerResource` primitive — `ext-apps` is a convenience wrapper, not required.

**Patterns to follow:**
- `docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md` Unit 10 — MCP tool registration pattern (typed envelopes, tool schema shape) — **reference only**; Unit 6 does not block on or import from it
- `api/src/schema/datachain-instance.ts` — DTPR datachain instance shape
- `api/src/app.ts` — existing Hono app; mount `/mcp` additively

**Test scenarios:**
- Happy path: valid datachain + version → tool result has `_meta.ui.resourceUri` pointing at `ui://dtpr/datachain/*`
- Happy path: reading the registered resource via MCP `resources/read` returns full HTML doc starting with `<!doctype html>`
- Happy path: resource mime type is `text/html;profile=mcp-app`
- Integration: agent text body includes an enumerable summary of each category and element
- Error path: invalid version (not matching `{type}@YYYY-MM-DD[-beta]` regex) → typed error envelope, no resource registered
- Error path: datachain fails Zod validation → typed error envelope including Zod issue list, no resource registered
- Integration: `_meta.ui.csp` contains no external domains (empty or unset `connectDomains`, `frameDomains`, etc.)
- Edge case: empty datachain (0 elements) → renders empty-state doc, still returns valid resource URI
- Integration: snapshot of tool response shape — ensures `_meta.ui.resourceUri` key is stable for agent-client compatibility

**Verification:**
- MCP integration test loads the rendered resource in a jsdom iframe, asserts `<button aria-expanded>` is present and clickable (end-to-end accordion works in MCP iframe mock)
- `pnpm --filter @dtpr/api test` passes end-to-end

---

### Phase 4 — Equivalence Verification

- [ ] **Unit 7: Vue SSR document-shell smoke test**

**Goal:** Prove the success criterion "Two surfaces, one logic" — since Path B was adopted in Unit 0.5, both Vue client-side rendering and Worker-side HTML output derive from the same `<DtprDatachain>` SFC. Equivalence is true by construction; this unit verifies the document shell wraps cleanly and the shared fixture produces stable snapshots.

**Requirements:** Success criterion "Two surfaces, one logic"; R20 (ARIA parity).

**Dependencies:** Unit 4, Unit 5.

**Files:**
- Create: `packages/ui/test/fixtures/datachain-sample.ts` — pinned `ai@2026-04-16-beta` fixture (reusable across unit tests).
- Create: `packages/ui/test/fixtures/categories-sample.ts`.
- Create: `packages/ui/test/document-shell.test.ts` — snapshot + assertions on the rendered document.

**Approach:**
- Render the shared fixture via `renderDatachainDocument` and snapshot.
- Assert: single `<!doctype html>` declaration, single `<style>`, single `<script>`, `<DtprCategorySection>` emits `<button aria-expanded aria-controls>` + `<div role=region>` panel (ARIA invariants from R20).
- Also assert each element has a stable `id` on its `<section>` wrapper for deep-linking parity.

**Test scenarios:**
- Happy path: fixture renders; snapshot matches committed reference.
- ARIA parity: every section has `<button aria-expanded>` + `<div role="region" aria-labelledby/aria-controls>` pair.
- Deep-link parity: section `id` attributes follow `ai__<category_id>` pattern for all sections.
- Edge case: empty fixture → single empty-state placeholder in body, no sections.

**Verification:**
- Snapshot matches; test passes.
- Updating the snapshot requires intentional regeneration (`pnpm test:update-snapshots`).

## System-Wide Impact

- **Interaction graph:**
  - `@dtpr/api/schema` is newly consumed by `@dtpr/ui/core`, which is newly consumed by `@dtpr/ui/vue` and `@dtpr/ui/html`, which are newly consumed by `@dtpr/api`'s MCP server (Unit 6). The Worker runtime is modified only to mount the `/mcp` route (if not already mounted by the sibling plan) and register the `render_datachain` tool + datachain resource. `app/` is untouched in v1.
  - The sibling plan (`docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`) was originally expected to deliver the MCP server that Unit 6 attaches to. **That hard dependency is now removed**: Unit 6 ships a self-contained MCP server bootstrap that composes additively with sibling Unit 10's future tools. Either plan can land first; composition is idempotent.
- **Error propagation:**
  - `validateDatachain` in core returns `{success, errors}` — consumers do not throw on validation failure; UI and MCP tool render error states.
  - MCP tool errors use a typed error envelope pattern (aligned with sibling-plan Unit 10's shape when that lands; this plan establishes the shape independently).
- **State lifecycle risks:**
  - No persistent state introduced. `@dtpr/ui` is stateless beyond component-local `<DtprCategorySection>` expanded state (controlled via prop + emit).
  - MCP UI resources are registered per-tool-call; registry lifecycle is owned by `@modelcontextprotocol/ext-apps`.
- **API surface parity:**
  - Library Vue DOM output and HTML string output enforce parity via Unit 7 snapshot tests (or trivial-by-construction if Unit 0.5 selects Path B).
  - `@dtpr/api/schema` is newly a public (workspace-internal) library — changes to its type exports are breaking for `@dtpr/ui/core`.
- **Integration coverage:**
  - Unit 5 jsdom accordion-behavior test proves interactive script works end-to-end.
  - Unit 6 MCP-iframe render test proves the tool response → resource → HTML fetch cycle.
  - `app/` migration equivalence test is deferred with that migration.
- **Unchanged invariants:**
  - `app/server/api/dtpr/v0|v1` endpoints continue to serve unchanged (Scope).
  - `app/content/dtpr.v1/` tree is not modified by this plan. `app/pages/taxonomy/ai.vue` continues to consume Nuxt Content unchanged in v1 (migration deferred).
  - `@dtpr/api` Worker bundle shape and wrangler config are untouched; only an additive `tsup`-compiled `dist/schema/` directory and new MCP tool module are added.
  - `hp-app/apps/guide-app` and `hp-app/apps/admin` are not touched (separate repo; deferred R14/R15).

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| **Worker build breaks when `api/package.json` gains `exports` field** (exports becomes exclusive; wrangler resolution might flip) | Unit 2 includes a regression test asserting `pnpm --filter @dtpr/api build` (wrangler dry-run) and `test:workers` continue to pass. Land Unit 2 behind a preview deploy. |
| ~~MCP Apps SDK contract drift~~ | **Resolved in Unit 0.5.** `@modelcontextprotocol/ext-apps@1.6.0` registered tool + resource end-to-end under `nodejs_compat`; all MCP methods returned expected shapes. Pin exact version in Unit 6; revisit on minor bumps. |
| ~~`@modelcontextprotocol/ext-apps` Cloudflare Worker compatibility unverified~~ | **Resolved in Unit 0.5.** Full bundle is 1.5 MB raw / 278 KB gzipped with Vue SSR + MCP SDK + ext-apps + Hono + zod — well under the 10 MB Worker limit. |
| ~~Vue SSR snapshot brittleness in Unit 7~~ | **Mitigated by Path B adoption in Unit 0.5.** Single renderer eliminates Vue-vs-html drift. Unscoped CSS requirement in Unit 4 removes `data-v-*` noise. Unit 7 is now a smoke test, not a cross-renderer diff harness. |
| ~~Toolchain end-to-end untested at Unit 1 time~~ | **Resolved in Unit 0.5.** Real `DtprIcon.vue` + `core/extract` built through Vite library mode + `vite-plugin-dts`; full prop types emitted. Unit 1 inherits the working config. |
| **Sibling-plan Unit 10 (MCP server) not yet merged when Unit 6 begins** | **No longer a hard blocker.** Unit 6 ships a self-contained MCP server bootstrap and composes additively with sibling Unit 10's future tools. Either plan can land first. The only residual risk is minor divergence in server wiring shape (transport config, route mount); mitigated by following `@hono/mcp` conventions documented in the sibling plan even while it is unmerged. |
| **MCP Apps SDK spec evolution (SEP-1865 still relatively new)** | Pin `@modelcontextprotocol/ext-apps` to the exact version at Unit 6 time; revisit with each minor bump. |
| **Vue SSR runtime divergence on non-Chromium agents** — the spike proved workerd works; agent clients outside Chromium (other browsers/native clients) may not yet support full MCP Apps iframes. | Out of scope — the MCP Apps contract is the iframe host's concern, not the library's. The library produces correct HTML; how agents display it is the client's problem. |
| **First `.d.ts`-emitting package in the repo — no precedent** | Accept the extra tooling cost (Vite library mode + vite-plugin-dts + tsup for schema). Document the pattern in `packages/ui/README.md` so future library packages can copy it. |
| **Hexagon fallback data URI visual drift from current `/icons/dtpr-hexagon.png`** | Port the existing PNG to URL-encoded SVG during Unit 3; include a visual-comparison test (render PNG next to SVG in a one-off check during implementation). |
| **Neutrality governance erodes under time pressure (R2)** | `pnpm --filter @dtpr/ui check:neutrality` runs in CI; contributors get a grep-level fail on `clarable|pinia|admin-` in public exports. Humans enforce the prose justification rule in review. |

## Documentation / Operational Notes

- **`packages/ui/README.md`** — consumer usage (one section per subpath), token reference, consumer-side `@layer` ordering recipe, R2 neutrality governance checklist with justification template.
- **`api/README.md`** — add a short "Exports" section noting the new `@dtpr/api/schema` subpath. Note that the Worker runtime is unchanged.
- **`app/` docs** — untouched in v1; `app/pages/taxonomy/ai.vue` migration is deferred. Update when that plan ships.
- **No migration runbook needed** — this is in-repo workspace consumption only; no deploy-order or data-migration gate.
- **CI:** add a `packages/ui` filter to the existing test matrix. Root `test:ui` script matches the existing `pnpm --filter ./<workspace> test` convention.
- **Versioning:** `@dtpr/ui` ships at `0.1.0` (private, workspace-only). Track breaking changes in a `CHANGELOG.md` even though not published, so future external publishing has a history.
- **Demo feed:** Unit 6 (MCP App) is the v1 proof point and directly feeds the sibling plan's wow-factor demo. All v1 units serve that path; `app/` taxonomy migration is explicitly out-of-v1 to keep focus on the demo.

## Sources & References

- **Origin document:** [`docs/brainstorms/2026-04-17-dtpr-component-library-brainstorm.md`](../brainstorms/2026-04-17-dtpr-component-library-brainstorm.md)
- **Sibling plan (MCP server dependency for Unit 6):** [`docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`](./2026-04-16-001-feat-dtpr-api-mcp-plan.md)
- **Current code references:**
  - `api/src/schema/element.ts`, `api/src/schema/category.ts`, `api/src/schema/datachain-instance.ts`, `api/src/schema/index.ts` (schema source of truth)
  - `api/package.json` (Zod 4, MCP SDK), `api/tsconfig.json` (Bundler resolution, noEmit), `api/wrangler.jsonc` (Worker config)
  - `api/vitest.config.ts` + `api/vitest.cli.config.ts` (test patterns)
  - `app/pages/taxonomy/ai.vue`, `app/components/TaxonomyLayout.vue`, `app/components/ElementSection.vue` (migration targets)
  - `app/content.config.ts` (current Nuxt Content shape)
  - `app/tailwind.config.ts` (brand tokens to mirror)
  - `app/vitest.config.ts` (Vitest projects pattern)
  - `pnpm-workspace.yaml` (extend with `packages/*`)
  - `package.json` (root, pnpm-filter script pattern)
- **External references:**
  - MCP Apps spec (SEP-1865): https://modelcontextprotocol.io/extensions/apps/overview
  - `@modelcontextprotocol/ext-apps` package: https://github.com/modelcontextprotocol/ext-apps
  - Zod v3/v4 coexistence: https://zod.dev/v4/versioning
  - Vite library mode: https://vitejs.dev/guide/build.html#library-mode
  - `vite-plugin-dts`: https://github.com/qmhc/vite-plugin-dts
  - MDN `@layer`: https://developer.mozilla.org/en-US/docs/Web/CSS/@layer
  - MDN container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
