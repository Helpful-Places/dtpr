---
source: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2903469
date_accessed: 2026-04-27
authority_tier: peer-reviewed
applicability_tags: [category:ai__rights, concept:right-to-explanation, concept:contestability, concept:algorithmic-accountability]
recheck_after: 2027-04-27
---

# Wachter / Edwards / Veale / Kaminski — right-to-explanation scholarship (paired entry)

A paired peer-reviewed entry covering the foundational scholarly cross-walk between *system-logic disclosure* and *individual-decision explanation* in algorithmic-rights law, plus the contestability literature that builds on it. These are the closest scholarly anchors for any DTPR proposal that splits or re-bundles `right_algorithmic_transparency` and `right_contest`.

## The four core papers

### Wachter, Mittelstadt & Floridi (2017) — "Why a Right to Explanation of Automated Decision-Making Does Not Exist in the GDPR"

International Data Privacy Law 7(2): 76-99. The canonical paper establishing that **GDPR Articles 13-15 give a right to be informed about *system logic* (ex-ante)** but **not a right to explanation of an *individual decision* (ex-post)**. Argues Article 22 + Recital 71 do not cure this — Recitals are not binding and Article 22's "right to obtain human intervention, to express their point of view and to contest the decision" is procedural, not explanatory.

The ex-ante / ex-post split this paper introduced is the structural distinction every later regulator (EU AI Act Art. 86, CCPA ADMT regs 2025, ICO guidance) has eventually codified.

URL: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2903469 / https://academic.oup.com/idpl/article/7/2/76/3860948

### Edwards & Veale (2017/2018) — "Slave to the Algorithm" / "Enslaving the Algorithm: From a Right to an Explanation to a Right to Better Decisions"

Duke Law & Technology Review 16: 18-84 (2017); IEEE Security & Privacy 16(3) (2018). Coins the **"transparency fallacy"** — that explanation rights alone do not cure algorithmic harm. Argues better remedies sit in *erasure* (GDPR Art. 17), *portability* (Art. 20), *DPIAs* (Art. 35), and *certification regimes*. Highly relevant to DTPR because it argues *against* over-indexing on transparency-as-cure: a citizen-facing disclosure system should treat transparency as one rights affordance among several, not the central one.

URLs: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2972855 / https://strathprints.strath.ac.uk/63317/1/Edwards_Veale_SPM_2018_Enslaving_the_algorithm_from_a_right_to_an_explanation_to_a_right_to_better_decisions.pdf

### Kaminski (2019) — "Binary Governance: Lessons from the GDPR's Approach to Algorithmic Accountability"

Southern California Law Review 92(6): 1529-1616. Frames algorithmic accountability as a *binary system*: **individual due-process rights** (notice, access, explanation, contestation) + **collaborative governance** (DPIAs, codes of conduct, supervisory authorities). Identifies three *concern-clusters* that motivate algorithmic rights:

1. **Dignitary** — being told why the machine treated you the way it did, regardless of outcome.
2. **Justificatory** — the system being legitimately accountable to public norms.
3. **Instrumental** — improving system accuracy / reducing error rates.

Useful for DTPR because the trichotomy explains *why* a public-facing rights icon system exists — citizens encountering a kiosk are primarily motivated by the dignitary concern, even when the legal text codifies the instrumental one.

URL: https://southerncalifornialawreview.com/wp-content/uploads/2019/12/92_6_Kaminski.pdf

### Kaminski & Malgieri (2025) — "The Right to Explanation in the AI Act"

Most current scholarly cross-walk between GDPR Article 22 and EU AI Act Article 86. Argues Art. 86 introduces a **materially distinct** right that triggers on AI outputs *informing* human decisions, not only on solely-automated decisions. Confirms the structural recommendation: the `right_to_explanation` is now *two rights*, not one, and DTPR's `right_algorithmic_transparency` should reflect the split.

URL: https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5194301

## Contestability literature (companion)

Two adjacent peer-reviewed papers worth tracking when DTPR works on `right_contest`:

- **Alfrink, Keller, Kortuem & Doorn (2022) — "Contestable AI by Design"** (*Minds and Machines* 32: 613-639). Frames contestability as a *design property* with three distinct affordances: (a) contesting an *individual decision*, (b) contesting *system design or deployment*, (c) *collective contestation*. Suggests `right_contest` is structurally three things bundled. URL: https://link.springer.com/article/10.1007/s11023-022-09611-z. Companion site: https://contestable.ai/
- **Henin & Le Métayer (2021) — "Beyond Explainability: Justifiability and Contestability in Algorithmic Decision-Making"** (*AI & SOCIETY*). Argues *justification* (a normative claim that the decision was warranted) is distinct from both *explanation* and *contestation*. Three separate user affordances; only one currently appears in the DTPR `ai__rights` category. URL: https://link.springer.com/article/10.1007/s00146-021-01251-8

