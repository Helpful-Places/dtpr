---
date: 2026-05-15
topic: dtpr-ai-datachain-visualizer
---

# DTPR AI Datachain Visualizer

## Summary

A browser-only page in `dtpr-ai` at `/[locale]/tools/datachain` where a builder pastes or drops a `DatachainInstance` JSON and sees it rendered through `DtprDatachain` from `@dtpr/ui/vue`. Validation and resolution route through the existing public-CORS DTPR API; a localStorage-backed personal list lets revisits resume saved chains. v1 is a viewer; the page reserves a URL-hash hook so a future skill flow can deep-link a chain into the page with no new infrastructure.

---

## Problem Frame

DTPR for AI publishes a thin `DatachainInstance` schema and a Vue renderer (`DtprDatachain`) — but the only way to see one rendered today is to embed it in a docs MDC content page and run the Nuxt dev server, or to wire it up in a downstream consumer like `hp-app`. Neither is reachable for someone who has just produced a JSON disclosure (e.g., from the `dtpr-describe-system` skill) and wants to confirm it looks right before publishing or sharing it.

Two pains compound. First, builders attempting DTPR adoption have no low-friction "does my JSON render" loop — the schema, the API, and the renderer are all production-grade, but a stranger evaluating DTPR meets none of them as a working artifact. The maintainer can preview a chain by hand-editing docs site fixtures, but external builders cannot. Second, the DTPR authoring skills produce JSON in chat, and the user's only path to seeing it rendered today is to copy the blob, set up a local environment, and wire it up — high enough friction that the skill's value gets capped at "JSON I trust without seeing."

The cost shape is adoption-shaped: every prospective DTPR builder who can't get to a rendered preview in their browser within a minute of producing JSON is a cohort that doesn't try DTPR a second time.

---

## Actors

- A1. **External builder** — a DPO, transparency lead, civic technologist, or product person evaluating or adopting DTPR for AI. May have produced their JSON by hand, by tooling, or via a DTPR skill in another tab. Wants confidence the JSON renders well before they ship anything.
- A2. **DTPR maintainer** — Helpful Places / DTPR steward iterating on schema, elements, or skill output. Uses the page as a fast feedback loop on authoring changes.
- A3. **DTPR authoring skill** (future) — `dtpr-describe-system` or a sibling publishing skill. Produces a `DatachainInstance` JSON and wants to hand the user a deep link that opens the rendered preview directly.

---

## Key Flows

- F1. **Paste-and-render (primary)**
  - **Trigger:** A1 or A2 lands on `/[locale]/tools/datachain` with a `DatachainInstance` JSON in clipboard or as a file.
  - **Actors:** A1, A2
  - **Steps:** Paste JSON into the input area (or drop a `.json` file). Page validates against the pinned `schema_version` via the API. On success, page resolves the chain via the API and hands the resolved sections to `DtprDatachain` for render. Locale switcher offers each locale the chain's content actually carries.
  - **Outcome:** Rendered datachain visible on the page; raw JSON still accessible (toggle or panel) for the builder to copy back.
  - **Covered by:** R1, R2, R3, R5, R6, R7, R8, R9, R12

- F2. **Save and revisit**
  - **Trigger:** After a successful render, A1 or A2 clicks a "Save to my collection" affordance.
  - **Actors:** A1, A2
  - **Steps:** Page derives a default name from the chain's `title` (with fallback to `id`) and writes the JSON to localStorage under a stable key. Returning to the page lists saved chains; selecting one re-renders it without re-pasting.
  - **Outcome:** Personal collection accrues across visits in this browser; user can rename or delete entries.
  - **Covered by:** R10, R11

- F3. **Skill deep-link (future seam, not a v1 user flow)**
  - **Trigger:** A3 produces a `DatachainInstance` JSON and instructs the user to open a URL of the form `https://dtpr.ai/<locale>/tools/datachain#data=<gzip+base64url>`.
  - **Actors:** A3 → A1 / A2
  - **Steps:** Page reads the URL fragment on mount, decodes and decompresses, populates the input as if pasted, runs F1's validate-and-render path. Fragment is cleared from the URL after ingest so the address bar isn't carrying a long blob.
  - **Outcome:** Rendered chain appears immediately on page load; the skill flow becomes a single-click handoff with no new backend.
  - **Covered by:** R13, R14

---

## Requirements

**Page surface and entry**

- R1. The page is reachable at `/[locale]/tools/datachain` for every locale the dtpr-ai site routes (currently `en`, `fr`). It is linked from the main site navigation under a "Tools" group.
- R2. The page accepts a `DatachainInstance` JSON via two input modes: paste into a text area, and drop or file-pick a `.json` file. Both modes converge on the same validation-and-render pipeline.

**Validation and resolution**

