---
title: DTPR AI Datachain Visualizer
type: feat
status: active
date: 2026-05-15
origin: docs/brainstorms/2026-05-15-dtpr-ai-datachain-visualizer-brainstorm.md
---

# DTPR AI Datachain Visualizer

## Summary

A new Nuxt page at `dtpr-ai/app/pages/tools/datachain.vue` (auto-prefixed `/en/` and `/fr/` via the configured `@nuxtjs/i18n`) wires the public `POST /api/v2/schemas/:version/validate` and `/resolve` endpoints into `DtprDatachain` via the existing `buildResolvedSections` helper from `@dtpr/ui/core`. State stays browser-local — paste/drop input, a single-key localStorage collection, and an on-mount URL-hash deep-link seam that decodes gzip+base64url payloads via `CompressionStream`. No backend changes, no new runtime dependencies.

---

## Problem Frame

External builders producing a `DatachainInstance` JSON (by hand, via tooling, or via a DTPR authoring skill) have no low-friction way to see it rendered. The schema, the API, and the renderer are all production-grade, but a stranger evaluating DTPR meets none of them as a working artifact — they must hand-edit docs fixtures or set up `hp-app` to preview. The cost shape is adoption-shaped: each prospective builder who can't get to a rendered preview within a minute of producing JSON is a cohort that doesn't try DTPR a second time. See origin: `docs/brainstorms/2026-05-15-dtpr-ai-datachain-visualizer-brainstorm.md` for the full pain narrative.

---

## Requirements

Traced from origin. Plan-time refinements are noted where they tighten an origin requirement.

- R1. Page reachable at `/[locale]/tools/datachain` for every site-configured locale (`en`, `fr` today). Linked from a new top-level **Tools** group in the docus header nav.
- R2. JSON input via two converging modes: paste into a textarea, and drop-or-file-pick a `.json` file. Both feed the same validate-and-render pipeline.
- R3. On submit, validate the JSON against `schema_version` via `POST /api/v2/schemas/:version/validate`.
- R4. On validation failure, surface each API-returned error with its `fix_hint` in a panel adjacent to the input. Paste content remains editable for in-place correction. (Plan-time: panel rather than per-line annotations — see Key Technical Decisions.)
- R5. On validation success, resolve via `POST /api/v2/schemas/:version/resolve` and hand the resolved sections to `DtprDatachain` via `buildResolvedSections(resolved, locale)`.
- R6. When `schema_version` names a version the API no longer serves, show a clear error naming the unsupported version (distinguishable from generic API failure).
- R7. Render uses `DtprDatachain` from `@dtpr/ui/vue` (no fork) and matches the visual treatment used elsewhere on `dtpr-ai`.
- R8. Render preserves accordion behavior: one section open at a time by default, with an expand-all control.
- R9. Locale switcher above the rendered output lists every locale the chain's content actually carries (across `title`, `description`, element variable labels/values, and other localized fields). Switching re-renders without re-fetching.
- R10. After a successful render, "Save to my collection" persists the JSON locally. Sidebar lists saved chains; user can rename and delete entries. No cross-device sync.
- R11. localStorage entries survive refresh and are namespaced per origin.
- R12. Default render locale is the active site locale (`en`/`fr`) when the chain has content for it; otherwise the first locale present in the chain's content (sorted by site-config order, then chain-content order).
- R13. On page mount, if `window.location.hash` matches `#data=<encoded>`, decode (base64url → gzip-inflate via `CompressionStream`) and ingest as if pasted.
- R14. After deep-link ingest, clear the fragment from the URL via `history.replaceState`.
- R15. No oversize handling on the consume side — page accepts any decode-able payload; producer-side fallback to clipboard is out of scope.

**Origin actors:** A1 (External builder), A2 (DTPR maintainer), A3 (DTPR authoring skill — future).
**Origin flows:** F1 (Paste-and-render), F2 (Save and revisit), F3 (Skill deep-link).
**Origin acceptance examples:** AE1 (R3, R4), AE2 (R6), AE3 (R9, R12), AE4 (R10), AE5 (R13, R14), AE6 (R13, R3, R4).

---

## Scope Boundaries

- No "Share" UI affordance — the URL-hash hook is a producer-side seam only; v1 surfaces no UI to encode the current chain into a link.
- No `ResolvedDatachainInstance` ingest path. v1 takes thin `DatachainInstance` only.
- No live split-view editor (Monaco/CodeMirror with debounced re-render). v1 is viewer-only.
- No cross-device collection sync, accounts, or backend persistence. Single-browser localStorage only.
- No authoring affordances inside the page (no element picker, no required-category preflight, no missing-element hints). The page renders what it's given.
- No publishing-skill changes — the deep-link seam is reserved for a future skill, but the skill itself is a separate brainstorm.
- No auth, rate limiting, or abuse handling. The page is a thin client over the existing public API which already carries those concerns.

---

## Context & Research

### Relevant Code and Patterns

