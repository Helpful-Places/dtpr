---
date: 2026-04-17
topic: dtpr-component-library
---

# DTPR Component Library (`@dtpr/ui`)

## Problem Frame

DTPR has four presentation surfaces — three in code today, a fourth imminent — that all present or edit the same underlying standard:

| Surface | Location | Role |
|---|---|---|
| Public taxonomy browser | `app/pages/taxonomy/ai.vue` → `app/components/TaxonomyLayout.vue` (dtpr.io Nuxt app) | Browse the standard (categories + elements, searchable) |
| Public datachain display | `hp-app/apps/guide-app/app/components/DtprAiDatachain.vue` + `DtprAiDatachainCategory.vue` + `DtprElement.vue` | Render one algorithm's datachain for end users |
| Admin datachain editor (Clarable) | `hp-app/apps/admin/components/algorithm_datachain/*` | Compose / edit a datachain (search, edit variables, AI rationale, delete) |
| MCP App (new) | `@dtpr/api` MCP tool responses | Render a datachain inside an agent conversation |

Two pressures converge:

**Data-shape convergence.** `@dtpr/api` is becoming the canonical source of shape for DTPR content — versioned schemas (`ai@YYYY-MM-DD[-beta]`), Zod-derived types, R2-hosted JSON bundles. Every current surface today consumes a different shape: `app/` uses Nuxt Content's flat markdown frontmatter (`name`, `description`, `category[]`, `icon: string`); `guide-app` consumes hp-app backend shapes; admin consumes another shape via Pinia. All of these will migrate to `@dtpr/api`'s shape over time. Without a shared presentation library, each surface handles that migration independently and reinvents the same display-prop derivation.

**Duplicated helpers, today.** Within `hp-app/apps/*` two surfaces already reimplement the same display primitives with divergent signatures:
- Localisation — `useDtprLocale` / `getLocalizedValue` / `extract` / `extractWithLocale` as separate copies in `guide-app` and `admin`
- Variable interpolation — `interpolateVariables` (plain string) vs. `useVariableInterpolation` + `InterpolatedText` (segmented)
- Category grouping / sort — `groupElementsByCategory`, `sortCategoriesByOrder`, `findCategoryDefinition`
- Icon fallback (`/icons/dtpr-hexagon.png`)
- Accountable-category / Canada / organization-as-element special cases

**Minimum viable response** to the "today" pressure is a shared helpers package. **The larger shape proposed here** is sized to the "tomorrow" pressure — an MCP-App surface arriving now, plus the fact that every schema bump from `@dtpr/api` will otherwise need to be re-handled in three UIs. A shared presentation layer buys lock-step for the schema-driven parts of each surface.

## Requirements

**Strategic posture**

- R1. The library is shipped as an **internally consolidated presentation SDK**, shaped from day one so it can be published publicly later if adoption outside Helpful Places materialises. No public npm release in v1 or v2. The architectural decisions below are defended on their own merits (separation of data logic from rendering, MCP needing framework-free HTML, internal consolidation) — not on a commitment to future external distribution.
- R2. The library must not bake in proprietary behaviour specific to Clarable (`admin`). Clarable-specific compositions (AI-rationale store binding, commercial-tier editor features, Pinia store wiring) compose on top of generic primitives exported from the library. **Governance:** new exports to `@dtpr/ui` require a neutrality check — a brief written justification of generic applicability. Under time pressure this is the first thing that erodes, so it lives in the requirements rather than as a convention.

**Architecture**

- R3. The library is **one package — `@dtpr/ui`** — with **subpath exports** providing layered separation:
  - **`@dtpr/ui/core`** — framework-neutral TypeScript. Owns all data logic: locale extraction, variable interpolation (string + segmented forms), category grouping / sort, element display-prop derivation, validation helpers built on `@dtpr/api`'s Zod modules. Zero framework dependencies.
  - **`@dtpr/ui/vue`** — Vue 3 components that consume `@dtpr/ui/core`. The interactive renderer for all current Vue consumers.
  - **`@dtpr/ui/html`** — server-side HTML-string renderer that consumes the same `@dtpr/ui/core` functions. Emits static HTML + inline vanilla JS (see R10) for interactive affordances. Used by `@dtpr/api` MCP tools so agent-conversation iframes get consistent output without Vue in the Worker bundle.
