---
source: https://arxiv.org/html/2502.05324v1
date_accessed: 2026-04-21
authority_tier: peer-reviewed
applicability_tags: [category:ai__risks_mitigation, concept:citizen-facing-disclosure, concept:public-space-ai, pattern:ai-city-register]
recheck_after: 2027-04-21
content_hash: sha256-a474aa8ebfb1c3f7e79af7ed7a23552143de8f4c30bb5e6470b5c09b53057bf5
---

# Atlas of AI Risks — citizen-facing AI risk disclosure

**"Atlas of AI Risks: Enhancing Public Understanding of AI Risks"**, arXiv 2502.05324 (February 2025). 140-participant user study; explicit motivation is citizen-facing disclosure for AI city registers.

## Why this matters for DTPR

The Atlas paper is the closest published prior art to DTPR's goal: **translating academic AI-risk taxonomies into formats that ordinary citizens can use to assess public-space AI deployments.** It does not cite or build on the MIT AI Risk Repository; it draws on a different academic lineage (Weidinger et al.'s sociotechnical framework) but reaches a similar citizen-facing target.

Directly names the AI city register use case — Helsinki's register is the reference model — and proposes integration so residents can assess risks before local policy debates.

## Six design requirements (from formative study, n=40)

| Req | Plain-language focus |
| --- | --- |
| R1 Multiple Uses | Help people consider what the technology can actually do |
| R2 Balanced Assessment | Present risks, benefits, AND mitigations together |
| R3 Structured Uses | Categorize applications (e.g., daily vs. non-daily uses) |
| R4 Reduced Complexity | Progressive disclosure (tooltip → detailed profile) |
| R5 Broad Appeal | Avoid jargon; relate to common concerns |
| R6 Engaging Exploration | Interactive elements with narrative flow |

R2 (benefits + risks + mitigations together) and R4 (progressive disclosure) are most structurally consequential for DTPR.

## Sociotechnical three-layer taxonomy

Rather than inventing a new risk taxonomy, Atlas adopts **Weidinger et al.'s three-layer framing**:

1. **Capability layer** — technical failures (poor model performance, bias in training data).
2. **Human interaction layer** — user reliance and misuse risks (overtrust, anthropomorphization).
3. **Systemic impact layer** — societal consequences (surveillance, inequality, information pollution).

Each risk in the Atlas's database is tagged with a layer. Benefits and mitigations are also grouped by layer.

## Impact-assessment card structure

**Brief (tooltip):** use illustration · one-sentence description · EU AI Act risk label.

**Detailed (profile):** summary with illustration · long description + overall risk level · Benefits by layer · Risks by layer · Mitigations with "who is affected" checkboxes.

Progressive disclosure: brief for scannable public signage, detailed for citizens who dig in.

## Plain-language framing discipline

Authors "carefully phrased the mitigations to be understandable regardless of (non)technical background."

Example: instead of "implement differential privacy," mitigations use action-oriented language ("the data is modified before it leaves the system so individual people cannot be identified").

The paper generated 138 uses for a single technology (facial recognition) including:
- Unlocking devices (daily use)
- Crime suspect identification (non-daily, high-risk)
- Tracking illegal poaching (non-daily, low-risk)

## Comparison with other frameworks

Atlas explicitly compares against:

- **IBM watsonx AI Risk Atlas** — technical risk visualization.
- **AI Incident Database (AIID)** — expert-focused incident cataloging.
- **NIST AI Risk Management Framework** — regulatory compliance tool.

Critique: existing tools are either too technical (confusion matrices, activation maps) or expert-focused (impact assessment reports). The Atlas fills the gap for non-technical citizens.

Does **not** reference MIT AI Risk Repository — parallel effort, different lineage.

## Application to DTPR

Three structural ideas applicable to DTPR's `ai__risks_mitigation` category:

1. **Sociotechnical three-layer organization.** Group risk elements by Capability / Interaction / Systemic layer — not by MIT domain and not (only) by functional mode.
2. **Progressive disclosure contract.** Each risk element carries both a one-sentence citizen-facing framing (tooltip) and a longer detailed explanation.
3. **Benefits + Risks + Mitigations triplet.** DTPR currently has Risks & Mitigation together but no Benefits. Question for DTPR stewards: should Purpose serve as the "benefit" side, or should risks be balanced by a per-risk "what this buys us" affordance?

## Citation for DTPR

For citizen-facing plain-language framings of risks, the Atlas methodology (140-user study, progressive disclosure, sociotechnical layer grouping) is the strongest prior art. Use MIT for the rigorous risk catalog; use Atlas for the citizen-facing translation layer.