- `packages/ui/src/vue/DtprDatachain.vue` — top-level renderer. Props: `sections`, `title`, `description`, `openSectionId` (v-model), `disableAccordion`. Slots: `section-<id>`, `empty`.
- `packages/ui/src/core/build-resolved-sections.ts` — consumes a `ResolvedDatachainInstance` + locale and yields `RenderedSection[]` ready for `DtprDatachain`. Handles snapshot-first / suggested-second resolution and category ordering.
- `packages/ui/src/core/locale.ts` — `extract(values, locale, fallbackLocale='en')` is the canonical fallback chain used internally by `deriveElementDisplay`. The locale-presence walker (U5) reuses this shape.
- `dtpr-ai/app/composables/useDtprState.ts` — exposes `activeLocale`, `DTPR_API_BASE` (`https://api.dtpr.io/api/v2`), `DTPR_FETCH_TIMEOUT_MS` (8000). Reused for default-locale resolution (R12) and API base URL.
- `dtpr-ai/app/pages/taxonomy/index.vue` — reference pattern for a Nuxt page in this app: imports `@dtpr/ui/vue` + `@dtpr/ui/core`, uses `useDtprState`, mounts `DtprElementGrid` inside `DtprCategorySection` slots. Mirror this layering, swapping in `DtprDatachain` for the top-level coordinator.
- `dtpr-ai/app/components/DtprPageHeader.vue` — chrome header used by the taxonomy page. Reused for the visualizer for consistency with the rest of the site (R7).
- `dtpr-ai/content/en/0.taxonomy.md` — pattern for "this content stub exists only so the docus header nav lists the route." A parallel stub for `tools/datachain` lives in U1.
- `api/src/rest/routes.ts:402` (POST `/validate`) and `api/src/rest/routes.ts:461` (POST `/resolve`) — soft-failure envelope: both return HTTP 200 with `{ ok: false, errors }` for Zod parse failures and semantic validator failures. Errors carry `{ code, message, path, fix_hint }`. R6's "unsupported version" maps to the `resolveKnownVersion` 404 response.

### Institutional Learnings

- `ce-learnings-researcher` returned nothing directly applicable in `docs/solutions/`; the closest prior art is the `2026-05-07-001-feat-dtpr-datachain-resolved-form-plan.md` plan which established the `ResolvedDatachainInstance` shape this page consumes.

### External References

- No external research needed. The codebase has strong direct patterns for every layer this plan touches (API client via `useFetch`/`$fetch`, `DtprDatachain` consumer pattern in docs MDC and `taxonomy/index.vue`, `useDtprState` for locale). `CompressionStream` is a stable web standard; no external doc dive required.

---

## Key Technical Decisions

- **Hit the live API for validate and resolve, not a bundled schema.** Confirmed from origin. CORS is open (commit `346d3f06`). The page degrades to "needs network to render," acceptable for a v1 visualizer.
- **Validate before resolve as separate calls.** The API's `/resolve` endpoint already runs the semantic validator internally and returns the same `{ ok: false, errors }` envelope on failure, so a single `/resolve` call is sufficient for the happy path. The plan still calls `/validate` first for the cases when the user submits an invalid blob: surfacing the validate-only result keeps error messaging consistent whether or not the API team ever changes `/resolve`'s short-circuit behavior, and it makes the implementation's intent (R3 then R5) match the code shape.
- **Tools nav as a new top-level docus group** via `dtpr-ai/content/{locale}/X.tools/0.index.md` (stub group landing page) + `dtpr-ai/content/{locale}/X.tools/1.datachain.md` (per-tool nav stub pointing at the Nuxt page route). Mirrors the existing pattern for `0.taxonomy.md`. Sequence prefix chosen to land **Tools** between Plugin (`7.`) and Changelog (`8.`) — final prefix is `7.5.tools/` (or renumbering of `8.changelog`/`9.attribution`/`10.cite` if Docus's numeric collator doesn't accept decimals; verify in U1).
- **Validation error UX: panel adjacent to the textarea**, listing each error's `path`, `message`, and `fix_hint`. The textarea stays a vanilla `<textarea>` — no Monaco/CodeMirror. Confirmed call-out from synthesis. Per-line annotations would require an editor dep; the brainstorm explicitly defers that to v2.
- **Page chrome: standalone-leaning.** Uses `DtprPageHeader` for site identity but omits docus breadcrumbs / left-rail nav so a deep-linked chain feels like landing on the chain itself. Confirmed call-out from synthesis.
- **localStorage shape: a single key `dtpr-ai.datachain-visualizer.collection.v1` holding a JSON array of entries.** Each entry: `{ id, name, savedAt, json }`. Single-key is simpler than per-chain keys for the "tens, not hundreds" volume the origin describes; rename/delete are array mutations, not key migrations. Versioned suffix on the key (`v1`) reserves room for a future shape change without colliding with stale entries.
- **Storage cap policy: refuse with explicit message when the serialized collection would exceed ~4 MB.** Below the ~5 MB localStorage origin cap with margin for other site state. No silent eviction — silent eviction would lose user work without warning, which contradicts the personal-collection contract.
- **Compression for the URL-hash seam: `CompressionStream`/`DecompressionStream` ('gzip').** Web-standard, no dependency. Browsers without it (older Safari) fall through to a clear "this browser cannot decode shared links — paste the JSON instead" message and the page still works for paste input.
- **Pure helpers live in `dtpr-ai/app/utils/`; add Vitest to `dtpr-ai` for them.** The decode helper, locale-presence walker, and collection CRUD are all framework-light and benefit from unit tests. `dtpr-ai` currently has no test runner, so this plan adds Vitest as a dev dep + `pnpm --filter dtpr-ai test` script. The Nuxt page itself is verified manually via the dev server — adding `@vue/test-utils` + Nuxt test harness for a single page is disproportionate cost.
- **Locale-presence walker is plan-local, not promoted into `@dtpr/ui/core`.** It walks a `ResolvedDatachainInstance` looking for `LocaleValue[]` entries and returns the union of `locale` codes seen. Specific to this page; not generally useful to other DTPR consumers. If a second consumer ever needs it, promote then.

