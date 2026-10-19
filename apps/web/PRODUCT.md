# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, served equally (confirmed: no single one takes priority):

- **Government and community leaders** deciding whether and how to use DTPR when deploying technology in public places and services.
- **Technologists and designers** embedding DTPR into their own work through the taxonomy, REST API and MCP server.
- **Community members and prospective contributors** who want to shape the standard as it grows.

The site routes each audience to its own path rather than optimizing for one.

## Product Purpose

This is the website for DTPR (Digital Trust for Places and Routines), an open standard that explains how technology uses data in plain language and icons anyone can understand. The site explains the standard, documents it, and brings people into the community around it.

A successful visit ends in one or more of (confirmed):

- the visitor understands what DTPR is and why it matters;
- the visitor starts using the standard (docs, taxonomy, API, MCP server);
- the visitor joins the community (newsletter, GitHub, email).

## Positioning

DTPR is a translation layer: a taxonomy of technology concepts, a visual language (icons), and a public feedback channel, combined into one open standard. It was developed through co-design with residents and experts starting in 2019, is freely available, and is stewarded by Helpful Places.

## Operating Context

- Site sections: Home, Who We Are, Get Started (the guide), Get Involved, DTPR in the World, The Taxonomy, Docs, Privacy. Docs has its own button at the top right of every page, in place of a nav tile; the guide and the footer also lead to it.
- Get Started is one guide page: what DTPR is and how it works (a taxonomy of questions, a visual language, a feedback channel), shown with two real systems, then ways to deploy and where to go next. It is a Studio page like the other marketing pages.
- Docs are split by audience under `/docs`: deployer docs (digital channel, public signage, community workshops, feedback survey) and developer docs (REST API, MCP server), each with its own sidebar. Concepts, at `/docs/concepts`, is shared by both and is also where the taxonomy explorer takes its definitions from. `/docs` itself is a chooser between the three.
- Marketing pages are assembled from typed sections in `content/pages/*.yaml` (Hero, Two Columns, Centered Content, Marquee, Vision Section, cards) and edited by non-developers through Nuxt Studio, which commits to `main`.
- Community channels: newsletter, GitHub (`Helpful-Places/dtpr`), `hello@dtpr.io`.

## Capabilities and Constraints

- Nuxt 4 with Nuxt Content, Nuxt UI, Tailwind CSS v4, deployed to Cloudflare Workers with D1-backed content.
- Currently a work in progress at `dev.dtpr.io` and not indexable; it is intended to take over `dtpr.io`.
- `@nuxtjs/i18n` is installed; no localized content exists yet.
- Vision components render live DTPR datachains from `public/data/*.datachain.json`.
- Terminology: DTPR, datachain, taxonomy, element, category, Helpful Places (steward).
- **Undecided:** whether Studio editability of the existing section types is a hard constraint on future layout work.

## Brand Commitments

Existing assets: DTPR logo (`public/images/dtpr_logo.png`), Helpful Places logo (`public/images/hp_logo.svg`, shown under the home hero's buttons and in the footer), DTPR favicon set, and the DTPR icon system.

The DTPR brand book (`https://dtpr-brand-identity.oilsinwater.workers.dev`) is binding for color, type, logo use and layout. Where the book contradicts itself, follow its web prototype (`/guidelines/prototype/`). Confirmed decisions:

- Navy is `#1B2B80`.
- Primary buttons are navy with a medium-blue hover. Chartreuse `#9ACD00` is reserved for live-data indicators.
- Three type families: Public Sans for everything, Source Serif 4 Italic once per page in the hero, Source Code Pro for code and identifiers. Kalam appears only inside the vision mocks.
- On the home page the header is a tile row that folds into a sticky compact bar on scroll. Every other page shows the compact bar from the start.
- Helpful Places is the sole steward. Do not credit Superbloom on the site.

**Undecided:** voice and tone.

## Evidence on Hand

- Deployment record: 15 communities across 3 continents over six years, listed in `content/pages/dtpr-in-the-world.yaml`.
- Sydney Olympic Park case study (external PDF, cover at `public/images/sydney-case-study.webp`).
- Awards and funding logos in `public/images/awards/` (Knight, NSF, Picasso, WSC).
- Co-design workshop photography (`workshop_notes.webp`, `get-involved.png`), world map (`map.png`), illustrated street scene (`who_we_are_hero.webp`).
- Real datachains: `public/data/cbsa-tci.datachain.json`, `public/data/nyc-myschools-match.datachain.json`.
- Origin story: convened by Sidewalk Labs in 2019 with over 100 experts; first draft in 2020.

No testimonials, user quotes, or usage metrics beyond the above exist in the repo. Do not fabricate them.

## Product Principles

1. **Practice what the standard preaches.** A site about making technology legible must itself be legible to someone with no technical background.
2. **Three doors, equal weight.** Leaders, builders and community members each find their path without wading through the others'.
3. **Show the standard working.** Real datachains, real deployments and real workshop artifacts carry the argument; claims follow evidence.
4. **Understanding leads to action.** Every explanation ends somewhere a visitor can go next: the docs, the taxonomy, or the community.

## Accessibility & Inclusion

**Undecided:** no formal standard (such as WCAG 2.2 AA) has been confirmed. The audience includes the general public and government users.