- R3. When the user submits a JSON blob, the page validates it against the schema version named in the JSON's `schema_version` field by calling the existing public DTPR API validate endpoint.
- R4. When validation fails, the page surfaces each error inline, including the `fix_hint` returned by the API, in a panel adjacent to the input. The raw JSON remains visible and editable (in the paste area) so the user can correct in place and resubmit.
- R5. When validation succeeds, the page resolves the thin instance into the renderable form via the existing public DTPR API resolve endpoint, then hands the resolved sections to `DtprDatachain`.
- R6. When the JSON pins a `schema_version` the API no longer serves, the page surfaces a clear error naming the unsupported version (rather than a generic API failure).

**Render**

- R7. The rendered output uses `DtprDatachain` from `@dtpr/ui/vue` and matches the visual treatment used elsewhere on `dtpr-ai` (no bespoke fork of the renderer).
- R8. The rendered output preserves accordion behavior: one section open at a time by default, with a control to expand all.

**Locale**

- R9. A locale switcher above the rendered output lists every locale for which the chain's content carries at least one localized string (across `title`, `description`, element variables, and any other localized fields). Switching re-renders without re-fetching.
- R12. The default locale on first render is the active site locale (`en` or `fr`) when the chain has content for it; otherwise the first locale present in the chain's content.

**localStorage collection**

- R10. After a successful render, a "Save to my collection" affordance lets the user persist the JSON locally. Saved entries appear in a sidebar or list on the same page; selecting one re-renders it. The user can rename and delete entries. There is no cross-device sync.
- R11. localStorage entries survive browser refresh and are namespaced per origin (so `dtpr.ai` collection is independent from any local-dev origin).

**URL-hash deep-link seam**

- R13. On page mount, if the URL fragment contains a recognized payload key (e.g. `#data=...`), the page decodes (gzip + base64url) and ingests it as if pasted, immediately running the validate-and-render pipeline.
- R14. After ingest, the page clears the fragment from the URL so the visible address bar does not carry the encoded blob.
- R15. When the encoded payload exceeds a safe URL-fragment threshold (heuristic for browser address-bar reliability), the producer (skill or other tool) is expected to fall back to clipboard handoff. The page accepts pasted JSON identically — there is no separate "oversize" code path on the consume side.

---

## Acceptance Examples

- AE1. **Covers R3, R4.** Given the user has pasted a JSON missing a required field on one element, when they click "Render," the page surfaces the validation errors with their `fix_hint`s next to the input, the input retains the pasted JSON, and no render is shown.
- AE2. **Covers R6.** Given the user pastes a JSON with `schema_version: "ai@2025-12-01-beta"` and that version has been retired from the API, when they click "Render," the page shows a message naming the unsupported version rather than a generic 404 or network error.
- AE3. **Covers R9, R12.** Given a chain whose `title` carries `en` and `fr` entries but whose element variables only carry `en`, when the page renders, the locale switcher offers `en` and `fr`, the default is the active site locale, and switching to `fr` re-renders the title in French while elements fall back to `en` content per the renderer's existing locale fallback.
- AE4. **Covers R10.** Given the user has saved three chains across two prior visits, when they revisit the page, the sidebar lists the three chains by their saved names, and clicking one re-renders it without requiring re-paste.
- AE5. **Covers R13, R14.** Given the user opens `https://dtpr.ai/en/tools/datachain#data=<encoded>` and the encoded payload decodes to a valid `DatachainInstance`, when the page mounts, the chain renders immediately, and the address bar shows `/en/tools/datachain` with no fragment.
- AE6. **Covers R13, R3, R4.** Given the user opens a deep-link URL whose decoded JSON fails validation, when the page mounts, the page surfaces the validation errors as in AE1 (the deep-link path uses the same error UI as paste), and the decoded JSON is shown in the paste area for in-place correction.

---

## Success Criteria

- A first-time external builder who arrives at the page with a `DatachainInstance` JSON in clipboard sees a rendered chain within one paste-and-click. If the JSON is invalid, the error UI is concrete enough that they can locate and correct the issue without leaving the page.
- A DTPR maintainer iterating on the `dtpr-describe-system` skill can produce JSON in one tab, paste it in another, and assess the rendered output without spinning up a local environment.
- A future skill upgrade can deep-link a chain into the page (`#data=...`) by changing only the skill — the page already accepts the format and the backend already serves the validate/resolve endpoints, so no new infrastructure is required.

---

## Scope Boundaries

