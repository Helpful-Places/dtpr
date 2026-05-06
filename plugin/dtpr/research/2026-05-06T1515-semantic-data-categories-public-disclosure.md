---
source: Apple App Privacy Details (developer.apple.com/app-store/app-privacy-details), Google Play Data Safety (support.google.com/googleplay/android-developer/answer/10787469), W3C DPV Personal Data Categories v2.3 (w3c.github.io/dpv/2.3/pd/), GDPR Art. 9 (gdpr-info.eu/art-9-gdpr), EU AI Act Art. 3(1) and Annex III (artificialintelligenceact.eu), TILT (arxiv.org/abs/2012.10431), DaPIS v3+ (zenodo.org/records/15094970)
date_accessed: 2026-05-06
authority_tier: peer-reviewed
applicability_tags: [category:input_dataset, category:output_dataset, concept:citizen-facing-disclosure, concept:public-space-ai, pattern:data-category-iconography, framework:apple-privacy-labels, framework:gdpr, framework:eu-ai-act, framework:dpv, framework:tilt, framework:dapis]
recheck_after: 2027-05-06
content_hash: sha256-2505fd78459ba2137fd45d2b9d60379b0f92fb6b450d10a6f13e75aebd0c51a0
---

# Semantic data categories for public-facing AI disclosure

## What every shipping or peer-reviewed framework agrees on

Across **eight independently developed transparency frameworks** — Apple Privacy Nutrition Labels, Google Play Data Safety, W3C DPV PD v2.3, GDPR Article 9, TILT, DaPIS, the original DTPR taxonomy, and Mozilla/Disconnect privacy icons — citizen-facing data categories are **always semantic, never format-based**. Categorizations are by *what the data is about* and *what it does to a person*, not by encoding (binary, tabular, pixel array).

This makes the original DTPR `input_dataset` element list — `binary`, `boolean`, `tabular`, `pixel_based_image` alongside `personal`, `spatial`, `values_time` — a hybrid artifact, not a design decision. The format-led elements were programmer documentation that survived earlier passes; only the semantic three matched the audience the schema actually serves (non-technical commuters reading a 1–3 second disclosure).

## Convergent categories across frameworks

| DTPR semantic category | Apple | Google Play | W3C DPV | GDPR | EU AI Act |
|---|---|---|---|---|---|
| About a person | Contact Info, Identifiers | Personal Info, Device IDs | Identifying | Art. 4(1) | — |
| About a body | visionOS Body | — | Biometric | Art. 9 | Annex III biometric ID |
| About a place | Location, visionOS Surroundings | Location | Location | — | Annex III critical infra |
| About behaviour | Usage, Browsing, Search, Purchases | App Activity | Behavioural | — | Annex III employment |
| About a measurement | — | App Performance | — | — | — (sensor data implied) |
| Sensitive personal | Sensitive Info, Health, Financial | Health, Financial | Medical, Financial | Art. 9 | Annex III welfare/credit |
| Operational data | — | — | Household | — | — (gap in most frameworks) |

The first six map cleanly to consumer-facing iconography precedent. **Operational data** (schedules, routes, budgets, occupancy counts, public records) is a gap in app-store frameworks because their domain is consumer software; for civic AI deployments (transit, public works, schools), this category is load-bearing and shows up partially in W3C DPV's `Household` branch and ISO/IEC 21972 city indicators.

## EU AI Act Art. 3(1) — the canonical AI output taxonomy

> "AI system" means a machine-based system … that, for explicit or implicit objectives, infers, from the input it receives, how to generate **outputs such as predictions, content, recommendations, or decisions** that can influence physical or virtual environments.

This sentence enumerates four output classes plus a fifth via "influence physical … environments":

1. **Decisions** — bound determinations affecting a person (eligibility, classification, yes/no). EU AI Act Annex III enumerates *which* high-risk decision domains attract additional disclosure obligations: biometric ID, critical infrastructure, education admissions/grading, employment hiring/performance, essential services (welfare/credit/emergency), law enforcement, migration/border, justice/democracy.
2. **Recommendations / predictions** — advisory rather than binding (suggestions, forecasts, risk scores, rankings).
3. **Content** — generated text, image, audio, video. Art. 50 requires disclosure that AI-generated content is synthetic; NIST AI 100-4 and C2PA define provenance metadata.
4. **Physical actions** — actuator outputs that change the environment (door, signage, HVAC, alert).

The DTPR `output_dataset` category should mirror this taxonomy directly because it is the regulatory boundary the schema's audience operates inside (EU deployments) or interoperates with (jurisdictions following the EU model).

## Why the PII context dimension stays — refined to a pure identifiability ramp

