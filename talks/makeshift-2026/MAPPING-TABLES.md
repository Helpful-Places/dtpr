# Act 3 mapping tables — v2 (locked)

**Status: v2. Locked for slides 22, 24, 25.**

The point of these tables isn't 1:1 framework equivalence — it's to show that DTPR's category structure reads coherently across the research and law it draws from. The spoken throughline:

> *"We don't replace any of these. We let a person read across them."*

We deliberately scoped to three strong mappings for an American audience:

- **AIAAIC** — independent research, verbatim risk adoption
- **Narain Jashanmal — AI Taxonomy** — operational framework, verbatim functional-mode naming
- **NYC Local Law 35 of 2022** — local statute that produces the OTI AI Report this deck centers on, and that already requires the spine of DTPR's category set

The **EU AI Act** is mentioned but not table-mapped — the spoken beat acknowledges its broader scope ("same shape, different scale") without burning slide real estate on article numbers an American room won't read.

We removed OECD and NIST from the mappings. OECD's classification framework is structurally adjacent but adds a third axis that confuses the read; NIST AI RMF is a process framework (Govern/Map/Measure/Manage), not a harm taxonomy, and doesn't share DTPR's axis. Both can be name-dropped in Q&A if asked.

---

## § Risks — DTPR `risks_mitigation` ↔ AIAAIC

**Rationale.** DTPR's risk catalog is a *verbatim adoption* of AIAAIC's victim-centered taxonomy (Abercrombie et al. 2024, arXiv:2407.01294, CC BY-SA 4.0). The first column is a re-labeling of AIAAIC's nine harm types kept verbatim where possible so the ShareAlike commons travels with the schema. Attribution is preserved on every derived element via `Element.citation`.

| DTPR (victim-centered) | AIAAIC harm type |
|---|---|
| Loss of autonomy | Autonomy |
| Physical harm | Physical |
| Psychological harm | Psychological |
| Reputational harm | Reputational |
| Financial & business harm | Financial & Business |
| Civil liberties harm | Human Rights & Civil Liberties |
| Societal & cultural harm | Societal & Cultural |
| Political & economic harm | Political & Economic |
| Environmental harm | Environmental |

**Speaker beat.** "We adopted AIAAIC's victim-centered harm taxonomy. Their research, attribution preserved, ShareAlike license travels with the schema."

**Source.**
- Abercrombie et al. 2024 — *A Collaborative, Human-Centred Taxonomy of AI, Algorithmic, and Automation Harms.* arXiv:2407.01294. CC BY-SA 4.0.

---

## § Function & Autonomy — DTPR `functional_modes` ↔ Narain Jashanmal AI Taxonomy

**Rationale.** DTPR's `functional_modes` category names its six modes verbatim from Narain Jashanmal's operational framework, with the verb framing intact. The verb is the load-bearing contribution: a citizen recognizes "decides", "creates", "acts" without us having to define "agentic". The source is cited on every derived element via `Element.citation`.

| DTPR mode | Verb (Jashanmal) | Plain-language reading |
|---|---|---|
| Analytical | decides | Predicts, classifies, scores — "the AI decides who to flag" |
| Semantic | understands and remembers | Finds meaning, grounds context — "the AI knows what you mean" |
| Generative | creates | Writes, draws, generates — "the AI writes the message" |
| Agentic | acts | Plans, uses tools, executes — "the AI takes the next step" |
| Perceptive | senses | Sees, hears, reads — "the AI watches the road" |
| Physical | moves | Robotics, infrastructure — "the AI moves the gate" |

**Orthogonal autonomy axis** — separate from mode, riding on `functional_modes`:

- **Human decides** — the mode suggests; a person picks the next step.
- **Human executes** — the mode decides; a person carries the result out.
- **Autonomous** — the mode decides *and* acts; no person in the loop on each decision.

**Speaker beat.** "Six verbs. Decides, understands, creates, acts, senses, moves. From Narain Jashanmal's framework. The autonomy axis is orthogonal — what the AI *does* is separate from *who's on the hook for the outcome*."

