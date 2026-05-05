---
title: "feat: DTPR-AI taxonomy view (searchable element catalog)"
type: feat
status: completed
date: 2026-04-27
---

# feat: DTPR-AI taxonomy view (searchable element catalog)

## Overview

Add a `/taxonomy` page to the `dtpr-ai` Nuxt + docus microsite that renders every DTPR element in the active schema as a searchable, category-grouped catalog. The page consumes the public REST API (`api.dtpr.io/api/v2`) for content and the `@dtpr/ui/vue` package for presentation, mirroring the layout and interaction model of the legacy `app/pages/taxonomy.vue` (sticky search, sidebar category nav, anchored category sections) without recreating its `@nuxt/content`-based data plumbing.

A version selector is included so visitors can browse the latest beta or any registered version. If complexity surfaces during implementation, the version selector can be cut without affecting U1–U4 (see `Scope Boundaries` and U5 below).

---

## Problem Frame

The `dtpr-ai` site today is pure markdown documentation under `dtpr-ai/content/**`. Visitors can read about elements, categories, and the schema, but there is no surface where they can browse the *actual* element inventory of a schema version end-to-end. The legacy `app/pages/taxonomy.vue` (the original `app/` Nuxt project) provides that experience for the device + AI taxonomies, sourced from `@nuxt/content` collections. That data layer is not present in `dtpr-ai`; the equivalent data is now exposed via the REST API and `@dtpr/ui/vue` ships the presentation primitives.

This plan adds the missing browse surface in `dtpr-ai`, using the data and component layers we already shipped (REST v2, `@dtpr/ui`).

---

## Requirements Trace

- R1. Visitors can reach a `/taxonomy` route on the `dtpr-ai` site.
- R2. The page lists every element in the active schema version, grouped by category, in declaration order.
- R3. Each element renders with its DTPR icon, title, and description (locale-resolved).
- R4. A search input filters elements by title and description across all categories; empty matches show an empty state.
- R5. A category sidebar navigates to anchored category sections and reflects the currently visible section.
- R6. Visitors can switch between registered schema versions, defaulting to the `<datachain_type>@latest` alias. *(Scope-cut candidate — see U5.)*
- R7. The page renders correctly under the dtpr-ai Cloudflare Workers production preset (no SSR/runtime regressions).
- R8. Every category and every element has a stable, shareable URL hash (`#category-<id>`, `#element-<id>`); loading the page with such a hash scrolls to and visually marks the target; visitors can copy that URL from a per-row affordance.

---

## Scope Boundaries

- Per-element detail pages (real routes, e.g. `/taxonomy/:element_id`) are **not** part of this plan. The unique URL requirement (R8) is satisfied via in-page anchors. Real per-element routes — with their own `<head>`/og-image and SEO benefits — are an explicit v2 follow-up (see `Deferred to Follow-Up Work`).
- Locale switching is **not** in scope; the page renders in `en` only. Locale resolution still goes through `extract` so adding a switcher later is a small follow-up.
- No new test framework will be introduced in `dtpr-ai`. The package today has no `test` script and no vitest config; standing one up is out of scope. Verification is manual + typecheck + production build.
- The legacy `app/pages/taxonomy.vue` and its `device`/`ai` subroutes are untouched.

### Deferred to Follow-Up Work

- Per-element real routes (`/taxonomy/:element_id`) and per-category routes (`/taxonomy/:category_id`): future iteration. v1 satisfies "unique URL per row" via anchors; real routes unlock per-row SEO, og-images, and a focused single-element view.
- Locale switcher inside `/taxonomy`: future iteration; the underlying `deriveElementDisplay` already accepts a locale argument.
- Test infrastructure for `dtpr-ai`: separate workstream — would require choosing vitest/playwright + wiring CI.

---

## Context & Research

### Relevant Code and Patterns