- R4. Subpath barriers are real, not cosmetic. `@dtpr/ui/core` has zero framework dependencies and is independently tree-shakable; `@dtpr/ui/vue` and `@dtpr/ui/html` import from it but not from each other. A later split into separate packages (`@dtpr/core`, `@dtpr/vue`, `@dtpr/html`) is mechanical if a concrete forcing function (independent versioning, external-consumer friction) emerges — but is not done upfront.
- R5. A future `@dtpr/ui/react` subpath is explicitly anticipated but out of scope. The layered design exists so a React port is limited to re-authoring components, not logic.

**Source of truth for types**

- R6. `@dtpr/api` exposes a **`./schema` subpath export** in its `package.json` that surfaces only its Zod modules + inferred TypeScript types (no Worker runtime). `@dtpr/ui` depends on `@dtpr/api` via `workspace:*` and imports types from `@dtpr/api/schema`. No separate `@dtpr/schema` package is created *unless* the spike in Outstanding Questions shows it is required.
- R7. Schema-version awareness is a first-class input. Components and core functions accept the parsed schema version's manifest + elements + categories as data inputs, not globals. Consumers pinning `ai@2026-04-16-beta` get the primitives behaving consistently against that version.

**v1 scope — `@dtpr/ui/core` + `@dtpr/ui/vue` + `@dtpr/ui/html`**

- R8. **`@dtpr/ui/core`** (v1) ships:
  - `extract(localized, locale, fallback?)` and `extractWithLocale(localized, locale)` — locale fallback chain is: exact-match locale → `en` → first-available → empty string (deterministic; documented in the function contract).
  - `interpolate(template, vars)` — string output.
  - `interpolateSegments(template, vars)` — array output for segmented rendering (highlighted variables, missing-variable placeholders).
  - `groupElementsByCategory(elements)`, `sortCategoriesByOrder(grouped, categories)`, `findCategoryDefinition(id, categories)`.
  - `deriveElementDisplay(element, instance, locale, options)` returning `{ title, description, icon, iconAlt, variables, citation }`, where each `variable` has `{ id, label, value, type }` — `type` drawn from the schema's variable-type enum so renderers can branch on text / URL / boolean / etc.
  - `validateDatachain(version, datachain)` wrapping `@dtpr/api`'s Zod validator.
  - Accountable-category + organization-as-element resolution is deferred until the schema defines the `organizations` concept (see Dependencies). For v1, `<DtprElementDetail>` slots accept accountable-specific overlays so consumers can inject `CanadaAccountableBadge`-style content without forking.
- R9. **`@dtpr/ui/vue`** (v1) ships these **compositional primitives** (not full-page browsers):
  - `<DtprIcon>` — icon + alt + size, with hexagon fallback. The fallback image is a **data URI embedded in the package** so no consumer-side asset is required.
  - `<DtprElement>` — compact figure (icon + interpolated title).
  - `<DtprElementDetail>` — full element view (icon, interpolated title, markdown description, variables by type, citation). **Named slots:** `#overlay` (replaces icon+title, for Canada/accountable badges), `#after-description`, `#after-variables`, `#after-citation`. **States:** viewing (default), value-missing-for-required-variable (inline warning), icon-load-error (hexagon fallback).
  - `<DtprCategorySection>` — category header + prompt + elements list + between-section chain-connector slot. **Collapsible by default**, single-open accordion pattern (matches current guide-app UX), click or Enter on header toggles, first-element preview visible when collapsed. Accordion behaviour can be disabled via prop for contexts that want always-expanded layout.
  - `<DtprDatachain>` — composition of category sections. Named `#empty` slot for zero-elements state; no default copy is shipped.
  - `<DtprElementGrid>`, `<DtprCategoryNav>` — primitives for taxonomy browser use. `<DtprCategoryNav>` exposes per-category counts as a data prop; the consumer renders the navigation UI (sticky positioning, drawer, etc.) with its own design system.
