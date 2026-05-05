---
date: 2026-04-29
topic: dtpr-taxonomy-pages-and-search
---

# DTPR Taxonomy: Element / Category Pages + Unified Cmd-K Search

## Problem Frame

The shipped `/taxonomy` page on `dtpr-ai` lets visitors browse every element in the active schema as a searchable, anchor-addressable catalog. Two limits show up immediately:

1. **No depth-on-demand.** Visitors can see an element's icon, title, and description on the catalog, but cannot preview how the element actually renders for a specific set of variable values or in a non-default context color. Hard-to-grasp categories (Risks & Mitigation in particular) need authored narrative — e.g., references to published research — and there is nowhere to put that.
2. **Search is fragmented.** Docus's Cmd-K search indexes the prose docs (`content/**/*.md`), but it does not see DTPR elements or categories. Visitors looking up "purpose" or "retention" miss the schema entirely from the global search and fall back to typing the URL or scrolling the catalog.

Both gaps reduce the usefulness of the schema as a public artifact: the catalog is breadth-only, and the global search is prose-only.

This brainstorm covers two coordinated additions: standalone, interactive pages per element and per category, and integration of those pages into the existing Docus search so that a single Cmd-K modal becomes the canonical discovery surface for the schema.

A small UI refinement (context picker on the element page) is folded into the same workstream because it is part of the element-page playground rather than its own feature.

---

## Actors

- A1. **Site visitor (reader):** Lands on the dtpr-ai site to understand a specific element, compare elements within a category, or find an element by partial term. Primary persona for R1–R16.
- A2. **Content author:** Adds optional narrative for hard-to-grasp elements or categories without touching the schema build pipeline. Affects R5, R10, R14.

---

## Key Flows

- F1. **Visitor previews an element with their own values.**
  - **Trigger:** Visitor clicks an element card on `/taxonomy`, or arrives via Cmd-K, or lands via deep link.
  - **Actors:** A1
  - **Steps:** Page renders the element's hero (icon, title, description). A "Playground" panel below the hero shows a Variables form (when the element declares any) and a Context chip row (when the element's category declares one). Visitor types values into Variables; title and description live-interpolate. Visitor clicks a Context chip; icon recolors to the chosen context. Visitor optionally toggles Default / Dark.
  - **Outcome:** Visitor leaves with a concrete sense of how the element looks for their use case.
  - **Covered by:** R1, R2, R3, R4, R6

- F2. **Visitor finds an element from global Cmd-K.**
  - **Trigger:** Visitor opens the Docus Cmd-K modal from any page on dtpr-ai.
  - **Actors:** A1
  - **Steps:** Visitor types a partial term ("purpose"). Search results include matching prose docs *and* matching elements + categories with enough context (icon, category, type) to disambiguate. Visitor selects an element result; the modal closes and the page navigates to that element's page.
  - **Outcome:** Visitor reaches the element page in two interactions from anywhere on the site.
  - **Covered by:** R11, R12, R13

- F3. **Author publishes editorial narrative for a hard-to-grasp element or category.**
  - **Trigger:** Author identifies that an element (e.g., a specific risk) or a whole category (e.g., Risks & Mitigation) needs context the schema does not capture.
  - **Actors:** A2
  - **Steps:** Author creates a single authored markdown file under the conventional path for that element or category. File contains the narrative copy. No schema change, no rebuild of the schema bundle, no migration.
  - **Outcome:** The narrative renders in the editorial slot of the matching page on next deploy and is picked up by Cmd-K search automatically.
  - **Covered by:** R5, R10, R14

---

## Requirements

**Element pages**

- R1. Every element in the active schema is reachable at a stable, shareable URL — one URL per element.
- R2. The element page renders a hero with the element's icon, title, and description, using the same component family (`<DtprElementDetail>` or equivalent) as the catalog so visitors see a consistent representation.
- R3. The element page includes a Playground panel with a Variables form when the element declares variables; entering values updates the rendered title and description live, using the same locale-fallback semantics as the catalog.
- R4. The Playground includes a Context chip row when the element's category declares a context. Each chip is colored by its context value's color and labeled with the value's name; clicking a chip recolors the hero icon to that context's variant. A small Default / Dark toggle sits alongside the chip row for the universal variants.
- R5. The element page renders an optional editorial body when one has been authored. When no editorial body exists, the page shows no body section — no empty placeholder, no "Coming soon" copy.
- R6. The page is fully functional with no editorial body authored — the playground is the page's primary content.

**Category pages**

