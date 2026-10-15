---
target: h1, font, margin, horizontal lines across cards, rows, headers
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
target_identity: "file:/Users/pichot/conductor/workspaces/dtpr-website-refresh/seville-v1/app/pages/get-involved.vue"
target_fingerprint: "sha256:cf702b97d9b913a37b8db14a8c509e60cf1a1eef208de3040222b983f63e7f6e"
target_path: /Users/pichot/conductor/workspaces/dtpr-website-refresh/seville-v1/app/pages/get-involved.vue
timestamp: 2026-10-07T17-22-39Z
slug: app-pages-get-involved-vue
---
Method: dual-agent (A: abdf5c6d6bd2de65f · B: ab62242255a004a24)

Scope: h1, fonts, margins and horizontal lines across home, get-involved, who-we-are, dtpr-in-the-world, taxonomy, docs.

## Design Health Score: 21/32 (66%, Acceptable)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of system status | 3 | Newsletter only says nothing is stored after submit |
| 2 | Match system / real world | 3 | Plain language holds |
| 3 | User control and freedom | 3 | Datachain element selection has no close affordance |
| 4 | Consistency and standards | 1 | Four h1s, three section-heading weights, two label styles, three outline colours, 4/6/8px radii |
| 5 | Error prevention | 2 | Newsletter invites an email it cannot store |
| 6 | Recognition rather than recall | 3 | /taxonomy h1 is 20px in a toolbar |
| 7 | Flexibility and efficiency | n/a | Marketing surface |
| 8 | Aesthetic and minimalist design | 3 | Get Involved: four 36px headings over 116-244px bodies |
| 9 | Error recovery | 3 | Mailto fallback given |
| 10 | Help and documentation | n/a | Docs are the product |

## Design specificity verdict
Half authored, half inherited. SectionHeader plus the white sheet (6px, ring rule, shadow-sm, 20/24 padding) is a real field-guide vocabulary, used on Home and Get Involved. Who We Are, DTPR in the World, the taxonomy and docs run on Nuxt UI defaults and one-offs.

Detector: 138 CLI findings, all advisory and all in unplaced vision mocks except CityLayers.vue:256 (0.625rem label, below the 12px floor). Browser: nav transitions margin (navHeader.vue:141); two paragraphs in SampleDatachain.vue:103,136 run 97 and 118 chars. italic-serif-display and cream-palette are false positives (both specified in DESIGN.md). Nothing flagged on rules or dividers; the inconsistency is not detector-visible.

## What's working
- SectionHeader rhythm: 24 rule-to-label, 12, 16, 32 to body, 24 to CTA, all on the dot grid's base.
- The white sheet is applied identically across eight components.
- Every page has exactly one h1 and no skipped levels.

## Priority issues
- [P1] Three section-heading systems. SectionHeader 36/600 left; UPageSection 30/700 centred with -0.75px tracking (who-we-are, app.config.ts:39); hand-rolled 30/400 centred (dtpr-in-the-world.vue:81,188,211,235). Fix: one SectionHeader everywhere. Command: /impeccable typeset.
- [P1] Four h1 treatments. Hero serif italic 48/400 with -1.2px tracking DESIGN.md says should be normal; taxonomy sub-pages serif italic 36/600; /taxonomy serif italic 20/600 in a toolbar under a 30px h2; docs Public Sans 36/700. Fix: two tiers, display and page-title. Command: /impeccable typeset.
- [P2] The 2px rule has three meanings and one hack. Slate on home, stripped on Get Involved by [&_section>header]:border-t-0 (get-involved.vue:14), navy inside a sheet at taxonomy/all.vue:35. The same selector sets [&_section]:py-7, leaving a 56px section gap against a 32px header-to-body gap. At 2px #CBD5E1 on paper the rule is about 1.3:1. Fix: one rule spec, on every section, density as a prop. Command: /impeccable layout.
- [P2] Margins drift. Hero to first heading is 144/68/120px on three pages; hero padding 40/48/40 shrinks at the widest breakpoint (app.config.ts:24); who-we-are and [...slug].vue double-wrap in UContainer, insetting content 32px. Command: /impeccable layout.
- [P3] Card and row drift. Card title 20/18/16/30px; row padding 16 vs 20-24; divide-y vs border-b; ring vs border for the same hairline; dtpr-in-the-world cards are 4px radius, 16-20 padding, no lift; Builder.vue:177 uses paper-edge on white. Command: /impeccable polish.

## Persona red flags
- Jordan: Get Involved h1 is centred and everything below is left. /taxonomy has no visible page title.
- Casey: at 390px, 28px section padding with no rule blurs Get Involved sections; five full-width buttons in sequence, two primary.
- Sam: footer column labels are h2 on every page; "15 deployments" is exposed as an h3.

## Minor observations
- SampleDatachain.vue:136 rule stops at 768px inside a 1216px sheet.
- contentCard.vue is registered and unused.
- DESIGN.md codifies two of these inconsistencies ("centred heading" for assembled sections; Get Involved "without the rule").

## Questions
- Is the 2px slate rule doing any work at 1.3:1?
- Does the italic serif line belong on every hero or Home alone?
- Are Get Involved's four short sections sections, or one sheet with four rows?