The 2026-04-27-beta schema previously declared a `pii` context (`none|anonymized|identifiable|biometric`) on both `input_dataset` and `output_dataset`. The 2026-05-06 audit's first cut dropped the whole dimension on a "double-bookkeeping" argument; a follow-up audit walked that back. The collision was real for exactly **one** of the four old values:

- `pii: biometric` ↔ `*_about_a_body` element. Same fact, two encodings — author coin-flip. `biometric` retired.
- `pii: none` ↔ absence of context value. Authoring a "no PII" claim is the same as not picking a context value, matching how Role works on `accountable`. `none` retired (encoded by absence).
- `pii: anonymized` (rename `de_identified`) → orthogonal to all elements. A face-blurred crowd count is `*_about_a_body` + `de_identified`; an aggregate ridership count is `*_about_a_person` + `de_identified`. Kept.
- `pii: identifiable` → orthogonal to all elements. A named-account profile is `*_about_a_person` + `identifiable`; a stored face-template tied to a name is `*_about_a_body` + `identifiable`. Kept.
- New value `pseudonymous` → captures the case original DTPR collapsed into `identifiable`: a token (hash, ID, template) lets the system recognise the same person across events without revealing a name. GDPR Art. 4(5) treats this as personal data; it deserves its own colour stop on the ramp.

The refined `pii` context is a **modality** dimension (how identifiable the data version this system processes is), strictly orthogonal to the **subject** dimension the elements carry (what the data is about). Original DTPR's at-a-glance colour band returns; the only loss is the false-precision of `biometric`-as-tier (now correctly handled as `*_about_a_body` × `identifiable`).

Final value set: `de_identified` (`#4A90D9` blue) → `pseudonymous` (`#9575CD` purple) → `identifiable` (`#FFD700` yellow). Absence of value carries the "no PII claim" meaning.

## Implementation details (2026-04-27-beta, 2026-05-06 audit)

11-category bidirectional taxonomy, applied symmetrically to `input_dataset` and `output_dataset`. The DTPR structural schema (`api/src/schema/element.ts:33`) enforces a single `category_id` per element and globally-unique element ids, so each pair uses two element files sharing one `symbol_id`:

| Concept | Input element id | Output element id | Shared symbol_id |
|---|---|---|---|
| About a person | `input_about_a_person` | `output_about_a_person` | `personal` |
| About a body | `input_about_a_body` | `output_about_a_body` | `about_a_body` |
| About a place | `input_about_a_place` | `output_about_a_place` | `spatial` |
| About behaviour | `input_about_behaviour` | `output_about_behaviour` | `about_behaviour` |
| About a measurement | `input_about_a_measurement` | `output_about_a_measurement` | `values_time` |
| Sensitive personal | `input_sensitive_personal` | `output_sensitive_personal` | `sensitive_personal` |
| Operational data | `input_operational_data` | `output_operational_data` | `operational_data` |
| A decision | `input_decision` | `output_decision` | `dm_accept-or-deny` |
| A recommendation | `input_recommendation` | `output_recommendation` | `dm_priority-ranking` |
| Generated content | `input_generated_content` | `output_generated_content` | `generated_content` |
| A physical action | `input_physical_action` | `output_physical_action` | `physical_action` |

Symmetric coverage on both sides supports downstream pipeline disclosure: an upstream model's output (e.g., a recommendation, decision, or physical-action signal) is a legitimate runtime input to a downstream model, and the schema must describe the full chain.

## Migration map (2026-04-16-beta → 2026-04-27-beta)

| Old element id | New mapping |
|---|---|
| `personal` | retired — concept absorbed by `*_about_a_person`, `*_about_a_body`, `*_sensitive_personal` |
| `spatial` | renamed to `*_about_a_place` |
| `values_time` | renamed to `*_about_a_measurement` |
| `pixel_based_image` | reclassified by what's depicted: face/body → `*_about_a_body`; place → `*_about_a_place`; person → `*_about_a_person` |
| `boolean` | input → `*_about_behaviour` (a yes/no signal); output → `*_decision` |
| `binary` | reclassified by content: voice → `*_about_a_body`; sensor stream → `*_about_a_measurement`; etc. |
| `tabular` | reclassified by row meaning: transactions → `*_about_behaviour`; sensor logs → `*_about_a_measurement`; schedules → `*_operational_data` |

## Open work

- Six placeholder symbols (`about_a_body`, `about_behaviour`, `sensitive_personal`, `operational_data`, `generated_content`, `physical_action`) ship as functional but design-unfinished SVGs. Studio illustrator pass needed before promotion from beta to stable.
- Localizations across en/es/fr/km/pt/tl are first-pass translations; native-speaker review recommended for km, tl, and the longer descriptions in fr and pt before stable.
- Mozilla/Disconnect privacy icon project is abandoned and only partial enumerations are findable; treated as historical prior art only.
