---
target: home page
total_score: 11
max_score: 24
na_heuristics: 5,7,9,10
p0_count: 1
p1_count: 3
target_identity: "file:/Users/pichot/conductor/workspaces/dtpr-website-refresh/san-antonio/app/pages/index.vue"
target_fingerprint: "sha256:e64d8c451c08322d7c7a9506440669f70310e9eaf72149e29fd900c42f5774f1"
target_path: /Users/pichot/conductor/workspaces/dtpr-website-refresh/san-antonio/app/pages/index.vue
timestamp: 2026-10-04T21-48-50Z
slug: app-pages-index-vue
closed: true
---
Method: dual-agent (A: aefe1091a9a11548e · B: adc2e5aea9b9ff7c7)

Both assessments used headless Chrome (Chrome extension not connected); no overlay was injected.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 2 | "How this works ▾" has a pointer cursor and caret but no click handler |
| 2 | Match System / Real World | 2 | "Translation layer", "taxonomy", `ai@2026-05-06-beta` on a page promising plain language |
| 3 | User Control and Freedom | 2 | About 7,000px on a phone with no sticky nav; sideways scroll on tablets |
| 4 | Consistency and Standards | 1 | Prose, audience doors and section labels share one card style; none are links |
| 5 | Error Prevention | n/a | No inputs or destructive actions |
| 6 | Recognition Rather Than Recall | 2 | A visitor who picks an audience card must scroll back up and guess the matching nav item |
| 7 | Flexibility and Efficiency | n/a | Landing page |
| 8 | Aesthetic and Minimalist Design | 2 | DTPR is defined three times in a row; a 364px section holds one line |
| 9 | Error Recovery | n/a | No error states |
| 10 | Help and Documentation | n/a | Landing page |
| **Total** | | **11/24** | **Poor (46%)** |

## Design Specificity Verdict

**LLM assessment:** mostly generic, with the DTPR-specific material buried. The first 3,600px on desktop is stock Nuxt UI hero and shadowed cards on graph paper. The hexagon icon system appears only at 16–26px inside mocks that start about 65% down the page. The hero image is a city diagram; no icon, sign or datachain appears above the fold.

**Deterministic scan:** source scan 2 findings; live-page scan 51–53 depending on width.
- Agrees with the review: 38 small-text findings (9–11.8px), all inside the three vision mocks.
- Detector only: 5 nested cards, a `transition: height` layout animation, a 72px h1 at tablet width.
- False positives: 4 low-contrast findings (grid lines sampled as background) and a `side-tab` hit in `HiringNotice.vue`, which the home page does not render.
- Pattern flags: grid-paper background, italic serif display, cream palette. Current identity, unconfirmed in PRODUCT.md; noted, not counted as defects.

**Visual overlays:** none available.

## Overall Impression

The headline is strong and the three "How might DTPR…" mocks are the right idea, but the page never lets anyone act on it. The biggest opportunity is to make the three audience cards real doors and give the page an ending.

## What's Working

- The headline positions the product in one sentence, and the italic serif gives the page its only typographic character.
- Nav tiles pair a label with a plain descriptor, which removes guesswork for first-timers.
- The vision mocks show DTPR inside a chat, a letter and a card, each with a plain consequence line.

## Priority Issues

**[P0] The content has no way forward**
- What: the page has 8 links, all in the header and footer. The three audience cards have no `link` in `content/pages/index.yaml:23-31`, though `twoColumns.vue:43` already supports one. No hero call to action and no closing section.
- Why it matters: two of the three success outcomes (start using, join the community) cannot be reached from the content.
- Fix: add links to the three cards, add a hero action pair, end the page with Slack, GitHub and email.
- Suggested command: /impeccable clarify

**[P1] Layout breaks on phones and tablets**
- What: at 390px the nav is five stacked tiles, 484px tall, so the headline starts 70% down the first screen. From 768px to 1280px the nav is a non-wrapping row of fixed 220px tiles (`navHeader.vue:30,36`); the page scrolls sideways by 516px at 768 and 260px at 1024. Below 640px the nav and card sections have no side padding while the hero is inset 16px. The canvas card is a fixed 372px (`CanvasCard.vue:18`) and the letter mock overflows by 9px at 390 and 27px at 320. The h1 is 72px between 640 and 1023, larger than the 48px desktop size (`app.config.ts:5`). The footer hardcodes `pl-20`/`pr-20` (`appFooter.vue:6,13`).
- Why it matters: tablets and small laptops are likely government-staff devices, and two nav items are off-screen there.
- Fix: collapse or wrap the nav, use one shared responsive container, make the mocks fluid.
- Suggested command: /impeccable adapt

**[P1] "Show the standard working" is not true here**
- What: "How this works" is a `span` with no handler (`ChatFooter.vue:387`). `visionSection.vue:50` has `:v-if` (typo) and passes `src`, but `CanvasCard.vue` declares no props, so `cbsa-tci.datachain.json` is ignored. The letter's QR code is an empty dashed box. The mocks are fictional and unlabelled.
- Why it matters: a transparency site showing dead controls and an unlabelled fictional government letter spends trust.
- Fix: make the chat strip a real toggle button, render `CanvasCard` from `src`, label the mocks as illustrations.
- Suggested command: /impeccable harden

**[P1] Mock text is too small for a product about legibility**
- What: about 1,000 characters render at 9–11.8px in a handwriting font; `text-default/50` captions are roughly 3.4:1.
- Why it matters: this is the page's peak moment and the proof the standard is readable.
- Fix: set a 12px floor, keep Kalam for annotations only, replace the 50% opacity text.
- Suggested command: /impeccable typeset

**[P2] One message said three times, then large gaps**
- What: the h1, the 55-word subhead (30px semibold on desktop) and the "transparent doable" card all define DTPR. The page has 3 real headings; other titles are `div`s. Section gaps stack to about 168px.
- Why it matters: the visitor reads the definition three times before seeing what DTPR looks like.
- Fix: cut the subhead to about 20 words, merge the two "why" cards, attach "How Might DTPR…" to its examples, use real `h2`/`h3`.
- Suggested command: /impeccable distill

## Persona Red Flags

- **Jordan (first-timer):** taps "Government And Community Leaders", the map's zoom button and "How this works"; nothing happens each time. Never sees a DTPR icon above 16px.
- **Casey (one-handed mobile):** five nav tiles before any content, a sideways wobble from the overflow, 30px-tall logo links, nothing tappable in the content.
- **Sam (keyboard and screen reader):** no `<main>` or skip link, the `<nav>` element is empty with links outside it, tab order skips the whole content area, all DTPR icons have `alt=""`.
- **City staffer evaluating adoption:** none of the evidence in PRODUCT.md (15 communities, Sydney case study, awards) is on the home page, and there is no "talk to us" path.

## Minor Observations

- Capitalisation drifts across the three vision headings, and only the first has a question mark.
- `map.png` is a screenshot of an interactive map with zoom buttons baked in; at 390px it renders 358×161 and the labels are unreadable.
- Invalid classes: `sm:w-100%`, `w-fill`, `h-100vh`, `rounded-40%`.
- Commented-out templates ship to the browser (`twoColumns.vue:73-101`, `hero.vue:24-35`).
- The hero image has no width or height, so layout shifts on load.
- The Helpful Places logo has equal weight to the DTPR logo in the header.

## Questions to Consider

1. Why does the page explain DTPR with 200 words and a city diagram instead of one real DTPR sign a visitor can read in five seconds?
2. The mocks are drawn as sketches of a possible future, but the standard has 15 deployments. Is the page selling a vision or a working standard?
3. What would the page be if the three audience doors were the hero?
