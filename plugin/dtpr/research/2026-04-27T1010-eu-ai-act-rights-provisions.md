---
source: https://artificialintelligenceact.eu/article/86/
date_accessed: 2026-04-27
authority_tier: regulatory-text
applicability_tags: [category:ai__rights, framework:eu-ai-act, jurisdiction:eu, concept:right-to-explanation, concept:algorithmic-accountability, pattern:notice-of-ai-use]
recheck_after: 2027-04-27
---

# EU AI Act — affected-person rights provisions (Articles 26, 27, 50, 86)

**Regulation (EU) 2024/1689** ("AI Act"), in force from 1 August 2024 with phased application through 2 August 2026 / 2027 depending on system class. The Act layers AI-specific rights *on top of* GDPR; both apply in parallel to high-risk AI systems that process personal data. Where GDPR's individual-rights cluster is rooted in Articles 13-22 (notice, access, erasure, portability, objection, ADM), the AI Act adds four affected-person hooks worth treating as discrete rights for DTPR purposes:

- **Article 26(11) — duty to inform affected persons.** Deployers of Annex III high-risk AI used to make decisions about natural persons must inform those persons that they are subject to the system. Operationalises the *right to know AI is in use* as a deployer-side obligation.
- **Article 27 — fundamental-rights impact assessment.** Public-service deployers and certain private deployers of high-risk AI must conduct an FRIA, accessible (in summary) to data subjects and supervisory authorities. Establishes a *right to assessment-of-impact-on-me* as an institutional artifact.
- **Article 50 — transparency obligations.** Right to be told you are interacting with an AI system (chatbots), to know that content is AI-generated (deepfakes / synthetic media), and to know when biometric categorisation or emotion-recognition is in operation. Distinct from Art. 26(11) because it triggers on the *interaction*, not on a downstream decision.
- **Article 86 — right to explanation of individual decision-making.** Affected persons subject to high-risk AI decisions producing legal or similarly significant effects on health, safety, or fundamental rights have a right to *clear and meaningful explanations of the role of the AI system in the decision-making procedure and the main elements of the decision taken*. Triggers when AI output *informs* a human decision — not only when the decision is solely automated. This is the *materially distinct* AI-rights addition over GDPR Article 22.

## Why this matters for DTPR

The AI Act is the strongest current statutory anchor for DTPR's `ai__rights` category. Three structural points:

1. **Notice-of-AI-use is not currently a DTPR element.** Art. 50 + Art. 26(11) together establish *citizens' right to know an AI is operating before any decision flows*. For kiosks, transit gates, library systems, and biometric checkpoints this is the single most public-facing right and the one most often violated in practice. DTPR's six current elements presume the citizen already knows AI is in use; the AI Act says that presumption is the wrong starting point.
2. **Art. 86 forces a split inside `right_algorithmic_transparency`.** The EU now treats *system-logic disclosure* (the ex-ante "this is how the system works" right rooted in GDPR Art. 13-15) and *individual-decision explanation* (the ex-post "this is what the system did to me" right of Art. 86) as **two separate rights with different triggers and different addressees**. DTPR's current `right_algorithmic_transparency` description ("how an AI system makes decisions that affect you, including… how it arrived at a particular decision") collapses both, making it harder for an author to disclose either correctly.
3. **Human-oversight-as-right is structurally implied.** Art. 14 obligates deployers to enable meaningful human oversight; Art. 86 obligates explanation. Together they give affected persons a *right to a non-AI path or a meaningfully-reviewed AI path* that DTPR currently bundles inside `right_contest`.

## Application options for DTPR

1. **Add `right_to_notice` as a new element.** Most defensible smallest change; closes the largest single gap.
2. **Split `right_algorithmic_transparency` into two siblings**: `right_system_logic_disclosure` and `right_individual_decision_explanation`. Aligns one-to-one with the GDPR/AI-Act split.
3. **Add `right_to_human_review` separate from `right_contest`.** Carries the prophylactic vs reactive distinction and matches the pattern California's 2025 ADMT regulations already adopted.

All three are independently citable to the AI Act articles above and to ICO guidance for the UK/post-Brexit cross-walk. A single corpus entry covering the four articles is sufficient; DTPR elements pin to article numbers in their `citation` field.

## Caution

The AI Act is in **phased application**. Article 50 applies from 2 August 2026; Article 86 applies from 2 August 2026 for high-risk systems that fall under Annex III post-effective-date. Citing Art. 86 as a live right *today* in a DTPR datachain is technically forward-dated for some system classes — flag this in any element description that hangs on Art. 86 specifically. The structural framing (system-logic vs decision-explanation) holds regardless of the application date.

## Cross-references

- **GDPR Articles 13-15, 22** — the prior-art rights the AI Act builds on. Cite alongside any DTPR element that pins to AI Act provisions; the two regimes are cumulative, not alternative.
- **Council of Europe Framework Convention on AI (2024)** — international treaty whose Chapter IV mirrors the AI Act's affected-person framing. See companion corpus entry.
- **Canada Directive on Automated Decision-Making (2019)** — federal-government implementation that pre-dates the AI Act and operationalises notice + explanation + human-in-the-loop at impact tiers.
- **ICO guidance — Individual Rights in AI Systems** — UK regulatory cross-walk that translates GDPR rights to AI contexts; useful for plain-language phrasing.

## URLs (verified 2026-04-27)

- AI Act Article 26: https://artificialintelligenceact.eu/article/26/
- AI Act Article 27: https://artificialintelligenceact.eu/article/27/
- AI Act Article 50: https://artificialintelligenceact.eu/article/50/
- AI Act Article 86: https://artificialintelligenceact.eu/article/86/
- ICO — Rights related to ADM and profiling: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/rights-related-to-automated-decision-making-including-profiling/
- ICO — Individual rights in AI systems: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/how-do-we-ensure-individual-rights-in-our-ai-systems/
