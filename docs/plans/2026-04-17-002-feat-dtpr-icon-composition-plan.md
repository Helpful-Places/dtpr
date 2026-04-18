---
title: DTPR Icon Composition in the API
type: feat
status: active
date: 2026-04-17
deepened: 2026-04-17
origin: docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md
---

# DTPR Icon Composition in the API

## Overview

Move DTPR icon composition into the `api/` Cloudflare Workers app as a first-class capability. Introduce `symbol_id` on elements and `shape` on categories, drop the hand-composed `IconSchema`, collapse `category_ids: string[]` to a single `category_id`, bundle a per-release symbol library + composed icons to R2, and expose primitive + composed SVG endpoints with aggressive CDN caching. **Pre-bake all (element × variant) combinations at build time; on-the-fly composition is the runtime miss-fallback for iteration speed on new symbols/context colors between builds.**

## Problem Frame

Today every DTPR element references a pre-baked SVG at `app/public/dtpr-icons/<name>.svg` where shape + symbol + color are fused at author time. Variants (dark, context-colored) would require authoring new files. A Nuxt experiment in `studio/` proved runtime composition from clean 36×36 primitives (95 symbols in `app/public/dtpr-icons/symbols/`, 4 shapes in `app/public/dtpr-icons/shapes/`), but the experiment lives in the wrong package and hardcodes a 1024 source size intended for Recraft-generated SVGs — wrong envelope for the cleaned primitives.

Meanwhile the new API (`ai@2026-04-16-beta`) has no icon story at all: the v1→v2 port at `api/migrations/lib/transform-element.ts:38-40` explicitly drops the v1 `symbol:` field, categories carry no `shape`, and `IconSchema` just points back at the legacy pre-baked URLs. The icon composition pipeline belongs in `api/` alongside the canonical schema, release bundles, and Worker-served content.

See origin: `docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md`.

## Requirements Trace

All requirement ids below reference the origin brainstorm.

**Terminology and Schema Evolution**

- R1. Use "structural schema" vs "content release" terminology in docstrings on new fields; do not rename existing types (tracked separately in `docs/plans/2026-04-17-001-feat-content-release-terminology-rename-stub.md`).
- R2. Add `symbol_id: string` to `ElementSchema`.
- R3. Add `shape: ShapeTypeEnum` to `CategorySchema` (`hexagon | circle | rounded-square | octagon`, required).
- R4. Drop `IconSchema` from `ElementSchema`; remove validator rule 14 (`ICON_URL_EMPTY`, `ICON_FORMAT_EMPTY`).
- R5. `ContextValueSchema.color` already exists — wire it through composition.
- R23. Change `category_ids: string[]` → `category_id: string`. Drop `device__*` entries from ported elements.

**Symbol Library (Content)**

- R6. Library model; multiple elements may share a `symbol_id`.
- R7. Symbols live at `api/schemas/<datachain_type>/<version>/symbols/<symbol_id>.svg`.
- R8. Per-release duplication accepted; revisit at 5MB.

**Shape Primitives (Structural)**

- R9. Shapes live in `api/` code, not release content.

**Icon API Surface**

- R10. `GET /api/v2/shapes/:shape.svg` — immutable cache.
- R11. `GET /api/v2/schemas/:version/symbols/:symbol_id.svg` — release-pinned cache.
- R12. `GET /api/v2/schemas/:version/elements/:id/icon[.dark|.<context_value_id>].svg`. Cache per R13/Key Technical Decisions: `public, max-age=31536000, immutable` for stable; `public, max-age=60` for beta.
- R13. **Pre-bake composed icons at build time** for every `(element × variant)` combination and upload to R2 alongside primitives. Runtime handler first reads the pre-baked key; on R2 miss, falls back to on-the-fly composition (read symbol + shape, string-compose, return). Miss-fallback does NOT write back to R2 — new symbols/variants become persistent only via the next `schema:build`. HTTP `Cache-Control` is the caching mechanism; no Worker Cache API.
- R14. JSON endpoints surface `symbol_id` and derived `shape`.
- R24. Inner color computed via WCAG relative luminance; contrast warning at build when ratio < 4.5:1 against chosen inner.
- R25. Each element's JSON includes `icon_variants: string[]` listing valid variant tokens.

**Validation and Build**

- R15. Build validates every `Element.symbol_id` has a file in the release `symbols/` directory.
- R16. Build validates every `Category.shape` is a known enum value (Zod-enforced via `ShapeTypeEnum`).
- R17. Build bundles symbol SVGs to R2 at `schemas/<version.dir>/symbols/<symbol_id>.svg`; SVG bytes participate in `content_hash`.
- R17a. Build **pre-composes and bundles composed icons** to R2 at `schemas/<version.dir>/icons/<element_id>/<variant>.svg` (where `variant ∈ {default, dark, ...context_value_ids}`) using the runtime compositor. Composed bytes participate in `content_hash`.

**Context Color**

- R19. Variant id resolves against the element's single category's `context`.
- R20. `ContextValue.id` uniqueness enforced within a context; reject `dark` (and other reserved variant tokens) as `ContextValue.id`.
- R21. Unknown variant → `404` with valid-variants list.

**Accessibility**

- R22. Icons are locale-neutral glyphs; no per-locale `<title>/<desc>`, no `Accept-Language`.

## Scope Boundaries

- **No raster output.** SVG only.
- **Pre-baking is the hot path; on-the-fly composition is the miss-fallback only.** All `(element × variant)` combinations known at build time are written to R2. The runtime on-the-fly compositor exists to bridge the gap between authoring a new symbol/variant and the next full build — it is NOT the default serving path and should not carry production traffic in normal operation.
- **Miss-fallback does not write back to R2.** A compose-on-miss result is ephemeral. To make it persistent, rebuild. This prevents runtime side-effects from bypassing `content_hash` integrity.
- **No structural schema version field in the manifest.**
- **No terminology rename of existing types** (separate stub plan).
- **No localization in icon SVG responses.**
- **No migration of external-facing URLs.** `app/server/api/dtpr/v0|v1` and `app/public/dtpr-icons/*.svg` stay in place indefinitely; no sunset, no redirect shim. (Broader documentation effort starting separately will clarify cross-domain migration.)
- **No partner-facing URL documentation in this plan.** URL contract is captured here. Partner-facing docs land in a separate documentation pass already being scoped.
- **No symbol authoring UI.** Authors drop SVG files into the release source directory.
- **No animated or interactive SVG.**
- **No studio cleanup.** Studio continues to use its local `/api/icons/*` routes. Migration of studio callers happens later in a dedicated task.

### Deferred to Separate Tasks

- **Terminology rename**: `SchemaManifestSchema` → `ContentReleaseManifestSchema`, etc. See `docs/plans/2026-04-17-001-feat-content-release-terminology-rename-stub.md`.
- **Studio symbol-generation experiments**: `studio/server/api/icons/generate.post.ts` and the other studio icon routes (`composite.post.ts`, `symbol.get.ts`) remain untouched; studio callers (`SymbolPicker.vue`, `pages/icons/index.vue`, `pages/icons/generate.vue`) keep using them. A future task migrates studio off these routes.
- **Cross-domain documentation / migration story**: a broader documentation effort is starting separately that will clarify the legacy-surface → new-API migration path for `app/`, `docs-site/`, and external consumers.

## Context & Research

### Relevant Code and Patterns

- `api/src/schema/element.ts:10-56` — `IconSchema`, `ElementSchema.category_ids`, `icon` field to remove/change.
- `api/src/schema/category.ts` — `CategorySchema`; needs new `shape` field.
- `api/src/schema/context.ts:13-34` — `ContextValueSchema.color` (hex regex `/^#[0-9A-Fa-f]{6}$/`).
- `api/src/schema/manifest.ts:18-35` — `SchemaManifestSchema`, `content_hash` pattern.
- `api/src/validator/semantic.ts:17-27` — rule ordering and registration.
- `api/src/validator/rules/icons.ts:9-30` — rule 14 to delete.
- `api/src/validator/rules/category-refs.ts:9-40` — existing category existence check; adapt to singular `category_id`.
- `api/src/validator/rules/uniqueness.ts` — rule 3 (context value-id uniqueness) to extend for reserved tokens.
- `api/cli/lib/json-emitter.ts:31-42` — `materializeVariables`; extension point for `shape` + `icon_variants`.
- `api/cli/lib/json-emitter.ts:65-77` — `payloadForHash`; extend to include sorted symbol bytes.
- `api/src/store/keys.ts:11-39` — R2 key helpers; add `symbolKey`.
- `api/scripts/r2-upload.ts:68-75` — `CONTENT_TYPE_BY_EXT`; extend with `.svg` → `image/svg+xml`.
- `api/src/rest/routes.ts:52-195` — REST routes and mounting pattern at `/api/v2`.
- `api/src/rest/responses.ts:68-81` — `setVersionHeaders` pattern for release-aware caching.
- `api/src/rest/version-resolver.ts:18-63` — version parsing and known-release check.
- `api/src/app.ts:62-69` — per-route timeouts; new icon routes should mount under the read timeout (2s).
- `api/migrations/lib/transform-element.ts` — one-shot v1→v2 port; extend to emit `symbol_id` and singular `category_id`.
- `api/migrations/port-ai-v1-to-2026-04-16.ts` — migration entry point; re-run after transform updates.
- `studio/lib/icon-shapes.ts:13-112` — reference for shape templates, category→shape map, variant semantics. **Copy shape SVG template strings; do not depend on studio.**
- `studio/lib/icon-compositor.ts` — reference only; its 1024 sourceSize assumption (line 79) is wrong for the 36×36 cleaned primitives. Author fresh, do not port.
- `app/public/dtpr-icons/symbols/` — 95 porting-source SVGs, all `viewBox="0 0 36 36"`, `fill="currentColor"`.
- `app/public/dtpr-icons/shapes/` — 4 source SVGs; lift path `d` attributes and restructure with parameterized fill/stroke.
- `app/content/dtpr.v1/elements/en/*.md` — authoritative source for each element's legacy `symbol:` reference during the port.

