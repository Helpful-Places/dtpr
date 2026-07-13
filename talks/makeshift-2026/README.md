# MakeShift 2026 — DTPR for AI plenary

Slidev deck for the **DTPR for AI** plenary at MakeShift 2026 (School of Visual Arts, NYC, 2026-05-20–21).

## Canonical specs

- **[`OUTLINE.md`](./OUTLINE.md)** — slide-by-slide spec (38 slides, ~27 min, build-to-reveal arc).
- **[`MAPPING-TABLES.md`](./MAPPING-TABLES.md)** — v1 drafts of the three Act 3 tables (Risks, Function & Autonomy, Transparency).

## Run locally

From the repo root:

```sh
pnpm install
pnpm dev:talk:makeshift
```

Opens at `http://localhost:3030`. Hot reload on edits to `slides.md`.

## Build static deck

```sh
pnpm build:talk:makeshift
```

Outputs to `talks/makeshift-2026/dist/` — deployable to any static host.

## Export PDF

```sh
pnpm export:talk:makeshift
```

Produces `slides-export.pdf` for offline / archival.

## Layout

```
talks/makeshift-2026/
├── OUTLINE.md            ← canonical slide-by-slide spec
├── MAPPING-TABLES.md     ← Act 3 mapping tables (v1 drafts)
├── slides.md             ← Slidev source — 38 slides
├── components/           ← Vue components used in slides (DtprDatachain wrappers, etc.)
├── public/               ← static assets (videos, screenshots, images)
├── snippets/             ← reusable Markdown snippets
├── package.json
└── README.md
```

## Embedding live DTPR datachains

`@dtpr/ui` is wired as a workspace dep. To render a real datachain inside a slide:

```vue
<script setup>
import { DtprDatachain } from '@dtpr/ui/vue'
import datachain from './public/data/311-translation.json'
</script>

<DtprDatachain :data="datachain" />
```

See slide 16, 19, 20 in `OUTLINE.md` for the planned uses.

## Production assets to record / capture

See the **Production assets checklist** section of `OUTLINE.md`. In short:

- 2 pre-recorded sped-up demo videos (311 Translation, Midtown Traffic Signal) — drop in `public/videos/`
- ~7 screenshots — drop in `public/images/`
- 1 recorded backup of the live `nyc.clarable.ai/register` walkthrough (Act 5 fallback)

## Status

Skeleton. Slide titles, key visuals, and speaker beats are stubbed in `slides.md` from `OUTLINE.md`. Real assets, live datachain components, and final mapping-table content land iteratively.
