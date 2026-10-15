# Webinar — October 2026 · DTPR

Slidev deck for the October 2026 webinar. A copy of [`talks/webinar-aug-2026`](../webinar-aug-2026) with three changes:

| Slide | Change |
|---|---|
| 1 (cover) | Generic DTPR: logo, `dtpr.io`, and the one-line definition. No "for AI", no beta pill. |
| 16 (open-source surface, the "DTPR for AI" card grid) | Removed. |
| 29 (Mentimeter poll cue) | Replaced by the maturity model slide, `<SpectrumSlide>` from [`talks/metagov-oct-2026`](../metagov-oct-2026). `MentimeterCue.vue` is gone. |

Everything else is as in the August deck, including the running CBSA example, the closing "One record, many surfaces" section, and the `ai@2026-05-06-beta` schema pin on the inherited components. `SpectrumSlide` fetches its three purpose icons from `dtpr@2026-09-01-beta`; the two pins coexist because the API serves both versions. If the whole deck should move to the new schema, the migrated components in `talks/metagov-oct-2026/components` are the drop-in replacements (see that deck's README for the element renames).

## Run

From the repo root:

```sh
pnpm install
pnpm dev:talk:webinar-oct     # http://localhost:3030
pnpm build:talk:webinar-oct   # static site → talks/webinar-oct-2026/dist/
pnpm export:talk:webinar-oct  # slides-export.pdf
```

## Assets and live dependencies

`public/videos/dtpr-agent-skill.mp4` is a symlink into `talks/makeshift-2026`, as in the August deck. Icons come from `api.dtpr.io` at render time, and two slides embed `canada.clarable.ai` iframes. Warm the cache with a rehearsal run.