**Source.**
- Jashanmal, N. (2026). *AI Taxonomy — An Operational Framework for Precision in AI Discourse*, v1.1, January 2026. https://dropleaf.app/d/AlXez8scbd

---

## § Transparency — DTPR for AI ↔ NYC Local Law 35 of 2022

**Rationale.** Local Law 35 of 2022 (NYC Admin Code § 3-119.5) is the law that **produces the OTI AI Report this deck centers on**. It requires every city agency to disclose, annually, six things about every algorithmic tool they use. DTPR for AI surfaces all six — and extends to the questions LL35 doesn't yet require but a person on the receiving end still asks. The argument of the slide isn't "LL35 is comprehensive"; it's "LL35 already requires the spine, and DTPR finishes it."

### What LL35 § 3-119.5(c) requires

| LL35 requires (per algorithmic tool) | DTPR for AI surfaces it as |
|---|---|
| Name or commercial name + brief description | datachain title, `purpose` |
| Purpose for which the agency is using the tool | `purpose` |
| Type of data collected/analyzed + source | `input_dataset` |
| How the information received from the tool is used | `processing`, `output_dataset` |
| Vendor / contractor involvement + name (when feasible) | `accountable` |
| Month and year the tool began being used (if known) | variable on `accountable` |

### What LL35 doesn't yet require — DTPR for AI extends to

- `functional_modes` — *what does it do, in plain-language verbs* (decides, creates, acts, senses, moves)
- `risks_mitigation` — *could it hurt me, and how is that harm mitigated*
- `rights` — *can I opt out, contest, request human review, ask for an alternative*
- `retention`, `storage`, `access` — *how long is my data kept, where, who can see it*

LL35's exemption clause (§ e) carves out disclosures that would violate other laws, endanger public safety, or interfere with an investigation. DTPR's category set is compatible — categories can be marked unknown / non-disclosed with a rationale, rather than forcing fabrication.

**On the EU AI Act.** The same disclosure spine appears in the EU AI Act framework — Charter of Fundamental Rights, Annex III high-risk categories, FRIA, Art. 50 disclosure duties — at much larger scope (economy-wide vs. NYC city agencies). Same shape, different scale. We don't drill in on a US audience.

**Speaker beat.** "Local Law 35 — the law that produces the OTI AI Report we just walked through — requires city agencies to disclose six things about every algorithmic tool. Name, purpose, data, use, vendor, start date. DTPR for AI surfaces every one of those six. And it extends to the questions LL35 doesn't yet require — but a person on the receiving end still asks: *Could it hurt me? What are my rights? Where does my data go?*"

**Sources.**
- NYC Local Law 35 of 2022 (Int. No. 1806-A of 2019) — NYC Admin Code § 3-119.5, *Annual reporting on algorithmic tools*. Passed Dec 15, 2021; effective Jan 14, 2022.
- Regulation (EU) 2024/1689 (AI Act) — referenced but not mapped row-by-row in this deck.
- DTPR for AI schema `ai@2026-05-06-beta` — see `api/schemas/ai/2026-05-06-beta/categories/`.

---

## Closing throughline (slide 26)

The verbatim sentence the speaker delivers:

> *"We don't replace any of these. We let a person read across them."*

Above the sentence, on the slide, the three named sources flow into one datachain icon:

```
AIAAIC · Narain Jashanmal · NYC LL35 of 2022  →  one datachain
                              (+ EU AI Act)
```

## Acknowledgements (slide 27)

Tightened to organizations whose work this deck directly leans on:

- **AIAAIC** — victim-centered harm taxonomy (verbatim adoption)
- **Narain Jashanmal** — AI Taxonomy v1.1 (functional-mode naming)
- **EU AI Office** — regulatory framework (read across, lighter mapping)
- **AlgorithmWatch** — automating-society reporting
- **AI Now Institute** — policy research

Plus the NYC public servants credited on slide 3 (AMPO, OTI, AI Action Plan team, LL144 originators).
