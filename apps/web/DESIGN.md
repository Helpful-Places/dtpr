---
name: DTPR
description: The website for Digital Trust for Places and Routines, an open standard that explains how technology uses data in plain language and icons.
colors:
  navy: "#1B2B80"
  navy-tint: "#F0F5FF"
  medium-blue: "#2563D0"
  cool-paper: "#E8EAF5"
  paper: "#F4F2EC"
  paper-raised: "#F8F8F2"
  sheet: "#FFFFFF"
  ink: "#0F172A"
  ink-muted: "#475569"
  ink-dimmed: "#64748B"
  rule: "#CBD5E1"
  paper-edge: "#E2E0D8"
  midnight: "#070D24"
  chartreuse: "#9ACD00"
  positive: "#15803D"
  info: "#1E40AF"
  caution: "#C2410C"
  caution-text: "#993006"
  error: "#B91C1C"
  sketch-ink: "#2B2B28"
  sketch-teal: "#007B7A"
  sketch-gold: "#FFD700"
  sketch-coral: "#E76F51"
typography:
  display:
    fontFamily: "'Source Serif 4', serif"
    fontSize: "2.75rem"
    fontWeight: 400
    lineHeight: 1.09
    letterSpacing: "normal"
  headline:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.11
    letterSpacing: "normal"
  page-title:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.11
    letterSpacing: "normal"
  title:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  row-title:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "normal"
  entry:
    fontFamily: "'Source Serif 4', serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  lede:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.56
    letterSpacing: "normal"
  body:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "'Public Sans', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "0.05em"
  code:
    fontFamily: "'Source Code Pro', monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "normal"
  annotation:
    fontFamily: "'Kalam', cursive"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "14": "56px"
  "20": "80px"
components:
  button-primary:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sheet}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.medium-blue}"
    textColor: "{colors.sheet}"
  button-outline:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.navy}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.navy-tint}"
    textColor: "{colors.medium-blue}"
  sheet-card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  nav-tile:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "44px"
  nav-link-compact:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  nav-link-compact-active:
    backgroundColor: "{colors.navy-tint}"
    textColor: "{colors.navy}"
  chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
    height: "36px"
  chip-selected:
    backgroundColor: "{colors.cool-paper}"
    textColor: "{colors.navy}"
  list-row-selected:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "44px"
  footer:
    backgroundColor: "{colors.midnight}"
    textColor: "{colors.sheet}"
    padding: "56px 32px"
---

# Design System: DTPR

## Overview

**Creative North Star: "The Field Guide"**

The site is a reference book for reading technology in the city. Like a good field guide, it is organised into entries you can look up, each with an identifier, an icon and a plain description, and it is laid out to be consulted outdoors by someone who is not an expert. The page is warm paper marked with a dot grid; content sits on white sheets with a hairline outline; identifiers are set in monospace and section labels in small capitals. The one flourish is an italic serif headline at the top of a page, the way a guide's title page is set differently from its entries.

The mood is civic, trustworthy, calm and clear. Density is moderate on the marketing pages and tight inside the taxonomy explorer, where three panes behave like an index, an entry and a list. Hand-drawn material is rare: the exploded city plan in the home hero, and the sketched vision mocks, which no page places at present. Those are the guide's plates, drawn in pen, and the mocks are labelled as illustrations.

This system rejects three looks. It is not SaaS marketing gloss: no gradients, glass cards, glowing accents or invented metrics. It is not smart-city futurism: no dark dashboards, neon data lines or surveillance-tech styling. It is not government-portal drab: no grey boxes, dense link lists or bureaucratic form styling.

**Key Characteristics:**
- Warm paper with a 24px dot grid as the substrate; white sheets with slate hairlines for anything that is read at length.
- Navy does the work. Medium blue is the hover and the "digital" tone. Chartreuse is held back for live data.
- Public Sans everywhere, one italic serif headline per page, monospace for identifiers.
- Small radii (4px controls, 6px sheets); full pills only for chips and tags.
- Three levels of depth: paper, sheet, lifted.
- Light theme only. Colour mode switching is disabled.
- Motion is brief, state-driven, and turned off under reduced motion.