---

## Open Questions

### Resolved During Planning

- **localStorage shape** — single key + JSON array (see Key Technical Decisions).
- **Storage cap behavior** — refuse with explicit message above ~4 MB.
- **Validation error UX** — panel adjacent, plain textarea.
- **Page chrome** — standalone-leaning (`DtprPageHeader`, no breadcrumbs).
- **Tools nav placement** — new top-level **Tools** group; per-locale content stub.

### Deferred to Implementation

- **Exact nav sequence prefix for the Tools group.** Need to confirm in U1 whether docus's content collator accepts decimal prefixes (`7.5.`) or whether the existing `8.changelog`, `9.attribution`, `10.cite` files must shift up. Both are mechanical.
- **Locale-presence walker boundary cases.** The brainstorm lists `title`, `description`, element variable labels/values "and any other localized fields." The exact set of `LocaleValue[]` fields in `ResolvedDatachainInstance` is discoverable from `packages/ui/src/core/types.ts` re-exports; the implementer enumerates them when writing U5.
- **Fragment-clear timing.** R14 says "after ingest." Whether to clear before validate (cleaner address bar earlier) or after successful render (preserves deep-link if user navigates away mid-validation) is a UX micro-decision settled during U7.

---

## Output Structure

The visualizer adds a new `tools/` route group, a small cluster of supporting components, helper utilities, and content stubs. The tree below shows the expected output shape; per-unit `**Files:**` sections are authoritative.

    dtpr-ai/
    ├── app/
    │   ├── pages/
    │   │   └── tools/
    │   │       └── datachain.vue                       # page root (U1, U2-U7 wire into it)
    │   ├── components/
    │   │   ├── DatachainVisualizerInput.vue            # paste + file-drop (U2)
    │   │   ├── DatachainVisualizerErrors.vue           # validation error panel (U3)
    │   │   ├── DatachainVisualizerRender.vue           # DtprDatachain wrapper (U4)
    │   │   ├── DatachainVisualizerLocaleSwitcher.vue   # locale chips (U5)
    │   │   └── DatachainVisualizerCollection.vue       # sidebar list + rename/delete (U6)
    │   └── utils/
    │       ├── datachain-visualizer-api.ts             # validate + resolve client (U3)
    │       ├── datachain-visualizer-collection.ts      # localStorage CRUD (U6)
    │       ├── datachain-visualizer-fragment.ts        # gzip+base64url decode (U7)
    │       └── datachain-visualizer-locales.ts         # locale-presence walker (U5)
    ├── content/
    │   ├── en/
    │   │   └── 7.5.tools/                              # exact prefix TBD in U1
    │   │       ├── 0.index.md                          # Tools group landing
    │   │       └── 1.datachain.md                      # nav stub → /tools/datachain
    │   └── fr/
    │       └── 7.5.tools/
    │           ├── 0.index.md
    │           └── 1.datachain.md
    └── test/                                            # new — Vitest entry (U1)
        ├── datachain-visualizer-api.test.ts
        ├── datachain-visualizer-collection.test.ts
        ├── datachain-visualizer-fragment.test.ts
        └── datachain-visualizer-locales.test.ts

---

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```mermaid
flowchart TD
    A[Page mount] --> B{Hash payload?}
    B -- yes --> C[decode gzip+base64url]
    B -- no --> D[Idle: input modes]
    C --> E[Populate textarea]
    D --> E
    E --> F{Submit}
    F --> G[POST /validate :version]
    G -- errors --> H[Render error panel + fix_hints]
    G -- ok --> I[POST /resolve :version]
    I -- errors --> H
    I -- ok --> J[Resolved instance state]
    J --> K[walk locales -> available[]]
    J --> L[buildResolvedSections resolved, activeLocale]
    K --> M[Locale switcher]
    L --> N[DtprDatachain + slots]
    M -- on change --> L
    J --> O[Save -> localStorage v1]
    O --> P[Sidebar list re-renders]
    P -- select entry --> E
```