### Test Patterns

- `api/test/api/seed.ts:1-60+` — R2 fixture seeding via `env.CONTENT` + `store/keys.ts`; new icon tests follow this pattern.
- `api/test/api/rest.test.ts` — integration style using `SELF.fetch(...)`; `_resetInlineBundles()` in `beforeEach`.
- `api/vitest.config.ts:8-17` — Workers pool for integration; `api/vitest.cli.config.ts:9-13` for CLI/build tests.

### Institutional Learnings

`docs/solutions/` does not exist yet. No prior documented solutions to draw from. Relevant planning context:
- `docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md` — the immediately preceding API/MCP plan whose conventions this plan extends.
- `docs/brainstorms/2026-04-16-dtpr-schema-api-mcp-brainstorm.md` — brainstorm that set the schema-evolution rationale this plan builds on.

### External References

External research was not run for this plan — the brainstorm is already grounded in concrete file paths and the studio prototype, and the composition algorithm itself is well-understood SVG string concatenation rather than unfamiliar territory. WCAG 2.1 relative luminance formula is the only external reference needed (documented inline at R24 in the origin).

## Key Technical Decisions

- **Pre-bake is the hot path; on-the-fly is the iteration fallback.** Icons are critical and will be used across production services, so the default serving path is a simple R2 read of pre-baked bytes — no Worker CPU, no compositor call, no multi-step load chain. Build-time composition runs the same pure `composeIcon` function the runtime compositor uses, so the two paths always produce identical bytes for the same inputs. On-the-fly exists to bridge authoring cycles: a developer adds a symbol or changes a context color, the next request for an unbuilt variant falls back to live composition, and the next build makes it permanent. On-the-fly is observability-tagged (see Operational Notes) so any production traffic on the fallback path is a signal, not background noise.
- **Cache strategy: HTTP `Cache-Control` only, no Worker Cache API.** Rationale: release URLs are immutable once stable, and Cloudflare's edge cache on the custom domain handles hot paths. Pre-baked bytes are deterministic from content_hash-covered inputs, so any release (stable or beta) can safely serve long-TTL on pre-baked paths. Stable: `public, max-age=31536000, immutable`. Beta pre-baked hits: `public, max-age=3600` (1h — long enough to avoid beat-on-edge, short enough that a rebuild propagates within an hour). Beta miss-fallback (on-the-fly) hits: `public, max-age=60` (short because the miss implies authoring iteration is live). A dedicated `setIconCacheHeaders` helper (introduced in Unit 7) implements this override without touching the JSON response path.
- **Seed `symbol_id` 1:1 by legacy filename stem during the port.** Audit: 149 v1 element files reference 95 unique symbols; `signal.svg` alone is shared by 12 elements. Because shared v1 symbols already collapse by filename, no pre-dedup logic is needed — the port writes `symbol_id: signal` on all 12 elements naturally.
- **Author shape primitives in code as SVG strings with parameterized `fill`/`stroke`.** Do not load shape SVGs from release content. 4 shapes × ~150-300 bytes each is trivial to inline. The shape module mirrors `studio/lib/icon-shapes.ts` in spirit but is a fresh authoring in `api/` that does not depend on the studio package. **Sealed API contract**: `getShapeSvgFragment(shape, { fill, stroke })` returns a string with those values applied to the shape's path element. Whether it's implemented via `String.replace` on a template, a tagged template literal, or a builder function is an internal detail of `shapes.ts` and not a cross-unit decision.
- **Composition envelope is 36×36, z-order overlay.** Because symbols and shape path data share the 36×36 coordinate space and symbols already use `fill="currentColor"`, composition is a straight overlay without scaling. Do NOT reuse `studio/lib/icon-compositor.ts` — its 1024 sourceSize scaling produces invisible output at 36×36.
- **Inner color via deterministic WCAG luminance.** `L = 0.2126·R + 0.7152·G + 0.0722·B` on linearized sRGB channels. Threshold 0.179 → black inner ≥ threshold, white below. Build emits a warning (not an error) when resulting contrast < 4.5:1.
- **Icon routes live under the existing `/api/v2/` surface.** Shapes at `/api/v2/shapes/:shape.svg`; release-pinned routes under `/api/v2/schemas/:version/...` — same Hono app, same per-route timeout, same rate-limit binding (`RL_READ` on `/api/v2/*`). Cache headers use the new `setIconCacheHeaders` helper (not the JSON `setVersionHeaders`) for the beta override described above.
- **Two explicit routes for variant/default.** Use `'/schemas/:version/elements/:id/icon.svg'` and `'/schemas/:version/elements/:id/icon.:variant.svg'` mounted as separate Hono handlers that call the same function — there is no existing repo precedent for Hono optional-param syntax, and splitting the route keeps OpenAPI/test enumeration simple.
- **Rate limiting: reuse `RL_READ`, rely on edge cache for burst absorption.** `RL_READ` is 300 requests / 60s per `(ip, DTPR-Client)` key (`api/wrangler.jsonc:26-40`); the Workers Rate Limit API consumes exactly one token per request with no per-route cost override. With pre-baked hot path, a grid-render cache-miss is a simple R2 read (no composition), significantly cheaper than the earlier on-the-fly design. A 75-icon cold grid still bursts 25% of the minute budget; warm edge cache collapses subsequent renders to ~1 origin hit per icon per TTL. Monitor 429 rate post-deploy; dedicated `RL_ICONS` bucket remains a deferred fallback.
- **Symbol bytes + composed icon bytes participate in `content_hash`.** Extend the `payloadForHash` object in `api/cli/lib/json-emitter.ts:65-77` with (a) a sorted map of `{ symbol_id → sha256(bytes) }` and (b) a sorted map of `{ "<element_id>__<variant>" → sha256(composedBytes) }`. Editing a symbol, changing a context color, or changing the composition algorithm all regenerate the hash and force re-upload without touching element/category YAML. The hash is genuinely a cover-all signal that "these bytes go together."
- **Keep the content port reproducible via the migration script.** Update `api/migrations/lib/transform-element.ts` to emit `symbol_id` + singular `category_id`, and author a small shape-map lookup for the 11 categories. Re-run the migration end-to-end; do not hand-edit the release YAMLs. If downstream unit tests fixtures diff unexpectedly, that's signal, not noise.
- **Rebuild the migration's category port (not covered by transform-element.ts today) to emit `shape:` per category** using the mapping copied from `studio/lib/icon-shapes.ts:47-71` filtered to `ai__*` keys. This is a one-off content edit surface inside the migration, not a runtime dependency.

## Open Questions

### Resolved During Planning

- **SVG composition envelope (R12)**: 36×36 viewBox, z-order overlay. Shapes use parameterized `fill`/`stroke` attributes; symbols use `fill="currentColor"` and are wrapped in a `<g color="...">` node at composition time. See Unit 5 technical design.
- **Symbol sharing audit (R6)**: 95 unique symbols across 149 v1 elements. Heaviest share: `signal.svg` (12 elements), `encrypted.svg` (9), `stored.svg` (7). Port seeds `symbol_id` 1:1 by legacy filename stem; natural dedup by identical filename.
- **Cache keying strategy (R13)**: HTTP `Cache-Control` only. Pre-baked stable: `public, max-age=31536000, immutable`. Pre-baked beta: `public, max-age=3600`. On-the-fly miss-fallback (any release): `public, max-age=60`. Existing `cacheControlFor` in `api/src/rest/responses.ts:68-72` returns `no-store` for beta JSON and stays unchanged.
- **JSON size growth from new fields (R14)**: `symbol_id` + `shape` + `icon_variants` add ~75-150 bytes per element. For 75 elements: ~6KB added to `elements.json`. Negligible; no split beyond the existing per-element JSON files.
- **Pre-bake vs on-the-fly composition**: Pre-bake is the hot path per user direction. Icons are critical infrastructure across production services, so the hot path must be the simplest possible (R2 point-read, no Worker CPU, long CDN TTL). On-the-fly composition is retained as a runtime fallback so authors can iterate on new symbols/context colors without blocking on a rebuild cycle. Combinatorial storage (~1MB/release) is trivial; the atomicity benefit of pre-baking outweighs any cost. This reverses the brainstorm's original default (on-the-fly + CDN-cache) after a user call-out that icons' production criticality warrants pre-baking as the norm.

### Deferred to Implementation

- **Exact shape SVG path data**: extract `d` attributes from `app/public/dtpr-icons/shapes/*.svg` during Unit 4. Fidelity verified via golden-file test against the current pre-baked SVGs for one element per shape category.
- **Shape fragment builder implementation**: the public contract (`getShapeSvgFragment(shape, { fill, stroke })`) is fixed in Key Technical Decisions. The internal implementation (string template vs builder function vs tagged template literal) is at the implementer's discretion and not cross-unit.
- **Whether to delete `studio/server/api/icons/*.ts` or leave as thin passthroughs**: decide during Unit 10 after the API routes are proven; lowest-risk default is to leave the studio routes until a downstream consumer migrates off.
- **Whether to add a dedicated `RL_ICONS` rate-limit bucket**: deferred to post-deploy observability. Default is to reuse `RL_READ` and lean on edge cache. Switch if 429 rate on icon routes exceeds 0.1% or client reports grid-render throttling.

## Output Structure

