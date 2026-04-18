---
date: 2026-04-17
topic: dtpr-icon-composition
---

# DTPR Icon Composition in the API

## Problem Frame

Every DTPR element has an icon, and that icon is a composition of three pieces: a **shape** (derived from the element's category — e.g. hexagon, circle, rounded-square, octagon), a **symbol** (a glyph specific to the element's meaning), and a **color** (usually black, but tinted in specific contexts to convey additional meaning — e.g. a "regulated" context value renders the icon in orange).

Three things make the current state blocking:

1. **Icons are missing from the new API's schema.** The v1 markdown content at `app/content/dtpr.v1/` carried `icon: /path.svg` and `symbol: /path.svg` fields, but the port to `api/schemas/ai/2026-04-16-beta/` explicitly dropped `symbol` (see `api/src/schema/element.ts:22-25`), and categories never had a `shape` field. `ContextValue.color` already exists but isn't wired to anything. Elements in the new API currently have no working icon story.

2. **The icon pipeline is pre-baked, not composable.** The v1 content points at hand-composed SVG files in `app/public/dtpr-icons/*.svg` where the shape, symbol, and black color are fused at author time. Any variant (dark mode, context-colored) requires authoring a new file. This doesn't scale as context values and new elements grow.

3. **Studio has proven composition, but it's an experiment in the wrong place.** `studio/lib/icon-compositor.ts`, `studio/lib/icon-shapes.ts`, and `studio/server/api/icons/*.ts` solve the composition problem from clean primitives. The cleaned primitives themselves already live in `app/public/dtpr-icons/symbols/` (95 symbol SVGs using `fill="currentColor"`) and `app/public/dtpr-icons/shapes/` (4 shape SVGs). But `studio` is a Nuxt playground and `app` is a consumer — neither is the right owner. The composition pipeline belongs in `api`, which is already the canonical home for schemas, releases, and content bundles.

The goal is to move icon composition into `api` as a first-class capability: author primitives in the release bundle, expose primitives AND canonical composed URLs, serve composition on-the-fly at the Worker with aggressive CDN caching. Internal tooling (`app`, `studio`, `docs-site`) consumes icons via canonical URLs; primitive endpoints support authoring and experimentation. URL stability for stable releases falls out of the existing immutability guarantee — any consumer, internal or external, that pins to a stable-release URL gets byte-stable assets without us having to treat that as a separate partner-facing contract.

## Requirements

**Terminology and Schema Evolution**

- R1. Adopt explicit terminology **in new code and docs added by this work**: **structural schema** (Zod/TS code in `api/src/schema/`) vs **content release** (a concrete immutable-when-stable snapshot like `ai@2026-04-16-beta` living in `api/schemas/<datachain_type>/<version>/`). Add this distinction as a docstring on any new fields introduced here, but do NOT rename existing types (`SchemaManifestSchema` etc.) or deprecate `app/content/dtpr.v1/` as part of this work. Those are cross-cutting renames tracked separately in `docs/plans/2026-04-17-001-feat-content-release-terminology-rename-stub.md`.
- R2. Add `symbol_id: string` to `ElementSchema`. Validated against the release's symbol library at build time (analog to the existing category validation).
- R3. Add `shape: ShapeTypeEnum` to `CategorySchema`. Enum values: `hexagon | circle | rounded-square | octagon`. Required on every category.
- R4. Drop `IconSchema` from `ElementSchema` and from author-facing element YAML. The canonical icon URL is derivable by the API and does not live in the manifest. The existing semantic validator rule at `api/src/validator/rules/icons.ts` (rule 14: `ICON_URL_EMPTY` / `ICON_FORMAT_EMPTY`) is removed alongside the schema change; new validators for `symbol_id` replace it (see R15). Icons carry no locale-specific text at the SVG layer (see R22).
- R5. No changes needed to `ContextValueSchema.color` — it already exists. Wire it through icon composition per R9.
- R23. Change `ElementSchema.category_ids: string[]` to `category_id: string`. Elements belong to exactly one category. The multi-category shape was a residual smell from the v0/v1 `device__*`+`ai__*` cross-listing; since current focus is DTPR-for-AI only, each element resolves to one category cleanly. Content port: for any element in `api/schemas/ai/2026-04-16-beta/` carrying multiple `category` entries, keep the `ai__*` one and drop the `device__*` one. Validator rule: `category_id` must resolve to an existing category in the release.