- **Reference layout (different project, do not import):** `app/pages/taxonomy.vue`, `app/components/TaxonomyLayout.vue`, `app/pages/taxonomy/ai.vue`, `app/pages/taxonomy/device.vue`. Use these to mirror the visual hierarchy: sticky header with search → sidebar nav with element counts → anchored category sections in the main column.
- **Target microsite shell:** `dtpr-ai/nuxt.config.ts`, `dtpr-ai/app.config.ts`, `dtpr-ai/wrangler.jsonc`. The site `extends: ['docus']` and deploys to Cloudflare Workers with a D1 binding for content. Custom Vue pages live under `dtpr-ai/app/pages/` (Nuxt 4 default app dir); none exist yet.
- **Presentation primitives:** `packages/ui/src/vue/index.ts` exports `DtprIcon`, `DtprElement`, `DtprElementDetail`, `DtprCategorySection`, `DtprDatachain`, `DtprElementGrid`. Import via `@dtpr/ui/vue` and `@dtpr/ui/vue/styles.css`.
- **Display derivation:** `packages/ui/src/core/element-display.ts` (`deriveElementDisplay`), `packages/ui/src/core/categories.ts` (`groupElementsByCategory`, `sortCategoriesByOrder`). The grouping helper requires `category_ids: string[]`; the REST `?fields=all` projection returns `category_id` (singular) plus other fields — confirm shape during U1 and adapt if needed (likely a small mapping step).
- **Existing UI quickstart docs:** `dtpr-ai/content/1.getting-started/3.ui-quickstart.md` already shows the full fetch + render pattern (`/categories` + `/elements?fields=all&limit=200` + `groupElementsByCategory` + `<DtprDatachain>` + `<DtprElementDetail>`). Use this as the canonical wiring reference.
- **REST endpoints to consume:**
  - `GET /api/v2/schemas` (list versions, including aliases like `ai@latest`).
  - `GET /api/v2/schemas/:version/categories` (locale-aware).
  - `GET /api/v2/schemas/:version/elements?fields=all&limit=200` (full records; 200 is well above current element count and stays under the 200-cap).
  - `GET /api/v2/schemas/:version/elements/:element_id/icon.svg` (composed icon URL — pass to `deriveElementDisplay({ iconUrl })`).
- **docus app config pattern:** `docs-site/app.config.ts` shows the conventional shape; nav is otherwise auto-derived from `content/` folder ordering (e.g. `1.getting-started/`, `2.mcp/`). Adding `/taxonomy` to the nav requires either a content stub or a docus `header.navigation`-style override (mechanism is verified during U6).

### Institutional Learnings

- `docs/solutions/` is empty in this checkout; no prior documented learnings apply.

### External References

- `@nuxt/ui` v4 (`UInput`, `UButton`, `UVerticalNavigation`, `USelectMenu`, `UIcon`) — already a `dtpr-ai` dependency at `^4.5.1` via `package.json`.
- Nuxt 4 `app/pages/` directory convention for file-based routing alongside an extended docus theme.
- Cloudflare Workers Nitro preset (existing) with the `agents/mcp` rollup stub already configured.

---

## Key Technical Decisions

- **Page lives in `dtpr-ai/app/pages/taxonomy.vue` (Nuxt 4 app dir):** Nuxt 4 file-based routing with the `app/pages/` convention takes precedence over docus content catch-all routes for the matching path. This is the lowest-friction way to introduce a custom Vue page without touching docus internals.
- **REST API as the data source, not a schema bundle:** `dtpr-ai` already deploys to the same Cloudflare account as `api.dtpr.io`; no CORS work needed for production. Avoids re-bundling schema content into the docus site.
- **Server-side fetch via `useFetch` (not `onMounted` `fetch`):** SSR-friendly, cacheable, works with the Workers preset. The UI quickstart in `content/5/` uses client-side `onMounted` because it's documenting a generic Vite app — for an actual Nuxt page we want SSR.
- **Default to `<datachain_type>@latest` alias:** Aliases are not stable for production *integrations*, but this is a browse UI for visitors, not a programmatic integration. Pinning would freeze the catalog at a beta date.
- **Client-side search, not API `?query=` BM25:** All elements are already loaded for the catalog view, so client-side filter on title + description is simpler, faster, and does not require debounced re-fetching. The API search endpoint stays the recommended path for paginated programmatic clients (documented in `content/3.rest/4.elements-list.md`).
- **`<DtprElement>` (compact card) over `<DtprElementDetail>` (rich) inside category sections:** The catalog view prioritizes scanability and search density over depth-per-element. Description is included in the search-index but rendered on a hover/expand affordance; full detail rendering (variables, citation) is deferred to a future per-element page.
- **Version state via `?v=` URL query param:** Shareable, server-renderable, no client-only state required. Falls back to alias when absent or invalid.
- **No new test framework in dtpr-ai:** Adding vitest + jsdom + Nuxt test utils is out of scope. The page is verified via manual browser walk-through, `pnpm --filter ./dtpr-ai build`, and `pnpm --filter @dtpr/ui typecheck` (the imported components are already covered there).

