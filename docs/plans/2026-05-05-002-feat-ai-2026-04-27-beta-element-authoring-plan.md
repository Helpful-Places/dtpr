---
title: "feat: ai@2026-04-27-beta deferred element authoring"
type: feat
status: active
date: 2026-05-05
origin: PR #274 (7c9b930) — commit message defers element-level authoring to subsequent dtpr-element-design / dtpr-category-audit passes
---

# feat: ai@2026-04-27-beta deferred element authoring

Tracks the follow-up element-authoring work that PR #274 ("v2 schema reshape — Element.context, subchains, PII, AIAAIC research") explicitly deferred. PR #274 reshaped the schema's structural layer (categories, subchains, contexts) but left several categories empty or under-populated, with element-level authoring punted to "subsequent dtpr-element-design / dtpr-category-audit passes."

The schema in scope is `ai@2026-04-27-beta`. Each focus below is a separate branch / PR.

---

## Current element counts (2026-05-05)

Counted via `https://api.dtpr.io/api/v2/schemas/ai@2026-04-27-beta/elements?fields=all&limit=200`:

| Category           | Count | Status                                       |
| ------------------ | ----- | -------------------------------------------- |
| `purpose`          | 23    | OK                                           |
| `accountable`      | 2     | Needs consolidation (deferred — see Focus 3) |
| `functional_modes` | 0 → 6 | Drafted in Focus 1 (this branch)             |
| `risks_mitigation` | 6     | Needs AIAAIC expansion — Focus 2             |
| `rights`           | 11    | OK                                           |
| `input_dataset`    | 7     | OK (PII context applied in #274)             |
| `processing`       | 7     | Needs family-typed reshape — Focus 4         |
| `output_dataset`   | 0     | **Empty** — Focus 5                          |
| `access`           | 9     | OK                                           |
| `retention`        | 2     | OK                                           |
| `storage`          | 7     | OK                                           |

---

## Focus 1 — `functional_modes` (six modes)

Status: drafted (this branch). Awaits review, translator pass for km/tl, designer pass on symbol stubs, then schema redeploy.

PR #274 emptied the renamed `ai__decision` → `functional_modes` catalog. The category description names six modes: **analytical, semantic, generative, agentic, perceptive, physical**. `dtpr-ai/content/6.concepts/6.subchains.md:54` references three by id (`perceptive_mode`, `analytical_mode`, `agentic_mode`) — establishing the `<mode>_mode` slug convention.

Source for the verb framing: Narain Jashanmal, *AI Taxonomy — An Operational Framework for Precision in AI Discourse*, v1.1, January 2026 (`https://dropleaf.app/d/AlXez8scbd`). Captured in the corpus at `plugin/dtpr/research/2026-05-06T1443-narain-jashanmal-ai-taxonomy.md` and cited in each element's `Element.citation`.

Approach taken:
- Audit via `dtpr-category-audit` produced coverage map, gap list, and verb-forward proposals.
- Element YAMLs authored directly (en/es/fr/pt) — `dtpr-element-design`'s locale-placeholder output was leapfrogged because the audit + corpus already supplied verb framing, descriptions, and boundary cues.
- Symbol SVG stubs created in-place; first-draft geometry, designer pass pending.

Done:
- [x] `analytical_mode` (verb: *decides*, symbol: bar chart)
- [x] `semantic_mode` (verb: *understands and remembers*, symbol: knowledge-graph triangle)
- [x] `generative_mode` (verb: *creates*, symbol: four-pointed sparkle)
- [x] `agentic_mode` (verb: *acts*, symbol: node + arrow)
- [x] `perceptive_mode` (verb: *senses*, symbol: eye)
- [x] `physical_mode` (verb: *moves*, symbol: four-directional arrows)
- [x] Citation field populated on each element (en/es/fr/pt)
- [x] Source recorded in research corpus + INDEX.md row
- [x] `pnpm schema:validate ai@2026-04-27-beta` passes
- [x] `pnpm schema:build ai@2026-04-27-beta` passes — 89 elements total (74 prior + 6 new this focus + 9 from Focus 2 already merged into this worktree)
- [x] Composed icons (hexagon × symbol) emit correctly under `dist/.../icons/<mode>_mode/{default,dark}.svg`

Follow-ups (block stable promotion, not this PR):
- [ ] **km and tl translations** — title, description, citation. Both locales were skipped in this pass; the validator accepts ≥1 locale entry but the existing element catalog is fully translated and these six are the only gap.
- [ ] **Designer pass on symbol stubs** — the six SVGs are first-draft geometry. Comprehension rubric flagged "symbol legibility" for sign-scale review (especially `mode_physical`, the four-arrow glyph reads dense at small sizes).
- [ ] **Comprehension audit re-grade** — run `dtpr-comprehension-audit` against the six new elements once translations land.
- [ ] **Schema redeploy** — local dist not yet pushed to R2; live `dtpr.ai/taxonomy` will pick up Functional Modes only after the API redeploys with the new bundles.

Acceptance: `functional_modes` section renders on `/taxonomy` with six elements; the smart-intersection example in `6.subchains.md` resolves cleanly against real elements.

---

## Focus 2 — `risks_mitigation` (nine AIAAIC risk elements)

Status: drafted (pending designer pass on placeholder symbols + translator review of non-en locales).

PR #274 organized this category around the AIAAIC Collaborative Harms Taxonomy (victim-oriented over cause-oriented) and added attribution. The current six elements are baseline; nine more AIAAIC-derived elements are expected. See `dtpr-ai/content/9.attribution.md` for the CC BY-SA 4.0 boundary and per-element citation pattern (use `Element.citation`).

Approach:
- Run `dtpr-category-audit` on `risks_mitigation` against the AIAAIC corpus entry at `plugin/dtpr/research/2026-04-21T1510-aiaaic-human-centred-harm-taxonomy.md`.
- Draft each new element via `dtpr-element-design` with `Element.citation` populated.

- [x] Identify the nine AIAAIC-derived elements (audit pass) — mapped to AIAAIC's 9 victim-oriented harm types: autonomy, physical, psychological, reputational, financial-business, civil-liberties, societal-cultural, political-economic, environmental. The 6 existing elements are mechanism-/cause-oriented and complement the new victim-oriented set.
- [x] Draft each element with citation — see `api/schemas/ai/2026-04-27-beta/elements/{autonomy_loss,physical_harm,psychological_harm,reputational_harm,financial_harm,civil_liberties_harm,societal_cultural_harm,political_economic_harm,environmental_harm}.yaml`. Each carries the AIAAIC citation per locale; CC BY-SA 4.0 surfaces in the citation text.
- [x] Verify CC BY-SA 4.0 attribution surfaces correctly in the element page — citation field is per-locale and renders via the element-page slot (see `dtpr-ai/content/5.ui/2.vue.md` `after-citation` slot); `9.attribution.md` already names the per-element citation as authoritative.

Follow-ups:
- [ ] Designer pass on the 9 placeholder symbols (`risks_autonomy`, `risks_physical`, `risks_psychological`, `risks_reputational`, `risks_financial`, `risks_civil-liberties`, `risks_societal-cultural`, `risks_political-economic`, `risks_environmental`) — current SVGs are minimal geometric stand-ins; redraw to match the silhouette quality of the existing 6 risks symbols.
- [ ] Translator review of `es`, `fr`, `km`, `pt`, `tl` strings on the 9 new elements — drafted by the implementer, not by native speakers; voice should match the existing 6 risks elements.

---

## Focus 3 — `accountable` consolidation + logo support

Status: not started.

Currently 2 elements. PR #274 corrected the shape to hexagon and added a Role context (vendor/deployer). The deferred work is a "consolidated accountable element with logo support" — likely a single element variant that carries an organization's logo as an asset, replacing the current pair.

Approach:
- Confirm what "logo support" requires at the schema layer (likely an element-level variable for a logo URL/asset, not a structural change).
- Draft the consolidated element via `dtpr-element-design`.
- Decide migration path for the existing two `accountable` elements (retire vs. keep as fallback).

- [ ] Specify logo storage (variable? asset? external URL?)
- [ ] Draft consolidated element
- [ ] Migration plan for existing `accountable` entries

---

## Focus 4 — `processing` family-typed catalog

Status: not started.

Currently 7 elements. PR #274 changed the shape to circle (data-in-motion contract) and rewrote the description. The deferred work is a "family-typed processing catalog" — grouping the processing techniques into families (e.g., classical-ML, LLM, optimization, recommendation, transformation). The current symbol directory hints at this: `processing_llm`, `processing_optimization-algorithm`, `processing_recommendation-systems`, `processing_sentiment-analysis`, `processing_text-to-speech`, `processing_time-series-forecasting`, `processing_privacy-preserving-transformation`.

Approach:
- Audit current 7 elements against the symbol set to identify family boundaries.
- Decide whether families are encoded via `Element.context`, element naming convention, or new structure.
- Draft any net-new elements; reorganize existing ones if needed.

- [ ] Family taxonomy decision
- [ ] Draft / reorganize elements per family
- [ ] Comprehension check on family labels

---

## Focus 5 — `output_dataset` (currently empty)

Status: not started. Not explicitly listed in PR #274's deferred work but flagged here because the category renders empty on `/taxonomy`.

PR #274 added the same PII context as `input_dataset` (none/anonymized/identifiable/biometric). Element catalog needs first-pass authoring.

Approach:
- Run `dtpr-category-audit` to scope.
- Likely mirrors `input_dataset` structure; may share elements via `category_ids[]` rather than duplicating.

- [ ] Audit pass
- [ ] Draft elements (or reuse `input_dataset` via `category_ids[]`)

---

## Cross-cutting

- [ ] Once Focus 1 lands, verify `dtpr-ai/content/6.concepts/6.subchains.md` examples still resolve; update if element ids drift from the assumed `<mode>_mode` convention.
- [ ] After each focus lands, force a dtpr-ai redeploy so the live `https://dtpr.ai/taxonomy` reflects the new state (current cache is stale on `ai@2026-04-16-beta`).
- [ ] Consider whether the `/taxonomy` page should render empty categories as "in progress" placeholders during this multi-PR rollout, or keep filtering them out (current behavior: filtered).

---

## Out of scope

- Promoting `ai@2026-04-27-beta` from `beta` to `stable`. That's a separate decision once all five focuses land and the schema is exercised end-to-end.
- Retiring `ai@2026-04-16-beta`. The two-version coexistence is intentional during this rollout.
