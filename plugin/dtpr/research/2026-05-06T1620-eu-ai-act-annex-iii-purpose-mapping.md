---
source: https://artificialintelligenceact.eu/annex/3/
date_accessed: 2026-05-06
authority_tier: regulatory-text
applicability_tags: [category:purpose, framework:eu-ai-act, jurisdiction:eu, concept:high-risk-ai, concept:public-space-ai, pattern:purpose-disclosure]
recheck_after: 2027-05-06
content_hash: sha256-2505fd78459ba2137fd45d2b9d60379b0f92fb6b450d10a6f13e75aebd0c51a0
---

# EU AI Act Annex III — high-risk use cases mapped to DTPR `purpose` elements

**Regulation (EU) 2024/1689** ("AI Act"), Article 6(2) and **Annex III** enumerate the use cases that, when deployed in the listed conditions, qualify an AI system as **high-risk** and trigger the conformity-assessment, transparency, human-oversight, and data-governance regime laid out in Chapter III. Annex III is the operational list — the place AI use is sliced into legally-relevant categories — and it is the closest existing regulatory text to a *purpose-of-deployment* taxonomy.

When DTPR's `ai/2026-04-27-beta` `purpose` category was extended in May 2026 with ten new elements (education, employment, financial_services, eligibility_benefits, content_moderation, marketing_personalization, translation_language, risk_assessment, healthcare, border_immigration), eight of the ten map directly onto Annex III paragraphs. The mapping is not 1:1 — DTPR purposes are user-facing functional categories, not legal classifications — but the alignment is strong enough that DTPR purpose disclosures cite Annex III as the upstream source.

## Annex III paragraphs (as enacted)

The list below restates Annex III in shortened form for cross-referencing. The official text is authoritative; this entry summarises only.

| § | Annex III paragraph | DTPR purpose element |
| --- | --- | --- |
| 1 | Biometric identification, categorisation, and emotion recognition | (covered as functional_modes:perceptive_mode + risks_mitigation:civil_liberties_harm; not a standalone purpose) |
| 2 | Critical infrastructure — road traffic, water, gas, heating, electricity | (covered by `safety_security` + `energy_efficiency` / `water_efficiency`; no standalone element) |
| 3 | Education and vocational training (admission, assessment, detection of prohibited behaviour) | **`education`** |
| 4 | Employment, workers management, access to self-employment (recruitment, work-relationship monitoring, task allocation) | **`employment`** |
| 5(a) | Public authorities — eligibility for public-assistance benefits and services | **`eligibility_benefits`** |
| 5(b) | Credit scoring of natural persons (excludes fraud detection) | **`financial_services`** |
| 5(c) | Risk assessment and pricing — life and health insurance | **`financial_services`** (cited alongside §5(b)) |
| 5(d) | Emergency-call dispatching, triage of patients in emergency healthcare | **`fire_emergency`** + **`healthcare`** (split coverage) |
| 6 | Law enforcement — risk profiling, polygraph-style detection, evidence reliability | **`risk_assessment`** (cited; also intersects `enforcement`) |
| 7 | Migration, asylum, border-control management — polygraph, risk assessment, document verification | **`border_immigration`** |
| 8 | Administration of justice and democratic processes — researching/interpreting facts and the law | **`risk_assessment`** (cited; also intersects `enforcement`) |

Two of the ten new elements have **no Annex III hook**: `content_moderation` (anchored in DSA, Regulation (EU) 2022/2065) and `marketing_personalization` (anchored in GDPR Art. 22 and DSA Art. 26/39). `translation_language` is anchored in Council of Europe Charter + EU Web Accessibility Directive — not in the AI Act. `healthcare` extends beyond Annex III §5(d) to clinical-AI broadly (WHO 2021 + MDR/IVDR overlay).

## Why Annex III is the right anchor for `purpose`

Three structural points:

1. **Annex III is the only EU-level text that classifies AI by *deployment use*, not by *technical class*.** The rest of the AI Act regime classifies by risk tier and provider/deployer role. For a *purpose-of-deployment* taxonomy that needs to land for citizens, Annex III is the closest legally-grounded baseline. Citing it in element descriptions (rather than Article 6 alone) is more useful for downstream audits.

2. **Annex III is enumerative, not exhaustive.** It lists discrete high-risk use cases, not a closed taxonomy. DTPR's `purpose` category therefore *includes more elements than Annex III enumerates* (e.g., `accessibility`, `arts_culture`, `connectivity` — none of which are Annex III high-risk). The mapping is "high-risk Annex III paragraphs anchor to specific DTPR purposes; the converse does not hold."

3. **The AI Act is in phased application.** Annex III high-risk obligations apply from **2 August 2026** for systems placed on the market on or after that date (Article 113). Earlier-deployed systems benefit from grandfathering through 2030 (Article 111(2)). DTPR purpose elements that cite Annex III should not assume the obligations are live for a specific datachain instance — the citation is an *anchor*, not an active-applicability claim.

## Application notes for DTPR element design

When proposing a new `purpose` element that overlaps an Annex III paragraph:

- **Cite the paragraph in the element's `citation` field**, not just "EU AI Act." The paragraph numbers are the load-bearing reference; readers grade against that specificity.
- **Carry both the regulation citation (Regulation (EU) 2024/1689) and the article+annex pin** (Article 6(2) and Annex III §X). Future readers who cross-walk to UK / Brazilian / Korean equivalents will need the paragraph number.
- **Avoid claiming high-risk status as a property of the DTPR element.** The element names a *purpose*; whether a specific instance is high-risk depends on its deployment context, the system's autonomy level, and the Article 6(2) carve-outs. Element citations should anchor to Annex III as the *source of the category boundary*, not as an active legal classification of the disclosed system.
- **Where a purpose has no Annex III hook**, anchor to the next-best regulatory text: GDPR Art. 22 + DSA Art. 26 for marketing/personalization; DSA Articles 14–17 for content moderation; Council of Europe Charter + Web Accessibility Directive for language access; WHO Ethics + MDR/IVDR for clinical AI.

## Cross-references

- **`2026-04-27T1010-eu-ai-act-rights-provisions.md`** — companion entry on AI Act *rights* provisions (Articles 26, 27, 50, 86). The two entries cover orthogonal angles: this entry maps Annex III to `purpose`; that entry maps Articles 26/27/50/86 to `rights`.
- **`2026-04-27T1015-coe-framework-convention-ai-2024.md`** — Council of Europe treaty whose Chapter IV mirrors AI Act framing. Useful when authoring elements for jurisdictions that adopted the COE convention but not the AI Act.
- **`2026-04-21T1515-air-2024-policy-taxonomy.md`** — academic AI risk taxonomy that cross-walks AI Act Annex III to government and corporate AI policies in the US, EU, and CN. Useful for non-EU citation alternatives.
- **AIAAIC repository** — referenced in element citations for `employment`, `eligibility_benefits`, and `risk_assessment`. Captures real-world incidents in each Annex III category.

## URLs (verified 2026-05-06)

- AI Act Annex III (high-risk use cases): https://artificialintelligenceact.eu/annex/3/
- AI Act Article 6 (high-risk classification rules): https://artificialintelligenceact.eu/article/6/
- AI Act Article 113 (phased entry into application): https://artificialintelligenceact.eu/article/113/
- DSA Article 26 (online advertising transparency): https://eur-lex.europa.eu/eli/reg/2022/2065/oj
- WHO — Ethics and Governance of AI for Health (2021): https://www.who.int/publications/i/item/9789240029200