- Shareable URL as a user-facing feature (no "Share" button, no UI affordance to encode the current chain into a link). The URL-hash hook exists as a producer-side seam only; v1 surfaces no UI for it.
- Accepting `ResolvedDatachain` input. v1 takes thin `DatachainInstance` only — the shape `dtpr-describe-system` currently produces. Resolved-form ingestion is a natural follow-up once consumers start shipping resolved snapshots.
- Live split-view editor (Monaco/CodeMirror on the left, live re-render on the right with debounced edits). v1 is viewer-only; this is a v2 mode toggle on the same page.
- Cross-device collection sync, named accounts, or any backend persistence. The "no external database" constraint is structural, not a deferral.
- Authoring affordances inside the page: no element picker, no category coverage hints, no "this required category is missing" preflight. The page renders what it's given.
- Designing the publishing skill itself (`dtpr-describe-system` upgrade or a new sibling). v1 reserves the deep-link seam; the skill that uses it is a separate brainstorm.
- Authentication, rate limiting, abuse prevention. The page is a thin client over the existing public API, which already carries those concerns.

---

## Key Decisions

- **Hit the live API for validate and resolve, rather than bundling the schema in the client.** The validate and resolve endpoints are already public, CORS is already open, and the schema evolves independently of the page — bundling would couple the page's deploy cadence to the schema and add ~hundreds of KB to the client. The page's offline behavior degrades to "needs network to render," which is acceptable for a v1 visualizer.
- **Viewer over editor for v1.** The skill-handoff flow only needs viewing, and the editor frame (live re-render, error-line mapping, unsaved-changes model) is materially more work. v2 can add a split-view mode toggle on the same page.
- **URL hash seam with gzip + base64url, not plain base64.** Realistic chains compress 4-6× (repeated locale codes, element ids, schema versions). Without compression, a heavily localized chain could approach browser address-bar limits; with compression, the seam handles every realistic chain comfortably.
- **The deep-link seam ships in v1 even though no skill uses it yet.** Building the consume-side later is the same work, but landing it now means the future skill upgrade is a one-sided change. The seam is invisible to users when no fragment is present.
- **localStorage collection is on the same page, not a separate "my collection" route.** Saved chains are a sidebar context for the page's primary action (visualize), not a destination of their own.
- **Locale switcher is driven by the chain's content, not by the schema's manifest allow-list.** The manifest declares what's *permitted*; the chain's content declares what's *present*. Offering locales that resolve to empty fallbacks would be misleading.

---

## Dependencies / Assumptions

- The existing DTPR REST API exposes validate and resolve operations against pinned schema versions, with public CORS open to the dtpr.ai origin (verified — see commit `346d3f06 feat(api): open CORS to public for all routes`).
- The `@dtpr/ui/vue` package's `DtprDatachain` component, plus the resolution-to-sections helper in `@dtpr/ui/core`, are stable enough to consume from the dtpr-ai app without local forking. (Today's `dtpr-ai` already consumes `@dtpr/ui` via workspace dependency.)
- The existing `useDtprState` composable in `dtpr-ai/app/composables/` provides the active site locale; the visualizer reuses it for R12's default-locale resolution.
- Modern browsers with `CompressionStream` API support are the target. Browsers without it (older Safari versions) lose the URL-hash seam but can still paste JSON. This degradation is acceptable for a v1 builder tool.
- The prior brainstorm `docs/brainstorms/2026-05-07-dtpr-datachain-instance-resolved-form-brainstorm.md` defines `ResolvedDatachain` as the portable resolved shape. This page consumes resolved output from the API but does not need to know the type; it only needs the renderable sections.

---

## Outstanding Questions

### Resolve Before Planning

(none — all product-level decisions resolved during brainstorm)

### Deferred to Planning

- [Affects R1][User decision] Does the "Tools" nav group already exist in `dtpr-ai`'s docs nav, or does this page introduce it? If it introduces the group, what other tools (existing or planned) sit beside it? (Affects whether the nav change is one entry or a new section.)
- [Affects R10][Technical] Exact localStorage shape — single key holding a list, or one key per chain. Tradeoff is delete/rename ergonomics vs scan cost. Pick during planning based on expected collection sizes (likely tens, not hundreds).
- [Affects R10][User decision] Storage cap and overflow behavior. localStorage is ~5MB per origin; a typical chain is small but a builder testing many revisions could fill it. Options: silent LRU eviction, soft warning at threshold, or no-cap-just-fail. Resolve during planning unless it changes scope.
- [Affects R4][Needs design] Validation error UX wording and grouping. The API returns structured errors with `fix_hint`s; the question is how to present them (per-error inline at the JSON line, summary panel, both). Defer to planning + a quick design pass on real failure cases from the skill output.
- [Affects R13][Technical] URL-fragment payload size threshold for the "fall back to clipboard" producer-side guidance. Best determined empirically against real chains; the page itself has no upper limit on what it'll attempt to decode.
- [Affects R7][Needs research] Whether the rendered output should match the existing taxonomy-page chrome (header, breadcrumbs) or be more standalone (so a deep-link feels like landing on the chain itself, not on a docs page). Resolve with a quick design pass before planning hands off.