## Colors

A cool navy-and-blue brand palette on warm off-white paper, with slate text and hairlines.

### Primary
- **Navy** (`navy`): the brand colour. Primary button fill, section labels, link text, active nav outlines, focus outlines, the 2px rule on top of the footer, the selected row in the deployments list.
- **Navy Tint** (`navy-tint`): the lightest navy step. Hover fill for outline buttons and list rows, active fill for compact nav links.

### Secondary
- **Medium Blue** (`medium-blue`): the response colour. Primary buttons turn this on hover and press; outline buttons take it as text and ring on hover. It is also the dot-grid ink (at 25%) and the colour of the "Digital layer" sheet in the hero plan.

### Tertiary
- **Cool Paper** (`cool-paper`): a lavender-grey fill for selected chips, award tags and hovered rows in the explorer.
- **Chartreuse** (`chartreuse`): reserved for live-data indicators. It is defined in the theme and not yet used by any component.

### Neutral
- **Paper** (`paper`): the page background, always under the dot grid.
- **Paper Raised** (`paper-raised`): the explorer shell, deployment cards and developer panels; one step lighter than paper.
- **Sheet** (`sheet`): pure white. Cards, nav tiles, the docs page, prose panels, inputs.
- **Ink** (`ink`): headings and body text.
- **Ink Muted** (`ink-muted`): supporting copy, captions, compact nav links at rest.
- **Ink Dimmed** (`ink-dimmed`): the faintest text, such as step numbers.
- **Rule** (`rule`): the slate hairline around every sheet, tile and outline button.
- **Paper Edge** (`paper-edge`): dividers inside the explorer and other paper-raised surfaces.
- **Midnight** (`midnight`): the footer band. Text on it is white at 70%, with column headings in a light step of medium blue.

### Status
- **Positive** (`positive`), **Info** (`info`), **Caution** (`caution`), **Error** (`error`): semantic fills and borders through Nuxt UI.
- **Caution Text** (`caution-text`): caution set as text. The fill colour falls short of 4.5:1 on tinted panels, so text takes one step darker.

### Sketch palette
Used only inside the vision mocks, which depict fictional services and are captioned as illustrations.
- **Sketch Ink** (`sketch-ink`): mock text and outlines.
- **Sketch Teal** (`sketch-teal`), **Sketch Gold** (`sketch-gold`), **Sketch Coral** (`sketch-coral`): highlighter strokes and dashed tags that mark context values such as "Identifiable" and "Autonomous".

### Named Rules
**The Live Data Rule.** Chartreuse marks live data and nothing else. Never text, borders, hover states or decoration.

**The Hover Is Blue Rule.** Navy is the resting state; medium blue is the response. An interactive navy element answers a pointer by turning medium blue, not by darkening.

**The Sketch Stays In The Sketch Rule.** Teal, gold, coral and sketch ink never leave the vision mocks.

## Typography

**Display Font:** Source Serif 4 Italic (with serif)
**Body Font:** Public Sans (with sans-serif)
**Label/Mono Font:** Source Code Pro
**Annotation Font:** Kalam, inside vision mocks only

**Character:** A government-grade sans does nearly everything, which keeps the site plain and legible. One italic serif line per page gives it a voice; monospace marks anything a developer could copy.

### Hierarchy
- **Display** (400 italic, 2.25rem on phones to 2.75rem from 640px, 48px lines, balanced): the hero headline, left-aligned.
- **Eyebrow** (Label type in navy, on one 24px line): an optional word or two above a hero headline, such as "Getting started" or "Documentation".
- **Page Title** (Public Sans, 600, 1.875rem to 2.25rem, left): the h1 of a page with no hero, such as privacy. The taxonomy now opens with the standard hero instead. The docs pages have not moved to it yet.
- **Headline** (600, 1.875rem to 2.25rem, left, balanced): every section heading, on every page.
- **Title** (600, 1.25rem): the heading of any card or sheet.
- **Row Title** (600, 1rem): the heading of a ruled row inside a sheet.
- **Entry** (Source Serif 4, 600, upright, 1.125rem to 1.875rem): names of taxonomy elements and category prompts inside the explorer.
- **Lede** (400, 1.125rem, 24px lines, ink muted, max 48rem, pretty wrap): the sentence under a headline or the paragraph under a hero.
- **Body** (400, 1rem, line-height 1.5): running text. Prose panels cap at 42rem. Dense UI text is 0.875rem.
- **Label** (600, 0.75rem, 0.05em tracking, uppercase, navy): section labels, nav tiles, list headers, footer column headings.
- **Code** (400 to 600, 0.75rem): element ids, schema versions, step numbers, developer panels.