```
api/
  src/
    icons/
      shapes.ts              # NEW — 4 shape SVG templates + shape enum + variant-options
      compositor.ts          # NEW — composeIcon(...) → string; called at build AND runtime fallback
      color.ts               # NEW — WCAG luminance, innerColor(), contrastRatio()
    schema/
      element.ts             # MODIFY — drop IconSchema, add symbol_id, singular category_id
      category.ts            # MODIFY — add ShapeTypeEnum + shape field
    validator/
      rules/
        icons.ts             # DELETE — replaced by symbol-refs.ts
        symbol-refs.ts       # NEW — rule 14 replacement
        variant-reserved.ts  # NEW — extends context value-id rule for reserved tokens
        color-contrast.ts    # NEW — WCAG contrast warning (non-blocking)
    store/
      keys.ts                # MODIFY — add symbolKey()
      symbols.ts             # NEW — loadSymbolSvg() for R2 reads (or extend r2-loader.ts)
    rest/
      routes.ts              # MODIFY — mount icon routes
      icons.ts               # NEW — icon route handlers (split for clarity)
  cli/
    lib/
      json-emitter.ts        # MODIFY — shape + icon_variants materialization, content_hash extension
      yaml-reader.ts         # MODIFY — load symbols/ directory alongside existing YAML
  scripts/
    r2-upload.ts             # MODIFY — .svg content-type mapping
  migrations/
    lib/
      transform-element.ts   # MODIFY — emit symbol_id, singular category_id
      transform-category.ts  # NEW (or modify existing) — emit shape from ai__* mapping
  schemas/
    ai/
      2026-04-16-beta/
        symbols/             # NEW — ~50-60 SVG files (75 elements × seeded 1:1 → dedupes on stem)
        categories/*.yaml    # MODIFY — add `shape:` field to all 11 categories
        elements/*.yaml      # MODIFY — add symbol_id, rename category_ids→category_id, drop icon
  dist/                      # build output (gitignored)
    schemas/ai/2026-04-16-beta/
      symbols/*.svg          # NEW — copied from release source
      icons/<element_id>/    # NEW — pre-baked composed icons, one dir per element
        default.svg          #   always present
        dark.svg             #   always present
        <context_value>.svg  #   one per context value id (when category has a context)
  test/
    unit/
      icons/
        shapes.test.ts       # NEW
        compositor.test.ts   # NEW — includes golden-file parity tests
        color.test.ts        # NEW
      validator-symbol-refs.test.ts  # NEW
    api/
      icons.test.ts          # NEW — integration via SELF.fetch
    fixtures/
      icons/
        golden/              # NEW — 4 reference composed SVGs (one per shape)
```

This tree shows the expected shape of the change. The implementer may adjust (e.g. add icon handlers inline in `routes.ts` rather than splitting into `rest/icons.ts`) if implementation reveals a cleaner layout.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

### Variant decision matrix

| Variant token | Shape `fill` | Shape `stroke` | Symbol `color` | Notes |
|---|---|---|---|---|
| `default` (omitted from URL) | `none` | `#000` | `#000` | Light outline; matches current pre-baked |
| `dark` | `#000` | `#000` | `#FFF` | Inverted; for dark-on-light reversed contexts |
| `<context_value_id>` | `<hex>` | `<hex>` | WCAG-computed (`#000` or `#FFF`) | Filled with context color |

### Composition pseudo-shape

```
composeIcon(shapeSvg, symbolSvg, { variant, color }):
  fill, stroke   = variant-specific for shape (see matrix)
  innerColor     = variant-specific; WCAG-computed when colored
  shapeInner     = inject fill/stroke into shape template
  symbolInner    = inner content of symbolSvg with its own <svg> wrapper stripped
  return `<svg xmlns="..." viewBox="0 0 36 36">
            ${shapeInner}
            <g color="${innerColor}">${symbolInner}</g>
          </svg>`
```

### Request flow for a composed icon — pre-baked hot path

```
GET /api/v2/schemas/ai@2026-04-16-beta/elements/accept_deny/icon.ai_only.svg
  → resolveKnownVersion()                     // parse + index check
  → validate param regex (symbol_id-style)    // reject /, .., etc. at request time
  → loadComposedIconSvg(ctx, version, 'accept_deny', 'ai_only')  // R2 read at schemas/<ver>/icons/accept_deny/ai_only.svg
  → hit: setIconCacheHeaders(c, manifest, { prebaked: true })   // long TTL for pre-baked
  → c.body(svg)
```

### Request flow on R2 miss (on-the-fly fallback)

```
loadComposedIconSvg(...) returns null
  → log metric 'icon_miss_fallback' with (version, element_id, variant)
  → loadElement(ctx, version, 'accept_deny')
  → loadCategory(ctx, version, element.category_id)        // singular loader (Unit 6)
  → resolveVariant('ai_only', category)
  → loadSymbolSvg(ctx, version, element.symbol_id)
  → composeIcon({ shape: category.shape, symbolSvg, variant: { kind: 'colored', color: '#<hex>' } })
  → setIconCacheHeaders(c, manifest, { prebaked: false })  // short TTL on fallback
  → c.body(svg)
  // NOTE: no write-back to R2 — persistence comes from the next schema:build
```

## Implementation Units

- [ ] **Unit 1: Structural schema evolution**

**Goal:** Update Zod schemas to the new shape: add `symbol_id`, add `shape`, drop `IconSchema`, change `category_ids` → `category_id`.

**Requirements:** R1, R2, R3, R4, R23

**Dependencies:** None

**Files:**
- Modify: `api/src/schema/element.ts`
- Modify: `api/src/schema/category.ts`
- Modify: `api/src/validator/rules/category-refs.ts` (adapt to singular `category_id`)
- Modify: `api/src/validator/rules/variables.ts` (reads `element.category_ids` — change to `category_id`)
- Modify: `api/src/validator/rules/instance.ts` (multiple reads of `category_ids` at context-value lookups — change to singular)
- Modify: `api/src/validator/rules/locales.ts` (reads `el.icon.alt_text` — drop with IconSchema removal)
- Delete: `api/src/validator/rules/icons.ts`
- Modify: `api/src/validator/semantic.ts` (drop the icons rule from the ordered list)
- Modify: `api/cli/lib/search-index-builder.ts` (reads `category_ids` — change to singular)
- Modify: `api/src/rest/routes.ts` (category filter at the elements route: replace `el.category_ids.includes(id)` with `el.category_id === id`; drop any read of `element.icon`)
- Modify: `api/src/rest/search.ts` (storeFields referencing `category_ids`)
- Modify: `api/src/mcp/tools.ts` (`DEFAULT_LIST_FIELDS` entry `'category_ids'` → `'category_id'`; any filter calls)
- Modify: `api/test/api/seed.ts` (fixture builders `makeElements` / `makeCategories` use `category_ids: [...]` and `icon: {...}`; update to new shape)
- Modify: `api/test/api/helpers.ts` (fixture helpers)
- Modify: `api/test/api/schemas.ts` (fixture schemas)
- Test: `api/test/unit/schema.test.ts`

**Approach:**
- Introduce `ShapeTypeEnum = z.enum(['hexagon', 'circle', 'rounded-square', 'octagon'])` in `category.ts` and export `ShapeType` type.
- Drop `IconSchema` entirely — do not alias or re-export it.
- Add `symbol_id: z.string().regex(/^[a-zA-Z0-9_-]+$/)` to `ElementSchema` with the same whitelist as `id`.
- Change `category_ids: z.array(z.string()).min(1)` → `category_id: z.string().min(1)`.
- Add docstrings that use the "structural schema"/"content release" distinction per R1.
- Update `category-refs.ts` rule to check `element.category_id` (singular).
- Remove the `checkIcons` entry from the rule list in `semantic.ts`.

**Patterns to follow:**
- `api/src/schema/context.ts` for enum + hex regex conventions.
- Existing rule shape in `api/src/validator/rules/category-refs.ts`.

**Test scenarios:**
- Happy path: valid element with `symbol_id: "signal"` and single `category_id: "ai__decision"` parses.
- Happy path: valid category with `shape: "hexagon"` parses; categories without `shape` fail Zod.
- Edge case: `symbol_id` with invalid chars (`/`, `.svg`) rejected by regex.
- Error path: element still carrying `icon: {...}` or `category_ids: [...]` is rejected with a clear Zod error.
- Error path: category with `shape: "triangle"` rejected with valid-values list.

**Verification:**
- All existing schema tests pass after updates.
- `pnpm --filter api typecheck` passes after all the downstream-consumer edits above; no lingering `Element.icon` or `Element.category_ids` reads remain. The cross-file list above is exhaustive — if new compile errors surface, treat as a signal that the Grep audit was incomplete.

---

- [ ] **Unit 2: Content port — symbol_id, shape, singular category_id**

**Goal:** Update the v1→v2 migration to emit the new fields; re-run it to regenerate `api/schemas/ai/2026-04-16-beta/` content YAML. Copy the 75-95 unique symbol SVGs from `app/public/dtpr-icons/symbols/` into the release's new `symbols/` directory.

**Requirements:** R2, R3, R7, R23

**Dependencies:** Unit 1 (new schema shape)

**Files:**
- Modify: `api/migrations/lib/transform-element.ts`
- Modify: `api/migrations/lib/transform-category.ts` (exists; extend to emit `shape:` from the AI category map)
- Modify: `api/migrations/port-ai-v1-to-2026-04-16.ts`
- Create: `api/schemas/ai/2026-04-16-beta/symbols/*.svg` (~50-60 files, unique by `symbol_id` across the 75 ported elements)
- Modify: `api/schemas/ai/2026-04-16-beta/categories/*.yaml` (11 files, add `shape:` field)
- Modify: `api/schemas/ai/2026-04-16-beta/elements/*.yaml` (75 files, add `symbol_id`, rename `category_ids`→`category_id`, drop `icon`)
- Test: `api/test/cli/migration.test.ts` (exists; extend)

**Approach:**
- In `transform-element.ts`, read v1 `symbol:` field (currently dropped), derive `symbol_id` as the basename without extension: `symbol.replace(/^.*\//,'').replace(/\.svg$/,'')`. Warn and skip the element if v1 has no `symbol:` value.
- Collapse `category_ids` to a single `category_id` by keeping the first `ai__*` entry (the `aiCategories` filter at `transform-element.ts:72` already produces this; just pick `[0]`).
- Remove the current `icon: { url, format, alt_text }` output; emit no icon field.
- For categories, author a static `AI_CATEGORY_SHAPE_MAP` inside the migration (copied + filtered from `studio/lib/icon-shapes.ts:47-71`), and inject `shape:` into the emitted category YAML.
- Copy symbol SVG files: for each unique `symbol_id` across all ported elements, copy `app/public/dtpr-icons/symbols/<symbol_id>.svg` → `api/schemas/ai/2026-04-16-beta/symbols/<symbol_id>.svg`. Fail the migration if the source file doesn't exist.
- Re-run `pnpm --filter api exec tsx migrations/port-ai-v1-to-2026-04-16.ts` (or whatever the existing migration command is). Commit the diff.