- R7. Every category in the active schema is reachable at a stable, shareable URL — one URL per category.
- R8. The category page renders the category's title, description, and the list of elements that belong to it. Each element row links to that element's page.
- R9. When a category declares a context, the category page renders the full context palette as labeled color swatches (read-only — visitors cannot change the active context from this page).
- R10. The category page reserves space for authored editorial narrative. Narrative is expected for some categories (such as Risks & Mitigation referencing published research) and is optional for others; categories with no narrative still render a complete page.

**Unified search**

- R11. The Docus Cmd-K search includes every element and every category as searchable items, alongside the existing prose docs.
- R12. Selecting an element or category from search routes to that item's page (R1, R7).
- R13. Search results show enough context for a visitor to pick the right item without opening it: at minimum, type indication (element vs. category vs. doc), title, and the element's category for element results.
- R14. When an element or category has authored editorial copy, that copy is also indexed by the existing search pipeline so a visitor can find the element by terms in its narrative — not just by terms in its title or description.

**Discoverability and version state**

- R15. The existing `/taxonomy` catalog links to each element's and each category's standalone page. The current per-row copy-link affordance and in-page anchors continue to work.
- R16. The `?v=<version>` URL pin behavior is consistent across `/taxonomy`, element pages, and category pages: a non-default version on `/taxonomy` carries through to the standalone pages reached from there, and direct deep links resolve to the requested version (or fall back to `<datachain_type>@latest` when missing).

---

## Acceptance Examples

