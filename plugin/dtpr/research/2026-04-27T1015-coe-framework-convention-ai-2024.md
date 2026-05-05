---
source: https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence
date_accessed: 2026-04-27
authority_tier: regulatory-text
applicability_tags: [category:ai__rights, framework:coe-framework-convention, jurisdiction:eu, jurisdiction:us, jurisdiction:uk, concept:right-to-remedy, concept:algorithmic-accountability]
recheck_after: 2027-04-27
---

# Council of Europe Framework Convention on AI (2024)

**Council of Europe Framework Convention on Artificial Intelligence and Human Rights, Democracy and the Rule of Law** ("Vilnius Convention"), opened for signature 5 September 2024. The first **legally binding international treaty** specifically on AI. Initial signatories: EU, United Kingdom, United States, Canada, Israel, Japan, Norway, Switzerland, Ukraine, Iceland, Andorra, Georgia, Moldova, San Marino. Drafted by the CoE Committee on AI (CAI) over 2022-2024.

## Structural cut: rights as remedies, not just transparency

The convention is the cleanest available example of a rights framework that **separates remedies from transparency** at the document level — the structural move DTPR's `ai__rights` category currently does not make.

- **Chapter II (Articles 4-5):** General obligations — protection of human rights, integrity of democratic processes and rule of law.
- **Chapter III (Articles 6-13):** Principles — *Equality and non-discrimination*, *Privacy and personal data protection*, *Accountability and responsibility*, *Transparency and oversight*, *Reliability*, *Safe innovation*, *Human dignity and individual autonomy*.
- **Chapter IV (Articles 14-15):** **Remedies** — accessible and effective remedies for human-rights violations; **procedural safeguards** including the obligation to make affected persons *aware* that they are interacting with an AI system, and to provide *information sufficient to contest the decision and seek human review* where AI systems materially affect them.

Chapter IV is the structural anchor for DTPR. It treats *awareness*, *procedural remedy*, and *effective remedy* as three distinct affected-person obligations, not a single transparency principle.

## Why this matters for DTPR

1. **The remedies/transparency split is now codified at international-treaty level.** Any DTPR element that bundles "right to know" with "right to appeal" into one icon is structurally weaker than the current global consensus. The CoE Convention names them separately.
2. **The "awareness" hook is a citizen-facing right, not a system property.** Article 15 requires deployers to make affected persons aware of AI interaction in a manner accessible to them. This maps onto the same gap that EU AI Act Article 50 surfaces — DTPR currently has no element for `right_to_notice`.
3. **The convention applies to *AI systems used in the public sector and by private actors acting on behalf of public authorities*.** This is precisely DTPR's target deployment context (transit, libraries, kiosks, civic services), not the wider commercial AI surface. Cite the convention specifically for the public-space AI use case.
4. **It is multi-jurisdictional.** Unlike the EU AI Act (EU only) or Canada DADM (federal-Canada only), the convention covers signatories across North America, Europe, and OECD partners. For DTPR's cross-jurisdiction posture this is the broadest single anchor available.

## Differentiation from adjacent frameworks

| Framework | Cut | Status |
|---|---|---|
| GDPR (2016/18) | Data-subject rights (notice, access, erasure, ADM) | EU regulation |
| EU AI Act (2024) | Risk-tiered AI obligations + affected-person rights (Art. 26, 50, 86) | EU regulation |
| White House Blueprint (2022, archived 2025) | Five citizen-facing principles | US non-binding (now historical) |
| UNESCO Recommendation (2021) | Values + principles + policy actions | Soft law, 193 states |
| OECD AI Principles (2019, updated 2024) | Five values-based principles | Soft law, 47 jurisdictions |
| **CoE Framework Convention** | **Principles + dedicated remedies chapter** | **Binding treaty, multi-jurisdiction** |

## Application to DTPR

Two integration moves the convention enables:

1. **Cite Article 15 as the statutory anchor for a new `right_to_notice` element.** Strengthens the EU-AI-Act citation by adding multi-jurisdictional weight.
2. **Cite Article 14 as the anchor for keeping `right_contest` while clarifying that "remedy" includes both *procedural review* and *substantive challenge to a decision*.** The convention's language ("information sufficient to contest the decision and seek human review") is plain enough to lift directly into the `right_contest` description if DTPR opts to keep it bundled.

If DTPR adopts a *split* approach (separate `right_to_human_review` from `right_contest`), the convention's framing supports this too — Article 14 lists both *human-review* and *contestation-of-decision* as accessible-remedy components.

## Strengths

- **Binding treaty status** — the only one in this domain.
- **Cross-jurisdictional** — North America + Europe + select OECD signatories.
- **Public-sector applicability** — direct match for DTPR's deployment context.
- **Plain language** — drafting style is closer to public-facing policy than to regulatory minutiae.

## Caution

- **Ratification is in progress.** As of late 2025 the convention is signed but not yet ratified by most signatories; legal force depends on each state's domestic ratification.
- **Implementation is left to signatories.** The convention sets obligations but does not prescribe specific mechanisms; each jurisdiction may operationalise differently. Cite the convention as a *framework anchor*, not as a prescriptive operating standard.

## URLs (verified 2026-04-27)

- CoE Framework Convention page: https://www.coe.int/en/web/artificial-intelligence/the-framework-convention-on-artificial-intelligence
- Wikipedia overview (treaty status, signatories): https://en.wikipedia.org/wiki/Framework_Convention_on_Artificial_Intelligence
