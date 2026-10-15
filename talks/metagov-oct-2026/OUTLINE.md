# Metagov seminar — October 2026 — outline

**Working title:** A proposed maturity model of AI transparency
**Length:** 15 minutes, remote. Audience: governance researchers, little or no regulatory background, mostly first exposure to DTPR.
**Thesis:** Transparency about AI starts inside the organization. An organization can't disclose what it hasn't noticed, so the path to a public AI registry runs from listening to staff, through internal policy, to a published, feedback-bearing record.
**Arc:** the journey as it happened. Physical objects in public space → AI systems that decide things → organizations in the dark about their own LLM use → the spectrum that puts all three in order → the open question.
**Vocabulary:** [`CONTEXT.md`](./CONTEXT.md). Schema pin everywhere: `dtpr@2026-09-01-beta`. Say "DTPR", never "DTPR for AI".

Sixteen slides. Slides marked **W#** are reworked from `talks/webinar-aug-2026` (slide numbers as on disk, 29 slides). **New** slides are built here.

---

## Chapter 1 — Places (≈2 min)

### 1. Cover — DTPR · dtpr.io
Source: W1, with "for AI" and the beta pill removed. Logo, `dtpr.io`, one line: "An open communication standard for sensors and AI systems."
Beat: name it, no history. Sixteen slides, under a minute each.

### 2. Where it started: a sign on a street
Source: W2 reworked. Left: the sign-scan photo (`dtpr-sign-scan.jpeg`, unused in the webinar). Right: the Long Beach license-plate-reader record card, unchanged. Drop the document pile; the audience doesn't know what a privacy impact assessment is.
Beat: six years ago, physical things in public space. A sign, a QR, one record with the same seven questions in every city. "Hold the shape."

## Chapter 2 — Deployed AI systems (≈5 min)

### 3. Same shape, pointed at an algorithm
Source: W5. `<AlgorithmHeader>` on `cbsa-tci.datachain.json`, context row highlighted, re-pinned to the new schema. No iframe here.
Beat: CBSA's border-screening indicator. Not physical, still a deployed system with a purpose, an accountable party, people affected. Same record shape.

