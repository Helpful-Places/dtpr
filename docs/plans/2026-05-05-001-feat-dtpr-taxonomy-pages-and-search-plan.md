---
title: "feat: DTPR-AI element pages, category pages, and unified Cmd-K search"
type: feat
status: active
date: 2026-05-05
origin: docs/brainstorms/2026-04-29-dtpr-taxonomy-pages-and-search-brainstorm.md
---

# feat: DTPR-AI element pages, category pages, and unified Cmd-K search

## Summary

Add per-element and per-category Vue routes under `/taxonomy/{elements,categories}/<id>` that reuse `<DtprElementDetail>` for an interactive playground (Variables form, Context chips, Default/Dark toggle), an editorial md overlay convention piggybacking the existing docus `docs` collection, and a synthetic Cmd-K injection via `<UContentSearch>`'s `groups` prop. A shared locale + version state composable propagates `?v=` and `?locale=` consistently across the catalog, both new pages, and Cmd-K, with the existing `/taxonomy` backfilled to consume it.

---

## Problem Frame

The shipped `/taxonomy` page provides breadth-only browsing and the docus Cmd-K does not see DTPR elements or categories — a visitor who types "purpose" finds prose docs but not the schema entry of the same name. Hard-to-grasp categories (Risks & Mitigation in particular) have no surface for authored narrative, and the existing catalog renders only `en` even though the API and `deriveElementDisplay` are already locale-aware. The full motivation lives in the origin brainstorm; see `docs/brainstorms/2026-04-29-dtpr-taxonomy-pages-and-search-brainstorm.md`.

---

## Requirements

- R1. Every element in the active schema is reachable at a stable, shareable URL — one URL per element.
- R2. The element page renders a hero with the element's icon, title, and description, using `<DtprElementDetail>` so visitors see a consistent representation with the catalog.
- R3. The element page includes a Playground panel with a Variables form when the element declares variables; entering values updates the rendered title and description live, using the same locale-fallback semantics as the catalog.
- R4. The Playground includes a Context chip row when the element's category declares a context. Each chip is colored by its context value's color and labeled with the value's name; clicking a chip recolors the hero icon to that context's variant. A small Default / Dark toggle sits alongside the chip row for the universal variants.
- R5. The element page renders an optional editorial body when one has been authored. When no editorial body exists, the page shows no body section.
- R6. The element page is fully functional with no editorial body authored — the playground is the page's primary content.
- R7. Every category in the active schema is reachable at a stable, shareable URL — one URL per category.
- R8. The category page renders the category's title, description, and the list of elements that belong to it. Each element row links to that element's page.
- R9. When a category declares a context, the category page renders the full context palette as labeled color swatches (read-only — visitors cannot change the active context from this page).
- R10. The category page reserves space for authored editorial narrative; categories with no narrative still render a complete page.
- R11. The Docus Cmd-K search includes every element and every category as searchable items, alongside the existing prose docs.
- R12. Selecting an element or category from search routes to that item's page, version- and locale-pinned to the active state.
- R13. Search results show enough context to disambiguate without opening: at minimum, type indication (element vs. category vs. doc), title, and the element's category for element results.
- R14. When an element or category has authored editorial copy, that copy is also indexed by the existing search pipeline so a visitor can find the element by terms in its narrative.
- R15. The existing `/taxonomy` catalog links to each element's and each category's standalone page. The current per-row copy-link affordance and in-page anchors continue to work.
- R16. The `?v=<version>` URL pin behavior is consistent across `/taxonomy`, element pages, and category pages; direct deep links resolve to the requested version (or fall back to `<datachain_type>@latest` when missing).
- R17. The active locale is selectable via a `?locale=<id>` URL query param on `/taxonomy`, element pages, and category pages, defaulting to `en` and falling back to `en` per-field for missing locale strings.
- R18. A locale switcher UI lives in the same sticky header strip as the search bar / version selector on every DTPR surface; switching locale updates the URL and refetches schema content at the new locale.
- R19. Cmd-K synthetic element/category entries reflect the active locale; switching locale re-fetches the synthetic group from the API at the new locale.

**Origin actors:** A1 (site visitor), A2 (content author).
**Origin flows:** F1 (visitor previews element with own values), F2 (visitor finds element from global Cmd-K), F3 (author publishes editorial narrative).
**Origin acceptance examples:** AE1 (covers R3, R4, R6), AE2 (covers R11, R13), AE3 (covers R10), AE4 (covers R1, R16).

---

## Scope Boundaries

> *Note on origin scope:* The origin brainstorm marked multi-locale element/category pages out of scope for v1. Mid-planning the user reopened this and confirmed Option 1 — a `?locale=` URL convention scoped to DTPR-derived surfaces only. R17–R19 codify that decision. Prose docs and the docus shell remain English-only; this plan does not adopt `@nuxtjs/i18n` or docus's `[[lang]]/...` route prefix.

- Multi-locale prose docs (translating `content/**/*.md` siblings to other locales) — out of scope. v1 ships locale awareness only on DTPR-derived surfaces (catalog, element pages, category pages, Cmd-K element/category entries). Prose stays English; per-locale editorial md siblings (e.g. `<id>.es.md`) are a clean follow-up.
- Setting up `@nuxtjs/i18n` and migrating to docus's `[[lang]]/...` route prefix — out of scope. We use a `?locale=` query param parallel to `?v=`. Migration to `[[lang]]` is a future workstream when prose translation arrives.
- Type-aware Cmd-K palette enhancements (custom hit rendering with inline DTPR icons, type filters such as `e:purpose`, action hits like "Open playground for X with civic context") — deferred. Pure ranked list of typed entries is the v1.
- Build-time generation of a markdown twin per element/category — deferred. v1 uses live SSR Vue routes plus an editorial overlay collection.
- Per-element OG-image generation — deferred follow-up.
- Per-version pinned routes (e.g. `/taxonomy/v/<version>/elements/<id>`) — deferred. Version stays as the existing `?v=` query parameter.
- Editing variables / context state via shareable URL params (e.g. `?ctx=civic&v.retention=30d`) — deferred follow-up; not blocking the v1 ship.
- Type-aware Variables form inputs (number / select / date pickers based on `variable.type`) — deferred. v1 renders all variables as plain text inputs; the underlying type system already accommodates richer controls.
- Inline drawer / modal alternative on `/taxonomy` (no new routes) — explicitly rejected (origin decision).
- New test framework in `dtpr-ai` — out of scope, consistent with the prior taxonomy plan. Verification is manual + typecheck + production build.