- AE1. **Covers R3, R4, R6.** An element with no declared variables and a category with no declared context: the Playground panel shows only the Default / Dark toggle. The page is still useful — hero + (optional) editorial body remain.
- AE2. **Covers R11, R13.** A visitor types `purpose` into Cmd-K. Results include the "Purpose" category page and every element whose title or description contains "purpose," each result clearly tagged with its type and (for elements) its category. Selecting "Purpose category" routes to `/taxonomy/categories/purpose`; selecting an element result routes to that element's page.
- AE3. **Covers R10.** The Risks & Mitigation category page renders authored narrative explaining how the category references published research, then the elements list, then the read-only context palette swatches.
- AE4. **Covers R1, R16.** A visitor lands on an element page with no `?v=` query: the page resolves against the current `<datachain_type>@latest` alias (matching `/taxonomy`'s behavior). A visitor lands on the same element page with `?v=ai@2026-04-16-beta`: the page renders that version's element content.

---

## Visual Aid — Element page layout

```
+--------------------------------------------------+
| dtpr-ai header (Cmd-K search lives here)         |
+--------------------------------------------------+
|                                                  |
|   [icon]  Title                                  |
|           Description (locale-resolved)          |
|                                                  |
+--------------------------------------------------+
|  Playground                                      |
|  +--------------------------------------------+  |
|  | Variables                                   | |
|  |   retention_period [    30 days       ]    | |
|  |   audience         [    commuters     ]    | |
|  |                                             | |
|  | Context                                     | |
|  |   [Commercial] [Civic] [Research]           | |
|  |                                             | |
|  | Style: ( ) Default  ( ) Dark                | |
|  +--------------------------------------------+  |
|                                                  |
+--------------------------------------------------+
|  Editorial body (only if authored)               |
|                                                  |
|  Long-form narrative — research references,      |
|  examples, when-to-use, etc.                     |
|                                                  |
+--------------------------------------------------+
```

The category page has the same shell with the elements list and read-only context-palette swatches replacing the Playground panel. Editorial body sits in the same slot.

---

## Success Criteria

- A site visitor can find any DTPR element from the docus Cmd-K search box and arrive at a page that previews that element with their own variable values and chosen context — within two interactions from any page.
- A content author can add narrative for a hard-to-grasp element or category by creating a single authored markdown file. No schema mutation, no build pipeline change, no migration step.
- The existing `/taxonomy` catalog stays the canonical breadth view; element and category pages stay the canonical depth view; the two surfaces link cleanly to each other.
- `/ce-plan` can lay out implementation units against R1–R16 without inventing user-facing behavior, scope, or success criteria.

---

## Scope Boundaries

- Type-aware Cmd-K palette enhancements (custom hit rendering with inline DTPR icons, type filters such as `e:purpose`, action hits like "Open playground for X with civic context") — deferred. Pure ranked list of typed entries is the v1.
- Build-time generation of a markdown twin per element/category — deferred. v1 uses live SSR Vue routes plus an editorial overlay collection. The generator approach can be revisited if the catalog grows past hundreds of elements or if SEO/index purity later outweighs the simpler runtime.
- Multi-locale element and category pages — out of scope. v1 renders `en` only, matching `/taxonomy`. The underlying `deriveElementDisplay` already accepts a locale, so a switcher can be added later.
- Per-element OG-image generation — deferred follow-up.
- Per-version pinned routes (e.g. `/taxonomy/v/<version>/elements/<id>`) — deferred. Version stays as the existing `?v=` query parameter.
- Editing variables/context state via shareable URL params (e.g. `?ctx=civic&v.retention=30d`) — deferred to plan as a small enhancement; not blocking the v1 ship.
- Inline drawer / modal alternative on `/taxonomy` (no new routes) — explicitly rejected. Editorial copy and per-page SEO require real routes; the drawer would block both.

---

## Key Decisions

- **Approach: live SSR Vue routes + editorial overlay markdown + synthetic Cmd-K injection (Approach A from brainstorm).** Schema data is fetched at SSR per request, identical to how `/taxonomy` already works. Editorial copy lives as opt-in markdown in a Nuxt Content collection. Cmd-K is fed by the existing content collection (which picks up authored editorial automatically) plus a synthetic stream of element / category entries derived from a single API fetch on app boot. Real markdown wins over synthetic entries when both exist for the same route.
- **Approach B (build-time generator) deliberately deferred.** Adds a build pipeline and version-snapshot semantics for marginal gain at current scale. Revisit if scale changes.
- **Approach D (type-aware palette) deliberately deferred.** Compelling, but its baseline value depends on `<UContentSearch>` slot extensibility, which is unresolved. v1 ships ranked typed entries; D is a follow-up.
- **Context picker UI: chip row labeled by context-value name.** Active chip filled, others outlined. Default / Dark live as a small adjacent toggle, not as chips, because they are universal variants rather than category-defined contexts.
- **Playground layout: hero on top, single bordered panel below containing Variables + Context controls, editorial slot at the bottom.** Sidebar layout and above-hero layouts rejected; grouping the controls in one card matches the "interactive component preview" framing.
- **#1 (pages) and #2 (context picker) are one feature, not two.** The picker is a playground control; there is no global picker on `/taxonomy`. The catalog stays in default coloring.

---

## Dependencies / Assumptions

- The existing REST API (`api.dtpr.io/api/v2`) returns `?fields=all` element records with `variables[]`, `icon_variants[]`, and category references. Verified against the wiring already shipped on `/taxonomy`.
- Categories that declare a context expose `context.values[]` with `{ id, color, name }` shape. Verified against `dtpr-ai/content/4.icons/3.composed-variants.md`.
- Composed icon URLs follow the documented `…/icon.<variant>.svg` shape, where `<variant>` matches a category `context.value.id`. Verified against `dtpr-ai/content/4.icons/4.urls.md`.
- Docus's `<UContentSearch>` accepts an extended `:files` array — assumed compatible with synthetic entries that mimic the `queryCollectionSearchSections` return shape. **Unverified at brainstorm time**; confirmed during plan.
- Cloudflare Workers SSR budget tolerates the per-element route fan-out at current schema scale (well under 100 elements). Same fetch pattern as `/taxonomy`, so cost per request is comparable.
- The existing `useFetch` / `useAsyncData` SSR pattern from `/taxonomy` continues to work for individual element / category routes; no new SSR mechanism is required.

---

## Outstanding Questions

### Resolve Before Planning

*(Empty — all product decisions are resolved.)*

### Deferred to Planning

- [Affects R3, R4][Technical] Should playground state (active context, variable values) persist in the URL so a visitor can share a specific preview? Either yes (full shareability, slightly more state plumbing) or no (cleaner page, but a copied URL is just the element page). Decide during plan.
- [Affects R15][Technical] When a visitor clicks the existing per-row copy-link on `/taxonomy`, does it copy the anchor URL (`#element-…`) or the new route URL (`/taxonomy/elements/…`)? Both could coexist with one being primary; pick during plan based on which feels canonical.
- [Affects R11, R12][Needs research] Does Docus's `<UContentSearch>` `:files` prop accept synthetic entries with arbitrary shapes, or does it constrain to the `queryCollectionSearchSections` return shape? If constrained, map synthetic entries to that shape; if not extensible at all, fall back to either a parallel in-modal results group or a thin custom modal triggered from the same Cmd-K binding.
- [Affects R7, R8][Technical] Where does the version selector live on element / category pages — re-render the same `<USelectMenu>` from `/taxonomy`, or hide it because the version is locked at the URL and only changeable by going back to `/taxonomy`? Likely the former for consistency, but confirm during plan.
- [Affects R11][Technical] Cmd-K dedupe rule between authored-markdown entries and synthetic API-derived entries. Likely "real markdown wins; drop synthetic for the same route" — confirm and document during plan.
- [Affects R8, R10][Technical] How does the category page get its elements list — re-fetch `/elements?fields=all&category_id=…`, or filter from a single page-wide cache? `/taxonomy` already fetches the full set; pages reached from `/taxonomy` could reuse it. Decide during plan.

---

## Next Steps

`-> /ce-plan` for structured implementation planning against this requirements document.