**Patterns to follow:**
- Existing transform structure in `api/migrations/lib/transform-element.ts:46-118`.
- `MIGRATION_LOCALES` iteration pattern from the same file.

**Test scenarios:**
- Happy path: element with v1 `symbol: /dtpr-icons/symbols/signal.svg` ports to `symbol_id: signal`.
- Happy path: element with v1 `category: [device__data, ai__input_dataset]` ports to `category_id: ai__input_dataset`.
- Happy path: category `ai__decision` gets `shape: hexagon`.
- Edge case: element with v1 `symbol:` missing — migration emits `ELEMENT_NO_SYMBOL` warning and skips (analog to existing `ELEMENT_NO_ICON`).
- Error path: referenced symbol file doesn't exist in source tree — migration fails with a clear error listing the missing file.
- Integration: after re-run, `pnpm --filter api schema:build` succeeds against the regenerated content.

**Verification:**
- `git diff api/schemas/ai/2026-04-16-beta/` shows only structural shape changes (new fields, dropped `icon:`, singular `category_id:`), no content regressions.
- `api/schemas/ai/2026-04-16-beta/symbols/` contains one SVG per unique `symbol_id` in the release's 75 elements. Expected count: ~50-60 files (ai-only subset of the 95 unique v1 symbols; shared symbols like `signal`, `encrypted`, `stored` collapse to one file each). Any count outside 40-75 warrants a re-check of the migration.
- Every category YAML has a `shape:` field matching the studio map.

---

- [ ] **Unit 3: Build pipeline extensions — validation, hashing, materialization, pre-baking**

**Goal:** Extend `pnpm schema:build` to (a) validate `symbol_id` resolves to a file, (b) validate no reserved tokens in `ContextValue.id`, (c) emit contrast warnings, (d) materialize `shape` and `icon_variants` into element JSON, (e) include symbol bytes + pre-baked composed-icon bytes in `content_hash`, (f) emit symbol SVGs to `dist/`, (g) **pre-bake every `(element × variant)` composed SVG to `dist/schemas/<version>/icons/<element_id>/<variant>.svg` using the runtime compositor**.

**Requirements:** R14, R15, R16, R17, R17a, R20, R24, R25

**Dependencies:** Unit 1 (schema), Unit 2 (content port), Unit 4 (shapes + WCAG helpers), Unit 5 (compositor). Unit 3 calls `composeIcon` at build time, so Units 4+5 must land first.