### Named Rules
**The Grid Line Rule.** Text set directly on the dot paper (the hero and every section header) uses lines one grid unit (24px) or two (48px) tall, starting on a row of dots, so the rows fall between lines of small text. Ledes are single height; the display line and headlines are double. Gaps between them are 0 or whole units. Text inside sheets is exempt: the dots are not visible there.

**The One Serif Line Rule.** Italic serif appears once per page, in the hero. Upright serif is allowed only for entry names in the taxonomy.

**The Identifier Rule.** If a string could be pasted into the API, it is set in Source Code Pro.

**The Twelve Pixel Floor Rule.** No text below 0.75rem, including inside mocks.

## Layout

Content sits in a centred container (79rem max, so its content is 1200px, fifty grid units, and both edges fall on dot columns; with 16px, 24px and 32px gutters at the three main breakpoints). The dot grid sets a 24px base unit, and card grids use 24px gaps to match it. Every section pads top and bottom by one step, `--section-pad`, through the `section-pad` utility: 40px on phones, 56px from 640px, 80px from 1024px. A page made of short sections adds `sections-compact` to its wrapper for 24px, 40px and 56px. Inside a section the gaps follow the grid: 24px from the rule to the first line, no gap between headline and lede, 24px from the header to the body, 24px from the body to the section's action. The hero pads 48px and puts 24px between its headline and paragraph.

Every section on the marketing pages opens with the same left-aligned header: a 2px rule, a headline and an optional lede. Below it sits a full-width sheet, a card grid, a prose panel, or a two-column grid at 1024px (2:1 for the map and its list, 1:1 for community tracks). The hero is left-aligned on the same edge. Vision sections, when placed, put text on the left and the mock on the right at 2:3.

Headings and short ledes may sit directly on the dot grid. Running prose and navigation always sit on a sheet. The docs section is a single white sheet holding a 3-column sidebar and a 7-column body. The taxonomy explorer is three cards on the paper with 16px gaps, 78vh tall from 768px. On a category they read categories, the category, its elements: two (remainder, 19rem) and then three (16rem, remainder, 20rem) at 1024px. Opening an element slides the list left over 300ms and the element fades in on the right: two (19rem, remainder) and then three (16rem, 20rem, remainder), on the same grid as the builder's palette, datachain and details so the two views share a frame. The slide is skipped under reduced motion. The category and element lists are paper raised; the entry is a white sheet. On phones it becomes a drill-down with a back bar.

Every interactive target is at least 44px tall, except secondary text links (32px) and chips (36px).

## Elevation & Depth

Depth is layered in three levels, and each level means something.

1. **Paper.** The page and its dot grid. No shadow. Headings and ledes live here.
2. **Sheet.** White or paper-raised panels resting on the paper: a hairline outline plus one faint shadow.
3. **Lifted.** A sheet that is responding or floating: linked cards on hover, and the compact header once the page scrolls.

### Shadow Vocabulary
- **Sheet** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): every card, panel, map frame and the docs page. Always paired with a 1px rule outline.
- **Lifted** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): linked cards on hover, together with a 2px rise and a navy ring, over 200ms.
- **Floating bar** (sheet shadow, white at 95%, `backdrop-filter: blur(12px)`): the compact sticky header.
- **Selection marker** (`box-shadow: inset 3px 0 0 #1B2B80`): the current element row in the explorer.
- **Pen offset** (`box-shadow: 2px 3px 0 rgb(0 0 0 / 0.05)`): a hard, unblurred offset under vision mocks, so they read as paper cut-outs.