**Symbol Library (Content)**

- R6. Symbols are a **library** (not 1:1 with elements). Multiple elements MAY reference the same `symbol_id`. The initial port of `ai@2026-04-16-beta` seeds each element's `symbol_id` with its legacy filename stem; dedup happens later as authors identify shared glyphs.
- R7. Symbol SVGs live in the release source at `api/schemas/<datachain_type>/<version>/symbols/<symbol_id>.svg`. They are content and version per release. The canonical cleaned primitives in `app/public/dtpr-icons/symbols/*.svg` (95 files) are the porting source for `ai@2026-04-16-beta`.
- R8. Per-release symbol duplication across releases is accepted. Rationale: immutability of stable releases > storage optimization at current scale (~180KB raw / ~430KB on disk for the current 95-symbol library, measured from `app/public/dtpr-icons/symbols/`). Revisit if any release's symbols directory exceeds 5MB.

**Shape Primitives (Structural)**

- R9. Shape SVGs live in `api/` package code (e.g. `api/src/shapes/` or ported `icon-shapes.ts`), NOT in release content. They are a fixed 4-value enum and part of the structural schema, not content. Changes to shapes are structural schema changes.

**Icon API Surface**

- R10. **Shape primitives** (not release-pinned, served from bundled code):
  - `GET /api/v2/shapes/:shape.svg` for `shape ∈ {hexagon, circle, rounded-square, octagon}`
  - Response: `image/svg+xml`, `Cache-Control: public, max-age=31536000, immutable`
- R11. **Symbol primitives** (release-pinned, served from R2 release bundle):
  - `GET /api/v2/schemas/:version/symbols/:symbol_id.svg`
  - Response: `image/svg+xml`. `Cache-Control: public, max-age=31536000, immutable` for stable releases; short TTL for `-beta`.
- R12. **Composed icons** (release-pinned, path-based variants, mounted under the existing `/api/v2/schemas/:version/` surface for consistency with the JSON routes in `api/src/rest/routes.ts`):
  - `GET /api/v2/schemas/:version/elements/:id/icon.svg` — default (light: black stroke shape, no fill, black inner)
  - `GET /api/v2/schemas/:version/elements/:id/icon.dark.svg` — inverted (black fill shape, white inner)
  - `GET /api/v2/schemas/:version/elements/:id/icon.<context_value_id>.svg` — colored (shape filled with `context_value.color`; inner color computed by WCAG rule R24)
  - Response: `image/svg+xml`. Cache lifetime matches release mutability (1 year + immutable for stable; short TTL for beta).
