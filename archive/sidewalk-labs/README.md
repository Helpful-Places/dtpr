# Sidewalk Labs prototypes

Three prototypes from when DTPR was a Sidewalk Labs project, served by one
Cloudflare Worker (`dtpr-archive`). A landing page listing all three is at
https://dtpr-archive.helpful-places.workers.dev.

| Prototype | URL | What it is |
| --- | --- | --- |
| [`vision/`](vision/) | https://vision.dtpr.io | Scroll-through microsite on where DTPR was headed. webpack 4 build, see its README. |
| [`interaction/`](interaction/) | https://prototype.dtpr.io | Clickable sign and detail pages per technology, driven by an Airtable export. Plain static files. |
| [`chatbot/`](chatbot/) | https://chatbot.dtpr.io | Dialogflow Messenger pages for a place, a system, and a component. Plain static files. |

`prototype.dtpr.io` is the hostname the interaction prototype's own analytics
tag names. Before this archive it pointed at a stale build of the old dtpr.io
app (`app/`, removed in #344).

## Changes from the originals

Only what was needed to run them today:

- **vision:** `yarn.lock` replaced by a `pnpm-lock.yaml` imported from it (same
  versions); scripts set `--openssl-legacy-provider` for Node 17+; the unpkg
  `scrollama` and `intersection-observer` script tags pinned to the versions
  they resolved to when this was archived (3.2.0, 0.12.2) so they can't drift.
- **interaction:** Material Design Lite 1.3.0 vendored into `lib/mdl-1.3.0/`
  (`code.getmdl.io` now returns 403); icon paths made relative (they assumed
  the page lived one folder below `dtpr_icons/`); the sign's QR code encodes the
  current URL instead of `dtpr.sidewalklabs.com`; accountability badges use the
  record's DTPR icon, because the Airtable logo URLs expired in November 2022 and
  one record had no logo at all, which crashed its page.
- **chatbot:** an `index.html` was added explaining the state below.

## Known gaps

- The chatbot's Dialogflow agent and its Airtable-backed fulfillment were shut
  down with Sidewalk Labs. The pages load and the chat window opens, but the
  agent returns 404 and the widget shows "Something went wrong".
- Interaction's accountability logos (Lyft, Soofa, City of Boston) and the
  Numina dashboard image lived only as Airtable attachments and are lost.
- Analytics tags still point at the Plausible sites `vision.dtpr.io` and
  `prototype.dtpr.io`.

## Build and deploy

```sh
./scripts/build.sh   # assembles dist/: landing page, built vision, interaction, chatbot
pnpm dlx --allow-build=esbuild --allow-build=workerd wrangler@4.151.0 dev
```

`src/worker.js` picks the prototype by hostname and serves it from that host's
root. Any other host (workers.dev, `wrangler dev`) shows a landing page with
each prototype under `/vision/`, `/interaction/`, `/chatbot/`. To try a single
host locally, add `--local-upstream prototype.dtpr.io`.

Pushes to `main` that touch `archive/sidewalk-labs/` deploy through
`.github/workflows/archive-deploy.yaml`.