- R10. **`@dtpr/ui/html`** (v1) ships string-rendering functions for each Vue primitive. Each top-level render emits a single `<style>` block (not per-fragment — avoids duplication when a full datachain composes many sections) and a single `<script>` block with inline vanilla JS implementing the expand/collapse interaction that matches `<DtprCategorySection>`. No external script or stylesheet references. Output is CSP-inline-allowed, iframe-safe, and renders with no dependencies.
- R11. The `@dtpr/api` MCP server gains a tool (exact name TBD in planning) that returns a `@dtpr/ui/html`-rendered datachain HTML string for a given datachain + schema version. This tool depends on the MCP server delivered by the sibling `@dtpr/api` plan (`docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`, Unit 10 "MCP server + 7 read-side tools"), but is itself a **new unit not in that plan today**. It is planned as part of this library's planning work, owned by this brainstorm.

**v1 consumer migration (in-repo)**

- R12. **`app/pages/taxonomy/ai.vue`** (dtpr.io Nuxt app) is rewritten to consume `@dtpr/api` for categories + elements and `@dtpr/ui/vue` for DTPR-specific rendering. This is a **data-source migration plus UI migration** — current shape is Nuxt Content frontmatter (`name`, `description`, `category[]`, `icon: string`, `dtpr_id`); target shape is `@dtpr/api` (`title: LocaleValue[]`, `description: LocaleValue[]`, `category_ids`, `icon: {url, format, alt_text}`, `id`). Search-and-filter code in `TaxonomyLayout.vue` is rewritten against the new shape; layout chrome (sticky header, UHorizontalNavigation / UVerticalNavigation, mobile drawer, toast) stays in the Nuxt app.
- R13. An **MCP App surface** (greenfield) is introduced in `@dtpr/api` using `@dtpr/ui/html` to render datachain output inside agent-conversation iframes.

**Later-phase consumer migrations (after v1 lands)**

- R14. **`guide-app/app/components/DtprAiDatachain.vue` and its children** migrate to `@dtpr/ui/vue` after `guide-app`'s cross-repo consumption strategy lands (see Outstanding Questions). This migration is expected — not "if" — but its timing is not gated by v1's ship date.
- R15. **`admin` (Clarable)** migrates in a later phase that depends on (a) v2 editor primitives and (b) cross-repo consumption. Admin-specific compositions (AI-rationale accordion, Pinia store adapter, drag-handle integration, organization-as-element UI, commercial-tier UX) stay in `admin` and compose with library primitives.

**Styling & accessibility**

- R16. `@dtpr/ui` ships a **default visual identity** as a single compiled stylesheet imported via `@dtpr/ui/vue/styles.css` (and inlined by `@dtpr/ui/html` top-level renders). No Tailwind dependency at consume-time. Internal authoring may use Tailwind and emit compiled CSS at build. **Specificity:** library styles are wrapped in `@layer dtpr { ... }` and use a `dtpr-` class prefix so host Tailwind's reset / base layer does not collide.
- R17. Theming is via **CSS custom properties** (`--dtpr-color-accent`, `--dtpr-color-border`, `--dtpr-font-heading`, `--dtpr-font-body`, `--dtpr-space-*`, `--dtpr-radius-*`). Consumers override tokens on a wrapping element. The MCP iframe, `app/`, `guide-app`, and `admin` each ship their own token override if they want.
- R18. The library exposes **compositional primitives, not full-page browser shells**. Boundary criterion: anything that requires DTPR schema knowledge (category names, element counts per category, sort order, grouping) lives in `@dtpr/ui`. Anything that requires application chrome (sticky positioning, Nuxt UI navigation components, clipboard / toast / auth / analytics, URL hash management, scrollspy) lives in the consumer.
- R19. Primitives use responsive CSS via **container queries**, not viewport media queries — so primitives render well inside any container size (iframe, sidebar, full-page). Minimum interactive touch target size is 44×44 px for click/tap targets in primitives.
- R20. **Accessibility target: WCAG 2.1 AA.** Interactive elements use semantic HTML (`<button>`, not `<div tabindex="0">`). `<DtprCategorySection>` implements `aria-expanded` + `aria-controls`. `<DtprIcon>` always renders a non-empty `alt` for meaningful icons, `alt=""` for decorative-only use. `@dtpr/ui/html` output includes the same ARIA attributes as the Vue DOM output.