---

## Open Questions

### Resolved During Planning

- **How is `/taxonomy` reachable from the docus top nav?** The mechanism is decided in U6 — the candidate path is a small docus app-config override or a content stub at `content/X.taxonomy.md` with a `redirect`/`navigation` frontmatter. Either way, we will not duplicate the page content in markdown.
- **Should we paginate?** No. The active AI schema has well under 200 elements (the canonical seed lists 11 categories and ~tens of elements). `limit=200` returns the whole set in one response. If the catalog ever crosses 200, the plan is to switch to `?cursor=` paging — explicitly deferred.
- **Should search hit the API?** No (decided above). Client-side filter over the loaded set.

### Deferred to Implementation

- The exact element record shape returned by `?fields=all` (single `category_id` vs `category_ids[]`) needs to be confirmed against a live response during U1; if the API returns a single id, we wrap it into `[id]` before passing to `groupElementsByCategory`.
- Whether `useFetch` cache headers play correctly with a `no-store` beta version on Cloudflare Workers — confirm during U1 via a build + preview deploy. If caching causes stale beta content, switch to `useAsyncData` + manual `fetch` with appropriate headers.
- Final docus nav-injection mechanism (U6) — confirmed against the docus version actually installed when the unit lands.

---

## Implementation Units

- U1. **Add taxonomy page with category-grouped element grid**

**Goal:** Render every element of `<datachain_type>@latest` in a category-sectioned grid using `@dtpr/ui/vue` components, with no search and no sidebar yet.

**Requirements:** R1, R2, R3, R7

**Dependencies:** None (presumes `@dtpr/ui` is available via the workspace — wired in U2).

**Files:**
- Create: `dtpr-ai/app/pages/taxonomy.vue`
- Modify: `dtpr-ai/nuxt.config.ts` *(only if pages dir needs explicit enabling — Nuxt 4 default should pick it up; modify only if validation finds the route is not registered)*

