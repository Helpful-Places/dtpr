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
| `accountable`      | 2     | OK for this version                          |
| `functional_modes` | 0 → 6 | Drafted in Focus 1 (this branch)             |
| `risks_mitigation` | 6 → 9 | Retired 6 mechanism-oriented; replaced with AIAAIC's 9 victim-oriented harms (Focus 2) |
| `rights`           | 11    | OK                                           |
| `input_dataset`    | 7 → 11 | Replaced format-led catalog with semantic taxonomy; PII context refined to identifiability ramp — Focus 5 |
| `processing`       | 7     | Needs family-typed reshape — Focus 4         |
| `output_dataset`   | 0 → 11 | First-pass semantic taxonomy authored, mirrors input — Focus 5 |
| `access`           | 9     | OK                                           |
| `retention`        | 2     | OK                                           |
| `storage`          | 7     | OK                                           |

---

## Focus 1 — `functional_modes` (six modes)

Status: drafted (this branch). Awaits review, designer pass on symbol stubs, then schema redeploy.

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
- [ ] **Designer pass on symbol stubs** — the six SVGs are first-draft geometry. Comprehension rubric flagged "symbol legibility" for sign-scale review (especially `mode_physical`, the four-arrow glyph reads dense at small sizes).
- [ ] **Comprehension audit re-grade** — run `dtpr-comprehension-audit` against the six new elements.
- [ ] **Schema redeploy** — local dist not yet pushed to R2; live `dtpr.ai/taxonomy` will pick up Functional Modes only after the API redeploys with the new bundles.

Acceptance: `functional_modes` section renders on `/taxonomy` with six elements; the smart-intersection example in `6.subchains.md` resolves cleanly against real elements.

---

## Focus 2 — `risks_mitigation` (nine AIAAIC risk elements)

Status: drafted (pending designer pass on placeholder symbols + translator review of non-en locales).

PR #274 organized this category around the AIAAIC Collaborative Harms Taxonomy (victim-oriented over cause-oriented) and added attribution. This focus completes the realignment: the 6 mechanism-/cause-oriented elements are retired and replaced with 9 victim-oriented harms drawn directly from AIAAIC's harm-type cut. Sat next to victim-oriented elements, the cause-oriented ones overlap awkwardly (e.g., `compromise_of_privacy` collides with `autonomy_loss` + `civil_liberties_harm`; `unequal_performance` with `civil_liberties_harm` + `reputational_harm`) and force authors into a coin-flip between mechanism and outcome for the same scenario. Beta-stage retirement is acceptable; downstream datachain instances pinned to the old IDs will need to remap. See `dtpr-ai/content/9.attribution.md` for the CC BY-SA 4.0 boundary and per-element citation pattern (use `Element.citation`).

Approach:
- Run `dtpr-category-audit` on `risks_mitigation` against the AIAAIC corpus entry at `plugin/dtpr/research/2026-04-21T1510-aiaaic-human-centred-harm-taxonomy.md`.
- Draft each new element via `dtpr-element-design` with `Element.citation` populated.
- Retire the 6 mechanism-oriented elements and their orphaned symbols.

- [x] Identify the nine AIAAIC-derived elements (audit pass) — mapped to AIAAIC's 9 victim-oriented harm types: autonomy, physical, psychological, reputational, financial-business, civil-liberties, societal-cultural, political-economic, environmental.
- [x] Draft each element with citation — see `api/schemas/ai/2026-04-27-beta/elements/{autonomy_loss,physical_harm,psychological_harm,reputational_harm,financial_harm,civil_liberties_harm,societal_cultural_harm,political_economic_harm,environmental_harm}.yaml`. Each carries the AIAAIC citation per locale; CC BY-SA 4.0 surfaces in the citation text.
- [x] Verify CC BY-SA 4.0 attribution surfaces correctly in the element page — citation field is per-locale and renders via the element-page slot (see `dtpr-ai/content/5.ui/2.vue.md` `after-citation` slot); `9.attribution.md` already names the per-element citation as authoritative.
- [x] Retire the 6 mechanism-oriented elements (`compromise_of_privacy`, `function_creep`, `opaque_decision_making`, `overreliance_automation_bias`, `system_drift`, `unequal_performance`) and their orphaned symbols (`risks_compromise-of-privacy`, `risks_unforseen-or-function-creep`, `risks_opaque-decision-making`, `risks_overreliance-and-automation`, `risks_system-drift-and-temporal-validity`, `risks_unequal-performance`). Earlier `2026-04-16-beta` keeps them — only retired in this version.