**Packaging and distribution**

- R21. `@dtpr/ui` lives in this monorepo as a pnpm workspace at `packages/ui/`, sibling to `api/`. `pnpm-workspace.yaml` today uses explicit entries (`app`, `api`, `docs-site`, `studio`); it is extended with a `packages/*` glob — additive change, does not affect the four existing entries.
- R22. Internal consumers depend on `@dtpr/ui` via `workspace:*`. `"private": true` stays on the `package.json`. External consumers (`guide-app`, `admin`) consume later — either via published packages (when the shape is validated) or via a cross-repo link strategy (see Outstanding Questions).

## Success Criteria

Each criterion is stated so a CI check or scripted grep can verify it.

- **Duplication eliminated in-repo.** After v1: grep across `app/` for `useDtprLocale`, `interpolateVariables`, `groupElementsByCategory`, `sortCategoriesByOrder`, `findCategoryDefinition`, and `/icons/dtpr-hexagon.png` (outside `packages/ui/`) returns zero matches. For hp-app-external consumers the equivalent check runs when they migrate.
- **Schema-version lock-step (calibrated).** When a new `ai@YYYY-MM-DD[-beta]` version is published that adds *additive content only* — new elements, new categories of known shape, new translations, new values for known variable types — no DTPR rendering or display-logic code changes are required in `app/` or the MCP App. *Structurally new fields or new visual primitives (e.g. a new citation type, a new variable type, AI-rationale fields) are acknowledged to require library-side work;* they are not covered by this criterion.
- **Two surfaces, one logic (v1).** The taxonomy page in `app/` and the MCP App iframe both render from `@dtpr/ui/core`. Snapshot tests: the semantic HTML of `@dtpr/ui/html` output matches the server-rendered DOM of `@dtpr/ui/vue` for a fixed datachain + schema version fixture. The "three surfaces" check becomes achievable once `guide-app` migrates in a later phase.
- **Consumer-context UX checks.** `app/` taxonomy page is reviewed against a browsing-on-dtpr.io user journey. MCP App output is reviewed inside an actual agent conversation. These are lightweight product checks, separate from the snapshot-equivalence test.
- **Neutrality verified.** The `@dtpr/ui` package exports surface is reviewed before any later publishing decision. Every export is accompanied by a one-line justification of generic applicability. Clarable-specific naming, props, or behaviors appear in zero exported symbols (`grep` exported symbols for `clarable`, `pinia`, `admin-*` returns none).

## Scope Boundaries

- **Not replacing `@dtpr/api`'s Zod schemas.** The library consumes them; it does not define them.
- **Not a full-page browser / application.** Compositional primitives only.
- **Not a design-system replacement for Nuxt UI.** `app/` and `admin` continue to use Nuxt UI in their own layout code.
- **Editor is not in v1.** No editor primitives, no schema-driven form derivation, no state-adapter contract. See v2 Considerations.
- **No React / web-components / Svelte adapter in v1 or v2.** Architecture supports them; shipping them is not in scope.
- **No public npm publish in v1 or v2.** Internal workspace consumption only.
- **The `device` datachain type is not migrated.** Matches `@dtpr/api`'s v1 scope.
- **Existing `app/server/api/dtpr/v0|v1` endpoints continue to serve unchanged.**
- **PDF / print renders, social-share cards, and docs-site embeds are not v1 consumers.** If they arrive later, `@dtpr/ui/html` is the expected host for the first two; docs-site embeds use `@dtpr/ui/vue` via Nuxt.
- **External consumer migrations (`guide-app`, `admin`) are expected but not gating v1 ship.**

## v2 Considerations (deferred for design space — not numbered requirements)

These are noted so planning has shape, not as v2 commitments. Each requires its own brainstorm/plan pass.