**Files:**
- Modify: `api/cli/lib/yaml-reader.ts` (load `symbols/` directory contents alongside YAML)
- Modify: `api/src/validator/types.ts` (extend `SchemaVersionSource` with `symbols: Record<string, string>` so validator rules can read the symbol map)
- Modify: `api/cli/lib/json-emitter.ts` (materialize shape + icon_variants; extend content_hash; copy symbols to dist)
- Create: `api/src/validator/rules/symbol-refs.ts` (rule: each element's `symbol_id` resolves to a loaded symbol; also rejects SVG sources that begin with BOM, XML prolog, leading comment, contain `<script>` tags, event-handler attrs matching `on[a-z]+\s*=`, `xlink:href`/`href` with non-data-URI values, `<foreignObject>`, or `<use>` pointing outside the document — error codes `SYMBOL_NOT_FOUND`, `SYMBOL_MALFORMED_WRAPPER`, `SYMBOL_ACTIVE_CONTENT`)
- Create: `api/src/validator/rules/variant-reserved.ts` (rule: no `ContextValue.id` collides with reserved variant tokens)
- Create: `api/src/validator/rules/color-contrast.ts` (warning: WCAG AA contrast < 4.5:1)
- Modify: `api/src/validator/semantic.ts` (register new rules)
- Create (shared with Unit 4): `api/src/icons/color.ts` — shared WCAG helpers. **Unit 4 is the canonical author**; if Unit 3 lands first, create the file here and Unit 4 absorbs it. Unit 4 depends on nothing else; prefer to land it before Unit 3 to avoid stub churn.
- Test: `api/test/unit/json-emitter.test.ts`, `api/test/unit/validator.test.ts`, `api/test/cli/cli-build.test.ts`

**Approach:**
- `yaml-reader.ts`: list files under `<releaseDir>/symbols/*.svg`; return `{ symbol_id → utf-8 string }` map alongside existing yaml output.
- `json-emitter.ts::materializeVariables` (rename or add alongside a new `materializeElementDerived`): also derive `shape` from the element's category (`categoriesById.get(element.category_id).shape`) and compute `icon_variants` as `['default', 'dark', ...category.context?.values.map(v => v.id) ?? []]`.
- `json-emitter.ts::bundleComposedIcons` (new): iterate elements; for each element, iterate its `icon_variants`; call `composeIcon(...)` with the appropriate `variant` discriminated-union value (resolving `ContextValue.color` from the element's category). Return a `composedIcons: Record<string, string>` keyed by `"<element_id>/<variant>"`.
- `json-emitter.ts::payloadForHash` (l. 65-77): add `symbolHashes` (sorted sha256 map of symbols) AND `composedIconHashes` (sorted sha256 map of composed bytes keyed by `"<element_id>__<variant>"`). Editing a symbol, changing a context color, OR changing the compositor algorithm all regenerate the release hash.
- `json-emitter.ts::bundleToFiles` (l. 102-117): copy each symbol SVG to `api/dist/schemas/<version.dir>/symbols/<symbol_id>.svg`; write each composed SVG to `api/dist/schemas/<version.dir>/icons/<element_id>/<variant>.svg` (utf-8 text writes).
- `symbol-refs.ts` rule (resolves by reading `source.symbols` from the extended `SchemaVersionSource`):
  - For each element, assert a symbol with `symbol_id` exists in the loaded map. Error code `SYMBOL_NOT_FOUND` with path `elements[i].symbol_id` and `fix_hint` listing the 3 nearest symbol ids.
  - For each loaded symbol, reject `SYMBOL_MALFORMED_WRAPPER` when the byte content begins with UTF-8 BOM (`\xEF\xBB\xBF`), an XML prolog (`<?xml`), or a leading comment (`<!--`). This is load-bearing for Unit 5's `stripOuterSvg`.
  - For each loaded symbol, reject `SYMBOL_ACTIVE_CONTENT` when a regex scan finds: `<script` tag, event-handler attributes matching `on[a-z]+\s*=`, `xlink:href`/`href` with non-`data:` values, `<foreignObject`, or `<use>` elements with `href`/`xlink:href` pointing outside the document. No parser dependency needed — raw regex over the UTF-8 string is sufficient. Rationale: composed SVGs may be loaded via `<object>`/`<embed>` or direct navigation where active content executes; authoring-time guard prevents a symbol author from accidentally introducing XSS surface.
- `variant-reserved.ts` rule: walk category contexts, error `RESERVED_VARIANT_TOKEN` if any `ContextValue.id` ∈ `['dark', 'default']`.
- `color-contrast.ts` rule: for each `ContextValue.color`, compute `innerColor` via WCAG luminance, compute contrast ratio against that inner, warn (not error) if `< 4.5`. Warning code `LOW_CONTRAST_CONTEXT_COLOR`.

**Patterns to follow:**
- Existing rule shape in `api/src/validator/rules/category-refs.ts` and `colors.ts`.
- `content_hash` payload construction at `api/cli/lib/json-emitter.ts:65-77`.

**Test scenarios:**
- Happy path: valid release builds; `elements.json` includes `symbol_id`, `shape`, and `icon_variants` per element.
- Happy path: editing a symbol SVG byte content causes a new `content_hash` without any YAML changes AND causes every composed icon using that symbol to be re-emitted.
- Happy path: changing a `ContextValue.color` hex in category YAML causes the corresponding composed-icon variant bytes to change and `content_hash` to change.
- Happy path: `dist/schemas/<version>/icons/accept_deny/default.svg` and `dist/schemas/<version>/icons/accept_deny/dark.svg` exist after build; category with context also emits one SVG per context value id.
- Happy path: total pre-baked icon count matches `sum(elements.icon_variants.length)` — e.g., 75 elements × ~4.5 variants avg ≈ 340 composed SVGs.
- Edge case: element's `shape` matches its category's `shape` field after materialization.
- Edge case: category with no `context` produces `icon_variants: ['default', 'dark']` — 2 composed SVGs emitted per element.
- Error path: element references `symbol_id: does_not_exist` — build fails with `SYMBOL_NOT_FOUND` and 3 nearest-id suggestions.
- Error path: category context contains `ContextValue { id: 'dark' }` — build fails with `RESERVED_VARIANT_TOKEN`.
- Error path: symbol SVG source begins with `<?xml version="1.0"?>` — build fails with `SYMBOL_MALFORMED_WRAPPER`.
- Error path: symbol SVG contains `<script>alert(1)</script>` — build fails with `SYMBOL_ACTIVE_CONTENT`.
- Error path: symbol SVG contains `onclick="..."` attribute — build fails with `SYMBOL_ACTIVE_CONTENT`.
- Error path: symbol SVG contains `<use xlink:href="https://evil/x.svg#id"/>` — build fails with `SYMBOL_ACTIVE_CONTENT`.
- Integration: build emits `dist/schemas/<version>/symbols/*.svg` matching the release source.
- Warning path: `ContextValue.color: '#EEEEEE'` against computed white inner triggers `LOW_CONTRAST_CONTEXT_COLOR` at build time (warning, not failure).

**Verification:**
- `pnpm --filter api schema:build` succeeds on the ported release with no validation errors.
- `api/dist/schemas/ai/2026-04-16-beta/symbols/` exists and has the same SVGs as the release source.
- `api/dist/schemas/ai/2026-04-16-beta/icons/<element_id>/` exists for every element, with one SVG per entry in that element's `icon_variants` list.
- `elements.json` entries include `symbol_id`, `shape`, `icon_variants`.
- Total pre-baked icon count ≈ 300-400 (~75 elements × mix of variants). Storage footprint well under the brainstorm's 5MB revisit threshold (expected: ~0.5-1MB composed + ~200KB symbols).

---

- [ ] **Unit 4: Shape primitives and WCAG helpers (code-bundled)**

**Goal:** Author the 4 shape SVG templates and the WCAG luminance helpers as pure TypeScript modules in `api/src/icons/`.

**Requirements:** R9, R24

**Dependencies:** None. Must land before Unit 3 (build uses these) and Unit 5 (compositor uses these).

**Files:**
- Create: `api/src/icons/shapes.ts`
- Create: `api/src/icons/color.ts`
- Test: `api/test/unit/icons/shapes.test.ts`
- Test: `api/test/unit/icons/color.test.ts`

**Approach:**
- `shapes.ts` covers shape-fragment generation only; visual parity checks live in Unit 5 (goldens against composed output). Shape-level tests here are structural: attribute strings match expected values, known shape name → known path, unknown shape name → typed error.
- `shapes.ts` exports:
  - `ShapeType` type (imported from `schema/category.ts` — don't redeclare)
  - `SHAPES: Record<ShapeType, { d: string; viewBox: 36 }>` with path `d` attrs lifted from `app/public/dtpr-icons/shapes/*.svg`
  - `getShapeSvgFragment(shape, { fill, stroke })` → returns the `<path .../>` or equivalent element string with fill/stroke injected
- `color.ts` exports:
  - `parseHex(hex)` → `{ r, g, b } | null` for `#RRGGBB` hex strings
  - `relativeLuminance({ r, g, b })` per WCAG formula (linearize channels then weighted sum)
  - `contrastRatio(colorA, colorB)` per WCAG (`(L_bright + 0.05) / (L_dark + 0.05)`)
  - `innerColorForShape(shapeColor)` → `'#000'` or `'#FFF'` using 0.179 threshold
- Note for implementer: both files are pure functions — no I/O, no Worker-specific globals. Testable under the Node vitest config.

**Patterns to follow:**
- Plain TypeScript module style already used in `api/src/schema/*.ts`.
- Shape path data lifted from `app/public/dtpr-icons/shapes/{circle,hexagon,octagon,rounded-square}.svg` — extract the `d` and the original `fill`/`stroke` attrs.

**Test scenarios:**
- Happy path: `getShapeSvgFragment('hexagon', { fill: 'none', stroke: '#000' })` returns a string containing the expected `d=` and attributes.
- Happy path: `parseHex('#FFDD00')` returns `{ r: 255, g: 221, b: 0 }`.
- Happy path: `relativeLuminance` of pure white ≈ 1.0; pure black ≈ 0.0.
- Edge case: `parseHex('#fff')` (3-char) returns `null` — we only accept 6-char hex per schema.
- Edge case: `parseHex('not a color')` returns `null`.
- Happy path: `innerColorForShape('#FFDD00')` (yellow, luminance ≈ 0.79) → `'#000'`.
- Happy path: `innerColorForShape('#003366')` (dark blue, luminance ≈ 0.027) → `'#FFF'`.
- Edge case: `contrastRatio('#FFFFFF', '#000000')` ≈ 21 (WCAG max).
- Edge case: colors exactly at the 0.179 luminance threshold map consistently (test both sides).

**Verification:**
- All 4 shapes render to parseable SVG fragments.
- WCAG helpers produce values matching published WCAG examples for at least 5 sample colors.

---

- [ ] **Unit 5: Icon compositor**

**Goal:** Pure `composeIcon(...)` function that produces the final composed SVG string. Called at **build time** by Unit 3 for pre-baking and at **runtime** by Unit 8 for miss-fallback — same function, same output for the same inputs.

**Requirements:** R10, R11, R12, R13

**Dependencies:** Unit 4. Must land before Unit 3 (build uses it) and Unit 8 (runtime fallback uses it).

**Files:**
- Create: `api/src/icons/compositor.ts`
- Test: `api/test/unit/icons/compositor.test.ts`
- Create: `api/test/fixtures/icons/golden/*.svg` (4 reference composed SVGs — one per shape category, comparing against `app/public/dtpr-icons/<element>.svg` pre-baked output)

**Approach:**
- Signature (pseudo-spec):
  - `composeIcon({ shape: ShapeType, symbolSvg: string, variant: 'default' | 'dark' | { kind: 'colored', color: string } }): string`
- Behavior (directional pseudo-code):
  ```
  case variant:
    'default'  → shapeFill='none', shapeStroke='#000', innerColor='#000'
    'dark'     → shapeFill='#000', shapeStroke='#000', innerColor='#FFF'
    'colored'  → shapeFill=color,  shapeStroke=color,  innerColor=innerColorForShape(color)
  shapeFragment = getShapeSvgFragment(shape, { fill: shapeFill, stroke: shapeStroke })
  symbolInner   = stripOuterSvg(symbolSvg)   // returns the inner <path>/<g> nodes
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">
            ${shapeFragment}
            <g color="${innerColor}">${symbolInner}</g>
          </svg>`
  ```
- `stripOuterSvg`: reliably removes the wrapper `<svg>` tags from a symbol file. Because all 95 source symbols follow the same `<svg ...>...</svg>` structure (verified via `app/public/dtpr-icons/symbols/accept_deny.svg` and spot-checks), a narrow regex or a DOM-free string slice is sufficient. Do NOT introduce an HTML parser dependency. Pair with Unit 3's build-time guard that rejects any symbol source with a leading BOM, XML prolog, or wrapping comment — if a future symbol has one, fix it at authoring time rather than in `stripOuterSvg`.

**Technical design:** *(directional; not implementation spec)*

```
composeIcon(shape, symbolSvg, variant):
  { shapeFill, shapeStroke, innerColor } = resolveVariantColors(variant)
  shapeEl   = getShapeSvgFragment(shape, { fill: shapeFill, stroke: shapeStroke })
  innerEl   = stripOuterSvg(symbolSvg)
  return  '<svg xmlns="..." viewBox="0 0 36 36" width="36" height="36">'
        + shapeEl
        + '<g color="' + innerColor + '">' + innerEl + '</g>'
        + '</svg>'
```

**Patterns to follow:**
- Pure-function module style like `api/src/schema/*.ts`.
- Reference only (do NOT reuse): `studio/lib/icon-compositor.ts` — its 1024 sourceSize and scaling logic are wrong for the 36×36 envelope.

**Test scenarios:**
- Happy path: `composeIcon('hexagon', <signal-symbol-svg>, 'default')` produces a 36×36 SVG with the hexagon stroke path and the signal symbol inner content wrapped in `<g color="#000">`.
- Happy path: `'dark'` variant produces filled black hexagon with `<g color="#FFF">`.
- Happy path: `'colored'` with `#F39C12` (amber) produces amber-filled shape with `<g color="#000">` (amber is light enough).
- Happy path: `'colored'` with `#003366` (navy) produces navy-filled shape with `<g color="#FFF">`.
- Golden-file parity: output for one element per shape category (`accept_deny`/hexagon, `data`/circle, `available_for_resale`/rounded-square, `rights`/octagon) visually matches the existing `app/public/dtpr-icons/<element>.svg` pre-baked file. "Visually matches" means identical shape path, identical symbol path, and identical default colors — byte equality not required because whitespace/attribute ordering may differ.
- Edge case: symbol SVG with extra attributes (e.g. `xmlns:xlink`) in the wrapper doesn't leak into the output.
- Error path: `composeIcon('triangle', ...)` type error caught at compile time (TypeScript exhaustiveness) — no runtime check needed.

**Verification:**
- Golden-file parity tests pass for all 4 shapes.
- Composed output parses as valid XML / SVG (use a simple XML parser or a well-formedness regex).
- Pure function: same inputs always produce identical output (no timestamp, no randomness).

---

- [ ] **Unit 6: R2 storage extensions — keys, SVG upload, loaders for symbols + composed icons**

**Goal:** Add R2 key helpers for symbols AND composed icons, extend the upload script with SVG content-type + the new `icons/` dir walker, add loaders for symbols and for composed icons, extend the singular-category loader.

**Requirements:** R7, R11, R17, R17a

**Dependencies:** Unit 3 (writes symbol SVGs AND composed icons to `dist/`)

**Files:**
- Modify: `api/src/store/keys.ts` (add `symbolKey(version, symbol_id)` AND `composedIconKey(version, element_id, variant)`)
- Modify: `api/src/store/index.ts` (add `loadCategory(ctx, version, id)` singular loader alongside existing `loadCategories`, mirroring `loadElement`/`loadElements`)
- Modify: `api/scripts/r2-upload.ts` (extend `CONTENT_TYPE_BY_EXT` with `.svg`; walker already recurses `dist/schemas/<version>/` but verify it handles the new `icons/<element_id>/<variant>.svg` tree)
- Create: `api/src/store/symbols.ts` (or modify `api/src/store/r2-loader.ts`) — add `loadSymbolSvg` AND `loadComposedIconSvg`. Both mirror `loadElement`'s inline-bundle-then-R2 pattern. `loadComposedIconSvg` returns null on miss (caller handles fallback).
- Modify: `api/src/store/inline-bundles.ts` (extend `InlineBundle` interface with `symbols: Record<string, string>` and `composedIcons: Record<string, string>` keyed by `"<element_id>/<variant>"`; update `getInlineBundle` callers; include both in inline bundle for tests)
- Test: `api/test/unit/store.test.ts` (or equivalent), `api/test/cli/r2-upload.test.ts`

**Approach:**
- `keys.ts`:
  - `symbolKey(version, symbol_id) = \`schemas/\${version.dir}/symbols/\${symbol_id}.svg\``
  - `composedIconKey(version, element_id, variant) = \`schemas/\${version.dir}/icons/\${element_id}/\${variant}.svg\``
  - Both match the existing naming convention.
- `r2-upload.ts`: add `'.svg': 'image/svg+xml'` to `CONTENT_TYPE_BY_EXT`; verify the directory walker handles the two-level `icons/<element_id>/<variant>.svg` tree (existing walker likely recurses; confirm during implementation).
- `loadSymbolSvg(ctx, version, symbol_id)`: mirror the existing `loadElement` shape — try inline bundle first (test path), then R2, then null. Return SVG as UTF-8 string.
- `loadComposedIconSvg(ctx, version, element_id, variant)`: same pattern. Return null on miss; Unit 8's route handler triggers on-the-fly fallback when this returns null.
- Inline-bundle for tests: extend the existing inline-bundle generation so unit tests can seed symbols AND composed icons without real R2.

**Patterns to follow:**
- `api/src/store/keys.ts:11-39` key-builder conventions.
- `api/src/store/index.ts` loader shape (`loadElement`, `loadManifest`).
- `api/scripts/r2-upload.ts:120-183` upload walker + atomic-index-last pattern.

**Test scenarios:**
- Happy path: `symbolKey({ dir: 'ai/2026-04-16-beta' }, 'signal')` returns `schemas/ai/2026-04-16-beta/symbols/signal.svg`.
- Happy path: `composedIconKey({ dir: 'ai/2026-04-16-beta' }, 'accept_deny', 'dark')` returns `schemas/ai/2026-04-16-beta/icons/accept_deny/dark.svg`.
- Happy path: `loadSymbolSvg` / `loadComposedIconSvg` return SVG bytes from R2 for existing keys.
- Edge case: `loadSymbolSvg` returns `null` for a missing symbol (route layer turns this into 404).
- Edge case: `loadComposedIconSvg` returns `null` for a missing composed icon (Unit 8 handler triggers on-the-fly fallback).
- Integration: `r2-upload.ts` dry-run against a built release lists `.svg` files under `symbols/` AND `icons/<element_id>/` with correct content-type.
- Error path: unknown file extension in the dist tree still falls through to `application/octet-stream` (existing behavior preserved).

**Verification:**
- Upload script test shows the expected counts: ~50-60 symbol SVGs and ~300-400 composed icon SVGs uploaded with `Content-Type: image/svg+xml`.
- `loadSymbolSvg` resolves for every ported element's `symbol_id`.
- `loadComposedIconSvg` resolves for every (element, variant) pair in `icon_variants`.

---

- [ ] **Unit 7: REST routes — shape and symbol primitives**

**Goal:** Mount `/api/v2/shapes/:shape.svg` (bundled) and `/api/v2/schemas/:version/symbols/:symbol_id.svg` (release-pinned) endpoints. Introduce the shared `setIconCacheHeaders` helper.

**Requirements:** R10, R11

**Dependencies:** Unit 4 (shapes), Unit 6 (symbol loader)

**Files:**
- Modify: `api/src/rest/routes.ts`
- Create (optional split): `api/src/rest/icons.ts`
- Modify: `api/src/rest/responses.ts` — add `setIconCacheHeaders(c, manifest?)` helper. For stable releases: `public, max-age=31536000, immutable`. For beta: `public, max-age=60`. For shapes (no manifest): same as stable immutable. Also stamps `DTPR-Content-Hash` header from manifest when present.
- Modify: `api/src/app.ts` — **required**: add explicit `app.use(<path>, timeout({ ms: 2000 }))` registrations for each new route (`/api/v2/shapes/:shape.svg`, `/api/v2/schemas/:version/symbols/:symbol_id.svg`, `/api/v2/schemas/:version/elements/:element_id/icon.svg`, `/api/v2/schemas/:version/elements/:element_id/icon.:variant.svg`). The existing timeout wiring at lines 62-68 is an explicit per-route enumeration, not a wildcard — new routes without a registration run without a wall-clock budget.
- Test: `api/test/api/icons.test.ts`

**Approach:**
- **No existing REST route in `api/src/` returns a non-JSON body.** Hono idiom for this codebase (closest in-repo precedent: `api/src/store/cache-wrapper.ts:72-74`): use `c.header(name, value)` to stamp `Content-Type: image/svg+xml; charset=utf-8` and cache headers, then `return c.body(svg)`. Do not use `c.json(...)`.
- **Re-validate URL path params before constructing R2 keys.** Before passing `shape`, `symbol_id`, `element_id`, or `variant` to lookup/key builders, guard with the same regex already used by the Zod schema (`/^[a-zA-Z0-9_-]+$/` for ids, `ShapeTypeEnum` for shapes). Use `apiErrors.badRequest(...)` on failure. Build-time Zod is not sufficient — the URL is user input.
- Shape route handler: validate `shape` param, look up shape in `SHAPES`, wrap the default (outline, black) fragment in a 36×36 `<svg>` envelope, call `setIconCacheHeaders(c)` (no manifest), return the body. 404 on unknown shape.
- Symbol route handler: resolve version via existing `resolveKnownVersion`, validate `symbol_id` regex, load manifest (required for `DTPR-Content-Hash`), load symbol via `loadSymbolSvg`, call `setIconCacheHeaders(c, manifest)`, return the body. 404 on unknown symbol.
- **Error responses MUST set `Cache-Control: no-store`** (handled via `apiErrors` / global error middleware). Do not let a 404 or 400 get cached under the `public, max-age=60` beta header — that would allow a single bad request to poison the CDN cache for 60s.
- Rate-limit: wildcard `app.use('/api/v2/*', rateLimit({ binding: 'RL_READ' }))` in `api/src/app.ts:74-76` already covers these routes. No new binding.

**Patterns to follow:**
- `api/src/rest/routes.ts:58-65` (manifest route — simplest release-pinned handler, adapt to set SVG headers and `c.body` instead of `c.json`).
- `api/src/store/cache-wrapper.ts:72-74` — the only in-repo precedent for explicitly setting `content-type` on a response.
- Existing 404 + error-body shape at `api/src/middleware/errors.ts`.

**Test scenarios:**
- Happy path: `GET /api/v2/shapes/hexagon.svg` → 200, `Content-Type: image/svg+xml`, body contains hexagon path, `Cache-Control` includes `immutable`.
- Happy path: `GET /api/v2/schemas/ai@2026-04-16-beta/symbols/signal.svg` → 200, SVG body, `DTPR-Content-Hash` header matches manifest.
- Edge case: URL-encoded version (`ai%402026-04-16-beta`) resolves the same as `ai@2026-04-16-beta`.
- Error path: `GET /api/v2/shapes/triangle.svg` → 404 with valid-shapes list in the error body. Response `Cache-Control: no-store`.
- Error path: `GET /api/v2/schemas/ai@2026-04-16-beta/symbols/does_not_exist.svg` → 404 with `Cache-Control: no-store`.
- Error path: `GET /api/v2/schemas/ai@2026-04-16-beta/symbols/..%2Findex.svg` → 400 (path-traversal attempt; regex guard rejects the decoded `..` segment).
- Error path: `GET /api/v2/schemas/unknown-version/symbols/signal.svg` → 404 (version not in index).
- Integration: beta release symbol response success uses `public, max-age=60`; stable uses `max-age=31536000, immutable`. All non-2xx icon responses use `Cache-Control: no-store`.

**Verification:**
- All 4 shapes resolvable via primitives endpoint.
- All 75 elements' `symbol_id` values resolvable via symbols endpoint after r2-upload.

---

- [ ] **Unit 8: REST routes — composed icons**

**Goal:** Mount `/api/v2/schemas/:version/elements/:id/icon[.<variant>].svg` and compose on the fly.

**Requirements:** R12, R19, R21, R24

**Dependencies:** Unit 5 (compositor), Unit 7 (route mounting established)

**Files:**
- Modify: `api/src/rest/routes.ts` (or `rest/icons.ts` if split)
- Test: `api/test/api/icons.test.ts` (extend)

**Approach:**
- **Two explicit routes, same handler.** Mount both `GET /schemas/:version/elements/:element_id/icon.svg` and `GET /schemas/:version/elements/:element_id/icon.:variant.svg` against the same handler function. The default-variant route resolves `variant = 'default'`. This matches the zero-precedent-for-Hono-optional-params state of the codebase and keeps route enumeration simple.
- Handler flow — **pre-baked first, on-the-fly fallback**:
  1. Resolve known version.
  2. Validate `element_id` and `variant` (when present) against `/^[a-zA-Z0-9_-]+$/`; 400 on failure.
  3. Try `loadComposedIconSvg(ctx, version, element_id, variant)` — R2 point-read at `schemas/<ver>/icons/<element_id>/<variant>.svg`.
     - **Hit (hot path)**: set `Content-Type: image/svg+xml; charset=utf-8`, call `setIconCacheHeaders(c, manifest, { prebaked: true })`, return via `c.body(svg)`. Done.
     - **Miss**: fall through to step 4.
  4. On miss, log observability metric `icon_miss_fallback` with `(version, element_id, variant)` — production traffic on this path is a signal that either a build hasn't been run since content changed OR the variant is invalid.
  5. Load element; 404 with `Cache-Control: no-store` on missing element.
  6. Load element's category via `loadCategory(ctx, version, element.category_id)`; fail with 500 if missing (content invariant validated at build time).
  7. Resolve variant token:
     - `default` → `default`
     - `dark` → `dark`
     - any other → look up in `category.context?.values`; if not found, 404 with `valid_variants` array in the error body and `Cache-Control: no-store`.
  8. Load symbol SVG via `loadSymbolSvg`.
  9. Call `composeIcon({ shape: category.shape, symbolSvg, variant })` — same pure function used at build time.
  10. Set `Content-Type: image/svg+xml; charset=utf-8`, call `setIconCacheHeaders(c, manifest, { prebaked: false })` (shorter TTL — 60s — to reflect iteration state), return via `c.body(svg)`.
  11. **No write-back to R2.** Persistence comes from the next `schema:build`.
- All non-2xx responses from this handler set `Cache-Control: no-store`.

**Patterns to follow:**
- `api/src/rest/routes.ts:124-143` (element detail route — the closest existing analog for the lookup flow).
- `api/src/middleware/errors.ts` for 404 body shape.

**Test scenarios:**
- Happy path (pre-baked hit): `GET /api/v2/schemas/ai@2026-04-16-beta/elements/accept_deny/icon.svg` → 200 with composed hexagon + `accept_deny` symbol, served directly from R2 `schemas/<ver>/icons/accept_deny/default.svg`. No compositor invocation. `Cache-Control` long-TTL. No `icon_miss_fallback` log entry.
- Happy path (pre-baked hit): `...icon.dark.svg` → 200 with black-filled shape and white inner; R2 hit.
- Happy path (pre-baked hit): `...elements/accept_deny/icon.ai_only.svg` → 200 with hexagon filled in the `ai_only` context color from `ai__decision`; R2 hit.
- Happy path (miss-fallback): test that *deletes* the pre-baked key in test R2 → request falls back to on-the-fly compositor → 200 with identical bytes; `icon_miss_fallback` log entry present; `Cache-Control: public, max-age=60`.
- Happy path (byte parity): for a sample element, the byte content served via pre-baked hit equals the byte content served via miss-fallback (proves the two paths are in sync).
- Edge case: element whose category has no `context` still supports `default` and `dark`; any other variant → 404.
- Error path: unknown element → 404 with `Cache-Control: no-store`.
- Error path: unknown variant token → 404 with `{ error: '...', valid_variants: ['default', 'dark', 'ai_only', 'ai_decides_human_executes', ...] }` and `Cache-Control: no-store`.
- Error path: `element_id` containing `/` or `..` → 400 with `Cache-Control: no-store` (path-traversal guard).
- Error path: element references `symbol_id` not in release → 500 (this is a build-time invariant, but the handler should surface a clean error rather than crash).
- Integration: response `Cache-Control` for beta returns `public, max-age=60` (diverging from `cacheControlFor`'s `no-store`); stable returns `public, max-age=31536000, immutable`.
- Integration: `DTPR-Content-Hash` header present on every composed response.

**Verification:**
- All 75 elements resolve default + dark variants via pre-baked hits.
- Elements whose category has a `context` resolve each context-value-id variant via pre-baked hits.
- Miss-fallback path produces byte-identical output to the pre-baked path for the same inputs (guarantees no drift between build-time and runtime composition).
- Golden visual parity for one element per shape category against the legacy `app/public/dtpr-icons/<element>.svg`.
- Production `icon_miss_fallback` rate post-deploy should trend to zero after each `schema:build` + `r2-upload` completes. Non-zero steady-state rate indicates an operational issue (stale R2, bad variant in a consumer URL).

---

- [ ] **Unit 9: MCP surface updates — expose icon URLs via JSON tools**

**Goal:** Surface icon discoverability through the existing MCP JSON tools. `icon_variants` lands in `get_element` / `list_elements` responses automatically via Unit 3's materialization. Optionally add a `get_icon_url` helper tool that returns a `{ url, content_type, variant }` shape so MCP clients can resolve a composed icon URL without URL-construction logic.

**Requirements:** R14, R25

**Dependencies:** Unit 3, Unit 7, Unit 8

**Files:**
- Modify: `api/src/mcp/tools.ts` — add the `get_icon_url` tool descriptor and handler alongside existing tools (register via `buildToolRegistry` at `api/src/mcp/tools.ts:100-115`; descriptor shape follows `get_element` at `api/src/mcp/tools.ts:326-378`).
- Test: extend `api/test/api/mcp.test.ts` with `get_icon_url` assertions; assert `icon_variants` appears in the existing `get_element` / `list_elements` responses.

**Approach:**
- **No OpenAPI surface exists in this codebase.** `api/package.json:25-32` has no `@hono/zod-openapi` dependency; a repo-wide grep for `openapi|swagger` returns no source matches. Drop the OpenAPI portion of the original unit scope. Writing a hand-authored OpenAPI document for every route is a follow-up decision tracked separately; it's not the right moment to introduce one as a side-effect of icon work.
- **MCP is JSON/text-only** (see `ToolResult` at `api/src/mcp/tools.ts:50-54` and the JSON-RPC dispatcher at `api/src/mcp/server.ts:143-188`). Do not serve raw SVG bytes through MCP. MCP clients fetch SVGs via the REST URLs in Units 7-8.
- `icon_variants` is already materialized into `elements.json` and per-element JSON by Unit 3. Existing `get_element` / `list_elements` MCP tools return the JSON as-is, so the field surfaces automatically — no tool-descriptor changes needed for that.
- Optional `get_icon_url` tool: input `{ version, element_id, variant?: string }`; output `{ url, content_type: 'image/svg+xml', variant }`. Validates variant against `icon_variants` before returning. This saves MCP clients from URL-construction logic and surfaces the variant enumeration inline.

**Patterns to follow:**
- `api/src/mcp/tools.ts:326-378` — `get_element` tool descriptor shape.
- `api/src/mcp/tools.ts:100-115` — `buildToolRegistry` registration.
- `schemaToJson` helper already used for inputSchema in the existing tools.

**Test scenarios:**
- Happy path: `get_element` MCP response includes `icon_variants: ["default", "dark", ...context_value_ids]` for the element.
- Happy path: `get_icon_url` with `variant: "dark"` returns the expected URL pointing at `/api/v2/schemas/<version>/elements/<id>/icon.dark.svg`.
- Happy path: `get_icon_url` with omitted `variant` defaults to the default icon URL.
- Error path: `get_icon_url` with an unrecognized variant returns an MCP tool error listing valid variants.

**Verification:**
- `api/test/api/mcp.test.ts` passes with new assertions.
- MCP tool list includes `get_icon_url`.

---

*(Unit 10 removed per user direction — studio cleanup is deferred to a dedicated future task. Studio continues to use its local `/api/icons/*` routes against bundled files; this plan does not touch studio.)*

---

## System-Wide Impact

- **Interaction graph:**
  - REST routes mount into the existing Hono app at `api/src/app.ts:79` alongside `/api/v2` JSON routes. Middleware chain (cors, logging, timeout, rate-limit, errors) applies uniformly.
  - Build pipeline (`api/cli/commands/build.ts`) now loads symbols from YAML source, validates via new rules, **runs `composeIcon` for every (element × variant) combination**, and emits both primitives and pre-baked composed icons to `dist/`. Downstream: `api/scripts/r2-upload.ts` walks the extended dist tree (symbols/ + icons/<element_id>/).
  - Runtime: composed-icon route first reads pre-baked R2; on miss, falls back to the same `composeIcon` function. Build and runtime invocations of the compositor are byte-identical for identical inputs.
  - Migration (`api/migrations/port-ai-v1-to-2026-04-16.ts`) re-run produces new YAML + copied symbol files.
- **Error propagation:**
  - Build-time: schema violations, missing symbols, reserved-token collisions → `pnpm schema:build` fails with actionable error codes.
  - Runtime: unknown version/element/symbol/variant → 404 with structured error body; compositor errors bubble to the global error middleware.
- **State lifecycle risks:**
  - `content_hash` extension means a release's hash changes when symbol bytes change without YAML changes. The atomic-index-last upload at `api/scripts/r2-upload.ts:164-183` already handles this. The stable-immutability check at `r2-upload.ts:134-139` must still pass — stable releases never re-upload; this plan does not promote any release to stable, so no new risk.
  - On the first `schema:build` after this work lands, every existing release (just `ai@2026-04-16-beta`) gets a new `content_hash` because the payload definition changed. Verified safe: `api/test/unit/json-emitter.test.ts` only asserts hash determinism within a source and response-to-edit sensitivity, not stability across releases; `api/test/api/seed.ts` uses a hardcoded fixture hash for seeding and is unaffected; `api/test/cli/cli-build.test.ts` asserts hash format (`sha256-<64 hex>`), not a specific value. No cross-release hash comparison exists in tests or integrations.
- **API surface parity:**
  - Existing JSON endpoints now include `symbol_id`, `shape`, and `icon_variants` per element. Any downstream consumer that fails closed on unknown JSON fields is unaffected (no removals); consumers that type-check strictly need to update their local type declarations (no shared types package exists today).
  - The dropped `icon` field is a **breaking change** for any consumer that read it. Per Scope: external consumers are not being migrated; they continue using `app/server/api/dtpr/v0|v1` endpoints which remain in place. Internal consumers of the new `api/` endpoints (there are none in production yet — the API is freshly shipped in Units 7-12 from `docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md`) are updated in this plan.
- **Integration coverage:**
  - Unit 7 and Unit 8 integration tests use `SELF.fetch` against the full middleware stack — the only way to prove Cache-Control headers, version resolution, and error bodies end-to-end.
  - Golden-file parity test in Unit 5 catches visual regressions that unit tests can't.
- **Unchanged invariants:**
  - `app/server/api/dtpr/v0|v1` endpoints and the legacy `app/public/dtpr-icons/*.svg` files are untouched. v1 consumers continue to work.
  - `SchemaManifestSchema` keeps its name; no terminology rename in this plan.
  - Rate-limit middleware (`RL_READ`, `RL_VALIDATE`) applies to new routes uniformly; no new rate-limit configuration.

## Risks & Dependencies

| Risk | Mitigation |
|---|---|
| Compositor output drifts visually from current pre-baked icons | Golden-file parity test per shape in Unit 5; visual parity is the acceptance bar, not byte equality |
| `content_hash` extension silently breaks an existing consumer that pinned on a hash | Only release affected is `ai@2026-04-16-beta`, which is `-beta` status; no consumer has production-pinned this release yet. Verified no cross-release hash comparison in tests (see System-Wide Impact). |
| Re-running the migration loses hand-edits made to `api/schemas/ai/2026-04-16-beta/` | Review `git diff` after re-run; if any legitimate hand-edits exist, port them into the migration script itself for reproducibility |
| Attribute rewrite in shape template leaks unintended CSS/SVG state (e.g. `stroke-width`) | Test matrix covers all 3 variants × all 4 shapes; golden-file parity catches rendering drift |
| Symbol SVGs contain unexpected wrapper attributes or active content (e.g. `xmlns:xlink`, `style`, BOM, XML prolog, `<script>`, event handlers, external `xlink:href`, `<foreignObject>`) | Unit 3's `symbol-refs` rule rejects at build time with `SYMBOL_MALFORMED_WRAPPER` and `SYMBOL_ACTIVE_CONTENT` error codes; Unit 5's `stripOuterSvg` test includes fixtures with extra wrapper attrs; negative test fixtures in Unit 3 cover each rejection case |
| Path-traversal attack via URL param (e.g. `symbols/..%2Findex.json.svg`) reads unintended R2 objects | Request-time regex guard in Unit 7/8 rejects any param outside `/^[a-zA-Z0-9_-]+$/` with 400; negative test case covers the decoded `..` path |
| 4xx error responses from icon routes get cached at the CDN for up to 60s (beta), poisoning subsequent legitimate requests | Unit 7/8 set `Cache-Control: no-store` on every non-2xx response; test assertions check the header on 400/404 paths |
| Cloudflare Worker CPU exceeds budget under composition load | Composition is trivial string concatenation (~microseconds); revisit only if observability surfaces the trigger criteria in origin brainstorm (> 20ms p99 for 7 days) |
| Breaking change to `ElementSchema` (dropped `icon`, singular `category_id`) cascades through local TS consumers in tests | TypeScript compiler surfaces all cascades in Unit 1; each is addressed in sequence. API shipped 2026-04-16 with no production consumers yet, so no external drift risk. |
| Icon-route burst traffic (~75 parallel requests per grid render) exhausts `RL_READ` 300/60s budget | Pre-baked hot path is a plain R2 point-read (no composition, no multi-step load chain), so cold-cache bursts are cheap per-request. Beta pre-baked hits use `public, max-age=3600`; stable uses `max-age=31536000, immutable`. The first render caches at the edge; subsequent renders bypass the Worker. Monitor 429 rate on icon paths post-deploy; bump to `RL_ICONS` binding if rate exceeds 0.1%. |
| Pre-baked combinatorial grows beyond expected footprint | At current scale: 75 elements × ~4.5 variants avg × ~2KB ≈ 700KB composed + ~200KB symbols = ~1MB per release — well under the 5MB revisit threshold. New datachain types or higher variant counts could push this; the build already asserts the count and storage total, and the brainstorm's 5MB trigger stays in effect. |
| On-the-fly fallback starts carrying steady-state production traffic (shouldn't happen after build) | `icon_miss_fallback` observability metric logs every fallback hit with `(version, element_id, variant)`. Non-zero steady-state rate triggers investigation: stale R2, bad variant in consumer URL, build-upload skipped. Cache TTL on fallback is short (60s) so a fix propagates quickly. |
| Build-time and runtime compositor drift (`composeIcon` version mismatch produces different bytes) | `composeIcon` is a pure function with no environment dependence; build-time calls it from Node, runtime calls it from Workers runtime. Unit 8 has an explicit byte-parity test between pre-baked and miss-fallback paths for the same inputs. If the test fails, the compositor has a latent nondeterminism bug. |
| MCP tool descriptors fall out of sync with actual routes | Unit 9 test assertion: `get_icon_url` returns URLs that match the routes mounted in Units 7-8; `icon_variants` in JSON responses matches the variants the composed route accepts. |

## Documentation / Operational Notes

- **MCP**: `get_icon_url` tool and `icon_variants` in element JSON surface automatically on deploy. No manual docs update required.
- **OpenAPI**: no OpenAPI document exists today; Unit 9 does not introduce one.
- **Cross-domain documentation**: a broader documentation effort starting separately will clarify migration and URL contracts across all domains (app, docs-site, external partners). This plan does not preempt that work.
- **Monitoring**: Cloudflare Analytics on `api.dtpr.io` already captures CPU, error rate, and cache hit rate. Post-deploy watchlist:
  - 429 rate on icon paths (> 0.1% → add `RL_ICONS` bucket).
  - `icon_miss_fallback` rate (expected near-zero steady-state; spikes around `schema:build` + `r2-upload` cycles are normal, persistent rate is a signal).
  - R2 egress attributable to icon reads (revisit storage model if > 5GB/day, per origin brainstorm threshold).
- **Rollout**: single deploy via existing CI. The `-beta` release can be re-uploaded at any time without touching stable-release invariants. Build now produces ~300-400 pre-baked icon SVGs; the upload step naturally handles these alongside existing JSON artifacts.
- **Rollback**: Units 1, 2, 3 form an atomic schema-migration — revert all three commits together and re-run `pnpm --filter api exec tsx migrations/port-ai-v1-to-2026-04-16.ts` to regenerate pre-change YAML. Because the API shipped 2026-04-16 with no production consumers yet, no staged rollback or feature flag is needed. If latent consumer code surfaces after this lands, prefer forward-fix (additive compat shim at the JSON emitter layer) over rollback.
- **Iterative authoring workflow**: when an author adds a new symbol or changes a context color, the next request for an affected variant falls back to on-the-fly composition (observable via `icon_miss_fallback` log), returning the correct bytes with a 60s TTL. When `pnpm schema:build` + `r2-upload` run (locally or in CI), the pre-baked bytes become authoritative and the fallback rate returns to zero. Authors do not need to rebuild to see their changes; production gets pre-baked stability.
- **Legacy coexistence**: `app/public/dtpr-icons/*.svg` and `app/server/api/dtpr/v0|v1` endpoints remain in place. No deprecation shim, no redirect, no announcement. Cross-domain migration is being documented separately.
- **Studio**: untouched by this plan. Studio continues to use its local `/api/icons/*` routes. A separate task will later migrate studio to the new API surface.

## Alternative Approaches Considered

- **On-the-fly composition as the hot path (brainstorm's original default)**: Compose every composed-icon response at the Worker from primitives; rely on CDN cache for absorption. Rejected in this plan (accepted in original brainstorm). The costs: (a) every cold-cache request runs multi-step load chain + compositor; (b) composition bugs can propagate to consumer-visible renders until fixed; (c) hot path shares fate with authoring-iteration path, making observability noisy. The original brainstorm's rationale ("SVG string composition is trivial CPU; CDN caching via immutable version-pinned URLs makes storage duplication redundant") is still partially true, but icons' production-criticality tips the balance toward pre-bake. Kept as the fallback path so the iteration-speed benefit isn't lost.
- **Pre-bake only `default` variant, compose the rest on-the-fly**: A hybrid that captures most of the burst-absorption benefit since default dominates traffic. Rejected: adds a conditional at every layer (build emits some, runtime decides which path by variant), and the storage savings are marginal. Uniform pre-baking keeps every code path simple.
- **Pre-bake with runtime write-back on miss**: When on-the-fly fallback produces a result, write it to R2 for next time. Rejected: runtime side-effects bypass `content_hash` integrity, produce drift between deployed R2 content and what the build would emit, and create observability noise (is that R2 object from a build or a runtime-write?). Persistence stays strictly through the build pipeline.
- **SVG sprite with `<symbol>` + `<use>`** (from brainstorm): Rejected in brainstorm for the reasons documented there (consumers use `<img>` not inline-SVG). Unchanged.
- **Authored per-context-value `inner_color` field** (from brainstorm): Rejected in brainstorm in favor of WCAG-computed. Still rejected here; flagged in the confidence-check pass as a potential escape hatch if the luminance formula produces a wrong answer for a specific context color, but no such case exists in current content.

## Sources & References

- **Origin document**: [docs/brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md](../brainstorms/2026-04-17-dtpr-icon-composition-brainstorm.md)
- **Related stub plan**: [docs/plans/2026-04-17-001-feat-content-release-terminology-rename-stub.md](./2026-04-17-001-feat-content-release-terminology-rename-stub.md)
- **Preceding API/MCP plan**: [docs/plans/2026-04-16-001-feat-dtpr-api-mcp-plan.md](./2026-04-16-001-feat-dtpr-api-mcp-plan.md) — conventions this plan extends
- **Related code**:
  - `api/src/schema/element.ts:10-56`, `api/src/schema/category.ts:11-43`, `api/src/schema/context.ts:13-34`
  - `api/src/validator/rules/icons.ts` (to delete), `api/src/validator/semantic.ts:17-27`
  - `api/cli/lib/json-emitter.ts:31-42` (materialization), `:65-77` (content_hash)
  - `api/src/store/keys.ts:11-39`, `api/src/store/index.ts` (loadElement/loadCategories/loadManifest pattern), `api/src/rest/routes.ts:52-195`, `api/src/rest/responses.ts:68-81`
  - `api/src/validator/types.ts` (SchemaVersionSource) — extend with symbols map
  - `api/src/middleware/errors.ts` — error-body shape and `Cache-Control: no-store` enforcement
  - `api/src/store/cache-wrapper.ts:72-74` — closest in-repo precedent for non-JSON response
  - `api/src/app.ts:62-76` — per-route timeouts and rate-limit mounts
  - `api/src/middleware/rate-limit.ts:53-68` — single-token consumption
  - `api/src/mcp/tools.ts:50-72,100-115,326-378` — descriptor shape, registry, `get_element` reference
  - `api/src/mcp/server.ts:143-188` — JSON-RPC dispatcher
  - `api/wrangler.jsonc:26-40,60-75` — `RL_READ` (300/60s) bucket config
  - `api/scripts/r2-upload.ts:68-75`, `:134-139` (stable immutability), `:164-183` (atomic index-last)
  - `api/migrations/lib/transform-element.ts:46-118`
  - `studio/lib/icon-shapes.ts:47-71` (CATEGORY_SHAPE_MAP — copy for migration)
  - `studio/lib/icon-compositor.ts` (reference only — do not reuse)
- **Porting sources**:
  - `app/public/dtpr-icons/symbols/` — 95 symbol SVGs at `viewBox="0 0 36 36"`, `fill="currentColor"`
  - `app/public/dtpr-icons/shapes/` — 4 shape SVGs; lift path `d` attributes during Unit 4
  - `app/content/dtpr.v1/elements/en/*.md` — authoritative v1 `symbol:` references for the port
- **Related commits**: 2e87e25 (REST + MCP read path), fc0bb6b (DTPR standalone API scaffold) — establish the Worker patterns this plan extends
