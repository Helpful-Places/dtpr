# Metagov seminar — October 2026

Slidev deck for the Metagov seminar, 2026-10-14. Fifteen minutes, remote. Working title: **A proposed maturity model of AI transparency**.

- [`OUTLINE.md`](./OUTLINE.md) is the slide-by-slide spec and the build notes.
- [`CONTEXT.md`](./CONTEXT.md) is the talk's vocabulary: the six stages, use vs use case vs deployed system, the two feedback tracks.

## Provenance

Forked from [`talks/webinar-aug-2026`](../webinar-aug-2026). Carried over and re-pinned to `dtpr@2026-09-01-beta`: `AlgorithmHeader`, `ContextFlow`, `DataFlow`, `DtprPlacement`, `DtprCategoryGrid`, `DtprCanvas`, `CanvasCard`, `ChatFooter`, the `setup/` helpers, `style.css`, and `public/data/cbsa-tci.datachain.json`.

Built here: `SpectrumSlide` (the maturity model), `CheckIn` (the weekly check-in from the real question copy), `RangeBand` and `SensingPanel` (questionnaire results), `RegistryLine` (internal registry beside the live register), `IconWall` (closing slide). `DtprCanvas` is now data-driven; its two records live in `components/canvas-content.ts`.

## Schema migration from the webinar deck

The webinar pinned `ai@2026-05-06-beta`. This deck pins `dtpr@2026-09-01-beta`, the first version of the consolidated type that covers sensors and AI. What changed on the way:

- `functional_modes` is now `action`; the six `*_mode` elements are ten verbs. `analytical_mode` became `recommends` (CBSA) or `decides` (fare gates); `perceptive_mode` became `senses`; `generative_mode` became `creates`.
- `human_executes` is now `human_oversees`. Nothing in this deck uses it.
- `affected` is a required category. The CBSA record gained a `people` element (subject). The fare-gates canvas's hand-drawn "Used on" box is now the real `people` icon.
- `risks_mitigation` elements need both `risk` and `mitigation` variables; the CBSA record's single mitigation text was split.
- `collection` and `manifestation` bracket the data flow. `AlgorithmHeader` can show them as empty seats (`show-ends`); `DataFlow` always does, because the CBSA assessment doesn't state them.

The CBSA record validates against the live API (`validate_datachain`, 2026-10-14).

## The questionnaire data

`components/sensing-data.ts` carries coded ordinals from an 18-response staff questionnaire at a small cultural organization in Canada, August 2026, plus paraphrased copy from the client build of that deliverable. No names, no free text, no verbatim quotes. The organization is not named anywhere in the deck. If that clears before the talk, the name goes in the speaker notes first.

## Run

From the repo root:

```sh
pnpm install
pnpm dev:talk:metagov     # http://localhost:3030
pnpm build:talk:metagov   # static site → talks/metagov-oct-2026/dist/
pnpm export:talk:metagov  # slides-export.pdf
```

## Live dependencies

Every icon is fetched from `api.dtpr.io`. Slide 12 embeds `canada.clarable.ai/register` in an iframe. As of 2026-10-14 the public registers still render icons from `ai@2026-05-06-beta`, so the iframe shows the older icon set next to this deck's newer one. Rehearse once to warm the cache.