- **Editor primitives in `@dtpr/ui/vue`.** `<DtprElementPicker>` (search + add), `<DtprElementEditor>` (variable edit, locale-aware, segmented interpolation preview), `<DtprDatachainEditor>` (compose a chain). Drag-reorder, confirm-delete patterns exposed via primitives.
- **Schema-driven editor pattern.** Variable inputs, required-field indicators, and locale fallbacks derived automatically from the pinned schema version's Zod / JSON Schema. Ambition; requires a spike to confirm feasibility beyond flat-form fields.
- **AI-rationale primitive.** `<DtprAiRationale>` renders confidence, suggested, rationale, source references, variable rationale. **Depends on schema addition:** these fields do not exist on `ElementInstance` today. If they don't land, this primitive stays in admin.
- **Editor state-management contract.** Uncontrolled `v-model` vs. controlled callbacks vs. store-adapter interface. Resolve via prototyping admin's Pinia adapter against a v-model-based `<DtprElementEditor>` before committing.
- **Clarable boundary under editor pressure.** The clean conceptual line (generic primitive + Clarable composition) is hardest to hold once admin is shipping commercial features. Governance in R2 is the first line of defence; a neutrality review for new editor exports is the second.
- **Provisional v1 core API.** Because v1 consumers are all read-only, the v1 `@dtpr/ui/core` API has not been stress-tested by a mutating consumer. v2 may require core contract changes (e.g., derived validity/dirty state, fine-grained locale fallback for edit mode). The v1 core is considered provisional, not stable.
- **Clarable freeze during v1.** Admin should avoid adding new variants of the shared-concern helpers (localization / interpolation / grouping / accountable resolution) during v1. Without this, v2 migration grows.

## Key Decisions

- **Layered architecture** (core + vue + html) chosen over web-components and Vue-SSR-for-MCP. Layering separates data logic from rendering, keeps the MCP Worker bundle Vue-free, and makes a future React port cheap. Web-components would force admin to abandon Nuxt UI; Vue SSR would bake Vue into the Worker.
- **One package with subpath exports, not three separate packages.** The layered architecture is delivered via `@dtpr/ui/core`, `@dtpr/ui/vue`, `@dtpr/ui/html` subpaths. Three separate packages earn no benefit for the current consumer set and would triple the release / versioning / changelog surface. Splitting later is mechanical.
- **In-repo consumers first; external migrates later.** v1 proves the design with two in-repo consumers (`app/` taxonomy + MCP App) to avoid blocking on cross-repo consumption mechanics. Two proofs are less than the original three, but both are real and both ship.
- **`@dtpr/api/schema` subpath, not a new `@dtpr/schema` package.** Pending verification via spike (Outstanding Questions).
- **Compositional primitives over full-page components.** Consumers own chrome. Trades one duplication (helpers) for a smaller duplication (chrome) per consumer — acceptable because chrome varies meaningfully and the library can't satisfy all host design systems.
- **Tokens via CSS custom properties, not theme prop / Tailwind preset.** Works in every host environment, no build integration, overridable at any wrapper element.
- **Flexibility-first over DTPR-recognizable visual identity.** A consumer-themeable library ships first. A "DTPR embed has a recognizable look" play can come later via a default token theme that consumers adopt by choice, not by dependency.
- **`@dtpr/ui/html` emits static HTML + inline vanilla JS.** No external scripts or stylesheets, CSP-inline-allowed, accordion interactivity matches Vue behaviour. Keeps "iframe-safe + zero external deps" while preserving UX parity.
- **Clarable-proprietary features stay in `admin`.** The library never imports from `admin`; `admin` never forks a library primitive — it composes them. Governance (R2) is the active defence.

## Dependencies / Assumptions

