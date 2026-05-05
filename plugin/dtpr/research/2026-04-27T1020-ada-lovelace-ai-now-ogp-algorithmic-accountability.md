---
source: https://www.opengovpartnership.org/wp-content/uploads/2021/08/executive-summary-algorithmic-accountability.pdf
date_accessed: 2026-04-27
authority_tier: industry-report
applicability_tags: [category:ai__rights, concept:citizen-facing-disclosure, concept:public-space-ai, concept:algorithmic-accountability, pattern:ai-city-register, pattern:redress-channel]
recheck_after: 2027-04-27
---

# Ada Lovelace + AI Now + OGP — Algorithmic Accountability for the Public Sector (2021)

**"Algorithmic Accountability for the Public Sector — Learning from the First Wave of Policy Implementation"**, August 2021. Joint study by the Ada Lovelace Institute, AI Now Institute, and the Open Government Partnership. The closest existing analog to AIAAIC's harm-taxonomy work but for the *rights and accountability* side of public-sector AI — and the closest single document to a citizen-facing-rights enumeration for DTPR's `ai__rights` category.

## Why this matters for DTPR

DTPR's existing risk-side corpus has four entries (MIT AI Risk Repository, Atlas of AI Risks, AIAAIC, AIR 2024) covering different cuts of *what can go wrong*. The rights-side corpus has been thin. This study fills the equivalent slot for *what can be invoked when something goes wrong*, organised around the same public-sector-AI context DTPR targets (kiosks, transit, libraries, civic services).

Key signal: the report explicitly studies *first-wave* algorithmic-accountability instruments and treats individual-rights enumerations as one accountability mechanism among several (alongside registers, audits, and impact assessments). This is exactly the framing DTPR sits inside.

## Structure: 7 mechanisms, 40+ instruments studied

Cross-jurisdictional survey of:

- **Canada — Directive on Automated Decision-Making (2019)** and Algorithmic Impact Assessment tool.
- **United States — NYC Local Law 49 (ADS Task Force, 2018)** and adjacent state-level efforts.
- **France — Loi pour une République numérique (2016)**, Article 4 — right to explanation of administrative algorithmic decisions.
- **Helsinki + Amsterdam AI Registers (2020)** — first city-level public AI inventories with redress fields.
- **United Kingdom — CDEI work on algorithmic transparency** and Centre for Data Ethics outputs.
- Various national and city-level inventory and impact-assessment regimes.

The seven mechanisms identified:

1. **Principles and ethics frameworks** (non-binding values).
2. **Standards and certifications**.
3. **Algorithmic impact assessments (AIAs)** — institutional artifacts that surface impact-on-affected-persons.
4. **Algorithmic audits** — third-party verification.
5. **Public registers** — city/national inventories of deployed AI (Helsinki, Amsterdam, the 9-city Eurocities common standard).
6. **Public participation in policy design** — including affected-community consultation.
7. **Individual rights and redress** — notice, explanation, human review, appeal, representational action under GDPR Art. 80.

The seventh mechanism is the closest match to DTPR's `ai__rights` category. The report names *individual redress*, *representational action* (collective challenge), and *civic participation* in policy design as three distinct affordances — equivalent to the contestability triad in the Alfrink "Contestable AI by Design" literature.

## Methodology

Cross-walk study; not a peer-reviewed taxonomy. Authority sits in the breadth and quality of jurisdictional cases studied, not in academic peer review. Audited 40+ first-wave instruments across 12+ jurisdictions; identified what worked, what failed, and which gaps recur. The report's *instrument inventory* is the most useful raw material for DTPR — every instrument studied includes a redress/contact field and a description of who can invoke it.

## Citizen-facing disclosure pattern: the public register

The report dedicates significant space to public AI registers as accountability infrastructure. Helsinki's `ai.hel.fi`, Amsterdam's algorithm register, and the **Eurocities 9-city common standard (2022)** all share a structure that pins each registered system to: *purpose*, *data sources*, *algorithm/model*, *human-oversight contact*, and **a redress/feedback channel for affected persons**. This is direct prior art for the DTPR datachain itself — DTPR is, structurally, a *citizen-facing version of the same register entry*.

The 9-city common standard establishes the *redress/feedback channel* as a required field, not an optional one. DTPR's `ai__rights` category currently has no element for "the affected-person knows where to go to invoke the right" — this is the *right_redress_path* gap.

## Application to DTPR

Three integration moves:

1. **Cite the Ada Lovelace/AI Now/OGP report as the cross-jurisdictional anchor** for any `ai__rights` element that pins to a multi-jurisdiction concept (notice, explanation, human review, appeal). One corpus entry; many element citations.
2. **Adopt the *redress channel* pattern as a DTPR element.** A `right_redress_path` (or `right_to_invoke`) element would name the *where do I go* affordance the 9-city register treats as required. This is independent of any specific right; it is the meta-right to actually exercise the others.
3. **Adopt the *representational action* affordance.** GDPR Art. 80 and the report's framing both treat *collective challenge* (NGO-led representational action) as a distinct right. DTPR's `right_contest` reads as individual-only; clarifying that contestation can be representational widens the affordance.

## Differentiation from sibling rights-side sources

| Source | Cut | Density | DTPR fit |
|---|---|---|---|
| EU AI Act Articles 26/50/86 | Statutory rights (single jurisdiction) | High | Direct citation for individual elements |
| CoE Framework Convention 2024 | International-treaty rights + remedies | Medium-high | Multi-jurisdiction backing |
| **Ada Lovelace + AI Now + OGP 2021** | **Public-sector accountability mechanisms (multi-jurisdiction)** | **High** | **Closest "AIAAIC for rights"** |
| Wachter/Edwards scholarly literature | Right-to-explanation theory | High | Element-split rationale |
| DaPIS Icon Set | Icon prior art for rights | Medium | Visual design prior art |

## Strengths

- **Cross-jurisdictional empirical base** (40+ instruments, 12+ jurisdictions).
- **Public-sector framing** matches DTPR's deployment context.
- **First-wave focus** — the instruments studied have now had 5+ years of operational experience, so retrospective failure modes are documented.
- **Three-author institutional pedigree** — Ada Lovelace (UK), AI Now (US), OGP (multi-state); reduces single-jurisdiction bias.

## Self-acknowledged limitations

- **Not peer-reviewed.** Authority is institutional and empirical, not academic.
- **2021 timestamp.** Pre-dates EU AI Act (2024), CoE Framework Convention (2024), CCPA ADMT regs (2025). The instrument-level analysis is durable; the policy landscape has moved on.
- **Public-sector scope.** Private-sector AI rights are out of scope; DTPR's commercial-deployment users would need additional sources.

## Caution

This is a 2021 study; the policy landscape has shifted significantly. Use as the *cross-jurisdiction synthesis anchor*, not as a current statutory inventory. Pair with the EU AI Act and CoE Framework Convention entries for current-law citations.

## URLs (verified 2026-04-27)

- Executive summary (PDF): https://www.opengovpartnership.org/wp-content/uploads/2021/08/executive-summary-algorithmic-accountability.pdf
- Ada Lovelace project page: https://www.adalovelaceinstitute.org/project/algorithmic-accountability-public-sector/
- AlgorithmWatch — Automating Society 2020 (sibling cross-jurisdictional survey): https://automatingsociety.algorithmwatch.org/
- Cities for Digital Rights — 9 European cities common register standard: https://citiesfordigitalrights.org/9-european-cities-set-common-data-algorithm-register-standard-promote-transparent-ai
- Helsinki AI register white paper: https://ai.hel.fi/wp-content/uploads/White-Paper.pdf