Follow-ups:
- [ ] Designer pass on the 9 placeholder symbols (`risks_autonomy`, `risks_physical`, `risks_psychological`, `risks_reputational`, `risks_financial`, `risks_civil-liberties`, `risks_societal-cultural`, `risks_political-economic`, `risks_environmental`) — current SVGs are minimal geometric stand-ins.
- [ ] Translator review of `es`, `fr`, `pt` strings on the 9 new elements — drafted by the implementer, not by native speakers; voice should match the existing element catalog.
- [ ] Renderer-side mode↔harm cross-product view — `functional_modes` and `risks_mitigation` are intentionally orthogonal categories. A taxonomy/instance view that surfaces "which (mode, harm) pairs are tagged" gives the disclosure power of mode-context-on-harm without coupling the schema. Out of scope for Focus 2; track separately when the renderer is the active surface.

---

## Focus 4 — `processing` family-typed catalog

Status: drafted (this branch). Awaits review, designer pass on two reused symbols, then schema redeploy.

Currently 7 elements. PR #274 changed the shape to circle (data-in-motion contract) and rewrote the description. The deferred work is a "family-typed processing catalog" — grouping the processing techniques into families (e.g., classical-ML, LLM, optimization, recommendation, transformation). The current symbol directory hints at this: `processing_llm`, `processing_optimization-algorithm`, `processing_recommendation-systems`, `processing_sentiment-analysis`, `processing_text-to-speech`, `processing_time-series-forecasting`, `processing_privacy-preserving-transformation`.

Approach:
- Audit current 7 elements against the symbol set to identify family boundaries.
- Decide whether families are encoded via `Element.context`, element naming convention, or new structure.
- Draft any net-new elements; reorganize existing ones if needed.

- [x] Family taxonomy decision — **each element IS a family** (no `Element.context` layer; ids are family slugs). 12 families chosen for breadth of public-space AI coverage.
- [x] Draft / reorganize elements per family — 7 old element files removed; 12 new family-typed elements written under `api/schemas/ai/2026-04-27-beta/elements/`. `schema:validate` and `schema:build` pass (11 categories, 94 elements at Focus-4 close; 103 after Focus 5).
- [x] Comprehension check on family labels — see commit body. Two symbols (`search_retrieval`, `clustering_segmentation`) reuse closest-fit existing icons (`connectivity`, `social`) and are flagged for design follow-up.

Family roster (12):

| id | family | symbol_id (✱ = reuse pending design) |
| --- | --- | --- |
| `language_models` | Language Models | `processing_llm` |
| `computer_vision` | Computer Vision | `pixel_based_image` |
| `biometric_recognition` | Biometric Recognition | `personal` |
| `speech_audio` | Speech & Audio | `processing_text-to-speech` |
| `classification_prediction` | Classification & Prediction | `processing_time-series-forecasting` |
| `affect_emotion_analysis` | Affect & Emotion Analysis | `processing_sentiment-analysis` |
| `anomaly_detection` | Anomaly Detection | `dm_anomaly-detection` |
| `optimization` | Optimization | `processing_optimization-algorithm` |
| `recommendation_ranking` | Recommendation & Ranking | `processing_recommendation-systems` |
| `search_retrieval` | Search & Retrieval | `connectivity` ✱ |
| `clustering_segmentation` | Clustering & Segmentation | `social` ✱ |
| `privacy_transformation` | Privacy-Preserving Transformation | `processing_privacy-preserving-transformation` |

---

## Focus 5 — `output_dataset` + `input_dataset` semantic recategorization

Status: drafted (this branch). Awaits review, native-speaker translator pass for non-en locales, designer pass on six placeholder symbols, then schema redeploy.

The audit reframed the scope: `input_dataset`'s shipped catalog (`binary`, `boolean`, `tabular`, `pixel_based_image`, `personal`, `spatial`, `values_time`) was a hybrid — three semantic elements alongside four data-format elements that read as programmer documentation to a non-technical commuter. Eight independently-developed citizen-facing transparency frameworks (Apple Privacy Nutrition Labels, Google Play Data Safety, W3C DPV PD v2.3, GDPR Art. 9, EU AI Act Art. 3(1) + Annex III, TILT, DaPIS, original DTPR's own semantic three) all categorize by *what data is about*, not by encoding. This focus replaces the input catalog wholesale and authors the output catalog symmetrically. Captured in corpus at `plugin/dtpr/research/2026-05-06T1515-semantic-data-categories-public-disclosure.md`.

Approach taken:
- Audit via `dtpr-category-audit` plus a `best-practices-researcher` pass synthesizing the eight frameworks.
- Element YAMLs authored directly across four locales (en/es/fr/pt) — matches Focus 1's precedent.
- Symbol SVG stubs created in-place for six new symbol_ids; existing five symbol_ids reused (`personal`, `spatial`, `values_time`, `dm_accept-or-deny`, `dm_priority-ranking`).
- `pii` context kept on both categories but refined to a pure identifiability ramp (`de_identified` → `pseudonymous` → `identifiable`). The old `biometric` value retired (it was the genuine overlap with `*_about_a_body`); the old `none` value retired (absence of context now carries that meaning, matching how Role works on `accountable`). Restoring the colour band preserves original DTPR's at-a-glance modality signal that the semantic-element-only design lost.
- `output_dataset` description and prompt broadened to cover decisions, content, and physical actions (not just data products).