### Deferred to Follow-Up Work

- Per-locale editorial md siblings (`content/taxonomy/elements/<id>.<locale>.md`) — convention reserved by U5; not authored in this PR.
- Migration from `?locale=` to `[[lang]]/...` route prefix when docus prose translation lands — clean redirect-and-migrate, not a rebuild.

---

## Context & Research

### Relevant Code and Patterns

- **Existing catalog page:** `dtpr-ai/app/pages/taxonomy.vue` — source of truth for the version-state computed chain (`requestedVersion` / `activeVersion` / `versionMissing`), SSR fetch posture (`useFetch` + two `useAsyncData` keyed on `activeVersion` with 8 s timeouts to fit the Workers subrequest budget), the copy-link and hash-scroll wiring, and the sticky-header layout pattern. The new pages reuse all of this; the catalog itself gets backfilled with locale state in U6.
- **UI components:** `packages/ui/src/vue/index.ts` exports `DtprIcon`, `DtprElement`, `DtprElementDetail`, `DtprCategorySection`, `DtprElementGrid`. `<DtprElementDetail>` exposes named slots `overlay`, `after-description`, `after-variables`, `after-citation` — the Playground form lives in `after-description`.
- **Display derivation:** `packages/ui/src/core/element-display.ts` (`deriveElementDisplay(element, instance, locale, { iconUrl })`). The interpolation gate at lines 81–89 includes only variable ids present in `instance.variables[]`; the wrapper passes all declared variable ids with empty-string defaults so live preview substitutes empty rather than leaving literal `{{var}}` in place.
- **Categories helpers:** `packages/ui/src/core/categories.ts` — `groupElementsByCategory`, `sortCategoriesByOrder`, `findCategoryDefinition`. Category pages reuse the same helpers as the catalog.
- **Docus Cmd-K mount:** `node_modules/.../docus/app/app.vue` mounts `<LazyUContentSearch :files :navigation :color-mode>`; we copy this app shell into `dtpr-ai/app/app.vue` and add a third bound prop `:groups` for synthetic injection.
- **`<UContentSearch>` extension surface:** `node_modules/.../@nuxt/ui/.../components/content/ContentSearch.vue` accepts a `groups` prop that is appended after the navigation-derived groups (avoiding the `mapNavigationItems` filter that drops `:files` entries lacking a matching navigation node). `useContentSearch.mapFile` keys items by `to`, so dedupe is a `Set<string>` filter on already-loaded `files`.
- **Editorial collection:** docus's bundled `content.config.ts` defines a single `docs` collection scanning `content/**/*.md`. Files dropped at `content/taxonomy/elements/<id>.md` are auto-indexed by Cmd-K (R14) and queryable via `queryCollection('docs').path('/taxonomy/elements/<id>').first()`. The explicit `[id].vue` outranks docus's catch-all so the page renders the Vue shell, not the raw md.
- **Icon URL grammar:** `dtpr-ai/content/4.icons/4.urls.md` — `…/elements/:element_id/icon[.<variant>].svg`; variants come from `element.icon_variants` cross-referenced with the parent category's `context.values[].id` for color + label (`dtpr-ai/content/4.icons/3.composed-variants.md`).
- **REST endpoints:** `GET /api/v2/schemas/:version/elements/:element_id?locales=<locale>,en&fields=all` (single-element, locale-aware), `GET /api/v2/schemas/:version/categories?locales=<locale>,en` (categories), `GET /api/v2/schemas/:version/elements?fields=all&limit=200&locales=<locale>,en` (catalog + Cmd-K). The `:version` segment accepts both canonical (`ai@2026-04-16-beta`) and aliases (`ai@latest`).
- **Nav stub:** `dtpr-ai/content/0.taxonomy.md` already routes the docus left nav to `/taxonomy`. New routes inherit discoverability through `/taxonomy` (R15) — they do not need their own nav entries.

### Institutional Learnings

- `docs/solutions/` does not exist in this checkout. The closest precedent is the prior taxonomy plan (`docs/plans/2026-04-27-001-feat-dtpr-ai-taxonomy-view-plan.md`), particularly its decision to use `useFetch`/`useAsyncData` with version keys, manual-only verification posture, and version-via-`?v=` convention.

### External References

- None required. All extension points (`<UContentSearch>` `groups` prop, `queryCollection` on the `docs` collection, Nuxt 4 `app/pages/` routing, Cloudflare Workers SSR via the existing nitro preset) are verified against the installed versions in this repo.

---

## Key Technical Decisions

- **Use `<UContentSearch>`'s `groups` prop, not `:files`, for synthetic Cmd-K injection.** `:files` requires a matching `navigation` node per `mapNavigationItems` (`useContentSearch.js`) — synthetic file entries lacking a nav node are silently dropped. The `groups` prop is appended verbatim, surfacing element/category items as a labeled group.
- **Local override `dtpr-ai/app/app.vue` to add the synthetic group binding.** Docus's Cmd-K mount is in its app shell; `app.config.ts` cannot reach Cmd-K props. We mirror docus's `app.vue` and add one bound prop. Keep the override minimal — no other changes to docus's mount markup.
- **Editorial overlay piggybacks the existing `docs` content collection.** Files at `content/taxonomy/{elements,categories}/<id>.md` with `navigation: false` frontmatter are auto-indexed by Cmd-K (free R14), queryable via `queryCollection('docs').path(...)`, and shadowed at the route level by the explicit `[id].vue`. No local `content.config.ts`; no new collection.
- **Cmd-K dedupe rule: real markdown wins.** Filter synthetic items whose `to` collides with any `file.id` in the boot-loaded `queryCollectionSearchSections('docs')` array. Single-pass `Set<string>` filter at synthesis time.
- **Catalog copy-link semantics: keep anchor copy + add separate "Open page" affordance.** The existing in-row `#element-<id>` clipboard button stays unchanged; a new per-row navigation link opens the standalone page (`/taxonomy/elements/<id>?v=…&locale=…`). Both copying the anchor and opening the page are distinct, well-named affordances.
- **Version selector on standalone pages: render in place; switch refetches.** Same `<USelectMenu>` from `/taxonomy`, same canonical-id semantics. If the active element/category does not exist in the picked version, render an inline "not in this version" fallback rather than redirecting.
- **Shared locale + version state via a Nuxt composable (`useDtprState` or equivalent).** Reads `?v=` and `?locale=` from `useRoute()`, exposes setters that push to the router, and is consumed by the catalog, both new pages, and the synthetic Cmd-K boot fetch. Default locale is `en`; default version is `<datachain_type>@latest`.
- **API fetches always pass `locales=<active>,en`.** The fallback chain is explicit so missing-locale fields resolve to `en` rather than empty strings; this matches the locale-fallback semantics `deriveElementDisplay` already applies (R3, R17).
- **Playground variable inputs: plain text only in v1.** `ElementDisplayVariable` carries `type` (`text`, `number`, etc.), but rendering type-aware controls is out of scope per Scope Boundaries. Empty inputs interpolate as empty strings — same observable result as missing-from-instance, no literal `{{var}}` leaks because all declared ids are passed in the instance.
- **Category page elements list: fresh server fetch per page.** Same `?fields=all&limit=200` shape as the catalog; no shared cache threading. SSR cost is comparable, code path is simpler, and Cloudflare Workers' HTTP cache absorbs duplicate fetches across rapid navigations.