### 4. Data flow reads like a sentence
Source: W10. `<DataFlow>` for CBSA, upgraded to the new chain (collection → input → model → output → manifestation; CBSA shows the three middle seats only, the two ends stay blank because the assessment doesn't state them).
Beat: one sentence a non-expert can read. Identifiers purged before scoring is the nuance.

### 5. Rights, actions, risks and mitigations
Source: W22 `<DtprCanvas>` (face-matching fare gates, composite), scaled, with the rights ladder and the risk seat emphasised and the data-flow seats dimmed. Mark "composite" on the slide.
Beat: this is what makes it more than a label. The rights you have, a button to use each one (email the review desk, start an appeal, escalate to the ombudsman), the risks already named, and what was planned against them. Public feedback is this, not a reaction score. Also: a camera and a model in one record, said once.

### 6. One record, many surfaces
Source: W21, copy trimmed. Canvas → card → line, plus non-digital and machine tracks.
Beat: the datachain is the canonical record; everything a person sees is a disclosure. Thirty seconds.

### 7. How two registers got filled
Source: W17 two-column card (Datachain Builder / Agent skill), with a third column added: the MCP server. No video.
Beat: the NYC and Canada registers were drafted from published assessments by an agent using the DTPR skill and MCP server, then reviewed by a person. The schema is the contract both sides write to.

### 8. The line: an AI assistant's footer
Source: W24 `<ChatFooter>`, re-pinned (`generative_mode` → `creates`). One click expands the line into the card.
Beat: the lightest surface. A chat window carries its own disclosure. Thirty seconds, and it sets up the next chapter: most AI in an organization is a chat window.

## Chapter 3 — Inside the organization (≈4 min)

### 9. Then we asked organizations about their own use
**New.** Pivot slide. Mostly white. One sentence set large: "Deployed systems are the easy case. Most AI in an organization today is a chat window open on someone's desk." Below, small: "Summer 2026 · a small cultural organization in Canada · 18 staff."
Beat: the discovery. Leadership and staff were struck by seeing their own use and their own levels of confidence laid out. Don't name the organization.

### 10. Sensing: what came back
**New.** Left: the weekly check-in, rebuilt as a component from the real copy: "What did you use AI for this week? A sentence or two is plenty." and the trust scale with its five anchors ("Wouldn't repeat it" … "Didn't need to check"). Right: two range bands from the questionnaire (comfort disclosing, median "Openly yes"; confidence in appropriate use, median "Mostly sure"), then the ranked concerns (losing the human voice 14 of 18, accuracy 12, environment 12, privacy 11). Caption under the bands: "From a one-off staff questionnaire. The weekly check-in is the continuous version."
Beat: people will tell you, if you ask lightly and show it back without names. Three of eighteen don't use AI at all and had the longest list of concerns.

### 11. Governing: a use case drawn in DTPR
**New.** The drafting-and-editing-writing use case as a canvas (port of the Bentway canvas, paraphrased client-build copy, element ids re-pinned: `generative_mode` → `creates`, `input_sensitive_personal`, `language_models`, `output_generated_content`, risks `societal_cultural_harm` / `civil_liberties_harm` / `environmental_harm`, rights `right_to_human_review` / `right_to_notice`). The blanks are set in the canvas's own words: "No safeguard in place yet", "made by vendors the organization has not vetted", "has no formal AI guidance yet". Beside it, the three staff policy questions, disclosure last: which uses and tools are acceptable; what is safe to share; do we tell partners and funders when AI helped. A dashed box, "living policy", labelled proposed.
Beat: the standard applied before a system exists. The blanks are the policy agenda. Living policy is an idea; say so and move on.

### 12. Describing to Publishing: internal, then external
**New.** Left: the internal registry as a column of use-case and system cards, some greyed. A line. Right: the Canada register iframe (`canada.clarable.ai/register`), the published subset.
Beat: the act in the middle is selection. Which entries cross the line, who decides, and what the public can do with them once they're across. This is the half that's built.

## Chapter 4 — The model (≈4 min)

### 13. A proposed maturity model of AI transparency
**New. The key slide.** Horizontal, six columns, left to right: In the dark · Sensing · Governing · Describing · Publishing · Engaging. Progressive resolution as content, styled sketch-to-render:
- In the dark: a cloud of unlabeled dots, no heading rule, "in the dark" in muted type. A place, not a step.
- Sensing: the dots get labels (dashed strokes, muted ink).
- Governing: dots cluster into named groups.
- Describing: groups become cards with real DTPR icons from the API.
- Publishing: some cards cross a vertical line.
- Engaging: marks arrive on the cards from outside.
DTPR bracket under the columns: faint from Governing, solid from Describing.
Two feedback loops drawn on this slide: internal track from Describing back to Governing (staff respond to the internal registry, policy adjusts); external track from Engaging back to Sensing (what outsiders raise is something new to listen for).
No status badges, no product names. Fuzziness carries the status.
Beat: every organization in the room is somewhere on this line. The left half is where we're experimenting; the right half is what exists.

### 14. Two tracks, one question
**New.** Slide 13 again, dimmed, with the two loops lit and annotated. Internal track theses, three lines: see how colleagues use AI; see how much they trust it; see where the organization's median is heading. External track, three lines: rights and actions; risks and planned mitigations; what people raise.
The question, set large: "One record with two audiences, or two systems?"
Beat: this is the design question we haven't answered. Metagov is the room to ask.

### 15. What exists, and the ask
**New.** Left: what exists today, three lines (the open schema, API, MCP server and agent skill; the NYC and Canada registers; the check-in and questionnaire prototypes). Right: two asks: organizations willing to try Sensing; research collaborators on comprehension or legitimacy.
Beat: two asks, not three.

### 16. Thanks
Icon wall from the new schema (139 elements, fetched live), `dtpr.io`, contact.

---

## Build notes

**Fork.** Copy `talks/webinar-aug-2026` → `talks/metagov-oct-2026` (components, setup, style.css, public). Add `dev:talk:metagov` / `build:talk:metagov` / `export:talk:metagov` to the root `package.json`. Replace the video symlink with nothing (no video in this deck).

**Schema migration, every pin to `dtpr@2026-09-01-beta`:**
- `setup/dtpr.ts`: the `SCHEMA` constant and the two hardcoded `functional_modes` lookups → `action`.
- Component defaults: `AlgorithmHeader`, `DtprPlacement`, `DtprCategoryGrid`, `DtprCanvas`.
- `cbsa-tci.datachain.json`: `schema_version`; `analytical_mode` → `recommends`; add `affected` → `people` as subject; validate with the DTPR MCP `validate_datachain` tool before the first rehearsal.
- `DtprCanvas` fare gates: `perceptive_mode` + `analytical_mode` → `senses` + `decides`; the hand-drawn "Used on" box becomes the real `people` element; `human_executes` nowhere in this deck.
- `AlgorithmHeader` flow row: add collection and manifestation seats, rendered empty when the record has none.

**New components:** `SpectrumSlide.vue` (slide 13, with a `loops` prop for slide 14), `CheckIn.vue` (slide 10 left), `RangeBand.vue` (slide 10 right, port of the chalkline band: interquartile band, median tick, one dot per respondent, five anchors), `UseCaseCanvas.vue` (slide 11, port of the Bentway canvas with the register chrome removed), `RegistryLine.vue` (slide 12 left).

**Data brought in:** the 18 coded respondents (ordinals and keys only, no free text) for the bands; paraphrased client-build strings for the use case. Nothing verbatim.

**Live dependencies:** `api.dtpr.io` for every icon; one iframe (`canada.clarable.ai/register`) on slide 12. As of 2026-10-14 the registers still render icons from `ai@2026-05-06-beta`; the deck's own icons will be the new set. Rehearse once to warm the cache.

**Rehearsal check:** `pnpm build:talk:metagov` passing is not enough; screenshot every slide (see memory note on Slidev headless QA) and check slides 10, 11 and 13 fit at 16:9.
