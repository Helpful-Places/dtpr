---
source: https://airisk.mit.edu/
date_accessed: 2026-04-21
authority_tier: peer-reviewed
applicability_tags: [category:ai__risks_mitigation, framework:mit-ai-risk-repository, concept:algorithmic-accountability, concept:public-space-ai]
recheck_after: 2027-04-21
content_hash: sha256-a474aa8ebfb1c3f7e79af7ed7a23552143de8f4c30bb5e6470b5c09b53057bf5
---

# MIT AI Risk Repository v4 — taxonomies

Living meta-review of AI risks maintained by MIT FutureTech. **As of April 2026: v4, with 1,725 risks drawn from 74 frameworks.** April 2026 governance-landscape update also classifies ~1000 AI governance documents from CSET's AGORA dataset across six taxonomies.

## Two orthogonal taxonomies

The repository maintains **two independent cuts** over the same risk dataset. Both apply to every risk.

### Causal Taxonomy (3 axes)

| Axis | Values |
| --- | --- |
| **Entity** | AI / Human / Other |
| **Intent** | Intentional / Unintentional / Other |
| **Timing** | Pre-deployment / Post-deployment / Other |

2×2×2 framing (with "Other" escape hatches) answers *how a risk arises*, not *what it does to people*.

### Domain Taxonomy (7 domains, 24 subdomains)

| # | Domain | Subdomains |
| --- | --- | --- |
| 1 | Discrimination & Toxicity | 1.1 Unfair discrimination & misrepresentation · 1.2 Exposure to toxic content · 1.3 Unequal performance across groups |
| 2 | Privacy & Security | 2.1 Privacy compromise via leakage or inference · 2.2 AI system security vulnerabilities |
| 3 | Misinformation | 3.1 False or misleading information · 3.2 Pollution of information ecosystem / loss of consensus reality |
| 4 | Malicious Actors | 4.1 Disinformation, surveillance, influence at scale · 4.2 Fraud, scams, targeted manipulation · 4.3 Cyberattacks, weapons, mass harm |
| 5 | Human-Computer Interaction | 5.1 Overreliance and unsafe use · 5.2 Loss of human agency and autonomy |
| 6 | Socioeconomic & Environmental | 6.1 Power centralization · 6.2 Inequality and employment decline · 6.3 Devaluation of human effort · 6.4 Competitive dynamics · 6.5 Governance failure · 6.6 Environmental harm |
| 7 | AI System Safety, Failures & Limitations | 7.1 Goal conflict · 7.2 Dangerous capabilities · 7.3 Lack of capability/robustness · 7.4 Lack of transparency/interpretability · 7.5 AI welfare and rights · 7.6 Multi-agent risks |

Multi-agent risks (7.6) was added in the April 2025 update. AI welfare/rights (7.5) predates it.

## Structural property relevant to DTPR

**MIT's Domain Taxonomy is mode-agnostic.** It categorizes risks by *what kind of harm occurs*, not *what kind of AI system causes it*. There is no "Perceptive AI risks" domain; facial-recognition misidentification sits inside 1.1 (unfair discrimination) or 2.1 (privacy), chosen by the harm framing, not by the system architecture.

This creates a direct structural tension for frameworks (like DTPR's April 2026 proposal) that want to map risks to functional modes (Analytical / Semantic / Generative / Agentic / Perceptive / Physical). Any mode→domain mapping is editorial, not inherited from MIT.

## Public-space AI: coverage assessment

Among the 24 subdomains, the ~12 most citizen-relevant for public-space AI disclosure:

- 1.1 Unfair discrimination (bias in analytical decisioning)
- 1.2 Exposure to toxic content (for generative systems displayed publicly)
- 1.3 Unequal performance across groups (face/voice recognition degrading for minority groups)
- 2.1 Privacy compromise (PII leakage, biometric inference)
- 2.2 Security vulnerabilities (hackable public systems)
- 3.1 False or misleading information (hallucination on public displays)
- 4.1 Surveillance at scale
- 5.1 Overreliance and unsafe use (blind trust in AI outputs)
- 5.2 Loss of human agency (automated decisions with no appeal)
- 6.6 Environmental harm (data-center energy)
- 7.3 Lack of capability/robustness (system fails when needed)
- 7.4 Lack of transparency/interpretability (black-box decisioning)

## Gaps relevant to public-space AI

Risks the MIT taxonomy under-represents for citizen-facing disclosure in public space:

- **Misidentification as a specific harm.** Subsumed under 1.1/1.3; deserves its own citizen-facing framing.
- **Spatial access equity and chilling effects.** "Who goes where, who is watched" — partially in 4.1 and 5.2 but not named.
- **Rights-access friction.** "No way to contest a decision" — subset of 7.4, not prominent.
- **Cumulative exposure across overlapping systems.** Each system described alone; stacked surveillance infrastructure is not a MIT domain.
- **Physical safety in shared space.** 7.3 (robustness) touches it; autonomous robots in pedestrian areas is a distinct concern.

## Citation for DTPR

For DTPR's `ai__risks_mitigation` element catalog, MIT's 24 subdomains provide the rigorous backbone. Plain-language framing and citizen-facing affordances come from a different lineage — see the Atlas of AI Risks entry in this corpus.