- R24. **Inner color for colored variant** is deterministic, computed from `context_value.color`'s relative luminance per WCAG: if luminance ≥ 0.179, inner = black; otherwise inner = white. Formula: `L = 0.2126·R + 0.7152·G + 0.0722·B` where R/G/B are linearized sRGB channels in [0, 1]. This gives authors a predictable contrast result without authoring a secondary color, and aligns with WCAG AA's 3:1 threshold against white/black. Build step emits a warning (not a failure) when any `context_value.color` produces a contrast ratio < 4.5:1 against its computed inner — authors can revisit the color choice if the warning fires.
- R25. **Variant discoverability via JSON**: each element's materialized JSON (`elements.json` and `elements/<id>.json`) includes an `icon_variants: string[]` field listing the valid variant tokens for that element — always `["default", "dark"]` plus the element's category's `context_value.id` entries (if the category has a context). Consumers can enumerate valid URLs without trial-and-error against R21's 404.
- R13. **Composition strategy**: on-the-fly at the Worker. Read symbol + shape, string-compose, return. No pre-baking into R2 at build time in this scope. Cloudflare Cache API + HTTP `Cache-Control` do the caching work.
- R14. **Composition primitives exposed in JSON** as well as SVG. `symbol_id` appears automatically in `elements.json` and per-element `elements/<id>.json` once R2 lands (top-level schema field). The only net-new materialization work is adding a derived `shape` field to each emitted element (sourced from the element's category per R23, analogous to the existing `variables` materialization at `api/cli/lib/json-emitter.ts`). Clients that want to compose client-side read `symbol_id` and `shape` directly from the JSON without hitting the SVG endpoints.

**Validation and Build**

- R15. Build step (`pnpm schema:build`) validates every `Element.symbol_id` resolves to a file in the release's `symbols/` directory. Missing symbol → build fails.
- R16. Build step validates every `Category.shape` is a known shape enum value. Unknown shape → build fails.
- R17. Build step bundles release symbol SVGs to R2 under `schemas/<version.dir>/symbols/<symbol_id>.svg` alongside the existing JSON assets, matching the existing R2 key convention in `api/src/store/keys.ts`. Symbol SVG bytes MUST participate in the release `content_hash` so that editing a symbol without other content changes produces a new hash and re-uploads the SVG (current hash payload in `api/cli/lib/json-emitter.ts:65-77` covers only JSON — this gets extended).

**Context Color Resolution**

- R19. For `icon.<context_value_id>.svg`: resolve `<context_value_id>` against the context of the element's single category (per R23). Since each element has exactly one category, resolution is unambiguous.
- R20. Build step validates `ContextValue.id` uniqueness within each category's context (preserves the existing `api/src/schema/context.ts:15` rule — "unique within its context"). Build also validates that no `ContextValue.id` equals a reserved variant token (`dark`, future-added variant names) to prevent URL collisions with the hard-coded `icon.dark.svg` route.
- R21. If the requested context value id is not present in the element's category's context (or the category has no `context` dimension), respond `404` with an error body listing valid context value ids for that element.

**Accessibility**

- R22. Icons are pure glyphs — they carry no locale-specific text in the SVG response. Consumers who need accessible labels source them from the element's already-localized `title` field (via the JSON endpoints) at render time, and wrap the icon in an `<img alt="...">` or `<svg role="img"><title>...</title></svg>` in their own rendering context. The icon API does NOT embed `<title>`/`<desc>` per-locale and does NOT do `Accept-Language` negotiation. This keeps the SVG response cacheable under a single URL and decouples icon rendering from content localization.

## Success Criteria

- Every element in `ai@2026-04-16-beta` has a valid `symbol_id` after the port; `pnpm schema:build` succeeds.
- Every category has a `shape`; build fails without one.
- `GET /api/v2/schemas/ai@2026-04-16-beta/elements/available_for_resale/icon.svg` returns the same visual icon as the current `app/public/dtpr-icons/available_for_resale.svg` (byte-for-byte need not match; visual parity is the bar).
- A colored-by-context URL like `GET /api/v2/schemas/ai@2026-04-16-beta/elements/<some_regulated_element>/icon.regulated.svg` renders with the context value's authored hex color.
- `studio/server/api/icons/*.ts` can be deleted or reduced to a thin passthrough to the `api` endpoints.
- URLs pinned to a stable release (e.g. `https://api.dtpr.io/api/v2/schemas/ai@2026-04-16-beta/elements/<id>/icon.svg` once that release is promoted to `stable`) continue to resolve to byte-stable assets indefinitely. This is a property of the existing stable-release immutability guarantee, not a separate partner-facing contract.
- Each element's `icon_variants` list in JSON accurately reflects the URLs that return 200 (no trial-and-error needed).

## Scope Boundaries

- **No raster output.** SVG only. PNG/WebP rasterization (`@resvg/resvg-js` WASM or external service) is explicitly deferred. If a consumer needs raster, they convert client-side.
- **No pre-baking to R2.** On-the-fly composition with CDN cache is the only runtime path in this scope. Pre-baking every `{element × variant × context}` gets revisited if observability surfaces any of: (a) Worker CPU > 20ms p99 per icon request for 7 consecutive days, (b) R2 egress > 5 GB/day attributable to icon reads, or (c) CDN cache hit rate < 85% on the icon routes. If none of these fire, on-the-fly stays.
- **No structural schema version field in the manifest.** Tracking "which structural schema does this release conform to" stays implicit (via the emitted `schema.json` in the release bundle and the deployed API version). A `structural_schema_hash` field is a possible future addition, not in scope here.
- **No terminology rename of existing types.** Renaming `SchemaManifestSchema` → `ContentReleaseManifestSchema`, dropping the `.v1` suffix from `app/content/dtpr.v1/`, and related cross-cutting cleanup are tracked in a separate stub plan (`docs/plans/2026-04-17-001-feat-content-release-terminology-rename-stub.md`). New fields/types introduced by this work use the clarified terminology in their docstrings; existing types keep their current names.
- **No localization in icon SVG responses.** Icons are pure glyphs; consumers source localized labels from the JSON endpoints at render time. No `Accept-Language` negotiation, no per-locale `<title>`/`<desc>`.
- **No migration of external-facing URLs.** The existing `app/server/api/dtpr/v0|v1` endpoints and the current `app/public/dtpr-icons/*.svg` files remain in place indefinitely. Both surfaces coexist; no sunset date is promised or planned here. Consumers of the old URLs are not asked to migrate as part of this work, and no redirect/deprecation shim is introduced. Any future consolidation is a separate decision with its own scope and deprecation window.
- **No partner-facing URL documentation.** The URL contract is defined here in the Requirements section and in the OpenAPI/MCP surface the API already emits. A written partner reference (e.g. on a `docs.dtpr.io` page) is tracked as follow-up work, not scoped here.
- **No symbol authoring UI.** Symbols are authored by dropping SVG files into the release source directory. Studio's symbol-generation experiments (`studio/server/api/icons/generate.post.ts`, etc.) stay as experiments for now.
- **No 1:1 enforcement.** The library model allows (and expects) multiple elements to share a `symbol_id`. No tooling to dedupe automatically; authors do it manually.
- **No animated or interactive SVG.** Static composition only.

## Key Decisions

- **Library model for symbols, not 1:1**: many elements share glyphs in practice, and the library decouples symbol authoring from element identity.
- **Shapes as code, symbols as content**: shapes are 4 fixed structural primitives (code-versioned); symbols are author-versioned visual content (release-versioned).
- **Per-release symbol duplication accepted**: immutability of stable releases matters more than storage at this scale.
- **Elements have exactly one category (R23)**: simplifies shape derivation (no "primary category" hack) and reflects the DTPR-for-AI focus. The old `category_ids: string[]` was a `device__*`+`ai__*` cross-listing artifact that doesn't belong in the new schema.
- **Icon API routes live under `/api/v2/` alongside existing JSON routes**: consistency with `api/src/rest/routes.ts` mount point avoids inventing a second top-level URL vocabulary and keeps partner-facing URLs predictable.
- **Icons are locale-neutral at the SVG layer**: no `<title>`/`<desc>` embedding, no `Accept-Language` negotiation. Consumers handle accessibility text in their own render context using the element's localized `title` from the JSON endpoints.
- **Path-based URL variants using context value id, not hex**: keeps CDN cache keys clean, keeps the URL semantically meaningful (reader sees `icon.regulated.svg` and knows why it's colored). Reserved tokens like `dark` are build-time-checked against context value ids.
- **`fill="currentColor"` in symbol primitives**: simplifies composition (no regex fill replacement; just set `color` on the wrapping `<g>`). The cleaned primitives at `app/public/dtpr-icons/symbols/` already follow this convention.
- **On-the-fly composition over pre-baking**: SVG string composition is trivial CPU; CDN caching via immutable version-pinned URLs makes storage duplication redundant. Defers any R2 combinatorial bake work.
- **Drop `IconSchema` from authoring, derive URLs at the API layer**: storing a URL in the manifest duplicates something the API can always compute, and invites drift.
- **Structural vs content release terminology made explicit in new code only**: Zod in code is the structural schema; each release bundle includes an emitted `schema.json` snapshot. Renaming existing types (`SchemaManifestSchema` et al.) is cross-cutting and tracked in a separate stub plan.
- **Symbol id stability is per-release, not global**: `symbol_id` lives inside a release's symbol library (R7). A URL pinned to `ai@2026-04-16-beta/elements/foo/icon.svg` stays byte-stable for that release's lifetime. A later release can rename, merge, or drop that symbol without affecting earlier stable releases. Consumers who want current visuals follow the "latest stable" pointer; consumers who want frozen visuals pin to a version. This falls out of the existing release immutability guarantee — no new policy is introduced.
- **Deterministic WCAG-based inner color (R24)**: picking luminance-based contrast over an authored secondary color keeps `ContextValueSchema` minimal and removes a decision authors would otherwise have to make per context value. Revisit only if a concrete case emerges where the computed color is wrong.

## Alternatives Considered

- **SVG sprite with `<symbol>` + `<use>`** per release, served as a single file (e.g. `/api/v2/schemas/:version/icons-sprite.svg`). Consumers would inline `<svg><use href="…#symbol_id"/></svg>` and use CSS `currentColor` for theming. Rejected for the default path because (a) the dominant consumer shape is `<img src="…">`, which loses `currentColor` and CSS theming when the SVG is loaded as an image rather than inlined; (b) it requires consumers to adopt inline-SVG rendering, a bigger integration cost than "copy URL into an img tag"; (c) the per-request URL is the simplest model for internal tooling like `docs-site` that wants stable cacheable assets. Sprites remain a plausible future addition for high-density consumers (e.g. a studio grid of all element icons) and would not conflict with the per-URL endpoints.
- **Authored per-context-value secondary color** (a `inner_color` field on `ContextValue`) instead of WCAG-computed. Rejected because it adds authoring surface that's almost always mechanically derivable; R24's luminance rule produces the right answer for every context color in current content.
- **Pre-baked composed SVGs in R2 at build time**. Rejected for this scope (covered in Scope Boundaries), but the combinatorial is small enough (~100 elements × 4-5 variants × ~100KB footprint) that a future switch stays open. The reversal signals in the updated Scope Boundary give us a concrete trigger.

## Dependencies / Assumptions

- **R2 CONTENT bucket is already bound** (`api/wrangler.jsonc:20-25`). Symbol SVGs bundle into this same bucket under `schemas/<version.dir>/symbols/<symbol_id>.svg` (aligning with the existing `INDEX_KEY`/`manifestKey`/`elementsKey` prefix convention in `api/src/store/keys.ts`). The `r2-upload` script needs a `.svg` → `image/svg+xml` content-type mapping added (currently only `.json` is handled at `api/scripts/r2-upload.ts:68-75`).
- **Existing build pipeline conventions**: the brainstorm assumes `pnpm schema:build` is the established entry point for release building (per prior brainstorm R10). Icon validation and symbol bundling extend this step; they do not introduce a new pipeline.
- **Cleaned primitives in `app/public/dtpr-icons/symbols/` and `/shapes/` are the porting source**: the 95 symbol SVGs and 4 shape SVGs are treated as canonical and move (or are copied) into their new homes. Any hand-composed `app/public/dtpr-icons/<name>.svg` files at the root level are discarded in the new world (they're the old pre-baked output).
- **Elements in `ai@2026-04-16-beta` are expected to resolve to a single AI category during R23 migration**. Any multi-category elements (v0/v1 `device__*`+`ai__*` cross-listings) have their non-AI category dropped in the port; this is a content edit, not a data-loss concern since the non-AI surface is out of scope.

## Outstanding Questions

### Resolve Before Planning

*(none)*

### Deferred to Planning

- [Affects R12][Technical] What's the exact SVG envelope for composition? **The existing `studio/lib/icon-compositor.ts` cannot be reused as-is**: it hardcodes `const sourceSize = 1024` (line 79, Recraft AI default) and scales inner content by `innerSize / sourceSize`, but the cleaned primitives in `app/public/dtpr-icons/symbols/` are already at `viewBox="0 0 36 36"` — the same coordinate space as the shapes. Applying the studio compositor directly would produce invisible (0.028×-scaled) symbols. Because primitives and shapes share the 36×36 coordinate space AND use `fill="currentColor"`, composition is a straight z-order overlay: `<svg viewBox="0 0 36 36">{shape}<g color="...">{symbol}</g></svg>`. Confirm the exact output SVG structure during planning; write a small golden-file test against one element from each shape category.
- [Affects R6][Needs research] How many current elements share a symbol in practice? A quick audit during planning tells us how much dedup upside exists and whether the initial port should pre-dedupe or just seed 1:1 and let authors dedupe later.
- [Affects R13][Technical] Cache keying strategy at the Worker: Cache API vs response-level `Cache-Control` only. For stable releases with immutable URLs, HTTP cache headers may be sufficient; for beta, explicit cache invalidation on republish is needed. Decide during planning.
- [Affects R14][Technical] Does `elements.json` grow meaningfully by including composition primitives? If it becomes a concern for edge response size, consider splitting into `elements.json` (summary) + `elements/<id>.json` (detail) — which the prior brainstorm already plans for (R10a). Likely already covered; verify during planning.
- [Affects R9][Strategic, monitor] Adding a new shape for a future datachain type (e.g. an `iot` or `biometric` datachain type with a different visual vocabulary) requires an API deploy, not a content release, because shapes live in code (R9). Accepted for now given the fixed DTPR-for-AI vocabulary of 4 shapes. If multi-datachain-type work surfaces a need for new shapes, reconsider whether shapes should move into the per-release bundle. Not blocking.

## Next Steps

-> `/ce:plan` for structured implementation planning