### Named Rules
**The Outline First Rule.** A shadow never stands alone. Every raised surface also carries a 1px rule outline, so the edge holds on low-contrast displays.

**The Lift Means Link Rule.** Only surfaces that go somewhere rise on hover. Static cards stay at sheet level.

## Shapes

Corners are small and consistent. Controls (buttons, compact nav links, list rows) take 4px. Sheets, cards, tiles and panels take 6px. Full pills are reserved for chips, tags and colour dots. There are four lines. The section rule is 2px in rule, full container width, above every section header and never inside a sheet. It is drawn on the dot grid: it starts on a column of dots and runs through a row of them (`useDotGridSnap` nudges each rule down by under 24px to reach the row). The hairline is 1px in rule: a `ring` around every sheet and `divide-y` between rows on white. Paper edge is 1px, for dividers on paper-raised surfaces only. The footer rule is 2px navy, on top of the footer only.

DTPR icons carry their own shapes (the outline is set by the element's category) and are never cropped, masked or re-rounded by the layout.

The vision mocks break the grid on purpose: irregular hand-cut radii, 2px dashed navy borders, a fraction of a degree of rotation and wavy underlines. That treatment belongs to the mocks alone.

## Components

Tactile and confident: solid fills, clear outlines, 44px targets, and a visible answer to every hover and focus.

### Buttons
- **Shape:** gently squared (4px), bold label, at least 44px tall on marketing pages.
- **Primary:** navy fill, white label. Extra-large size for section actions, often with a trailing arrow icon.
- **Outline:** white fill, navy label, rule ring. Used for secondary actions inside cards.
- **Hover / Focus:** primary turns medium blue. Outline gets a navy-tint fill with medium-blue text and ring. Focus is a solid navy outline.
- **Ghost / Neutral:** small neutral buttons inside the explorer toolbar and developer panels.

### Chips
- **Style:** full pill, 1px border, white fill, 0.875rem text. May lead with a 10px colour dot for a context value.
- **State:** selected chips take a navy border, cool-paper fill and navy text. Hover darkens the border toward navy.
- **Tags:** award tags are cool-paper pills with navy text that invert to navy on hover; press tags are outlined paper pills.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** white on marketing pages, paper raised inside the explorer and on deployment cards.
- **Shadow Strategy:** sheet at rest; lifted on hover when the card is a link (see Elevation & Depth).
- **Border:** 1px rule ring. Internal dividers are 1px rule.
- **Internal Padding:** 20px on phones, 24px from 640px; prose panels 24px to 32px. Rows, and the header and footer strips of a sheet, take 16px vertically and 20px to 24px horizontally.
- **Titles:** Title (1.25rem) in a card, Row Title (1rem) in a row.

### Inputs / Fields
- **Style:** Nuxt UI defaults on a white fill with a 4px radius; search inputs carry a leading icon and sit in a sticky bar above the list.
- **Focus:** solid navy outline. Nuxt UI's 25% primary outline is overridden because it fails 3:1.
- **Required:** a caution-text asterisk with a screen-reader "(required)".

### Navigation
- **Expanded header (home page only):** the DTPR and Helpful Places logos over a row of five white tiles. Each tile has a small-caps navy label and, at 1280px, a one-line descriptor. Hover and active states darken the outline toward navy.
- **Compact header:** every other page starts here. On the home page, past 24px of scroll, the tiles fold away over 300ms and the bar becomes a floating white sheet with inline small-caps links (ink muted at rest, medium blue on a blue tint on hover, navy on a navy tint when active).
- **Mobile:** a 44px "Menu" button opens the same tiles stacked, each with its descriptor.
- **Docs sidebar:** one per tree. Deployer docs and developer docs each show only their own pages, under the tree's name, with links to Concepts and the other tree beneath. Concepts, which belongs to both, lists itself and the two trees. Link-style navigation with a rule guide line for nested items; collapses into a disclosure named after the tree below 1024px.

### Section Toolbar
One slim white sheet under the page title of a section that has more than one view, 24px below the header and 24px above the content. On the left, the views as links in the compact-header style (small capitals, ink muted at rest, medium blue on a blue tint on hover, navy on a navy tint when current), each 44px tall. On the right, the settings the views share. The views are pages, so they are links with `aria-current`, not ARIA tabs. The taxonomy uses it for Explore and Build, with the schema version and locale on the right; the version is shown locked while the builder holds a datachain. Until the builder launches (the `builder` feature flag), Explore is the only view, so the toolbar holds the settings alone. A view that shows its content more than one way (Explore: panes or list) puts that switch in a row above its cards, as two small outline buttons with the current one on cool paper. Explore's row then has the Developer switch, and always ends with Print and Download, each after a thin divider; Print always prints the list, loading it out of sight when the panes are showing. Hidden in print.

### Developer View
One switch, off by default, for pages that serve both the public and developers: the taxonomy and the Concepts page. It is a small outline button labelled Developer with a code icon, on cool paper when on, in Explore's view row between the Panes and List switch and Print and Download (each side set off by a thin divider), and at the top right of the Concepts page. The deployer and developer docs never show it: each is written for one audience. It is remembered in a cookie, so the server renders the right version, and a link can carry `?dev=1` (or `?dev=0`). When on, it adds ids in Code type and medium-blue ink (category, element and variable ids), the "For developers" block of REST and MCP calls and raw JSON on category and element cards, and every `::dev` block in the docs, such as each concept's "In the API" paragraph. Every addition that is more than an id sits behind a 2px medium-blue rule on its left, so it reads as added and turning the switch off clearly takes only that away. The developer docs are for developers throughout and are never hidden.

### Where To Start
The home page's persona section, second on the page. A framed workshop photograph with a caption sits beside one white sheet of numbered, hairline-ruled rows (1:1 from 1024px, the photo card stretched to the rows' height with the picture filling the space above its caption). Each row is a persona: a row title, a muted sentence, then an outline button into the part of the Get Started guide that suits them and, beside it, a text link to a way to take part (email, Slack, GitHub). Under the section, a primary button to the guide and an outline button to Get Involved. Any page section can carry an anchor, so these buttons land on the right part of the guide.