Page-level reactive state is a small bundle: `inputJson: string`, `parsedInstance: DatachainInstance | null`, `resolvedInstance: ResolvedDatachainInstance | null`, `apiErrors: ApiError[]`, `availableLocales: string[]`, `renderLocale: string`, `collection: Entry[]`. U2-U7 each own one slice; the page composes them.

---

## Implementation Units

### U1. Page scaffold, route, nav stub, Vitest setup

**Goal:** Land a reachable `/[locale]/tools/datachain` route with a placeholder body, register the new **Tools** group in the docus header nav, and add Vitest to `dtpr-ai` so subsequent units can ship with tests.

**Requirements:** R1.

**Dependencies:** None.

**Files:**
- Create: `dtpr-ai/app/pages/tools/datachain.vue`
- Create: `dtpr-ai/content/en/<prefix>.tools/0.index.md`
- Create: `dtpr-ai/content/en/<prefix>.tools/1.datachain.md`
- Create: `dtpr-ai/content/fr/<prefix>.tools/0.index.md`
- Create: `dtpr-ai/content/fr/<prefix>.tools/1.datachain.md`
- Modify: `dtpr-ai/package.json` (add `vitest`, `@vue/test-utils`, `happy-dom` or `jsdom` as devDeps; add `test` script)
- Create: `dtpr-ai/vitest.config.ts`
- Create: `dtpr-ai/test/.gitkeep` (Vitest entry directory)

**Approach:**
- Page is a minimal `<script setup>` SFC that renders `DtprPageHeader` + an empty container. Subsequent units replace the container body. Use `useHead({ title: 'Datachain visualizer' })` per the taxonomy page pattern.
- The new content folder uses a sequence prefix that lands **Tools** between Plugin and Changelog. First try `7.5.tools/`. If Docus's nav collator rejects the decimal, renumber existing `content/en/8.changelog.md`, `content/en/9.attribution.md`, `content/en/10.cite.md` up to `9.`, `10.`, `11.`, and rename `content/fr/10.cite.md` to `content/fr/11.cite.md` to keep the locale folders ordered consistently. Use `8.tools/` for the new group in both locales.
- Both stub files (`0.index.md`, `1.datachain.md`) mirror `0.taxonomy.md`'s frontmatter exactly — `navigation: false` for the page-rendered route (the .vue file owns the body) and a `seo` block for the Tools landing.
- French stubs carry placeholder French copy in the title/description; the page itself doesn't need translated body text in v1 (the body is purely controls).
- Vitest config keeps it framework-light: a `vue` + `jsdom` env, `pool: 'forks'`, glob `test/**/*.test.ts`. Mirrors `packages/ui/vitest.config.ts` minus Vue-specific helpers we won't need.

**Patterns to follow:**
- `dtpr-ai/content/en/0.taxonomy.md` for stub frontmatter.
- `dtpr-ai/app/pages/taxonomy/index.vue` for page-shell shape (DtprPageHeader, useHead, layout wrapper).
- `packages/ui/vitest.config.ts` for Vitest config shape.

**Test scenarios:**
- Test expectation: none — this unit is scaffolding and config. Verification is via the dev server and Vitest's own self-check (`pnpm --filter dtpr-ai test --run` exits 0 with no test files).

**Verification:**
- `pnpm --filter dtpr-ai dev` serves `/en/tools/datachain` and `/fr/tools/datachain` with a header but no rendered chain.
- The docus header nav lists **Tools** between Plugin and Changelog (or wherever the chosen prefix lands it).
- `pnpm --filter dtpr-ai test --run` exits 0.

---

### U2. JSON input modes (paste + file drop)

**Goal:** Two input modes that converge on a single `inputJson: string` reactive state and emit a `submit` event with the current value.

**Requirements:** R2.

**Dependencies:** U1.

**Files:**
- Create: `dtpr-ai/app/components/DatachainVisualizerInput.vue`
- Modify: `dtpr-ai/app/pages/tools/datachain.vue` (mount the new component, hold its state)

**Approach:**
- A `<textarea>` bound to `v-model:json` (controlled by the parent page).
- A drop zone overlaying the textarea (`@dragover.prevent`, `@drop.prevent`) accepting one `.json` file at a time. On drop, read via `FileReader.readAsText` and write into the same model. A hidden `<input type="file" accept=".json">` triggered by a visible button gives the file-pick mode.
- A "Render" button (or Cmd/Ctrl-Enter shortcut) emits `submit`. No client-side JSON parse here — let the API's Zod parse own that, per the soft-failure envelope.
- File-pick UI does not auto-submit on selection; the user reviews the loaded content first.

**Patterns to follow:**
- Standard Nuxt UI / `@nuxt/ui` form primitives (`UButton`, `UTextarea`) where they fit the visual language of the rest of `dtpr-ai`.

