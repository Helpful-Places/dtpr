# MakeShift 2026 — status

**Last updated:** 2026-05-14
**Talk date:** 2026-05-20 (T-6 days at last update)
**Branch:** `feat/makeshift-plenary-outline`

## Snapshot

The talk has a locked spine, a working Slidev skeleton, and v1 mapping-table research. The build-to-reveal arc is set: open by celebrating NYC OTI's transparency work, demonstrate the gap (declared ≠ understood), introduce DTPR for AI as the translation layer, run two pre-recorded "spreadsheet → datachain" demos (311 Translation + Midtown Traffic Signal), ground the methodology against AIAAIC / EU AI Act / OECD, and climb to the launch of `nyc.clarable.ai/register` — the OTI 2025 AI report (86 systems, 20 organizations) rendered as DTPR datachains. Closes with a workshop CTA + beta-engagement CTA.

What's missing is mostly *production*: 2 demo videos, ~7 screenshots, live `<DtprDatachain>` component wiring, and a few content decisions (which OTI report row to feature on slide 5, who to credit by name on slide 3, the workshop slot for slide 37).

## Files in this directory

| File | What it is |
|---|---|
| `slides.md` | Slidev source. All 38 slides stubbed with titles, layouts, content placeholders, and speaker notes. Canonical source of truth. |
| `package.json` | Slidev + `@dtpr/ui` workspace dep. |
| `README.md` | Run instructions, layout, asset checklist. |
| `STATUS.md` | This file. |
| `components/` | Vue components used in slides (currently empty; first use will be `<DtprDatachain>` wrappers). |
| `public/images/` | Static images (placeholder filenames referenced from slides.md). |
| `public/videos/` | Demo screencasts (TBD). |

## Done

- [x] Talk arc locked: build-to-reveal climaxing on `nyc.clarable.ai/register`
- [x] Hero systems chosen for Act 2 demos: 311 Multilingual Translation + Midtown Traffic Signal
- [x] Framework chosen and scaffolded: Slidev (Vue-based, allows live `<DtprDatachain>` in slides)
- [x] Slidev project scaffolded at `talks/makeshift-2026/`
- [x] Monorepo wiring: `talks/*` added to `pnpm-workspace.yaml`; `dev:talk:makeshift` / `build:talk:makeshift` / `export:talk:makeshift` scripts added to root `package.json`
- [x] All 38 slides stubbed in `slides.md` with speaker notes

## In progress

Nothing actively in progress. Next steps are decision-blocked or production-blocked (see below).

## Decisions needed before next major push

1. ~~**Mapping-table content review**~~ — **LOCKED 2026-05-14.** Act 3 now leads with three named mappings: AIAAIC (Risks), Jashanmal (Function), NYC LL144 (Transparency). EU AI Act mentioned without article numbers (US audience). OECD and NIST dropped. Acknowledgements grid on slide 27 tightened accordingly. See `MAPPING-TABLES.md` v2.
2. **OTI report row for slide 5** — pick a row from the 2025 report that is *adjacent* to but distinct from 311 Translation and Midtown Traffic, so the Act 2 demos feel like discoveries.
3. **Names to credit on slide 3** — AMPO holder, OTI leadership, AI Action Plan PMs. Confirm exact names + any photos to grid.
4. **Workshop slot for slide 37** — day, time, room. Fill in once the conference schedule lands.

## Next concrete steps (recommended priority order)

1. ~~**Lock mapping-table content**~~ — done 2026-05-14. v2 in `MAPPING-TABLES.md`; slides 22, 24, 25, 26, 27 + `OUTLINE.md` synchronized.
2. **Wire up live `<DtprDatachain>` components** — `@dtpr/ui` is now built and wired into Slidev (smoke test rendering on slide 7 via `DtprSmoke.vue`). Replace placeholder text on slides 16, 19, 20 with real Vue components rendering against static datachain JSON. Estimated: 1–2 hours.
3. **Capture the two demo videos** — 311 Translation row → Claude skill → datachain render, then Midtown Traffic Signal row → same. Sped-up screen recordings; drop in `public/videos/`. `DemoVideo.vue` fallback handles missing files. Estimated: 1–2 hours each, including retakes.
4. **Capture the supporting screenshots** — slides 2, 4, 5, 23, 29, 30, 35 from the asset checklist. Estimated: 1 hour batched.
5. **Record the live-register backup walkthrough** — a screencast of the Act 5 actions, in case Wi-Fi fails. Estimated: 30 min including a clean take.
6. **First end-to-end timing run** — present to a wall, no audience, with a stopwatch. Identify which slides need to be cut or compressed. Estimated: 45 min.

## How to pick this up

```sh
# from repo root, first time only:
pnpm install

# start Slidev dev server (hot reload):
pnpm dev:talk:makeshift

# build static deck:
pnpm build:talk:makeshift

# export PDF for offline / archive:
pnpm export:talk:makeshift
```

Slidev opens at `http://localhost:3030`. Press `o` for slide-overview view, `p` for presenter view (with speaker notes).

## Quick reference

- **Conference site:** https://makeshift2026.dtpr.io/
- **The launch URL:** https://nyc.clarable.ai/register
- **Global deployments:** https://dtpr.guide/
- **DTPR for AI standard:** https://dtpr.ai
- **Schema in this repo:** `api/schemas/ai/2026-05-06-beta/`
- **Claude plugin (agent skills):** `plugin/dtpr/`

## Risks worth tracking

- **Live register at slide 33** — Wi-Fi at SVA. Carry a recorded fallback. Test the venue's connection during setup.
- **Demo videos** — 311 Translation and Midtown Traffic Signal must produce visually clean datachains. The agent skill output should be reviewed for any errors that would distract on-screen.
- **Time** — outline lands at ~27.5 min. First timing run will reveal whether the live-register walkthrough (3 min budgeted) is realistic. If it stretches, the methodology section (Act 3, ~5 min, 6 slides) is the most compressible.