11-category bidirectional taxonomy with 22 element files (one per category per side, sharing one symbol_id):

| Concept | Input element id | Output element id | Shared symbol_id |
| --- | --- | --- | --- |
| About a person | `input_about_a_person` | `output_about_a_person` | `personal` |
| About a body | `input_about_a_body` | `output_about_a_body` | `about_a_body` ✱ |
| About a place | `input_about_a_place` | `output_about_a_place` | `spatial` |
| About behaviour | `input_about_behaviour` | `output_about_behaviour` | `about_behaviour` ✱ |
| About a measurement | `input_about_a_measurement` | `output_about_a_measurement` | `values_time` |
| Sensitive personal | `input_sensitive_personal` | `output_sensitive_personal` | `sensitive_personal` ✱ |
| Operational data | `input_operational_data` | `output_operational_data` | `operational_data` ✱ |
| A decision | `input_decision` | `output_decision` | `dm_accept-or-deny` |
| A recommendation or prediction | `input_recommendation` | `output_recommendation` | `dm_priority-ranking` |
| Generated content | `input_generated_content` | `output_generated_content` | `generated_content` ✱ |
| A physical action | `input_physical_action` | `output_physical_action` | `physical_action` ✱ |

✱ = first-draft placeholder symbol, designer pass pending.

Done:
- [x] Eight-framework research synthesis captured at `plugin/dtpr/research/2026-05-06T1515-semantic-data-categories-public-disclosure.md`.
- [x] `categories/input_dataset.yaml` — `pii` context refined to three-value identifiability ramp (`de_identified` blue / `pseudonymous` purple / `identifiable` yellow); old `none` and `biometric` values retired.
- [x] `categories/output_dataset.yaml` — `pii` context refined symmetrically; description and prompt broadened to "produces, decides, generates, or causes."
- [x] 7 obsolete input_dataset element files deleted (`binary.yaml`, `boolean.yaml`, `personal.yaml`, `pixel_based_image.yaml`, `spatial.yaml`, `tabular.yaml`, `values_time.yaml`).
- [x] 22 new element YAMLs written across four locales (en/es/fr/pt).
- [x] 6 new symbol SVG stubs created (`about_a_body`, `about_behaviour`, `sensitive_personal`, `operational_data`, `generated_content`, `physical_action`).
- [x] `pnpm schema:validate ai@2026-04-27-beta` passes — 11 categories, 103 elements.
- [x] `pnpm schema:build ai@2026-04-27-beta` passes — 466 dist files (PII-context icon variants account for the increase from the pre-context 400-file baseline).
- [x] Full test suite passes — 388 tests (340 workers + 48 cli).
- [x] Corpus verifier passes — 11 corpus entries.

Follow-ups (block stable promotion, not this PR):
- [ ] **Native-speaker translator review** of `es`, `fr`, `pt` strings on the 22 new elements — current drafts are author-translated.
- [ ] **Designer pass on the six placeholder symbol stubs** — current SVGs are minimal geometric stand-ins.
- [ ] **Comprehension audit re-grade** — run `dtpr-comprehension-audit` against the 11 categories.
- [ ] **Schema redeploy** — local dist not yet pushed to R2; live `dtpr.ai/taxonomy` will reflect this only after redeploy.
- [ ] **Migration note for downstream callers** — datachain instances pinned to `ai@2026-04-27-beta` and using the old element ids (`personal`, `tabular`, etc.) will need to remap. See migration table in the corpus entry. Beta-stage breaking change is in-policy per the plan's Out-of-scope section.

---

## Cross-cutting

- [ ] Once Focus 1 lands, verify `dtpr-ai/content/6.concepts/6.subchains.md` examples still resolve; update if element ids drift from the assumed `<mode>_mode` convention.
- [ ] After each focus lands, force a dtpr-ai redeploy so the live `https://dtpr.ai/taxonomy` reflects the new state (current cache is stale on `ai@2026-04-16-beta`).
- [ ] Consider whether the `/taxonomy` page should render empty categories as "in progress" placeholders during this multi-PR rollout, or keep filtering them out (current behavior: filtered).

---

## Out of scope

- Promoting `ai@2026-04-27-beta` from `beta` to `stable`. That's a separate decision once the schema is exercised end-to-end.
- Retiring `ai@2026-04-16-beta`. The two-version coexistence is intentional during this rollout.