**Test scenarios:**
- Happy path: emitting `update:json` when the textarea receives input updates the parent's model.
- Happy path: dropping a `.json` blob fires `update:json` with the file's text content.
- Edge case: dropping a non-`.json` file is rejected silently (no model update; surface a small inline message).
- Edge case: dropping a `.json` file larger than ~2 MB still loads (the limit lives at validate-time, not input-time).
- Integration: `submit` event is emitted with the current model value, not a stale one.

**Verification:**
- Manual: dev server, paste a valid JSON → submit fires; drop a JSON file → textarea fills; click Render → submit fires with that content.

---

### U3. Validate-and-resolve API pipeline + error display

**Goal:** Take an `inputJson` string, run `/validate` then `/resolve` against the API, and produce either an `ApiError[]` or a `ResolvedDatachainInstance`. Render errors in an adjacent panel with `fix_hint` per entry.

**Requirements:** R3, R4, R5, R6.

**Dependencies:** U2.

**Files:**
- Create: `dtpr-ai/app/utils/datachain-visualizer-api.ts`
- Create: `dtpr-ai/app/components/DatachainVisualizerErrors.vue`
- Modify: `dtpr-ai/app/pages/tools/datachain.vue` (orchestrate submit → API → error/render state)
- Create: `dtpr-ai/test/datachain-visualizer-api.test.ts`

**Approach:**
- `datachain-visualizer-api.ts` exports a single function (call it `validateAndResolve(jsonText: string)`) that:
  1. JSON-parses locally just enough to read `schema_version` (no shape validation). If JSON.parse throws, return a synthetic `ApiError[]` with `code: 'invalid_json'` and a generic `fix_hint` so the error UI is uniform.
  2. POSTs to `${DTPR_API_BASE}/schemas/${encodeURIComponent(schema_version)}/validate`. If the response is `{ ok: false, errors }`, return those errors. If the response is a 404, return an `ApiError[]` with `code: 'unsupported_schema_version'` and the requested version surfaced in the message (covers R6).
  3. POSTs to the same version's `/resolve`. Same envelope handling. Returns the `ResolvedDatachainInstance` on success.
- `DatachainVisualizerErrors.vue` renders the `ApiError[]` as a list: error count header, then per-error `{ path }` + `{ message }` + `{ fix_hint }`. Mounted only when `errors.length > 0`.
- Page-level orchestration: clicking submit sets a `loading` flag, calls `validateAndResolve`, branches on the result. On error, populate the errors panel and clear `resolvedInstance`. On success, clear errors and stash `resolvedInstance`.

**Patterns to follow:**
- `api/src/rest/routes.ts:402` for the validate envelope shape and `api/src/rest/routes.ts:461` for resolve. Both use `{ ok, errors[], warnings? }` on failure.
- `dtpr-ai/app/composables/useDtprState.ts` for `DTPR_API_BASE` and `DTPR_FETCH_TIMEOUT_MS`.

**Test scenarios:**
- Happy path: input with valid `schema_version` and well-formed body returns the resolved instance (mock `fetch` to return `{ ok: true, ... }` envelopes for both calls; assert the resolved payload threads through).
- Happy path: validate succeeds → resolve is called with the same JSON body and version path.
- Error path: malformed JSON (`{`) returns a synthetic `ApiError` with `code: 'invalid_json'` without hitting `fetch`.
- Error path: validate returns `{ ok: false, errors: [{ code: 'parse_error', path: 'elements.0.id', message, fix_hint }] }` → function returns those errors, resolve is NOT called.
- Error path: 404 on `/validate` for an unknown schema version returns `code: 'unsupported_schema_version'` with the version name in the message. Covers AE2.
- Error path: 404 on `/resolve` after `/validate` succeeded (improbable but possible if the schema is retired between calls) returns the same `unsupported_schema_version` shape.
- Error path: network failure (fetch rejects) returns a single `ApiError` with `code: 'network_error'` and a generic `fix_hint`.
- Integration (component): `DatachainVisualizerErrors.vue` mounted with two errors renders both, each with its `fix_hint`. Covers AE1.

**Verification:**
- Manual: paste known-bad JSON → errors panel shows expected fix_hints. Paste known-good JSON → no errors, `resolvedInstance` is set in devtools.

---

### U4. Render pipeline via `DtprDatachain`

**Goal:** Given a `ResolvedDatachainInstance` and a `locale`, render the chain through `buildResolvedSections` + `DtprDatachain`. Wire one-section-open-at-a-time accordion + an expand-all toggle.

**Requirements:** R5, R7, R8.

**Dependencies:** U3.

**Files:**
- Create: `dtpr-ai/app/components/DatachainVisualizerRender.vue`
- Modify: `dtpr-ai/app/pages/tools/datachain.vue` (mount the render component when `resolvedInstance` is non-null)

