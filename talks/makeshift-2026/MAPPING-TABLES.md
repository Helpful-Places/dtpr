# Act 3 mapping tables — v1 drafts

**Status: v1 research draft. Awaiting user review before locking into slides 22, 24, 25.**

The point of these tables is not to claim 1:1 equivalence between DTPR and external frameworks — it's to show that DTPR's category structure reads coherently across the live regulatory and research landscape. The talk's spoken line lands the framing:

> *"We don't replace any of these. We let a person read across them."*

Each table below has a brief rationale, the mapping itself, and notes calling out anywhere the alignment is approximate or contested.

---

## § Risks — DTPR `risks_mitigation` ↔ AIAAIC ↔ EU AI Act

**Rationale.** DTPR's risk catalog is an *adoption* of AIAAIC's victim-centered taxonomy (Abercrombie et al. 2024, arXiv:2407.01294, CC BY-SA 4.0), not a derivation. The first column is essentially a re-labeling of AIAAIC's nine harm types, kept verbatim where possible to preserve the ShareAlike commons. The third column shows where the same harm dimension appears in the EU AI Act framework — primarily through Charter of Fundamental Rights references, prohibited-practice articles, and the Annex III high-risk categorization.

| DTPR (victim-centered) | AIAAIC harm type | EU AI Act framing |
|---|---|---|
| Loss of autonomy | Autonomy | Charter Art. 1 (dignity) · Art. 5(1)(a)–(b) prohibited subliminal / exploitative manipulation |
| Physical harm | Physical | Health & safety as a regulated dimension across Art. 9 (risk management for high-risk systems) |
| Psychological harm | Psychological | Charter Art. 3 (right to integrity, mental aspect) · referenced in Art. 27 FRIA scope |
| Reputational harm | Reputational | Charter Arts. 7 (private life), 8 (data protection) — defamation / privacy intersection |
| Financial & business harm | Financial & Business | Art. 5(1)(c) prohibited social scoring · Annex III §5(b) creditworthiness · consumer-protection acquis |
| Civil liberties harm | Human Rights & Civil Liberties | Charter Arts. 7, 8, 11 (expression), 12 (assembly), 21 (non-discrimination) · Annex III §1 (biometrics), §6 (law enforcement) |
| Societal & cultural harm | Societal & Cultural | Recital 7 (fundamental rights) · Annex III §8 (democratic processes) |
| Political & economic harm | Political & Economic | Art. 27 FRIA (rule of law concerns) · Annex III §8 (electoral, democratic processes) |
| Environmental harm | Environmental | Recital 27 · Art. 95 (voluntary codes of conduct, environmental sustainability) |

**Notes & caveats.**
- The EU AI Act doesn't categorize harms in the AIAAIC sense. The framing is "where this harm dimension surfaces in the Act's text" — *not* "the Act explicitly recognizes this harm category."
- "Charter Art. X" refers to the Charter of Fundamental Rights of the EU (2000/C 364/01), which the AI Act repeatedly references as its rights baseline.
- Annex III item numbering: I'm using the post-2024 final-text numbering (8 categories). If the user wants pre-publication numbering or trilogue-era numbering, adjust.
- Art. 95 (codes of conduct) is voluntary, not mandatory — it's the closest thing the Act has to an environmental hook for general systems.
- DTPR also has a `risk_assessment` element used as a process-level marker; not mapped here.

**Sources.**
- Abercrombie et al. 2024 — A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms. arXiv:2407.01294. CC BY-SA 4.0.
- Regulation (EU) 2024/1689 (AI Act), final text, esp. Articles 5, 9, 27, 50, 95 + Annex III + Recitals 7, 27.
- Charter of Fundamental Rights of the European Union (2000/C 364/01).

---

## § Function & Autonomy — DTPR `functional_modes` + autonomy axis ↔ EU Annex III ↔ OECD AI System Classification

**Rationale.** DTPR splits "what does the AI do?" into two orthogonal axes: *functional mode* (the verb — analytical, semantic, generative, agentic, perceptive, physical) and *autonomy* (who decides, who executes — human decides / human executes / autonomous). The EU AI Act and OECD frameworks each handle these dimensions, but differently. The honest mapping is by *question answered*, not by row-for-row alignment of taxonomies that don't share a structure.

| Question | DTPR | EU AI Act | OECD |
|---|---|---|---|
| What does the AI do? *(verb)* | `functional_modes` — analytical · semantic · generative · agentic · perceptive · physical | No direct equivalent. Closest: implicit in Annex III domain definitions and in Art. 3 definitions | "Task & Output" dimension of the OECD Framework for the Classification of AI Systems |
| How autonomous is it? | Autonomy axis — human decides · human executes · autonomous | Implicit. Annex III domains carry assumed autonomy weight; Art. 14 mandates human oversight for high-risk | Explicit in OECD classification — autonomy & adaptiveness rated separately |
| In what domain is it deployed? | `purpose` — 23 elements covering health, transport, education, public safety, etc. | Annex III — 8 high-risk domains (biometrics, critical infrastructure, education, employment, essential services, law enforcement, migration, justice/democracy) | "Economic Context" dimension (sector, scale, deployment setting) |

**Design-decision callout for slide 23 / 24.**
The autonomy axis is on `functional_modes`, not on `accountable`. This is deliberate: it separates *what the AI does* (the mode) from *who's on the hook for the outcome* (the accountable role). EU Art. 14 conflates these somewhat by tying human oversight to the high-risk classification. DTPR's split lets the disclosure say "this is an autonomous mode under deployer X" without forcing the reader to infer either fact from the other.