### Guide Sections
Three section types carry the Get Started guide, each opening with the standard section header and a prose panel of markdown body text.
- **Datachain Rows:** one white sheet of ruled rows, one per chosen category. Each row puts the category's question from the API on the left and two systems' answers beside it (icon, name, a muted note with the element and context, and the text the datachain filled in). Column labels sit in a header strip from 768px and above each answer below it. A footer strip says who wrote the examples and shows the schema version in Code type.
- **Icon Anatomy:** one white sheet split into three steps (1fr 1fr 2fr from 768px, stacked below): the element's symbol, the shape its category sets, and the finished icon in each coloured context value, each labelled with the value's name from the API.
- **Question List:** a prose panel beside a white sheet of numbered rows (side by side from 1024px), for a short list such as the feedback survey's questions. Up to two buttons below, as Icon Anatomy.
- **Example List:** a white sheet of hairline-ruled rows beside one framed example (1:1 from 1024px), for "Ways to deploy". Each row is an option: title, muted sentence and an outline button. Pointing at a row, or tabbing to its button, gives it the navy-tint fill and 3px inset navy marker of a selected list row and crossfades the example over 200ms (no fade under reduced motion). The example sits on paper raised inside a 4:3 frame, never cropped, with a caption strip below that links to the deployment. Below 1024px every row carries its own example, so nothing depends on hover.

### Section Header
A 2px rule, a semibold headline (max 56rem) and a muted lede (max 48rem). No label sits above the headline. It opens every section on Home, Get Started, Get Involved, Who We Are and DTPR in the World. Get Involved keeps the rule and uses the compact section step, because its sections are short.

### Ways In
Three white sheet cards in a row from 768px, stacked below, one per way to take part. Each holds a title, a muted sentence and a single outline button pinned to the bottom. A card may open with a 40px navy-tint square holding a 20px navy line icon from the shared inline Lucide set (`lineIcons`, the same set Audiences draws from), so the three cards read as three different things. The icon is the thing's mark wherever it appears: signpost, code and open book stand for the deployer docs, developer docs and Concepts on both the guide's "Where next" and the `/docs` chooser. Links that leave the site take an up-right arrow; internal links take a right arrow. The cards are not links themselves, so they never lift. A card may leave the button out when it only names an idea, as in the guide's "How DTPR works". Used for "Ways in" on Get Involved, two sections of the Get Started guide and the `/docs` chooser.

