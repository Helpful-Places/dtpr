---
source: https://arxiv.org/abs/2406.17864
date_accessed: 2026-04-21
authority_tier: peer-reviewed
applicability_tags: [category:ai__risks_mitigation, framework:air-2024, jurisdiction:eu, jurisdiction:us, jurisdiction:cn, concept:regulatory-compliance]
recheck_after: 2027-04-21
content_hash: sha256-a474aa8ebfb1c3f7e79af7ed7a23552143de8f4c30bb5e6470b5c09b53057bf5
---

# AIR 2024 — AI Risk Categorization from Government and Corporate Policies

**"AI Risk Categorization Decoded (AIR 2024): From Government Regulations to Corporate Policies"**, arXiv 2406.17864 (June 2024). Derived from 8 government policies (EU, US, China) and 16 company policies across 9 foundation model developers.

## Structure: 4 tiers, 314 specific risks

| Level | Count | Example |
|---|---|---|
| Level-1 | 4 | System & Operational Risks |
| Level-2 | 16 | Security Risks; Operational Misuse |
| Level-3 | 45 | Confidentiality, Integrity, Availability |
| Level-4 | 314 | Malware generation; Unauthorized data access |

### Level-1 categories

1. **System & Operational Risks** — cybersecurity compromise, unsafe deployment in regulated industries.
2. **Content Safety Risks** — hate, harassment, explicit material, CSAM.
3. **Societal Risks** — political manipulation, economic harm, defamation, deception.
4. **Legal & Rights-Related Risks** — fundamental rights, discrimination, privacy, criminal activities.

## Why we surveyed it

AIR 2024 is a major contemporaneous AI risk taxonomy with the highest granularity (314 risks) of any current academic cut. It bottom-up-clusters risks from real policy text across three jurisdictions.

## Why it's NOT the right fit for DTPR

**Compliance-focused, not citizen-facing.** The paper explicitly targets policymakers, company policy teams, and compliance officers. Direct quote: "This work can tangibly contribute to AI safety by serving as the basis for improved policies, regulations, and benchmarks."

Structural signals:
- Technical jargon density without lay definitions.
- 14-section academic structure requiring specialized knowledge.
- No user-protective guidance (e.g., "how to recognize unsafe AI").
- Focus on institutional risk mitigation rather than individual user education.

## Useful for DTPR as

- **Regulatory harmonization reference.** If DTPR wants to map its risk elements to EU AI Act / US EO / China AI governance, AIR 2024's Level-3 and Level-4 granularity is the best cross-jurisdictional anchor.
- **Gap detection.** AIR 2024 identified "Disempowering Workers" as prohibited by US EO but absent from all 16 company policies — the kind of gap a civic disclosure framework should surface.

## Regional divergence noted

Chinese policies emphasize "Disrupting Social Order"; US/EU emphasize democratic participation and vulnerable group protection. For a jurisdiction-agnostic civic disclosure framework, DTPR should stay closer to the lowest common denominator (privacy, bias, safety) and avoid category names that import one jurisdiction's framing.