---

## Open Questions

### Resolved During Planning

- **`<UContentSearch>` extensibility (origin Q on R11, R12):** use the `groups` prop. Verified against the installed `@nuxt/ui@4.5.1` source (`mapNavigationItems` filters `:files` by navigation matching; `groups` is appended verbatim).
- **Cmd-K dedupe (origin Q on R11):** real markdown wins; drop synthetic for the same `to`. Single `Set<string>` filter against `files`.
- **Version selector on standalone pages (origin Q on R7, R8):** render the same `<USelectMenu>`; switch refetches in place; missing-at-version renders an inline fallback.
- **Catalog copy-link (origin Q on R15):** keep anchor copy as-is; add a separate per-row "Open page" navigation link.
- **Playground state in URL (origin Q on R3, R4):** deferred per Scope Boundaries.
- **Category page elements list source (origin Q on R8, R10):** fresh server fetch on the category page; no page-wide cache threading.
- **Locale handling (raised during planning):** Option 1 — `?locale=` URL param parallel to `?v=`, owned by a shared composable, applied to the catalog, both new pages, and Cmd-K. Docus `[[lang]]` migration deferred until prose translation arrives.

### Deferred to Implementation

- Whether to copy docus's full `app.vue` verbatim or fork only the `<ClientOnly><LazyUContentSearch>` block — confirm against the docus version installed when U7 lands; either approach is acceptable as long as no other docus-shell behavior regresses.
- Whether `queryCollection('docs').path('/taxonomy/elements/<id>').first()` returns `null` cleanly for missing overlays under the Cloudflare Workers preset — verify in U5; if it throws, wrap in a try/catch.
- Exact placement of the locale switcher within the sticky header (alongside or below the search row) — pick during U6 based on visual fit.
- Whether `?fields=all&limit=200` boot fetch needs trimming (e.g. `?fields=id,title,description,category_id,icon_variants`) for Cmd-K injection cost — measure during U7; trim only if SSR latency or hydration size noticeably regresses.

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```
┌──────────────────────── dtpr-ai shell ────────────────────────┐
│                                                                │
│  app/app.vue (local override)                                  │
│   └─ <LazyUContentSearch :files :navigation :groups>           │
│                                            ^                   │
│                                            │ synthetic group   │
│                                            │ (boot fetch +     │
│                                            │  dedupe vs files) │
│                                                                │
│  composables/useDtprState.ts                                   │
│   ├─ activeVersion  (?v=, default ai@latest)                   │
│   ├─ activeLocale   (?locale=, default en)                     │
│   └─ setters push to router; surfaces watch them               │
│                                                                │
│  app/pages/                                                    │
│   ├─ taxonomy.vue ───────────────────── catalog (existing,     │
│   │                                       backfilled in U6)    │
│   ├─ taxonomy/elements/[id].vue ─────── element page           │
│   │     ├─ hero (DtprElementDetail)                            │
│   │     ├─ Playground (Variables + Context + Default/Dark)     │
│   │     └─ editorial body slot ◄──── queryCollection('docs')   │
│   │                                       .path(/taxonomy/...) │
│   └─ taxonomy/categories/[id].vue ──── category page           │
│         ├─ hero (description + context palette swatches)       │
│         ├─ elements list (links to /taxonomy/elements/...)     │
│         └─ editorial body slot ◄──── queryCollection('docs')   │
│                                                                │
│  content/taxonomy/                                             │
│   ├─ elements/<id>.md   (optional; navigation: false)          │
│   └─ categories/<id>.md (optional; navigation: false)          │
└────────────────────────────────────────────────────────────────┘
```

Element page Playground state flow:

```
form state (variables{}, contextId|null, style: default|dark)
        │
        ▼
computed: instance = { variables: [{id, value}, …declared ids…] }
computed: variant  = style==='dark' ? 'dark'
                   : contextId      ? contextId
                   : 'default'
computed: iconUrl  = …/elements/<id>/icon[.<variant>].svg
        │
        ▼
deriveElementDisplay(element, instance, activeLocale, { iconUrl })
        │
        ▼
<DtprElementDetail :display />
```

---

## Implementation Units

- U1. **Shared locale + version state composable**

**Goal:** Single source of truth for `activeVersion` and `activeLocale` consumed by the catalog, both new pages, and the Cmd-K boot fetch. Reading from and writing to `?v=` and `?locale=` query params.

**Requirements:** R16, R17, R18 (state plumbing for the switchers UIs landing in U6 and the new-page headers in U2/U4).

**Dependencies:** None.

**Files:**
- Create: `dtpr-ai/app/composables/useDtprState.ts`
- Create: `dtpr-ai/types/dtpr-state.ts` *(only if shared types end up needed beyond the composable)*