**Notes & caveats.**
- EU Annex III is a *list of domains*, not a function/mode taxonomy. Mapping DTPR's six modes onto Annex III's eight domains is a category error — they answer different questions. The table reflects this honestly.
- OECD's classification framework (2022) explicitly separates autonomy & adaptiveness as ratings; this is closer kin to DTPR's autonomy axis than anything in the EU Act.
- DTPR `physical_mode` (e.g., robotics in public space) doesn't have a direct EU Annex III bucket beyond critical infrastructure; this is a gap worth flagging in Q&A if asked.

**Sources.**
- OECD (2022). OECD Framework for the Classification of AI Systems. OECD Digital Economy Papers, No. 323.
- Regulation (EU) 2024/1689, Art. 3 (definitions), Art. 14 (human oversight), Annex III.
- Narain Jashanmal (2026). AI Taxonomy — An Operational Framework for Precision in AI Discourse, v1.1. (Source for DTPR's verb framing on functional modes.)

---

## § Transparency — NYC LL144 ↔ EU AI Act Arts. 13/26/50 ↔ DTPR for AI surfaces

**Rationale.** Each row is a *disclosure question a person might have* about an AI system. The columns show what each regulatory regime requires (or enables) on that question, and what DTPR for AI surfaces in the visual disclosure. The pattern: regulators set the floor of what *must* be disclosed; DTPR is the form that lets it be *read*.

| Disclosure question | NYC LL144 (AEDT, 2021/2023) | EU AI Act | DTPR for AI surfaces |
|---|---|---|---|
| Is AI in use here at all? | Notice to candidate 10 business days before use | Art. 50 — interaction with AI must be disclosed; AI-generated content marked | `purpose` + `functional_modes` |
| What does the system do? | Implicit — bias audit covers the output dimension | Art. 13 — instructions for use describing characteristics, capabilities, limitations | `functional_modes`, `processing` |
| Who's responsible? | Employer using the AEDT | Provider + Deployer roles defined throughout; Art. 26 deployer duties | `accountable` (with vendor / deployer role distinction) |
| What's the risk profile? | Public bias-audit summary | Art. 27 Fundamental Rights Impact Assessment for high-risk in public services | `risks_mitigation` (9 harm dimensions) |
| What about my data? | Type, source, retention disclosed in candidate notice | Art. 13 + Art. 10 (data governance for high-risk) | `input_dataset`, `processing`, `output_dataset`, `access`, `retention`, `storage` |
| What are my rights / redress? | Right to request alternative selection process | Art. 86 — right to explanation of individual decisions in high-risk context | `rights` (11 elements covering opt-out, contest, explanation, etc.) |

**Notes & caveats.**
- LL144 is *narrow* — only employment AEDTs, only NYC. Including it makes the point that even local, sector-specific rules already imply DTPR's category structure; it's not the bar to clear.
- EU Art. 50 obligations apply to providers and deployers of certain AI systems regardless of risk class, which is why it's the right mapping for "is AI in use at all?" — applies broadly, not just to high-risk.
- Art. 86 (right to explanation) is the closest the AI Act comes to a GDPR Art. 22-style individual right; it's narrower in scope than GDPR's automated-decision-making provisions.
- DTPR `rights` category currently has 11 elements; some are more aspirational than enforced by any regulation listed here. Worth flagging in Q&A: DTPR can describe rights *practices* the operator commits to, even where regulation doesn't mandate them.

**Sources.**
- NYC Local Law 144 of 2021 + DCWP final rules (effective 2023-07-05).
- Regulation (EU) 2024/1689, Articles 13, 26, 50, 86 + Art. 10 (data governance) + Art. 27 (FRIA).
- DTPR for AI schema `ai@2026-05-06-beta` — see `api/schemas/ai/2026-05-06-beta/categories/`.

---

## Open questions for the user

1. **Specific Article numbers.** I've cited the EU AI Act's final-text Article numbers (post-2024 publication). If you want trilogue-era or recital-only references, adjust. Confirm depth of citation appropriate for a plenary slide.

2. **NIST AI RMF inclusion.** I drafted around EU + OECD + AIAAIC since those are the three you named. NIST AI RMF could appear in either the Risks table (mapped to "Govern / Map / Measure / Manage" outcomes) or the Transparency table (NIST's transparency profile). Add as a column, leave out, or mention only on slide 27 (acknowledgements)?

3. **OECD AI Principles vs. OECD AI System Classification.** I used the *Classification* framework (2022 OECD Digital Economy Papers #323) on the Function & Autonomy table because it has explicit autonomy ratings. The OECD AI Principles (2019, revised 2024) are the policy doc — five principles including "Transparency and Explainability." Either could be cited; want me to add Principles references to the Transparency table?

4. **Visual treatment.** The slides currently render these as plain HTML tables. For polish, consider rendering as proper tables with column-header color coding, or as a "visual flow" graphic where the regulatory frameworks all converge on a single DTPR datachain icon. Worth a design pass before the talk.

5. **Truncate or expand.** The Risks table at 9 rows is on the edge of what's readable from a back-row plenary seat. If 9 is too many, two paths: (a) condense to 4–5 grouped rows, or (b) split across two slides ("4 person-affecting" + "5 system-affecting"). Recommendation: keep 9, use larger type, accept that back rows skim — the speaker beat lands the *adoption fact* (we adopted AIAAIC), not the row-by-row.