### Newsletter
A white sheet holding a labelled email field and a primary "Subscribe" button on one line (stacked on phones), with a status line beneath. A photograph may sit beside it in a 22rem column from 1024px, framed as a sheet. No mailing list is connected yet: submitting says so in caution text and stores nothing.

### Audiences
Context, not actions, so rows instead of cards: one white sheet of hairline-ruled rows, each an inline 24px navy line icon (from `lineIcons`, Lucide paths at 1.75 stroke), a row title and a muted sentence (title and sentence side by side from 768px). Not links, so they never lift.

### Deployment Figures
Four white sheet cards in a row from 1024px, two by two below: a large navy semibold number over a muted caption, for communities, countries, awards and press articles. Every number is counted from the content collections. They sit above the map on the home page's DTPR in the World section and on the DTPR in the World page. Not links, so they never lift.

### Contact
A white sheet with the email address set as a navy title link, one muted sentence, and a primary button on the right.

### Field Plate (hero city plan)
An exploded isometric plan of four sheets (public realm, transportation, buildings, digital layer) drawn as pen line art with a turbulence filter and a second, fainter pass. The three physical layers are navy steps; the digital layer is medium blue. The stack spreads as the page scrolls and holds still under reduced motion. Labels are small capitals beside each sheet.

### Datachain Sheet
A real datachain read as a field-guide entry, directly under the home hero. One white sheet: the system's name and description on top, then one ruled row per category in schema order, with the category's question on the left (15rem) and its elements on the right. Each element is a 44px outlined button holding its 40px DTPR icon, its name, and a muted note for the taxonomy name and context value. Selecting one fills it with navy tint under a navy outline and opens what the datachain says about it beneath the row, followed by the taxonomy's own definition and a link to the element. The footer states who wrote the example and its source, with the schema version in monospace. Icons keep the colours their context values assign; the layout adds none.

### Vision Mocks
Not placed on any page at present. Sketches of fictional services showing where DTPR could appear: a chat footer, a decision letter, a canvas card. Kalam type, dashed navy borders, highlighter strokes in the sketch palette. Each is captioned as an illustration.

### Footer
A midnight band under a 2px navy rule: white logo and one-sentence description on the left, three link columns on the right, and below a faint divider the Helpful Places logo (inverted to white) as steward beside the licence line.

## Do's and Don'ts

### Do:
- **Do** put running prose and navigation on a white sheet with a 1px rule outline and the sheet shadow. Only headings and short ledes sit on the dot grid.
- **Do** use navy (#1B2B80) for primary actions and medium blue (#2563D0) for their hover.
- **Do** keep targets at 44px or taller, and give every focusable element a solid navy outline.
- **Do** set ids, schema versions and anything copyable in Source Code Pro.
- **Do** open every section with the section header: rule, headline, optional lede.
- **Do** pad sections with `section-pad`, outline sheets with `ring ring-rule`, and divide rows with `divide-y divide-rule`.
- **Do** honour reduced motion on every transition, and keep motion to 200ms or 300ms on state changes.
- **Do** caption vision mocks as illustrations of fictional services.

### Don't:
- **Don't** use chartreuse for text, borders, hover states or decoration.
- **Don't** set more than one italic serif line on a page.
- **Don't** use Kalam, dashed borders, irregular radii or the sketch palette outside the vision mocks.
- **Don't** use gradients, glass cards, glows or number cards other than the deployment figures. Never show a figure that is not counted from content.
- **Don't** build dark dashboards, neon data lines or surveillance-tech visuals.
- **Don't** fall back to grey boxes, dense link lists or bureaucratic form styling.
- **Don't** lift a card on hover unless it links somewhere.
- **Don't** set caution orange (#C2410C) as text; use the darker caution text step.
- **Don't** add a dark theme. The tokens are light only.
- **Don't** credit Superbloom, or present any steward other than Helpful Places.