## Why this matters for DTPR

The four papers (plus the two contestability companions) provide the scholarly basis for **two structural moves** in DTPR's `ai__rights` category:

1. **Splitting `right_algorithmic_transparency`.** Wachter (2017) + Kaminski-Malgieri (2025) make it indefensible to ship a single transparency element that conflates GDPR Art. 13-15 with AI Act Art. 86. The split is recognised across academia, the EU regulator, and the California regulator. DTPR can either keep one element with a cleaned-up description that picks one side of the split, or split into two siblings.
2. **Unbundling `right_contest`.** Alfrink (2022) + Henin & Le Métayer (2021) name *human review*, *appeal of issued decision*, *system-design challenge*, and *justification* as up to four distinct affordances. DTPR's current `right_contest` description bundles "request human review", "provide additional information", "express your point of view", and "have the decision reconsidered" into one icon. The literature would support a split into at least `right_to_human_review` and `right_to_appeal`.

The Edwards & Veale (2017) paper is the *cautionary* citation: it argues against treating any single right as the central remedy. DTPR's icon-by-icon rights enumeration is structurally aligned with this caution — multiple distinct affordances, each citable individually.

## Strengths

- **Foundational citation density.** Wachter (2017) is the most-cited scholarly paper on right-to-explanation; later papers cross-reference it as canonical.
- **Tracked by regulators.** The ex-ante / ex-post distinction has been codified in EU AI Act Art. 86 (2024) and CCPA ADMT regs (2025). The scholarly framing is now law.
- **Stable across years.** Wachter (2017), Edwards (2017), Kaminski (2019), and the contestability papers (2021-22) have all been cited by every later piece of scholarship in this domain. Low risk of being superseded.

## Self-acknowledged limitations

- **EU/UK-centric.** All four papers anchor to GDPR; cross-jurisdictional applicability requires inference. The Kaminski-Malgieri 2025 paper extends to the EU AI Act but does not cover US, Canadian, or APAC frameworks.
- **Pre-AI-Act for three of the four.** Wachter, Edwards, and Kaminski (2019) all pre-date the AI Act; Kaminski-Malgieri (2025) is the bridge but is still pre-print rather than journal-published as of access date.
- **Theoretical, not empirical.** None of these papers report user-comprehension studies. For DTPR's plain-language layer, pair with DaPIS (which does have user studies) and the broader XAI-comprehension literature.

## Application to DTPR

1. **Cite Wachter (2017) + Kaminski-Malgieri (2025) on any element-design proposal that splits or re-words `right_algorithmic_transparency`.** The combined citation is the strongest scholarly anchor available.
2. **Cite Alfrink (2022) + Henin & Le Métayer (2021) on any element-design proposal that splits `right_contest`.** Three distinct affordances; the literature supports any of the two-way or three-way splits.
3. **Cite Edwards & Veale (2017) as the cautionary frame** — DTPR's icon-by-icon rights model is structurally aligned with their argument that no single transparency right is the central cure.

## URLs (verified 2026-04-27)

- Wachter, Mittelstadt & Floridi (SSRN): https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2903469
- Wachter et al. (Oxford IDPL): https://academic.oup.com/idpl/article/7/2/76/3860948
- Edwards & Veale (SSRN): https://papers.ssrn.com/sol3/papers.cfm?abstract_id=2972855
- Edwards & Veale (Strathprints PDF): https://strathprints.strath.ac.uk/63317/1/Edwards_Veale_SPM_2018_Enslaving_the_algorithm_from_a_right_to_an_explanation_to_a_right_to_better_decisions.pdf
- Kaminski (Southern California Law Review): https://southerncalifornialawreview.com/wp-content/uploads/2019/12/92_6_Kaminski.pdf
- Kaminski & Malgieri (SSRN): https://papers.ssrn.com/sol3/papers.cfm?abstract_id=5194301
- Alfrink et al. (Springer): https://link.springer.com/article/10.1007/s11023-022-09611-z
- Henin & Le Métayer (Springer): https://link.springer.com/article/10.1007/s00146-021-01251-8
- Contestable AI by Design (companion site): https://contestable.ai/
