# Webinar — August 2026 · DTPR for AI

Slidev deck for the **DTPR for AI** webinar (August 2026).

## Provenance

Forked from [`talks/makeshift-2026`](../makeshift-2026) — slide 1 (cover) plus slides 4–37 of that
deck, in order. Deliberately dropped:

| Source slide | What it was | Why it's out |
|---|---|---|
| 2 | "NYC — on the forefront of municipal innovation" | Venue-specific opener |
| 3 | `<Ll35ReportScroll>` — 127-page LL35 report scroll | Venue-specific; also 21 MB of page renders |
| 38 | Workshop CTA (SVA Room 110, "tomorrow 3–4pm") | MakeShift-only event card |
| 39 | Finale / icon-wall closer | Needs a webinar-specific ending |

The deck opens on the cover and closes with a webinar-specific final section, **"One record, many
surfaces"** — speculative mocks of where DTPR disclosures could live (three levels of precision:
canvas → card → line, plus non-digital and machine-readable tracks) — ending on an icon-wall
thank-you slide.

## Run locally

From the repo root:

```sh
pnpm install
pnpm dev:talk:webinar
```

Opens at `http://localhost:3030`. Hot reload on edits to `slides.md`.

## Build / export

```sh
pnpm build:talk:webinar     # static site → talks/webinar-aug-2026/dist/
pnpm export:talk:webinar    # slides-export.pdf
```

## Layout

```
talks/webinar-aug-2026/
├── slides.md         ← Slidev source — 35 slides
├── components/       ← only the components these slides use
├── public/           ← images, datachain JSON, video (see note below)
├── setup/            ← main.ts (loads @dtpr/ui styles) + vendored dtpr.ts helpers
├── style.css         ← Helpful Places brand tokens (--hp-blue-*, teal)
└── package.json
```

Components carried over: `AlgorithmHeader`, `ContextFlow`, `DataFlow`, `DtprPlacement`,
`DtprCategoryGrid`. The makeshift deck's `Ll35ReportScroll`, `DemoVideo`, `DtprSmoke`,
`MySchoolsMatchPage`, and `Slide15DatachainTest` are not used here and were not copied.

Built for the closing section: `CanvasCard`, `ChatFooter`, `DecisionLetter`, `DocumentMark`,
`DtprCanvas`, `HiringNotice`, `QrPlaceholder` — speculative disclosure mocks (all copy hardcoded;
composed icons from the live API are their only network dependency; the QR placeholder is
deliberately not scannable). `DtprCanvas` is a Slidev port of the canvas prototype's board
(`prototypes/canvas`), hardcoded to the EN content of its `face-gates` system; `CanvasCard` is the
same record folded to a single cell (Level 2).

Webinar-only: `MentimeterCue` — the live-poll interstitial (mock browser-tab strip + arrow) cueing
the presenter to switch tabs to Mentimeter. The poll questions themselves live in those two slides'
speaker notes, not on screen.

## Assets

`public/videos/dtpr-agent-skill.mp4` is a **symlink** to the same file in `talks/makeshift-2026` —
it's 18 MB and already in git, so it isn't duplicated. If you need this deck to be self-contained
(e.g. zipping it up for someone else), replace the symlink with a real copy.

Everything else under `public/` is a real copy.

## Live network dependencies

Several slides fetch from `api.dtpr.io` at render time (element icons, `DtprCategoryGrid`,
`AlgorithmHeader`), and three slides embed live iframes (`long-beach.dtpr.guide`,
`nyc.clarable.ai`). Warm the cache with a rehearsal run and have a fallback if the connection is
shaky. Icons are pinned to schema `ai@2026-05-06-beta` in the slide source.

## Running example: the CBSA Traveller Compliance Indicator

The deck's running example is CBSA's Traveller Compliance Indicator — its Algorithmic Impact
Assessment is vendored at `sources/cbsa-traveller-compliance-indicator-tci-algorithmic-impact-assessment-aia.pdf`
and its register page is `canada.clarable.ai/algorithms/eff58688-…`. The example threads through:
the translation-layer slide, the AlgorithmHeader highlight slides (fed by
`public/data/cbsa-tci.datachain.json`, hand-authored from the AIA and validated against
`ai@2026-05-06-beta` via the DTPR MCP server), `ContextFlow`/`DataFlow`, the disclosed
risks-and-rights slide, Access/Storage/Retention, Actions, the comprehension audit (rubric applied
to the AIA's own language), and authoring provenance (verbatim quote from AIA page 2 — this
resolved the old placeholder-quote TODO).

Deliberate exception: `DecisionLetter` in the closing section stays a school-placement letter
(`nyc-myschools-match` content) — border indicators don't mail decisions, and the letter beat needs
a system that does. `public/data/nyc-myschools-match.datachain.json` and
`public/images/myschools-match.jpg` are kept for that heritage and are otherwise unreferenced.