**Approach:**
- `useFetch` two endpoints in parallel: `GET /api/v2/schemas/<datachain_type>@latest/categories` and `GET /api/v2/schemas/<datachain_type>@latest/elements?fields=all&limit=200`.
- Hard-code `datachain_type = 'ai'` for v1 (`ai@latest`); the version param is generalized in U5.
- Normalize each element so `category_ids` is an array (wrap a singular `category_id` if that's what the API returns).
- Group via `groupElementsByCategory(elements, categories)`; order via `sortCategoriesByOrder(grouped, categories)`.
- For each element, compute `iconUrl = ${API_BASE}/schemas/${version}/elements/${id}/icon.svg` and call `deriveElementDisplay(el, undefined, 'en', { iconUrl })`.
- Render: outer `<main>` → per-category `<DtprCategorySection :id title :disable-accordion>` → `<DtprElementGrid>` → `<DtprElement v-for :display>`.
- Set page title via `useHead({ title: 'Taxonomy' })`.
- Pull in `@dtpr/ui/vue/styles.css` once (top-level CSS import in the page or `nuxt.config.ts` `css: []`).

**Patterns to follow:**
- The fetch + group + render shape in `dtpr-ai/content/1.getting-started/3.ui-quickstart.md` (note: it uses `onMounted` `fetch`; we use `useFetch` instead).
- Per-category section wrapping pattern in `app/components/TaxonomyLayout.vue` `<main>` block (structural reference only — do not import).

**Test scenarios:**
- *Test expectation: manual verification.* `dtpr-ai` has no test setup; introducing one is out of scope (see Scope Boundaries).
- Manual: `pnpm --filter ./dtpr-ai dev` → visit `/taxonomy` → every category with elements shows a section, each element renders an icon and title, ordering matches `sortCategoriesByOrder`.
- Manual: kill network on a single icon URL → fallback hexagon renders (verifies `<DtprIcon>` error path is reachable via this page).
- Manual: `pnpm --filter ./dtpr-ai build` succeeds (production Workers preset).

**Verification:**
- `/taxonomy` renders categories and elements end-to-end against the live REST API.
- Icons resolve; missing icons fall back to the hexagon.
- Page is server-rendered (view source contains element titles before JS hydration).

---

- U2. **Add `@dtpr/ui` workspace dependency to `dtpr-ai`**

**Goal:** Make `@dtpr/ui/vue` and `@dtpr/ui/vue/styles.css` resolvable from inside `dtpr-ai`.

**Requirements:** R3 (transitively — U1 cannot ship without this).

**Dependencies:** None. Sequence-wise, this is a prerequisite for U1's import lines actually resolving in CI; do this before or alongside U1.

**Files:**
- Modify: `dtpr-ai/package.json` (add `"@dtpr/ui": "workspace:*"` under `dependencies`).
- Modify: `pnpm-lock.yaml` (auto via `pnpm install`).

**Approach:**
- Match the workspace pattern already used in `packages/ui/package.json` for `@dtpr/api` (`"@dtpr/api": "workspace:*"`).
- Run `pnpm install` from repo root; verify `dtpr-ai/node_modules/@dtpr/ui` is a workspace symlink.
- Confirm `@dtpr/ui` `dist/` is built (it is published from the `packages/ui` `vite build`); if `dist/` does not exist locally, run `pnpm --filter @dtpr/ui build` once.

**Patterns to follow:**
- Workspace dep style already used elsewhere in the monorepo (see `packages/ui/package.json` deps).

**Test scenarios:**
- Test expectation: none — pure dependency wiring; behavioral verification happens in U1 (the page must build and render).

**Verification:**
- `pnpm --filter ./dtpr-ai build` succeeds with `@dtpr/ui/vue` imports in `taxonomy.vue` resolving cleanly.

---

- U3. **Add sticky search bar with client-side filter**

**Goal:** Filter elements by case-insensitive substring match on title + description across every category, with an empty-state when no matches and live element-count updates per category.

**Requirements:** R4

**Dependencies:** U1

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy.vue`

**Approach:**
- Add a `searchQuery` `ref('')` and a `filteredByCategory` `computed` that re-runs `groupElementsByCategory` on the (already-loaded) elements array filtered by the query.
- Filter predicate: lowercase the query and match against the locale-resolved title and description (i.e. against `display.title` / `display.description`, not the raw localized arrays — this keeps locale fallback semantics consistent with what the user sees).
- Sticky header strip at the top of the page containing a `UInput` (icon `i-heroicons-magnifying-glass`, trailing clear button when non-empty, mirroring the legacy `TaxonomyLayout.vue` markup).
- Empty-state block when no category section has elements after filtering (`UIcon` + "No results found" copy, same shape as legacy).
- Categories with zero filtered elements collapse out of the rendered list (do not show empty sections during search).

**Patterns to follow:**
- `UInput` + trailing clear-button pattern from `app/components/TaxonomyLayout.vue` lines 178-196.

**Test scenarios:**
- *Test expectation: manual verification* (no test framework — see Scope Boundaries).
- Manual: type a query that matches a known element title → only that category shows it.
- Manual: type a query that matches text in a description but not a title → element still appears.
- Manual: type gibberish → empty state renders, all category sections are gone.
- Manual: clear the input via the trailing button → full catalog returns.

**Verification:**
- Filter runs synchronously on input (no API roundtrip).
- Empty state matches the legacy taxonomy's UX shape.

---

- U4. **Add category sidebar navigation with anchor scrolling**

**Goal:** Show a vertical category list with element counts; clicking a category smooth-scrolls to its section; the active section is highlighted while scrolling.

**Requirements:** R5

**Dependencies:** U1, U3 (counts must reflect search-filtered totals), U7 (anchor IDs).

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy.vue`

**Approach:**
- Use `UVerticalNavigation` with one entry per category: `{ label, badge: count, to: '#category-' + id, active: id === activeCategory }`.
- The `#category-<id>` anchor scheme is established in U7; this unit consumes it and does not own the wrapper `:id` attributes.
- Scroll listener (mounted-only, removed on unmount) updates `activeCategory` based on the topmost section above a 100 px offset, mirroring the legacy implementation.
- Mobile: hide sidebar by default, toggle via a hamburger button in the sticky header (legacy parity is nice-to-have; minimum bar is "sidebar visible on lg+ screens").

**Patterns to follow:**
- Sidebar markup + scroll handler in `app/components/TaxonomyLayout.vue` lines 60-100, 235-265.

**Test scenarios:**
- *Test expectation: manual verification.*
- Manual: click a category in the sidebar → page scrolls to its section.
- Manual: scroll the page → sidebar active state follows the scroll position.
- Manual: type a search query → category counts update; categories with zero matches still appear in the sidebar but are non-clickable or marked empty (decide during implementation; legacy hides empty ones — match that).
- Manual: viewport `< lg` → sidebar collapses; hamburger toggles it.

**Verification:**
- Anchored navigation works without a full page reload.
- Active category state is correct at any scroll position.

---

- U5. **Add schema version selector** *(scope-cut candidate)*

**Goal:** Offer visitors a dropdown of registered schema versions, default to `ai@latest`, and persist the active selection in the URL as `?v=<canonical-id>`.

**Requirements:** R6

**Dependencies:** U1

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy.vue`

**Approach:**
- `useFetch('/schemas')` (`https://api.dtpr.io/api/v2/schemas`) once on page enter. Filter to entries where `id` starts with `<datachain_type>@` (today, `ai@`).
- Read the active version from `useRoute().query.v`; fall back to `ai@latest` if missing or unknown.
- Wrap the per-version fetches (`/categories`, `/elements`) inside a `useAsyncData` (or `useFetch` with a `key` and `watch`) keyed on the active version so changing it triggers a refetch.
- Render a `USelectMenu` in the sticky header next to the search input. Each option shows `id` and `status` badge (`stable` / `beta`). Optionally surface the alias next to canonical entries (e.g. `ai@2026-04-16-beta — alias: ai@latest`).
- On change, push to the router with `{ query: { ...current, v: nextId } }` (pinning to canonical form, never the alias) so reloading the URL is reproducible.
- Empty / error states: if `/schemas` fails, hide the selector and continue rendering with the alias. If the URL contains a `?v=` that 404s on `/categories`, show an inline alert and fall back to alias.

**Patterns to follow:**
- The version-aware fetch pattern documented in `dtpr-ai/content/2.mcp/4.tools/1.list-schema-versions.md` (REST equivalent is `GET /schemas`).

**Scope-cut criterion:**
- If implementation reveals that `useFetch` re-keying or the `?v=` round-trip introduces hydration churn or breaks the Workers SSR build in non-trivial ways, drop U5: hard-code the alias from U1 and ship U1–U4. Document that the version selector is deferred and link to a follow-up issue.

**Test scenarios:**
- *Test expectation: manual verification.*
- Manual: load `/taxonomy` with no `?v=` → alias resolves; selector shows the alias's canonical id.
- Manual: pick a different version → URL updates with `?v=<id>`; data refetches; categories + elements reflect the picked version.
- Manual: load `/taxonomy?v=ai@bogus` → alert renders, page falls back to alias.
- Manual: kill `/schemas` (block in devtools) → selector hides, page still renders against the alias.

**Verification:**
- Version selector is visible, functional, and SSR-renderable.
- `?v=` is shareable: pasting the URL in a fresh tab loads the same version.
- Removing U5 is a clean revert (one component + one `useAsyncData` key) — confirmed by reviewing the diff before merging.

---

- U6. **Wire `/taxonomy` into the docus top navigation**

**Goal:** Make `/taxonomy` discoverable from the dtpr-ai site header (alongside MCP, REST, Icons, UI, Plugin, etc.) without duplicating page content as markdown.

**Requirements:** R1 (discoverability — the route exists from U1, this surfaces it).

**Dependencies:** U1

**Files:**
- Modify: `dtpr-ai/app.config.ts` *(if docus exposes `header.navigation` or similar — verify against the installed docus version).*
- Or create: `dtpr-ai/content/0.5.taxonomy.md` *(content stub with a `navigation` frontmatter that points the URL to `/taxonomy` — fallback if app-config nav extension is not supported).*

**Approach:**
- Inspect the installed `docus` version's documented nav-extension API (search `node_modules/docus` for `app.config` schema or nav components). The most likely shape is a `header.navigation` or `header.links` array in `app.config.ts`.
- If app-config supports it: add an entry pointing to `/taxonomy` with the label `Taxonomy`.
- If not: drop a content stub file ordered between `index.md` and `1.getting-started/`. The stub can use `redirect` frontmatter or a single-line page body; the goal is to have docus render a nav link the visitor can follow to `/taxonomy`.
- Validate that the link in the docus header is highlighted as active when the route matches (docus typically does this on its own when the nav entry's `to` equals the route).

**Patterns to follow:**
- Existing docus app-config shape in `dtpr-ai/app.config.ts` and `docs-site/app.config.ts`.
- Numerical ordering convention used in `dtpr-ai/content/` (`1.getting-started`, `2.mcp`, …) when falling back to a stub.

**Test scenarios:**
- *Test expectation: manual verification.*
- Manual: top nav shows a "Taxonomy" entry; clicking it routes to `/taxonomy`.
- Manual: while on `/taxonomy`, the nav entry is visually marked active.

**Verification:**
- Visitors arriving at `dtpr.ai` can find `/taxonomy` without typing the URL.

---

- U7. **Stable anchor URLs + copy-link affordance for categories and elements**

**Goal:** Every category section and every element card gets a stable `id` attribute (`category-<id>`, `element-<id>`) so the URL hash addresses it; loading the page with a hash auto-scrolls to and visually emphasizes the target; each row exposes a button that copies its hash-pinned URL to the clipboard.

**Requirements:** R8

**Dependencies:** U1

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy.vue`

**Approach:**
- **Stable IDs (the source-of-truth for anchors):**
  - Wrap each `<DtprCategorySection>` in a `<div :id="`category-${categoryId}`">` if `DtprCategorySection`'s root does not itself accept an `id` (verify against `DtprCategorySection.vue` — it currently sets `:data-section-id`, which browsers do **not** use for hash-scroll). Wrapping is the safest option since `@dtpr/ui/vue` is a neutral library and we should not add consumer-specific id attributes to it (R2 neutrality).
  - Render each `<DtprElement>` inside a wrapper element (e.g. `<div :id="`element-${elementId}`" class="taxonomy-element-row">`) so element-level anchors resolve.
  - Use `id` (not `data-id`) — browser hash-scroll only honors `id`.
- **Initial-mount hash handling:** in `onMounted`, read `window.location.hash`, look up the matching `id`, and call `scrollIntoView({ behavior: 'smooth', block: 'start' })` on a `setTimeout(…, 100)` so layout settles after hydration. Mirrors `app/components/TaxonomyLayout.vue` lines 150-159.
- **Visual emphasis on hash target:** track `targetId = ref<string | null>(window.location.hash.slice(1))`; bind `:class="{ 'taxonomy-row--active': targetId === id }"` on category and element wrappers. Listen on `window` for `hashchange` and update `targetId`. CSS provides a subtle outline / background-tint that fades after a few seconds (or persists until the hash changes — pick whichever is simpler in implementation).
- **Copy-link affordance:**
  - Per-element: small `UButton` with `i-heroicons-link` icon inside the element-row wrapper (positioned via the row CSS, not by modifying `<DtprElement>` itself). On click: `navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#element-${id}`)` and emit a `useToast()` notification mirroring legacy.
  - Per-category: same icon button placed in the category section header bar (a wrapper `<header>` adjacent to `<DtprCategorySection>`'s built-in heading; do not edit `<DtprCategorySection>` internals).
  - The toast component comes from `@nuxt/ui` (`useToast()` is the v4 API); already a dependency.
- **Search interaction:** if a search query hides the targeted row, the hash still resolves on next clear-search; do not clear the hash on filter (legacy behaves the same way).
- **SSR hydration safety:** read `window.location.hash` only inside `onMounted` (or an `if (process.client)` guard) — the server renders with `targetId === null`, hydration matches, and the post-mount tick updates it.

**Patterns to follow:**
- `app/components/TaxonomyLayout.vue` lines 108-135 (copy-link toast for elements and categories) and 150-159 (initial hash auto-scroll).
- `useToast()` usage already canonical across `@nuxt/ui` v4 docs.

**Test scenarios:**
- *Test expectation: manual verification.*
- Manual: visit `/taxonomy#category-purpose` → page scrolls to and highlights that category.
- Manual: visit `/taxonomy#element-purpose.example` → page scrolls to and highlights that element row.
- Manual: visit `/taxonomy#bogus` → page renders normally, no scroll, no error.
- Manual: click the per-element copy-link button → URL with `#element-<id>` lands on clipboard, toast appears; pasting it in a new tab reproduces the deep-linked view.
- Manual: click the per-category copy-link button → analogous behavior with `#category-<id>`.
- Manual: search hides the targeted element → no client-side error; clearing the search restores the highlight.
- Manual: deep-link arrives, hash already present → highlight persists; navigating to another anchor swaps highlight.

**Verification:**
- Hash-deep-links work for every category and every element.
- Copy-link works for every category and every element; clipboard contains a fully-qualified URL.
- No new public exports added to `@dtpr/ui` (neutrality preserved — anchors and copy-link affordances live in the consumer page).

---

## System-Wide Impact

- **Interaction graph:** New page only; no shared middleware, no auth, no callbacks. The new dependency on `@dtpr/api` (via `@dtpr/ui`'s `core`) introduces a workspace edge that already exists in the build graph for other consumers.
- **Error propagation:** Fetch failures should render a visible inline error (or simply not render that card / category) rather than crash hydration. Use `useFetch`'s `error` ref to gate rendering.
- **State lifecycle risks:** None — the page is read-only over a public API. No mutation, no caching layer to invalidate beyond Workers' built-in HTTP cache.
- **API surface parity:** No changes to API. No changes to `@dtpr/ui`. The addition is consumer-side only.
- **Integration coverage:** None of the current automated tests exercise the dtpr-ai site in a browser; manual verification is the integration coverage. This is consistent with the rest of the dtpr-ai surface.
- **Unchanged invariants:** `app/pages/taxonomy.vue` and the legacy device/AI subroutes remain untouched. The dtpr-ai content directory and existing docus pages are untouched (except for the small nav addition in U6).

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| `?fields=all` element shape returns `category_id` (singular) vs `category_ids[]` (plural). | Confirm against a live response in U1. Wrap singular into an array before passing to `groupElementsByCategory`. |
| `useFetch` SSR + Cloudflare Workers `no-store` beta cache headers cause hydration mismatch or stale renders. | Test under `pnpm --filter ./dtpr-ai build && pnpm --filter ./dtpr-ai preview`. Fall back to `useAsyncData` + raw `fetch` if needed. |
| docus nav extension does not support a non-content link. | Fall back to the content-stub approach in U6. |
| `@dtpr/ui` `dist/` not built locally → Vite/Nuxt cannot resolve workspace import. | Document in PR description: run `pnpm --filter @dtpr/ui build` once after `pnpm install`. CI already builds packages before app builds. |
| Schema element count exceeds 200 in a future version. | Out of scope today; follow-up plan to switch to `?cursor=` paging. |
| `ai@latest` alias drift: if the alias retargets a new beta during a session, the page won't auto-refresh. | Acceptable for v1 — visitor reload picks it up. Document in `Scope Boundaries`. |

---

## Documentation / Operational Notes

- After merge, update the `dtpr-ai` `index.md` card-group to add a "Browse the taxonomy" card pointing to `/taxonomy`. *(Small follow-up; not blocking.)*
- No analytics, no feature flag, no rollout plan — additive feature on a documentation site.
- Cloudflare deployment uses the existing `wrangler.jsonc`; no new bindings or routes.

---

## Sources & References

- Reference layout: `app/pages/taxonomy.vue`, `app/pages/taxonomy/ai.vue`, `app/pages/taxonomy/device.vue`, `app/components/TaxonomyLayout.vue`
- UI components and core helpers: `packages/ui/src/vue/index.ts`, `packages/ui/src/core/index.ts`, `packages/ui/src/core/categories.ts`, `packages/ui/src/core/element-display.ts`
- Existing fetch + render reference inside dtpr-ai: `dtpr-ai/content/1.getting-started/3.ui-quickstart.md`
- REST contract: `dtpr-ai/content/3.rest/1.schemas.md`, `dtpr-ai/content/3.rest/3.categories.md`, `dtpr-ai/content/3.rest/4.elements-list.md`, `dtpr-ai/content/3.rest/5.element-detail.md`, `dtpr-ai/content/3.rest/7.icons.md`
- Versions concept: `dtpr-ai/content/6.concepts/3.versions-and-releases.md`
- Site shell: `dtpr-ai/nuxt.config.ts`, `dtpr-ai/app.config.ts`, `dtpr-ai/wrangler.jsonc`
- Sibling docus app shape: `docs-site/nuxt.config.ts`, `docs-site/app.config.ts`