**Approach:**
- Component props: `resolved: ResolvedDatachainInstance`, `locale: string`.
- A computed `sections = buildResolvedSections(resolved, locale)` produces the `RenderedSection[]`.
- `DtprDatachain` receives `sections`, the locale-resolved `title` and `description` from `resolved.instance` via `extract(...)`, and either `openSectionId` (default: first section's `id`) or `disableAccordion: true` based on a local `expandAll` toggle.
- Per-section slots iterate the section's `elements` and render each via `DtprElementGrid` + `DtprElementDetail` — same shape as the UI quickstart in `dtpr-ai/content/en/5.ui/2.vue.md`.
- An "Expand all" / "Collapse" control above the chain toggles `disableAccordion`.

**Patterns to follow:**
- `dtpr-ai/content/en/5.ui/2.vue.md:184-222` — the documented `DtprDatachain` integration example.
- `packages/ui/src/core/build-resolved-sections.ts` exports — confirms section ordering and proposed/provenance handling are handled inside the helper (the page does not re-implement either).

**Test scenarios:**
- Test expectation: none for `buildResolvedSections` itself — covered by `packages/ui/src/core/build-resolved-sections.test.ts`. Component-level Vue mount tests in `dtpr-ai` are out of scope (no Nuxt test harness installed; cost-disproportionate).
- Verification is by manual render in the dev server against a known-good fixture.

**Verification:**
- Manual: paste a known-good chain → rendered output matches what `hp-app` or a docs MDC `DtprDatachain` embed produces for the same JSON.
- One section open by default; clicking another section closes the first.
- "Expand all" opens every section; toggling back restores accordion behavior.

---

### U5. Locale switcher driven by chain content

**Goal:** Enumerate every locale the chain's content carries (across title, description, element labels, variable labels, variable values, context value names), present them as a chip row above the rendered chain, and let the user switch render locale without re-fetching.

**Requirements:** R9, R12.

**Dependencies:** U4.

**Files:**
- Create: `dtpr-ai/app/utils/datachain-visualizer-locales.ts`
- Create: `dtpr-ai/app/components/DatachainVisualizerLocaleSwitcher.vue`
- Modify: `dtpr-ai/app/pages/tools/datachain.vue` (default locale resolution; thread `renderLocale` into render component)
- Create: `dtpr-ai/test/datachain-visualizer-locales.test.ts`

**Approach:**
- `datachain-visualizer-locales.ts` exports `collectPresentLocales(resolved: ResolvedDatachainInstance): string[]`. Implementation walks every `LocaleValue[]` field reachable from the resolved instance — at minimum: `instance.title`, `instance.description`, each `schema_snapshot.elements[].title`/`.description`, each `variables[].label`, each `categories[].name`/`.description`, each `element_context.values[].name`. Returns the union of `locale` codes, deduplicated, in a stable order.
- Default locale resolution at page level: take `useDtprState().activeLocale.value`. If it's in `collectPresentLocales(resolved)`, use it (R12). Otherwise pick the first entry from the present list.
- Switcher component: a chip row labeled "Locale", chips highlighted when active, emits `update:locale` on click. Switching mutates the `renderLocale` page state; `DatachainVisualizerRender`'s computed `sections` recomputes via Vue reactivity — no refetch.

**Patterns to follow:**
- `packages/ui/src/core/locale.ts` for the `LocaleValue` shape (each is `{ locale, value }`).
- `dtpr-ai/app/components/DtprPlayground.vue:53-67` for a similar chip-row UI pattern.

**Test scenarios:**
- Happy path: a `ResolvedDatachainInstance` with `title` in `en` and `fr` and element labels in `en` only returns `['en', 'fr']`.
- Happy path: ordering is stable across calls (sort by site-config locale order first, then alphabetic, so the switcher row doesn't shuffle).
- Edge case: empty `LocaleValue[]` arrays are skipped; an entry with `locale: 'en'` and `value: ''` still counts.
- Edge case: a chain with no locale strings anywhere returns `['en']` (the canonical default) so the switcher is never empty.
- Integration (default-locale resolution test): given a chain present in `en` + `fr` and `activeLocale = 'fr'`, the page initializes `renderLocale` to `'fr'`. Given the same chain and `activeLocale = 'es'` (not present), it picks `'en'` (first present). Covers AE3.

**Verification:**
- Manual: load a chain with mixed-locale content, confirm switcher only shows present locales, and switching `fr → en` re-renders without a network call.

---

### U6. localStorage personal collection

**Goal:** Save, list, rename, and delete personal-collection entries on the same page. Sidebar shows the saved list; clicking re-renders an entry. Storage cap enforced.

**Requirements:** R10, R11.

**Dependencies:** U4 (need a successful render before save makes sense).

**Files:**
- Create: `dtpr-ai/app/utils/datachain-visualizer-collection.ts`
- Create: `dtpr-ai/app/components/DatachainVisualizerCollection.vue`
- Modify: `dtpr-ai/app/pages/tools/datachain.vue` (mount sidebar; wire save action; on entry-click, load entry's JSON into the page state and re-run the validate/resolve pipeline from U3)
- Create: `dtpr-ai/test/datachain-visualizer-collection.test.ts`

**Approach:**
- Module exports `loadCollection()`, `saveEntry({ name, json })`, `renameEntry(id, name)`, `deleteEntry(id)`. Storage key: `dtpr-ai.datachain-visualizer.collection.v1`. Value: `{ entries: Entry[], schemaVersion: 1 }`. Each `Entry`: `{ id, name, savedAt, json }`. `id` is a `crypto.randomUUID()`.
- Default `name`: locale-resolved `instance.title` extracted in the active site locale (`extract(...)`), falling back to `instance.id` if title is empty. The user can override via the rename action.
- Size cap: before write, serialize the next state and check byte length against `4 * 1024 * 1024`. Over → throw a typed `CollectionFullError`; page handles by surfacing a clear message and leaving prior state intact.
- Sidebar: list of entries sorted `savedAt` desc, each row with the entry name, a click target (loads the entry), and a per-row menu (rename, delete with confirm).
- Clicking an entry rehydrates the textarea (U2's model) with the stored JSON and re-runs the U3 pipeline. This guarantees re-rendered entries are validated against the API's current schema state, which catches the case where a saved entry pins a now-retired `schema_version` (R6 path triggers naturally).

**Patterns to follow:**
- No prior localStorage helper in `dtpr-ai`; the module sets the local pattern. Use `try/catch` around every `window.localStorage` access — SSR (`nuxt build`) executes `<script setup>` server-side and `window` is undefined there.

**Test scenarios:**
- Happy path: `saveEntry` writes a new entry; subsequent `loadCollection` returns it.
- Happy path: `renameEntry` updates only the named entry's `name`; other entries unchanged.
- Happy path: `deleteEntry` removes only the named entry.
- Edge case: `loadCollection` on a fresh origin (no key) returns `{ entries: [], schemaVersion: 1 }`.
- Edge case: `loadCollection` when the stored value is corrupt JSON returns the empty state and does not throw (logs once to console for debuggability).
- Edge case: `loadCollection` when `schemaVersion` is unknown returns the empty state (forward-compat — never crash on a v2-written key).
- Error path: `saveEntry` when the resulting blob exceeds 4 MB throws `CollectionFullError`; the prior stored state is unchanged.
- Error path: `saveEntry` when `window.localStorage` access throws (private-mode Safari, disabled storage) surfaces a `CollectionUnavailableError`; the caller can fall back to a one-shot UI message.
- Integration: after `saveEntry` + page reload (simulated via re-running `loadCollection`), the entry round-trips with byte-for-byte JSON identity. Covers AE4.

**Verification:**
- Manual: save a chain, reload the page, confirm sidebar lists it. Rename and delete work. Click an entry → page re-renders that chain.

---

### U7. URL-hash deep-link decode (gzip + base64url)

**Goal:** On mount, if `window.location.hash` matches `#data=<encoded>`, decode (base64url → gzip-inflate) and ingest as if the user pasted that JSON, running the U3 pipeline immediately. Clear the fragment after ingest.

**Requirements:** R13, R14, R15.

**Dependencies:** U2, U3 (ingest paths), U4 (render path).

**Files:**
- Create: `dtpr-ai/app/utils/datachain-visualizer-fragment.ts`
- Modify: `dtpr-ai/app/pages/tools/datachain.vue` (call decode on `onMounted`; thread result into the same submit path U3 uses)
- Create: `dtpr-ai/test/datachain-visualizer-fragment.test.ts`

**Approach:**
- Module exports `decodeFragment(hash: string): Promise<string | null>`. Returns `null` when the hash does not contain a `data=` key. Otherwise:
  1. Strip the leading `#`, split on `&`, find the `data=` param, base64url-decode to bytes.
  2. Feed the bytes through `new DecompressionStream('gzip')` via `ReadableStream` and collect the result as UTF-8 text.
  3. Return the decoded text.
- If `DecompressionStream` is unavailable (older Safari), throw a typed `FragmentUnsupportedError`. Page catches this and surfaces an inline notice: "Your browser cannot expand shared datachain links. Paste the JSON directly to render."
- If decode succeeds, the page writes the result into the `inputJson` model (same surface U2 owns) and dispatches the same `submit` action U3 wires. Validation errors flow through the same error panel — there is no separate deep-link error UX (covers AE6).
- After ingest (whether validate-and-resolve succeeded or failed), call `history.replaceState(null, '', window.location.pathname + window.location.search)`. Settled before U3's API calls return — the encoded blob should not linger in the URL during validation. (Deferred decision noted in Open Questions: clear-before-validate vs clear-after-render. Plan picks clear-before.)
- SSR safety: gate the whole hook on `import.meta.client` so `window.location` is never touched during `nuxt build`.

**Patterns to follow:**
- Web platform `DecompressionStream` API — no library dep. Modern docs are on MDN.

**Test scenarios:**
- Happy path: a fragment built by gzipping a known JSON string and base64url-encoding decodes to the original string byte-for-byte.
- Happy path: a fragment without a `data=` key returns `null`.
- Happy path: a fragment with `data=` and extra params (`&foo=bar`) still decodes the `data=` value.
- Edge case: empty `data=` returns `null` (treated as no payload, not as an empty-string error).
- Edge case: base64url payload using `-`/`_` instead of `+`/`/` decodes correctly.
- Error path: malformed base64url (non-alphabet character) rejects with a typed error; the page surfaces the same "cannot expand" message as the no-`DecompressionStream` case.
- Error path: valid base64url that does not gzip-decompress rejects with the same typed error.
- Error path: `DecompressionStream` is not available in the runtime → throws `FragmentUnsupportedError`. (Test by stubbing `globalThis.DecompressionStream` to `undefined`.)
- Integration: when the page mounts with a valid `#data=` fragment, the input model is populated and the U3 pipeline runs once. Covers AE5.
- Integration: when the page mounts with a `#data=` fragment whose decoded JSON fails validation, the error panel renders the validation errors and the paste area shows the decoded JSON for editing. Covers AE6.

**Verification:**
- Manual: construct a deep-link by encoding a known-good chain via a small Node REPL using the same `CompressionStream` shape, open the URL → page renders without paste; the address bar shows no fragment after ingest.

---

## System-Wide Impact

- **Interaction graph:** New page is a leaf — no other dtpr-ai routes depend on it. The shared `useDtprState` composable is read-only from this page.
- **Error propagation:** Three failure surfaces (API errors, fragment-decode errors, localStorage errors) all funnel into either the validation error panel or a single inline notice. No silent failures.
- **State lifecycle risks:** `localStorage` writes are synchronous and small enough that a half-written entry is not a practical concern. The 4 MB cap is checked *before* write so a too-large save does not corrupt the prior state.
- **API surface parity:** None. The page consumes the existing public API; no new endpoints, no shape changes.
- **Integration coverage:** The page-level integration of U2 → U3 → U4 (paste → validate → resolve → render) is verified manually in the dev server. Unit tests cover the seams (decode helper, locale walker, collection module, API client).
- **Unchanged invariants:** `@dtpr/ui/vue` and `@dtpr/ui/core` are consumed unmodified — no fork, no patched build. `useDtprState` is unchanged.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Docus nav collator rejects decimal prefixes (`7.5.tools/`) and the section misorders. | U1 verifies in dev; if rejected, renumber `content/en/8`-`10` and `content/fr/10` files up one (the fr folder currently only carries `10.cite.md`) and use `8.tools/` in both locales. Mechanical and contained. |
| Saved entries pin a `schema_version` that the API later retires. | Loading an entry re-runs validate; R6's "unsupported version" message fires naturally. The entry remains in the sidebar; the user can delete it. |
| Private-mode Safari throws on `localStorage` access. | `loadCollection`/`saveEntry` surface a typed error; the page shows a one-time notice and continues working without the collection. |
| Older Safari without `DecompressionStream` cannot expand deep links. | The decoder throws a typed error; the page surfaces "paste JSON instead" and keeps full paste support. Brainstorm's R15 / Dependencies entry already accepts this degradation. |
| Adding Vitest to `dtpr-ai` bloats the dev install. | Vitest + happy-dom is small; restricted to devDeps; CI cost is one additional `pnpm --filter dtpr-ai test --run`. |

---

## Documentation / Operational Notes

- The new **Tools** group landing (`content/{locale}/<prefix>.tools/0.index.md`) gets a short paragraph describing the section's purpose and a card linking to the datachain visualizer. Mirrors the home page's card-group pattern.
- Add a one-line cross-link from the UI Quickstart (`content/en/1.getting-started/3.ui-quickstart.md`) and the Vue page (`content/en/5.ui/2.vue.md`): "Want to preview a chain without setting up a project? Use the [Datachain visualizer](/tools/datachain)."
- No rollout, monitoring, or migration concerns. The page is a pure client.

---

## Sources & References

- **Origin document:** `docs/brainstorms/2026-05-15-dtpr-ai-datachain-visualizer-brainstorm.md`
- Related plan: `docs/plans/2026-05-07-001-feat-dtpr-datachain-resolved-form-plan.md` (defines the `ResolvedDatachainInstance` shape this page consumes).
- Related code:
  - `packages/ui/src/vue/DtprDatachain.vue`
  - `packages/ui/src/core/build-resolved-sections.ts`
  - `packages/ui/src/core/locale.ts`
  - `dtpr-ai/app/composables/useDtprState.ts`
  - `dtpr-ai/app/pages/taxonomy/index.vue`
  - `api/src/rest/routes.ts` (`/validate`, `/resolve` handlers)
- Related commit: `346d3f06` (CORS opened to public for all routes).
