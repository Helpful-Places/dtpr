# CMS Content Conversion Brainstorm

**Date:** 2026-02-06
**Status:** Complete

## What We're Building

Converting 6 hardcoded HTML pages into CMS-editable Markdown documents powered by Nuxt Content v3 and Nuxt Studio. This enables non-developer content editing via the Studio visual editor.

### Pages to Convert

| Page | Route | Complexity | Notes |
|------|-------|-----------|-------|
| `index.vue` | `/` | High | 18+ partner cards, colored sections, hero |
| `awards.vue` | `/awards` | Moderate | Award cards with external links |
| `get-involved.vue` | `/get-involved` | Low | Text + newsletter signup embed |
| `governance.vue` | `/governance` | High | 10+ council member bios with headshots |
| `how-we-got-here.vue` | `/how-we-got-here` | Low | Flat prose text |
| `tools-and-resources.vue` | `/tools-and-resources` | Moderate | Resource lists, blog posts, related projects |

### What We're NOT Touching

- Taxonomy pages (`taxonomy/device.vue`, `taxonomy/ai.vue`) - already content-driven
- Existing content collections (`dtpr.v0/`, `dtpr.v1/`) - leave as-is
- Navigation (`NavHeader`) and footer (`AppFooter`) - structural, stay in Vue
- `content.config.ts` existing collections - no changes to taxonomy schemas

## Why This Approach

### Content Location: `content/pages/`

New page markdown files live in `content/pages/` to keep them separate from the taxonomy data in `content/dtpr.v0/` and `content/dtpr.v1/`.

### Routing: Individual Page Files

Each page keeps its own `.vue` file (not a catch-all `[...slug].vue`). Several pages have unique design features and layouts that benefit from dedicated Vue templates. Each page will query its markdown content and render it.

### Structured Content: MDC Components

Complex structured content (partner cards, council bios, award cards) will use MDC component syntax in markdown:

```mdc
::partner-card{url="https://example.com" image-file="partner.png" image-alt="Partner"}
Partner description text here.
::
```

This makes cards fully editable in the Nuxt Studio visual editor - editors can add, remove, and reorder cards without touching code.

### Components to Make MDC-Ready

Components need to be in `components/content/` (or globally registered) to be available in MDC:

- `Card` - general content blocks
- `PartnerCard` - partner grid items
- `COPC-Card` - council member bios
- `NewsletterSignup` - email signup form
- Header components may need props for text currently hardcoded

## Key Decisions

1. **All 6 pages at once** - Small enough scope to do in one pass
2. **`content/pages/` directory** - Clean separation from taxonomy data
3. **MDC components** - Cards and structured content as MDC, not frontmatter arrays
4. **Individual page Vue files** - Unique layouts per page, not catch-all routing
5. **Leave taxonomy untouched** - Already working, no reason to change
6. **New `pages` collection** - Add a `type: 'page'` collection to `content.config.ts`

7. **Header text from frontmatter** - IntroHeader, GuideHeader, awardsHeader will accept props for their text, populated from markdown frontmatter
8. **i18n for page content** - Page markdown should support locales, following the same `{locale}/` path pattern used by taxonomy content (en, fr, es, pt, tl, km)

## Open Questions

- How should the `markdown-it` plugin (used for taxonomy descriptions) coexist with the new MDC content rendering?
