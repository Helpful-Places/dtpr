---
source: https://arxiv.org/html/2407.01294v1
date_accessed: 2026-04-21
authority_tier: peer-reviewed
applicability_tags: [category:ai__risks_mitigation, concept:citizen-facing-disclosure, pattern:harm-taxonomy, concept:algorithmic-accountability]
recheck_after: 2027-04-21
content_hash: sha256-a474aa8ebfb1c3f7e79af7ed7a23552143de8f4c30bb5e6470b5c09b53057bf5
---

# AIAAIC Collaborative, Human-Centred Taxonomy of AI Harms

**"A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms"**, arXiv 2407.01294 (July 2024, revised November 2024). Developed by the AIAAIC Repository working group — 25+ volunteer contributors from journalism, law, sociology, UX design, and computer science across 10+ countries, operating independently of corporate/government funding.

## Citation and license

**License (both paper and taxonomy): Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0).** Confirmed on both the arXiv paper page and the OECD.AI catalog entry for the AIAAIC Repository. This is one of the most permissive open licenses but carries a **ShareAlike viral clause**: derivative works of the taxonomy must be distributed under the same license.

**Authors (v2, November 2024):** Gavin Abercrombie, Djalel Benbouzid, Paolo Giudici, Delaram Golpayegani, Julio Hernandez, Pierre Noro, Harshvardhan Pandit, Eva Paraschou, Charlie Pownall, Jyoti Prajapati, Mark A. Sayre, Ushnish Sengupta, Arthit Suriyawongkul, Ruby Thelot, Sofia Vei, Laura Waltersdorfer.

**DOI:** https://doi.org/10.48550/arXiv.2407.01294

**Project repository:** https://www.aiaaic.org/ (living taxonomy + incident database; 1,500+ indexed incidents as of mid-2024).

**Suggested citation (author-short form):**
> Abercrombie et al. (2024). A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms. arXiv:2407.01294 [cs.LG]. CC BY-SA 4.0.

## Why this matters for DTPR

This is the strongest **citizen-facing, outcome-oriented** AI risk taxonomy we've surveyed. Unlike MIT (harm-type-agnostic, academic) or AIR 2024 (compliance-focused), AIAAIC is designed for **lay audiences alongside practitioners** and organizes risks by *what happens to the person*, not by how the system causes it.

Stated intended users (direct quote): "civil society organisations, educators, policymakers, product teams and **the general public**."

## Structure: 9 harm types, 69 specific harms

Two-level hierarchy. Harm types are the organizing cut; specific harms are the leaves. Specific harms are **not mutually exclusive** — one incident can trigger multiple harms across categories.

| # | Harm Type | Definition |
|---|---|---|
| 1 | **Autonomy** | Loss of/restrictions to decision-making rights and identity control |
| 2 | **Physical** | Physical injury to individuals/groups or property damage |
| 3 | **Psychological** | Emotional/mental health impairment (direct or indirect) |
| 4 | **Reputational** | Damage to reputation of individuals/groups/organizations |
| 5 | **Financial & Business** | Financial losses or organizational harm from system misuse |
| 6 | **Human Rights & Civil Liberties** | Compromise of fundamental freedoms and rights |
| 7 | **Societal & Cultural** | Harms affecting community/societal functioning and culture |
| 8 | **Political & Economic** | Political manipulation and institutional damage |
| 9 | **Environmental** | Environmental degradation from system operation |

The cut is **outcome-oriented from the victim's perspective** — "what could happen to me" — rather than cause-oriented ("what kind of failure is this"). This is the structural difference from MIT and Weidinger.

## Methodology (1,500+ incidents)

1. **Use case analysis**: surveyed ~50 repository users.
2. **Literature review**: assessed existing taxonomies.
3. **Expert outreach**: feedback from NGO/academic specialists.
4. **Annotation testing**: 1,000+ annotations on 39 incidents (Feb–Apr 2024) using a custom open-source tool.
5. **Community validation**: ongoing review via fortnightly open working group since June 2023.
6. **Consensus mechanism**: "rough consensus" (IETF RFC 7282) with Krippendorff's alpha scoring.

Baseline definition used: harm is *"physical, psychological or other form of damage to third-parties"* resulting from AI/algorithmic/automation systems.

## Six intended use cases

Directly echo DTPR's goals for public-facing AI disclosure:

- **Literacy & education** (demystify technology).
- **Journalism** (evidence-based reporting).
- **Advocacy** (NGO resource tracking).
- **Citizen reporting** (accessible complaint mechanisms).
- **Policy-making & enforcement**.
- **Risk management**.

## Differentiation from adjacent frameworks

| Framework | Cut | Audience |
|---|---|---|
| MIT AI Risk Repository | 7 domains × 24 subdomains, cause-oriented | Academic/policy |
| AIR 2024 | 4 tiers × 314 risks, policy-grounded | Compliance |
| Weidinger 2023 (3-layer) | Capability / Interaction / Systemic | Evaluators |
| Shelby et al. | Sociotechnical harm types | Survey of 172 papers |
| OECD AI Classification | System-dimension (data, model, task) | Policy |
| **AIAAIC** | **9 harm types, victim-oriented** | **Public + practitioners** |

## Strengths

- **Data-driven**: built from 1,500+ documented real incidents.
- **Independent**: no corporate/government funding.
- **Multidisciplinary**: diverse backgrounds reduce disciplinary bias.
- **Cross-system**: applies to AI *and* algorithmic *and* automation (not LLM-only).
- **Machine-readable**: supports compliance (e.g., EU AI Act Article 17).
- **Living document**: continuous annotation rounds, community contribution pathways.

## Self-acknowledged limitations

- **Not yet user-tested outside the working group.** Usability for lay users is "unproven" at time of writing. (Atlas of AI Risks is user-tested, n=140; AIAAIC is structurally citizen-oriented but unvalidated.)
- **Oversimplification risk**: categorical framing may reduce complex phenomena inappropriately.
- **Normalisation effect**: categorization may dampen perceived severity for specific groups.
- **Political nature**: "taxonomies are political projects" — classification schemes can crowd out mitigation action.
- **Ongoing maintenance**: labour-intensive, long-term sustainability uncertain.
- **Future gaps**: authors quote UN AI Advisory Board — comprehensive risk listing is "a fool's errand"; new categories will require addition.

## Application to DTPR

Three integration options:

1. **Adopt AIAAIC as primary organizing cut.** 9 harm types become the DTPR risk category's organizing dimension. Risk elements inherit from AIAAIC's 69 specific harms.
2. **Hybrid with MIT.** MIT provides catalog breadth (24 subdomains); AIAAIC provides the citizen-facing cut (9 harm types). Each DTPR risk element is tagged with one MIT subdomain + one or more AIAAIC harm types.
3. **AIAAIC-inspired DTPR cut.** DTPR invents its own citizen-facing risk types informed by AIAAIC's structure but scoped to DTPR's signage constraints. Costs harmonization with AIAAIC.

Option 1 is the simplest; option 2 is the most rigorous; option 3 is the most customizable.

## Caution

AIAAIC's unvalidated-for-lay-users status is the single biggest risk for DTPR adoption. Atlas of AI Risks (the Weidinger-derived alternative) has 140-user validation but borrows a cause-oriented (3-layer) cut. Adopting AIAAIC commits DTPR to a structurally stronger framing that is less empirically tested.