**Approach:**
- `useDtprState()` returns reactive `activeVersion`, `activeLocale`, `selectedVersion` (writable computed pushing to `router.replace({ query })`), `selectedLocale` (same shape), `versionMissing` flag (when `?v=` doesn't match a known version), `availableVersions` (fetched lazily once via `useFetch('/schemas')` with a stable key like `'dtpr-schemas'` so all four call sites share the same response), and `availableLocales` (static list: `en`, `es`, `fr`, `km`, `pt`, `tl` per the DTPR schema spec).
- The composable governs *DTPR-derived surfaces only* — it is not a general-purpose i18n layer for the docus prose. Header comment must call this out so future contributors don't extend it into a docus-shell concern.
- Default locale is `en`; default version resolves to the `<datachain_type>@latest` alias when `?v=` is missing or unknown.
- All mutations use `router.replace` (not `push`) to preserve back-button behavior.
- Composable is SSR-safe: reads route via `useRoute()`, no `window` access at the top level.

**Patterns to follow:**
- The version computed-chain at `dtpr-ai/app/pages/taxonomy.vue:79-113` (`requestedVersion`, `activeVersion`, `versionMissing`, `selectedVersion` getter/setter). Lift this verbatim into the composable so the catalog (U6) can drop its local copies and consume the shared state.

**Test scenarios:**
- Happy path: load any DTPR surface with no `?v=`/`?locale=` → `activeVersion = ai@latest`, `activeLocale = 'en'`.
- Happy path: load with `?v=ai@2026-04-16-beta&locale=es` → both reflected in the composable's reactive state.
- Edge case: `?v=ai@bogus` → `versionMissing = true`, `activeVersion` falls back to alias.
- Edge case: `?locale=xx` (unsupported) → `activeLocale` falls back to `en`.
- Integration: `selectedVersion.value = 'ai@2026-04-16-beta'` → router URL updates without page reload; reactive consumers re-fetch.

**Verification:**
- `pnpm --filter ./dtpr-ai typecheck` passes.
- Manual: composable surfaces in Vue DevTools when active on `/taxonomy` after U6 lands.

---

- U2. **Element page route shell with hero, version + locale UI**

**Goal:** Render `/taxonomy/elements/<id>` with the element hero (icon, title, description) via `<DtprElementDetail>`, version-aware single-element fetch, locale-aware fields, sticky header containing version and locale switchers, and a "back to taxonomy" link. No playground yet; no editorial body yet.

**Requirements:** R1, R2, R16, R17, R18.

**Dependencies:** U1.

**Files:**
- Create: `dtpr-ai/app/pages/taxonomy/elements/[id].vue`
- Create: `dtpr-ai/app/components/DtprPageHeader.vue` *(small shared header strip used by U2 + U4 + U6)*

**Approach:**
- Read `id` from `useRoute().params.id`.
- `useAsyncData` keyed on `[activeVersion, activeLocale, id]`: `GET /api/v2/schemas/<version>/elements/<id>?fields=all&locales=<locale>,en` — single-element endpoint (one request, lower latency than re-filtering the catalog).
- Parallel `useAsyncData` for the parent category at the same version+locale — needed so the page can render the category breadcrumb and (in U3) the context palette.
- `iconUrl = …/elements/<id>/icon.svg` (default variant; U3 makes this dynamic).
- `<DtprElementDetail :display="display" :locale="activeLocale">` where `display = deriveElementDisplay(element, undefined, activeLocale, { iconUrl })` — `instance` is `undefined` until U3 wires the playground.
- `useHead({ title: \`\${display.title} — DTPR Taxonomy\` })` for browser tab + SEO basics.
- `<DtprPageHeader>` slot props: `version`, `locale`, `onVersionChange`, `onLocaleChange`. Renders `USelectMenu` for version, `USelectMenu` for locale, "Back to taxonomy" `NuxtLink` carrying `?v=` and `?locale=` forward.
- 404 handling: if the element fetch returns 404, render an inline `<UAlert>` with the requested id and a link back to `/taxonomy?v=<version>&locale=<locale>`. Do not throw; the route is valid even if the id isn't.
- "Not in this version" fallback: when `versionMissing` becomes true (user picks a version where the element doesn't exist), show the same inline alert variant.

**Patterns to follow:**
- Single-element fetch contract documented at `dtpr-ai/content/3.rest/5.element-detail.md`.
- `<DtprElementDetail>` slot model in `packages/ui/src/vue/DtprElementDetail.vue:12-33` (the `after-description` slot is reserved for U3).
- Sticky header pattern from `dtpr-ai/app/pages/taxonomy.vue` (extract into `DtprPageHeader.vue` so U6 backfill isn't a copy).

**Test scenarios:**
- Happy path: visit `/taxonomy/elements/purpose` → element hero renders with icon + en title + en description; URL shows no `?v=`/`?locale=`.
- Happy path: visit `/taxonomy/elements/purpose?v=ai@2026-04-16-beta&locale=es` → element hero renders Spanish title (or `en` fallback for missing fields), version selector shows pinned beta. **Covers AE4.**
- Edge case: visit `/taxonomy/elements/bogus_id` → inline 404 alert renders, link back to `/taxonomy` preserves query state.
- Edge case: pick a version in the selector where the element doesn't exist → inline "not in this version" alert, page does not crash hydration.
- Integration: change locale in the switcher → URL updates with `?locale=`, element refetches, hero re-renders with new locale; this covers F1's "page renders the element's hero" step in non-`en` locales.

**Verification:**
- `pnpm --filter ./dtpr-ai build` succeeds against the Cloudflare Workers preset.
- Manual: page is server-rendered (view source contains element title before hydration).
- Manual: switching version/locale does not full-reload the page.

---

- U3. **Element page Playground (Variables + Context + Default/Dark)**

**Goal:** Render the Playground panel below the hero with a Variables form (when the element declares variables), a Context chip row (when the parent category declares a context), and a Default/Dark toggle. Form state drives `display` live: title and description re-interpolate, icon recolors via the variant URL.

**Requirements:** R3, R4, R6.

**Dependencies:** U2.

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy/elements/[id].vue`
- Create: `dtpr-ai/app/components/DtprPlayground.vue`

**Approach:**
- `<DtprPlayground :element :category>` owns reactive form state: `variables` (`Record<string, string>`, keys = declared variable ids, default `''`), `contextId` (`string | null`, default `null`), `style` (`'default' | 'dark'`, default `'default'`).
- Computed `instance: InstanceElement` = `{ id: element.id, variables: declaredIds.map(id => ({ id, value: variables[id] ?? '' })) }` — pass all declared ids so `interpolate` substitutes empty rather than leaving literal `{{var}}` (per `packages/ui/src/core/element-display.ts:81-89`).
- Computed `variant`: `style === 'dark' ? 'dark' : contextId ?? 'default'`.
- Computed `iconUrl`: `…/elements/<id>/icon.<variant>.svg` when variant !== 'default', else `…/elements/<id>/icon.svg`.
- Computed `display` = `deriveElementDisplay(element, instance, activeLocale, { iconUrl })` — recomputes on any form/state change. Pass `display` up to the parent page via `defineProps`/emit OR render `<DtprElementDetail>` from inside the playground (decide during impl based on which keeps the hero+playground binding tighter; either is acceptable as long as the editorial body slot in U5 still has a clean place to render).
- Variables form: one `<UFormField>` + `<UInput>` per declared variable (plain text only — see Scope Boundaries). Label = `variable.label` resolved at the active locale. Required-marker on `variable.required`.
- Context chip row: render only when `category.context?.values?.length`. Each chip is a `<UButton>` styled with the value's `color` (filled when active, outlined when inactive). Label = locale-resolved `value.name`. Active chip click toggles back to `null` (default).
- Default/Dark toggle: small `<URadioGroup>` adjacent to the chip row. Mutually exclusive with chip selection — if the user picks Dark, `style = 'dark'` and `contextId` stays whatever it was (style takes precedence in the variant computed). Visualize the precedence cleanly: when style=dark, fade chip-active state.
- Empty state: when the element declares no variables AND the category declares no context, render only the Default/Dark toggle (per AE1). The panel still gets a heading so visitors know it exists.

**Patterns to follow:**
- Interpolation gate semantics in `packages/ui/src/core/element-display.ts:81-89`.
- Variant id source: `element.icon_variants` cross-referenced with `category.context.values[]` for color + label (`dtpr-ai/content/4.icons/3.composed-variants.md`).
- `<DtprElementDetail>` slot composition in `packages/ui/src/vue/DtprElementDetail.vue:12-33` — the playground attaches via the `after-description` slot if hero+playground are co-rendered, or sits as a sibling block if they're separate.

**Test scenarios:**
- Happy path: element with two declared variables → typing into either input live-updates `display.title` / `display.description` to substitute the new value.
- Happy path: element whose category declares 3 context values → chip row renders 3 chips colored by the values' `color`; clicking one recolors the hero icon to that variant. **Covers F1 Steps 3-4.**
- Happy path: toggle Default → Dark → hero icon swaps to the dark variant URL; chips remain visible but visually de-emphasized.
- Edge case: element with NO declared variables and category with NO declared context → panel renders only the Default/Dark toggle, hero still functional. **Covers AE1.**
- Edge case: variable input cleared → `display` shows `''` substituted (not literal `{{var}}`), confirming all declared ids are present in the instance.
- Edge case: locale changes mid-edit → variables form retains values; labels re-render in the new locale; `display` re-interpolates.
- Integration: an icon URL 404 (variant doesn't exist for this element) → `<DtprIcon>` falls back to its hexagon (verifies the existing fallback path).

**Verification:**
- `pnpm --filter @dtpr/ui typecheck` and `pnpm --filter ./dtpr-ai build` both succeed.
- Manual: type a value → preview updates within one frame.
- Manual: click a chip → icon recolors without a network round-trip beyond the new `<img>` load.

---

- U4. **Category page route with description, elements list, and read-only context palette**

**Goal:** Render `/taxonomy/categories/<id>` with the category's description, an elements list (each row links to the element page), and a read-only context palette of labeled color swatches when the category declares a context. No playground; no editorial body yet.

**Requirements:** R7, R8, R9.

**Dependencies:** U1, U2 (consumes `DtprPageHeader.vue`).

**Files:**
- Create: `dtpr-ai/app/pages/taxonomy/categories/[id].vue`

**Approach:**
- Read `id` from `useRoute().params.id`.
- Two parallel `useAsyncData` keyed on `[activeVersion, activeLocale, id]`: `GET /api/v2/schemas/<version>/categories?locales=<locale>,en` (full categories list — find `id`) and `GET /api/v2/schemas/<version>/elements?fields=all&limit=200&locales=<locale>,en&category_id=<id>` if the API supports server-side filtering, otherwise client-side filter on the full bulk response (confirm during impl; either is acceptable per the "fresh server fetch" decision).
- Render hero: category title + description via the locale-resolved fields. Reuse `<DtprPageHeader>` from U2 for the sticky header.
- Render context palette (R9): when `category.context?.values?.length`, render a row of labeled color swatches — each swatch is a small block colored `value.color` with the locale-resolved `value.name` underneath. Read-only — no click handlers, no chip-active state. Visually distinct from the U3 chip row (no border on hover, no cursor change).
- Render elements list: each element row uses `<DtprElement :display>` (compact card from `packages/ui/src/vue/DtprElement.vue`) wrapped in a `<NuxtLink :to="\`/taxonomy/elements/\${el.id}\` + queryString">` where `queryString` carries `?v=` and `?locale=` forward. Order matches `category.element_order` if present, else declaration order from the elements list response.
- 404 handling: same pattern as U2 — inline alert when category id doesn't resolve, link back to `/taxonomy` with state preserved.
- "Not in this version" fallback: same pattern when category exists in latest but not in the picked version.

**Patterns to follow:**
- `groupElementsByCategory` is overkill here (we only need one category's elements); use a direct filter on `el.category_id === id` (or normalized `category_ids` per the prior plan's defensive wrap).
- Categories endpoint shape at `dtpr-ai/content/3.rest/3.categories.md:43-49` for `context.values[]`.

**Test scenarios:**
- Happy path: visit `/taxonomy/categories/risks_mitigation` → title + description render; full elements list renders; if the category declares a context, palette swatches render below the description.
- Happy path: visit `/taxonomy/categories/<id>?v=ai@2026-04-16-beta&locale=es` → renders Spanish title/description (or en fallback per field) at the pinned version.
- Edge case: visit `/taxonomy/categories/bogus` → inline 404 alert; link back to `/taxonomy` preserves query.
- Edge case: category has no declared context → palette section omitted; page still complete.
- Edge case: category exists in latest but not in picked version → inline "not in this version" alert.
- Integration: click an element row → routes to `/taxonomy/elements/<id>?v=…&locale=…` with the same version/locale state; element page renders correctly. **Covers R8.**

**Verification:**
- `pnpm --filter ./dtpr-ai build` succeeds.
- Manual: server-rendered (view source contains category title and element titles).
- Manual: palette swatches render the documented `value.color` values.

---

- U5. **Editorial markdown overlay convention**

**Goal:** Establish the convention for authored editorial narrative on element and category pages. Both new pages query the existing `docs` content collection for an optional overlay md file at the page's route path; when present, the page renders an editorial body section beneath the hero + playground (or hero + elements list); when absent, no body section. Cmd-K indexes the editorial md automatically (R14).

**Requirements:** R5, R10, R14.

**Dependencies:** U2, U4.

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy/elements/[id].vue`
- Modify: `dtpr-ai/app/pages/taxonomy/categories/[id].vue`
- Create: `dtpr-ai/content/taxonomy/elements/.gitkeep` *(reserves the directory; authored md files land here)*
- Create: `dtpr-ai/content/taxonomy/categories/.gitkeep`
- Optional: `dtpr-ai/content/taxonomy/elements/risks_mitigation_example.md` *(one example overlay md, only if the implementing agent wants a smoke-test fixture; not required for the convention to ship — see Test scenarios)*

**Approach:**
- In each page, add a `useAsyncData` keyed on the route path: `queryCollection('docs').path(routePath).first()`. `routePath` = `/taxonomy/elements/<id>` or `/taxonomy/categories/<id>` — matches docus's auto-derived `id` for files at `content/taxonomy/<kind>/<id>.md`.
- Wrap the editorial body render in `<template v-if="overlay">…</template>` so missing overlays produce no DOM (per R5 and R10's "no empty placeholder" rule).
- Render via `<ContentRenderer :value="overlay" />` (docus / Nuxt Content's standard render component, already in use across the prose docs).
- Document the convention in `dtpr-ai/content/` somewhere visible to authors. Either extend `dtpr-ai/content/0.taxonomy.md` with a brief authoring note (preferred — keeps it adjacent to the surface), or create a new short content stub at `dtpr-ai/content/0.taxonomy.editorial.md`. Pick during impl based on what reads cleanly in the docus left nav.
- Required frontmatter for overlay md files: `navigation: false` (so docus does not surface the overlay md in the left sidebar nav), `title:` (for Cmd-K indexing). Document this in the authoring note.
- The authoring note must also state: *adding an overlay md replaces the synthetic Cmd-K entry for that route* (per the U7 dedupe rule). Authors who want their md to augment rather than replace should know the synthetic entry's auto-derived prefix (`"<category> · element"`) goes away unless they re-supply it via frontmatter — for v1 the prefix is simply lost on authored entries; richer parity is a follow-up.
- Wrap `queryCollection(...).first()` in a try/catch returning `null` if the query throws on the Workers preset (deferred check from Open Questions).

**Patterns to follow:**
- Existing docus content rendering shape — `<ContentRenderer>` usage in the docus catch-all `[[lang]]/[...slug].vue`.
- The "optional content lookup" pattern: prior plan's `queryCollection('docs').path(...)` wiring (none ships today, but research confirmed the API shape).

**Test scenarios:**
- Happy path: drop a fixture md at `dtpr-ai/content/taxonomy/elements/<known_id>.md` with title and a paragraph of body → element page renders the body below the playground; Cmd-K finds it by terms in the body.
- Happy path: drop a fixture md at `dtpr-ai/content/taxonomy/categories/risks_mitigation.md` → category page renders narrative above the elements list (or below — pick during impl based on visual fit; brainstorm visual aid puts it at the bottom). **Covers AE3 + R10.**
- Edge case: no overlay md exists for an element/category → no body section renders, no empty placeholder, no console error.
- Edge case: overlay md exists with `navigation: false` frontmatter → md does NOT appear in docus left sidebar nav.
- Integration: type a term that appears only in editorial body (not in element title or description) into Cmd-K → result includes the element/category page. **Covers R14.**
- Integration: remove the fixture md and rebuild → page still renders, body section disappears, Cmd-K result for the body-only term disappears.

**Verification:**
- `pnpm --filter ./dtpr-ai build` succeeds with at least one fixture md present.
- Manual: overlay md authoring is a single-file add — no schema rebuild, no migration, no app code change. **Covers F3.**

---

- U6. **Backfill `/taxonomy` with shared locale state and per-row "Open page" link**

**Goal:** Migrate the existing `/taxonomy` catalog to consume the shared `useDtprState` composable (so all four surfaces — catalog, element page, category page, Cmd-K — share locale + version state), add a locale switcher to the catalog's sticky header, and add a per-row "Open page" link that navigates to the new standalone routes with `?v=` and `?locale=` carried forward. Existing copy-link / hash-scroll behavior preserved.

**Requirements:** R15, R16, R17, R18.

**Dependencies:** U1, U2, U4 (so the "Open page" link targets exist).

**Files:**
- Modify: `dtpr-ai/app/pages/taxonomy.vue`

**Approach:**
- Replace the local `requestedVersion` / `activeVersion` / `versionMissing` / `selectedVersion` chain with `const { activeVersion, activeLocale, selectedVersion, selectedLocale, versionMissing } = useDtprState()`.
- Update the categories + elements `useAsyncData` keys to depend on `activeLocale` as well, and add `&locales=<locale>,en` to both fetches.
- Update `decoratedElements` to call `deriveElementDisplay(el, undefined, activeLocale, { iconUrl })` — current call hardcodes `'en'`.
- Add a locale `<USelectMenu>` to the sticky header next to the existing version selector. Both menus consume the same `<DtprPageHeader>` from U2 (extracting the catalog's existing header into the shared component is part of this unit).
- Add a per-row "Open page" affordance: small `<UButton>` with `i-heroicons-arrow-top-right-on-square` icon inside the existing element-row wrapper, routes to `/taxonomy/elements/<id>?v=<version>&locale=<locale>` via `<NuxtLink>`. Place the button alongside the existing copy-link button so both are discoverable.
- Add a per-section "Open category page" affordance in the category section header bar: same icon button, routes to `/taxonomy/categories/<id>?v=<version>&locale=<locale>`.
- Existing copy-link button (clipboard `#element-<id>` URL) and existing hash-scroll behavior remain unchanged.
- Sidebar element counts and search filter operate against the locale-resolved title/description (consistent with the existing search UX).

**Patterns to follow:**
- Existing copy-link toast pattern in `dtpr-ai/app/pages/taxonomy.vue` (commit `8c55012`). The new "Open page" affordance does NOT toast — it just navigates.
- Sticky header layout already in `taxonomy.vue` — extract into `DtprPageHeader.vue` (created in U2) so the catalog and standalone pages share one component.

**Test scenarios:**
- Happy path: load `/taxonomy` with no query → `activeLocale = 'en'`, `activeVersion = ai@latest`, sidebar renders, elements render.
- Happy path: load `/taxonomy?locale=es` → catalog renders Spanish titles/descriptions (or en fallback per field); locale selector shows `es` active.
- Happy path: switch locale via the selector → URL updates with `?locale=`, fetches refire, catalog re-renders.
- Happy path: click per-row "Open page" → routes to `/taxonomy/elements/<id>?v=<version>&locale=<locale>`; back button returns to catalog with state preserved.
- Edge case: existing per-row copy-link still copies the anchor URL (`#element-<id>` with current `?v=`/`?locale=` carried) — no behavioral regression.
- Edge case: existing hash-scroll on load (`/taxonomy#element-purpose`) still works.
- Integration: deep-link `/taxonomy?v=ai@2026-04-16-beta&locale=es#element-purpose` → version + locale + scroll target all resolve correctly. Carries forward to the open-page link.

**Verification:**
- `pnpm --filter ./dtpr-ai build` succeeds.
- Manual: side-by-side comparison with pre-PR catalog — search, sidebar, copy-link, hash-scroll all behave identically; new locale switcher and "Open page" affordances work.
- No new public exports added to `@dtpr/ui` (consumer-side only).

---

- U7. **Synthetic Cmd-K injection via local `app.vue` override**

**Goal:** Inject every element and every category as a searchable Cmd-K entry alongside the existing prose docs, dedupe against authored editorial md files, and refresh on locale change. Real markdown wins on collision.

**Requirements:** R11, R12, R13, R14 (R14 is mostly satisfied by U5 — this unit ensures the synthetic group does not block authored md from surfacing), R19.

**Dependencies:** U1 (state for boot fetch), U2 (element route must exist for synthetic `to` URLs), U4 (category route must exist) — without U2 and U4, R11 is met but R12 navigation lands on 404s.

**Files:**
- Create: `dtpr-ai/app/app.vue`
- Create: `dtpr-ai/app/composables/useDtprSearchOverlay.ts`

**Approach:**
- Mirror docus's `app.vue` template + script verbatim, then add a single binding: `:groups="dtprGroups"` to `<LazyUContentSearch>`.
- `useDtprSearchOverlay()` runs a single `useAsyncData('dtpr-search-overlay', …)` keyed on `[activeVersion, activeLocale]`. Fetches `GET /schemas/<activeVersion>/elements?fields=all&limit=200&locales=<activeLocale>,en` and `GET /schemas/<activeVersion>/categories?locales=<activeLocale>,en` in parallel.
- Build synthetic items shaped to match `<UContentSearch>`'s group item contract (`{ label, suffix, to, icon, prefix?, level? }` — see `useContentSearch.mapFile`):
  - Element item: `label = display.title`, `suffix = display.description` (truncated for visual fit), `to = /taxonomy/elements/<id>?v=<version>&locale=<locale>`, `prefix = "<category title> · element"` (R13: type + category disambiguation), `icon` left undefined (DTPR icon rendering inside the result row is deferred per Scope Boundaries — type-aware palette).
  - Category item: `label = title`, `suffix = description`, `to = /taxonomy/categories/<id>?v=<version>&locale=<locale>`, `prefix = "category"`.
- Dedupe: build `existingPaths = new Set(files.value?.map(f => f.id) ?? [])` from the boot-loaded `queryCollectionSearchSections('docs')` array (the same `files` docus's `app.vue` already binds). Drop synthetic items whose `to`'s pathname is in `existingPaths` — authored editorial md wins.
- Compose the final `groups` array: `[{ id: 'taxonomy-elements', label: 'Elements', items: elementItems }, { id: 'taxonomy-categories', label: 'Categories', items: categoryItems }]`. Two groups (not one) so visitors can scan elements vs. categories.
- Re-fetch on locale change is automatic via the `useAsyncData` key. Version change also re-fetches; the boot fetch always uses the surface's *active* version. **Counterintuitive but correct rule:** Cmd-K results scope to the active version on whatever surface the user is viewing. Opening Cmd-K on `/taxonomy?v=ai@2026-04-16-beta` shows beta entries; opening it on `/getting-started/...` (no `?v=` → alias) shows latest. Document this rule in the override file's header comment so it isn't mistaken for a bug.
- SSR posture: `server: false` on the `useAsyncData` (matching docus's pattern for `files`) so the boot fetch runs client-only and doesn't block initial paint.

**Patterns to follow:**
- Docus's `app.vue` mount pattern (the file we are mirroring — see Context section).
- `<UContentSearch>` `groups` prop semantics in `node_modules/.../components/content/ContentSearch.vue` (groups appended after navigation-derived groups; not filtered by `mapNavigationItems`).
- The element-item shape that `mapFile` produces in `useContentSearch.js:7-17` — synthetic items match this so they render uniformly.

**Test scenarios:**
- Happy path: open Cmd-K from `/taxonomy` → results include "Elements" and "Categories" groups alongside the existing prose results.
- Happy path: type `purpose` → results include the "Purpose" category and every element whose title or description matches; each element entry shows its category in the prefix. **Covers AE2 + F2.**
- Happy path: select an element result → modal closes, navigation goes to `/taxonomy/elements/<id>?v=<version>&locale=<locale>` matching the surface's active state.
- Happy path: switch locale on `/taxonomy` → reopen Cmd-K → element/category labels and suffixes render in the new locale.
- Edge case: drop an authored editorial md at `content/taxonomy/elements/purpose.md` → Cmd-K shows ONE result for `/taxonomy/elements/purpose` (the authored entry from the `docs` collection); the synthetic item is filtered out. **Covers R14 dedupe.**
- Edge case: API fetch fails (network blocked) → Cmd-K still works; only the docus prose results render. No console error, no broken modal.
- Edge case: empty schema (no elements) → synthetic groups simply omit; modal renders without empty headings.
- Integration: navigate from any page on dtpr-ai → Cmd-K opens, type "purpose," select an element → arrive at element page in two interactions. **Covers F2 outcome.**

**Verification:**
- `pnpm --filter ./dtpr-ai build` succeeds.
- Manual: `pnpm --filter ./dtpr-ai dev` → Cmd-K integration verified across `/`, `/taxonomy`, `/getting-started/...`, and the new element/category pages.
- Manual: dedupe rule observed — drop a fixture md, confirm one result; remove the md, confirm the synthetic entry returns.
- No regression to existing docus prose search behavior.

---

## System-Wide Impact

- **Interaction graph:** New pages only; no shared middleware, no auth, no callbacks. The new Cmd-K injection runs client-side after hydration; it cannot interfere with SSR. The local `app.vue` override replaces docus's app shell — verify that nothing else depends on internal docus shell behavior we don't mirror (verified in U7's "mirror verbatim then add one prop" approach).
- **Error propagation:** Single-element / category fetch failures render inline alerts (R-level fallbacks); they do not crash hydration. Cmd-K boot fetch failure leaves only docus prose results — silent degradation. Editorial md collection query failure on Workers preset is wrapped in try/catch (deferred check resolved in U5).
- **State lifecycle risks:** None — read-only over a public API. URL-state mutations use `router.replace` (not `push`) to avoid back-button traps when the user toggles a chip or types a variable.
- **API surface parity:** No changes to the DTPR REST API. No changes to `@dtpr/ui` exports. No changes to `@dtpr/api`. The plan is consumer-side only inside `dtpr-ai/`.
- **Integration coverage:** The interaction surface that mocks alone won't prove: (1) Cmd-K dedupe between authored md and synthetic injection works against a real `queryCollectionSearchSections` response shape; (2) `?v=` and `?locale=` propagation across `<NuxtLink>` navigations and selector mutations preserves both query params on every transition; (3) the local `app.vue` override does not regress docus's existing shell behaviors (color mode, header rendering, layout slot). Verified manually per U-level test scenarios.
- **Unchanged invariants:**
  - `dtpr-ai/app/pages/taxonomy.vue`'s search behavior, sidebar, sticky header layout, copy-link toast, and hash-scroll all preserve their current UX (U6 is a refactor + augment, not a redesign).
  - `app/pages/taxonomy.vue` (the legacy `app/` Nuxt project, different repo path) and its device/AI subroutes are untouched.
  - Existing `dtpr-ai/content/**/*.md` prose docs and their docus rendering paths are untouched.
  - `@dtpr/ui` exports remain stable; no new public exports added.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Local `dtpr-ai/app/app.vue` override drifts from docus's upstream shell on a docus version bump. | Keep the override minimal — verbatim mirror plus the single `:groups` prop binding. Add a header comment in the file pointing to `node_modules/docus/app/app.vue` and the docus version snapshot at fork time so reviewers know to re-sync on docus upgrades. A CI hash check against the upstream file would catch silent drift mechanically; deferred as a follow-up if drift becomes a real problem. |
| `<UContentSearch>` `groups` prop contract changes in a future `@nuxt/ui` major. | Pin the component's expected item shape in U7's implementation comments referencing `useContentSearch.mapFile`. If `@nuxt/ui` v5 ships, re-validate before upgrading. |
| `queryCollection('docs').path(...)` throws on the Cloudflare Workers preset for missing entries. | Wrap in try/catch (U5 approach); regression-tested by deploying a preview build with no overlay md present. |
| Cmd-K boot fetch latency measurably regresses initial Cmd-K open. | `useAsyncData('dtpr-search-overlay', …, { server: false })` runs after hydration; boot fetch does not block paint. If hydration size is impacted, trim API response with `?fields=id,title,description,category_id,icon_variants` (deferred check in Open Questions). |
| Locale fallback semantics produce silent English content where the visitor expected localized strings. | `?locales=<active>,en` always passes both — explicit fallback rather than silent. UI does not flag fallback occurrence at the field level (out of scope). |
| Element exists in `<datachain_type>@latest` but not in a pinned beta version → broken navigation from search. | U2/U4 inline "not in this version" fallback; Cmd-K results are scoped to the surface's active version, so they cannot point outside what the user is viewing. Cross-version stale links are an acceptable v1 edge case. |
| A future `@nuxtjs/i18n` adoption clashes with our `?locale=` URL convention. | Migration path is documented (Scope Boundaries: redirect-and-migrate from `?locale=` to `[[lang]]/...`). Not a blocker for v1. |

---

## Documentation / Operational Notes

- After merge, update `dtpr-ai/content/0.taxonomy.md` (or its sibling note created in U5) to describe the editorial md authoring workflow — single-file add, conventional path, required frontmatter (`navigation: false`, `title:`).
- No analytics, no feature flag, no rollout plan — additive feature on a public docs site.
- Cloudflare deployment uses the existing `wrangler.jsonc`; no new bindings, no new routes, no new env vars.
- The shared `useDtprState` composable is a small but consequential abstraction — note it in the dtpr-ai onboarding section so future surfaces consume it instead of re-reading `?v=` and `?locale=` ad hoc.

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-04-29-dtpr-taxonomy-pages-and-search-brainstorm.md`
- **Prior taxonomy plan:** `docs/plans/2026-04-27-001-feat-dtpr-ai-taxonomy-view-plan.md` (catalog page; pattern reference for SSR fetch, version state, manual-only verification posture)
- **Existing catalog implementation:** `dtpr-ai/app/pages/taxonomy.vue`
- **DTPR UI components:** `packages/ui/src/vue/index.ts`, `packages/ui/src/vue/DtprElementDetail.vue`, `packages/ui/src/vue/DtprElement.vue`, `packages/ui/src/vue/DtprIcon.vue`, `packages/ui/src/vue/DtprCategorySection.vue`
- **DTPR core helpers:** `packages/ui/src/core/element-display.ts`, `packages/ui/src/core/categories.ts`, `packages/ui/src/core/types.ts`
- **REST contract:** `dtpr-ai/content/3.rest/3.categories.md`, `dtpr-ai/content/3.rest/4.elements-list.md`, `dtpr-ai/content/3.rest/5.element-detail.md`, `dtpr-ai/content/3.rest/7.icons.md`
- **Icon URL grammar:** `dtpr-ai/content/4.icons/3.composed-variants.md`, `dtpr-ai/content/4.icons/4.urls.md`
- **Versions concept:** `dtpr-ai/content/6.concepts/3.versions-and-releases.md`
- **Site shell:** `dtpr-ai/nuxt.config.ts`, `dtpr-ai/app.config.ts`, `dtpr-ai/wrangler.jsonc`
- **Docus Cmd-K mount (read-only reference):** `node_modules/.pnpm/docus@5.10.0_*/node_modules/docus/app/app.vue`
- **`<UContentSearch>` extension surface (read-only reference):** `node_modules/.pnpm/@nuxt+ui@4.5.1_*/node_modules/@nuxt/ui/dist/runtime/components/content/ContentSearch.vue`, `node_modules/.pnpm/@nuxt+ui@4.5.1_*/node_modules/@nuxt/ui/dist/runtime/composables/useContentSearch.js`
