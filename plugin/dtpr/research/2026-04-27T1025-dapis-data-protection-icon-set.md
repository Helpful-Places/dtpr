---
source: https://zenodo.org/records/15094970
date_accessed: 2026-04-27
authority_tier: peer-reviewed
applicability_tags: [category:ai__rights, concept:citizen-facing-disclosure, pattern:rights-icon-system, standard:iso-iec-29184, framework:gdpr]
recheck_after: 2027-04-27
---

# DaPIS — Data Protection Icon Set (Rossi & Palmirani, ongoing through v3+ 2025)

**Data Protection Icon Set (DaPIS)**, ongoing project led by Arianna Rossi and Monica Palmirani at CIRSFID-AI / University of Bologna, with v3+ released 2025 on Zenodo. An ontology-based icon set for GDPR-compliant data-protection notices, modelled on PrOnto (the GDPR ontology) and machine-readable via Akoma Ntoso. v3+ includes 100+ icons covering rights, data categories, processing purposes, recipients, and storage locations.

**License:** CC BY-NC-SA 4.0 on Zenodo (verify per-asset licensing for commercial use).

## Why this matters for DTPR

DaPIS is the **only mature, peer-reviewed, ontology-grounded icon system** that currently covers individual rights vocabulary at the same level of structural rigor DTPR is targeting. It is the most relevant icon-design prior art for the `ai__rights` category specifically.

Three structural points:

1. **DaPIS already has icons for the rights DTPR is currently missing.** v3+ ships icons for *right of access*, *right of rectification*, *right to erasure*, *right to restriction of processing*, *right to data portability*, *right to object*, and *rights related to automated decision-making*. The cross-walk against DTPR's six current elements surfaces the same gap list the statutory frameworks suggest (rectification, portability, object, opt-out-of-ADM).
2. **The ontology grounding is structurally compatible with DTPR's element-variable model.** DaPIS icons are named from a formal ontology (PrOnto for GDPR; LegalRuleML for cross-jurisdictional concepts), which means each icon has stable semantics across translations and adaptations. DTPR's element model (id + locale-keyed title/description + variables) is structurally similar; adopting DaPIS naming for shared concepts gives DTPR free interoperability with any consumer that already understands DaPIS.
3. **DaPIS is user-tested.** Rossi and Palmirani have published comprehension evaluations going back to 2018-2020 with sample sizes of 100+ users, including non-expert audiences. The current `ai__rights` category in DTPR is, by contrast, untested for public comprehension. DaPIS's findings — particularly that abstract rights ("purpose limitation", "processing restriction") consistently underperform concrete metaphors ("erasure", "human review") — should drive DTPR's own plain-language verb-phrase labelling decisions.

## Structure of v3+

| Group | Examples | Notes |
|---|---|---|
| **Data subject rights** | Access, rectification, erasure, portability, objection, restriction, ADM-rights | Direct cross-walk to DTPR's `ai__rights` category |
| **Data categories** | Identifying data, biometric, health, location, financial, special-category | Maps onto DTPR's `ai__input_dataset` / `ai__output_dataset` |
| **Processing purposes** | Marketing, analytics, profiling, security, legal compliance | Maps onto DTPR's `ai__purpose` |
| **Recipients** | Third party, processor, public authority, international transfer | Maps onto DTPR's `ai__access` |
| **Storage and retention** | Indefinite, fixed period, encryption | Maps onto DTPR's `ai__storage` and `ai__retention` |

The data-subject-rights group is the most directly applicable. The other groups are useful prior art for DTPR's other categories but are not in scope for this entry.

## Standards-body anchoring

DaPIS implements **ISO/IEC 29184:2020 — Online Privacy Notices and Consent**, which formally endorses layered notices, dashboards, icons, and just-in-time notices. ISO 29184 is paywalled (https://www.iso.org/standard/70331.html); the W3C DPV implementation guide is open (https://w3c.github.io/dpv/guides/notice-29184) and useful for DTPR cross-walk purposes.

DaPIS also pins to **GDPR Article 12(7)**, which authorises *standardised graphical icons* for rights notices and is the legal hook DTPR sits inside for the EU jurisdiction.

## Strengths

- **Peer-reviewed.** Multiple academic publications across IOS Press, Springer, and CIRSFID's own publication series.
- **Ontology-grounded.** Stable semantics across translations and adaptations; not just visual marks.
- **User-tested.** Comprehension evaluations published with sample sizes of 100+ across multiple iterations.
- **Standards-aligned.** ISO/IEC 29184 + GDPR Art. 12(7) backing.
- **Open license** (CC BY-NC-SA 4.0 on Zenodo), but the *NC* clause is a constraint for commercial deployers — verify before adopting in a paid product.

## Self-acknowledged limitations

- **Privacy-flavoured, not AI-flavoured.** DaPIS predates the EU AI Act and was designed for GDPR compliance; it covers GDPR rights but not AI-Act-specific provisions (notice-of-AI-use, individual-decision explanation per Art. 86, AI-system identification per Art. 50).
- **NC clause.** Cannot be used commercially without separate licensing — DTPR's distribution model would need to confirm compatibility.
- **Iconography is European-centric.** Visual conventions assume European reading culture; cross-jurisdictional comprehension is partially tested but not exhaustively.

## Application to DTPR

Three integration options:

1. **Cite DaPIS as visual-design prior art and adopt naming for shared concepts.** Cheapest move — DTPR keeps its own iconography, but elements that overlap DaPIS rights use the same id naming pattern (e.g., `right_access` → DaPIS *Access*; `right_rectification` (proposed) → DaPIS *Rectification*).
2. **Cross-walk DTPR's element list against DaPIS's rights group and close gaps.** The cross-walk surfaces the same gap list other sources suggest: rectification, portability, object, opt-out-of-ADM, plus notice-of-AI-use as an AI-Act addition DaPIS does not yet have.
3. **Treat DaPIS comprehension findings as a research input for DTPR's plain-language layer.** Rossi & Palmirani's evaluations show abstract rights underperform concrete metaphors; DTPR's verb-phrase labels ("Talk to a person", "Erase my data", "Know it's AI") should follow the same finding.

## Caution

DaPIS is privacy-rights-flavoured. For AI-specific rights (notice-of-AI-use, individual-decision explanation, AI-system identification) DTPR is genuinely filling a gap and should *not* assume DaPIS prior art covers it. Cite DaPIS for the GDPR-rights cross-walk; cite the EU AI Act and CoE Framework Convention for the AI-specific additions.

## URLs (verified 2026-04-27)

- Zenodo (v3+, 2025): https://zenodo.org/records/15094970
- IOS Press chapter: https://ebooks.iospress.nl/volumearticle/51786
- DaPIS — GDPR by Design report (2019, methodological background): http://gdprbydesign.cirsfid.unibo.it/wp-content/uploads/2019/01/report_DaPIS_jan19.pdf
- ISO/IEC 29184:2020 catalogue (paywalled): https://www.iso.org/standard/70331.html
- W3C DPV — ISO 29184 implementation guide (open): https://w3c.github.io/dpv/guides/notice-29184