- **Schema additions for v2 editor work are *planned*, not done.** `InstanceElementSchema` does not currently carry `ai_generation.{confidence, suggested, rationale, source_references, variable_rationale}`. Admin uses these fields in its UI (see `AlgorithmDatachainElementBase.vue`), which means either they live in admin's own Pinia store outside the API, or they need to be added to `@dtpr/api`'s schema. A library `<DtprAiRationale>` primitive (v2) depends on the schema addition landing; without it, the primitive stays in admin.
- **`organizations` concept must be defined in `@dtpr/api`** before `@dtpr/ui/core` can ship `resolveAccountable`. Currently no `organizations` schema exists. Deferred to when `@dtpr/api` addresses it.
- **Zod version alignment.** `@dtpr/api` uses `zod@^4.3.6`; `app/` uses `zod@^3.25.76`. Dual-Zod in `node_modules` produces incompatible `z.infer` types and runtime schema mismatches. Resolution options: (a) upgrade `app/` to Zod 4 alongside v1 work, (b) have `@dtpr/api/schema` export only inferred TS types and keep Zod instances internal. Resolve in planning.
- **`pnpm-workspace.yaml`** accepts `packages/*` glob alongside existing `api`, `app`, `docs-site`, `studio` entries — additive change.
- **MCP Apps SDK iframe contract** is unknown as of 2026-04-17. If the contract is iframe-HTML-fragment-shaped (as assumed), `@dtpr/ui/html` ships as spec'd. **Contingency:** if the contract requires structured JSON, React components, or remote-rendered templates, `@dtpr/ui/html` collapses into a helper under `@dtpr/ui/core` and R10/R11/R13 revisit — architecture decision is rechecked against the real contract.
- **R11/R13 sequencing.** The new HTML-rendering MCP tool (per R11) cannot ship before the sibling `@dtpr/api` plan's MCP server (Unit 10) lands. The tool itself is new scope planned alongside this library's v1, not inherited from the sibling plan.
- **Opportunity cost against `@dtpr/api` P3 demo.** The sibling plan's "wow-factor demo" is the declared north star for the API. This library's v1 MCP App work (R13) feeds that demo (a consistent rendered output makes the demo stronger). `app/` taxonomy migration (R12) and v2 editor work are separable and can be sequenced after the demo lands if capacity is tight.

## Outstanding Questions

### Resolve Before Planning

- [Affects R6][Spike] Does `@dtpr/api`'s `package.json` tolerate a `./schema` subpath export without breaking (a) existing Worker imports, (b) `wrangler` bundling, or (c) `@cloudflare/vitest-pool-workers` tests? Once `exports` is introduced it becomes the exclusive resolution path. If the spike fails, fall back to a `@dtpr/schema` package as a minimal additional workspace.
- [Affects R10, R11, R13][Spike] Confirm the Anthropic MCP Apps SDK iframe contract as of the v1 build window. If iframe-HTML-fragment-shaped, proceed. If structured JSON / React / remote templates, invoke the R10 contingency and reshape `@dtpr/ui/html`.
- [Affects R14, R15][Decision] What cross-repo consumption mechanism is chosen for `guide-app` and `admin`? Options: publish `@dtpr/ui` to a private npm registry, use a pnpm link / file: dependency during dev, or merge `hp-app/apps/*` into this monorepo. This does not block v1 ship (per the in-repo-first decision) but must be chosen before R14/R15 can start.
- [Affects Dependencies][Decision] Zod version alignment — upgrade `app/` to Zod 4, or constrain `@dtpr/api/schema` to inferred-TS-types only?

### Deferred to Planning

- [Affects R8][Technical] Locale-fallback order across the DTPR surfaces — the R8 contract specifies `requested → en → first-available → empty`, but the current copies in `guide-app` / `admin` may have diverged behaviour that needs auditing before migration.
- [Affects R10][Technical] Single `<style>` + single `<script>` per top-level `@dtpr/ui/html` render — exact de-duplication mechanics, asset inlining for any icon assets needed inline (data URIs or server-bundled references).
- [Affects R12][Technical] Whether `app/pages/taxonomy/ai.vue` consumes `@dtpr/api` at build time (static generation) or request time (runtime fetch against `api.dtpr.io`). Interacts with dtpr.io's deploy model and i18n strategy.
- [Affects R21][Technical] Whether `@dtpr/ui/vue`'s compiled CSS is emitted as a single stylesheet or as per-component CSS modules.
- [Affects v2 editor][Needs research] How deeply a schema-driven editor can derive form fields from Zod / JSON Schema without per-version hand-written glue. Spike during v2 planning.
- [Affects v2 editor][Technical] Editor state-management contract — v-model vs. controlled vs. store-adapter. Resolved via prototype.

## Next Steps

-> `/ce:plan` for structured implementation planning.
