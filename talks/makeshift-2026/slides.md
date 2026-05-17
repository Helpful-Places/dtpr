---
theme: seriph
title: DTPR for AI — A Translation Layer for the Algorithms in Our Cities
info: |
  ## DTPR for AI
  A Translation Layer for the Algorithms in Our Cities

  MakeShift 2026 · School of Visual Arts, NYC · 2026-05-20–21
  Jonathan Pichot · Helpful Places
author: Jonathan Pichot
class: text-center
background: https://dtpr.io/images/intro_header.svg
transition: slide-left
mdc: true
fonts:
  sans: 'Helvetica Neue'
  serif: 'Sorts Mill Goudy'
  mono: 'JetBrains Mono'
  weights: '400,600,700'
  local: 'Helvetica Neue'
---

<div class="inline-block bg-hp-blue text-white px-8 py-4">
  <h1 class="!m-0 !p-0 !text-white">DTPR for AI</h1>
</div>

<div class="mt-6 inline-block bg-hp-blue text-white px-6 py-3 text-2xl">
An Open-Source Communication Standard for AI
</div>

<div class="mt-12 inline-block bg-hp-blue text-white px-6 py-3 text-lg">
MakeShift 2026 · School of Visual Arts, NYC<br>
Jonathan Pichot · Helpful Places
</div>

<!--
15s
A grounded hello. Don't promise what the talk will do — let the audience discover it.
-->

---
layout: image-right
image: https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1600&q=80
---

# NYC

On the forefront of municipal innovation

### AI transparency and disclosure
- Local Law 35 of 2022
- The Office of Technology & Innovation
<br>
<br>
### ..built on the foundation <br> of open data
- Local Law 11 of 2012
- Mayor's Office of Data Analytics
- BetaNYC

<!--
SLIDE 2 · 20s · We're in NYC
Set the location. Pay homage to LL35 + OTI. Constructive, humble.

---

> We're in New York City. New York City has done more than most cities to make AI transparent and understandable — thanks to Local Law 35 of 2022 and the Office of Technology and Innovation. [beat] We wanted to pay homage to that work.
-->

---
class: '!p-0'
---

<Ll35ReportScroll :duration-sec="300" />

<!--
SLIDE 6 · 30s · LL35 Report — full scroll
The 127-page LL35 Report 2025 scrolls slowly upward when the slide loads. Default duration 360s (the speaker controls when to advance). Continuous beat with slide 5: this slide is where the "I applaud them" line lands AS the volume of the report becomes visible.
Tune via :duration-sec on <Ll35ReportScroll />.
Source PDF: public/LL35 Report 2025 - Final - 2026-03-27.pdf, rendered to public/images/ll35-report/page-NNN.jpg at 100dpi.

---

*Slide loads. The report starts scrolling. Let it do the work.*

> *(Continuing from slide 5.)* And every year they publish a report like this — one hundred and twenty-seven pages this year. [beat] Every algorithmic tool the city uses, declared. In machine-readable form. [beat] I really want to applaud them on this work.
-->

---
class: text-center flex flex-col items-center justify-center
---

# Disclosure is the first step
# Public understanding comes next

<div class="mt-8 text-2xl opacity-80">
DTPR is designed to move from PDFs and CSVs,<br>to understanding
</div>

<!--
SLIDE 7 · 30s · Disclosure is step one (bridge into Act 1)
Pivot from "applauding NYC" to "what we're here to add." Don't make the talk's promise — frame it as a shared question. Humble bridge into the DTPR translation-layer setup.

---

*Title large; subtitle small. Brief pause before delivering.*

> So — what we're here to do is to introduce the next step. [beat] Disclosure is step one. Getting the data out there, in machine-readable form, is step one — and New York has done that. [beat] [beat] But how do we make this information usable by a lot of people? [beat] How can we bring what we've learned — working with communities around the world on making data collection in public space transparent — to AI?
-->

---
layout: image-right
image: /sopa.png
---

# DTPR, 6 years later

- Initially released in 2020
- Grounded in conversations and co-design sessions with hundreds of experts and public participants
- Focused on bringing transparency to data collection in public space
- Released as Creative Commons Attribution-ShareAlike 4.0 International
- Translated in 6 languages
- Covered in media around the world

<div class="absolute bottom-2 right-3 text-[10px] opacity-70 text-white drop-shadow">
Early DTPR deployment · Sydney Olympic Park
</div>

<!--
SLIDE 8 · 30s · DTPR, 6 years later
Photo (sopa.png) carries the "you've seen these" beat. Frontmatter `image:` resolves through Slidev's layout, which bypasses the markdown-image import guard that flagged `<img src="/sopa.png">` and `![](/sopa.png)`.
Skip the origin story.

---

*Origin photo: DTPR signage panel + CCTV at Sydney Olympic Park.*

> Many of you already know DTPR. [beat] You've seen these shapes. The icons. The colors. It's a visual grammar for what a connected thing in public space is doing — the same hexagon in Boston means the same thing as the same hexagon in Helsinki. [beat] I'll skip the origin story.
-->

---
layout: image
image: /dtpr-map.png
backgroundSize: contain
---

<div class="absolute top-3 left-6 bg-black/80 text-white px-4 py-2 rounded text-2xl font-semibold backdrop-blur">
Deployed in 15 cities on 3 continents, and counting
</div>

<!--
SLIDE 10 · 30s · DTPR in production today
Static map of every original-DTPR deployment, sourced from dtpr.guide/landing. Replaces the prior live iframe (blocked by the import guard / X-Frame-Options uncertainty).

---

*Map fills the slide. Title chip top-left; URL chip bottom-left.*

> And this isn't a thought experiment. The original DTPR is deployed in fifteen cities — Boston, Sydney, Paris, Detroit, on and on. It's been doing translation work, for connected things in public space, for years.
-->

---

# DTPR as a translation layer

Making sense of piles of PDFs

<div class="mt-8 grid grid-cols-[1fr_auto_1fr] gap-8 items-center">

<div class="text-lg opacity-80">

**Heterogeneous source-of-truth**  
*scattered across agencies and vendors*

- Privacy Impact Assessments
- Vendor specs
- Procurement records

</div>

<div class="text-5xl opacity-70 text-center">→</div>

<div>

**DTPR datachain**  
*tells the story of data collection*

- Visual language
- Design system
- Standard taxonomy

</div>

</div>

<!--
SLIDE 9 · 45s · It was always a translation layer
"Take heterogeneous inputs from any city or vendor. Produce one comparable nugget a person can read."
This is the THESIS slide. Set up the reframe that DTPR for AI extends the same translation function.

---

*Split slide: privacy notice PDF, vendor spec, signage standard on the left → datachain on the right.*

> Here's the thing about DTPR. [beat] It takes heterogeneous inputs — a privacy notice in legal English, a vendor spec sheet, a regulatory filing — and it produces one comparable, readable nugget that a non-expert can actually parse. [beat] DTPR has always been a translation layer.
-->

---

# January 2025, first proposal of DTPR for AI

<div class="text-base mt-1 opacity-70">
<a href="https://github.com/Helpful-Places/dtpr/issues/228" class="underline">RFC #228</a> · <em>Create a new datachain pattern to describe an AI model or algorithm</em>
</div>

<table class="text-xs mt-4 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-2 py-1 text-left">Shape</th>
<th class="px-2 py-1 text-left">Sensor datachain</th>
<th class="px-2 py-1 text-left">AI datachain</th>
<th class="px-2 py-1 text-left"><em>Contextual color</em></th>
</tr>
</thead>
<tbody>
<tr><td class="px-2 py-1">hexagon</td><td class="px-2 py-1">Accountable</td><td class="px-2 py-1">Accountable</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">hexagon</td><td class="px-2 py-1">Purpose</td><td class="px-2 py-1">Purpose</td><td class="px-2 py-1"></td></tr>
<tr class="bg-blue-50"><td class="px-2 py-1">hexagon</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"><strong>Decision Making</strong> 🆕</td><td class="px-2 py-1 italic">Level of autonomy in decision-making</td></tr>
<tr><td class="px-2 py-1">hexagon</td><td class="px-2 py-1">(Data-collection) Technology</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1 italic">Data collected is personally identifiable</td></tr>
<tr><td class="px-2 py-1">circle</td><td class="px-2 py-1">Data Type <span class="opacity-60">[deprecate]</span> 🗑️</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"></td></tr>
<tr class="bg-blue-50"><td class="px-2 py-1">circle</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"><strong>Input Datasets</strong> 🆕</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">circle</td><td class="px-2 py-1">Processing (Technology)</td><td class="px-2 py-1">Processing (Technology) ♻️ <em>+ location</em></td><td class="px-2 py-1"></td></tr>
<tr class="bg-blue-50"><td class="px-2 py-1">circle</td><td class="px-2 py-1">Output Datasets 🆕</td><td class="px-2 py-1"><strong>Output Datasets</strong> 🆕</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">square</td><td class="px-2 py-1">Access</td><td class="px-2 py-1">Access</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">square</td><td class="px-2 py-1">Storage <em>+ location</em></td><td class="px-2 py-1">Storage <em>+ location</em></td><td class="px-2 py-1"></td></tr>
<tr class="bg-blue-50"><td class="px-2 py-1">octagon</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"><strong>Risks &amp; Mitigation</strong> 🆕</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">octagon</td><td class="px-2 py-1">Rights 🆕</td><td class="px-2 py-1">Rights 🆕</td><td class="px-2 py-1"></td></tr>
</tbody>
</table>

<div class="mt-3 text-xs text-center opacity-60">
Opened 2025-01-15 on github.com/Helpful-Places/dtpr · the seed of what we now call DTPR for AI
</div>

<!--
SLIDE 11 · 45s · January 2025 — the first proposal (RFC #228)
The pivot from sensors to AI. Replaces the "Same mission. New domain." title-card. Plants the flag that DTPR for AI didn't appear overnight — it started as a public RFC sixteen months ago, in the open, in the repo.

The table is verbatim from issue #228 — the side-by-side that compares the existing Sensor datachain to a proposed AI datachain. Highlighted rows are the new categories the RFC introduced: Decision Making, Input Datasets, Output Datasets, Risks & Mitigation. Most have survived into the current schema, sometimes renamed (Decision Making → Functional Modes).

Don't read the whole table. Land three beats:
  - We opened this in the open, in January 2025.
  - The shape of the AI datachain — what categories exist, which are new vs. reused — was a public conversation from day one.
  - Most of what's highlighted is still in the schema today, sometimes renamed. The rest of this talk is the result of sixteen months of iteration on this table.

---

*Side-by-side comparison table fills the slide.*

> In January 2025 — sixteen months ago — we opened an RFC in the DTPR repo. Issue two-twenty-eight. The first proposal to adapt DTPR to AI. [beat] This is the table from that issue. The Sensor datachain on the left — what DTPR had been describing for six years. A proposed AI datachain on the right. [beat] The highlighted rows are what was new — Decision Making, Input and Output Datasets, Risks and Mitigation. [beat] Most of these survived into the schema you'll see in a few slides, sometimes renamed. The rest of this talk is what sixteen months of iteration on this table produced.
-->

---
class: flex flex-col justify-center
---

<div class="text-sm uppercase tracking-wider opacity-60 mb-4">
NYC Local Law 35 of 2022 · § 3-119.5(a)
</div>

<div class="text-2xl leading-relaxed font-serif italic">
Any technology or computerized process that is derived from <span class="font-semibold not-italic">machine learning, artificial intelligence, predictive analytics</span>, or other similar methods of data analysis, that is used to make or assist in making decisions about and implementing policies that <span class="font-semibold not-italic">materially impact the rights, liberties, benefits, safety or interests of the public</span>.
</div>

<!--
SLIDE 3 · 25s · LL35 definition — our working definition of AI
The speaker paraphrases; the slide carries the verbatim quote. Land "rights, liberties, benefits, safety or interests of the public" as the moral scope. The closing "this is how we think about AI" sets up the rest of the talk as collaborative unpacking.
Source: NYC Admin Code § 3-119.5(a) · Local Law 35 of 2022.

---

*Slide loads. The verbatim definition is on screen. Speaker paraphrases rather than reading word-for-word.*

> Local Law 35 gives us a good place to start on what we mean when we say *AI*. We'll be unpacking this together throughout the talk — to communicate AI well, we need to define it well. [beat] Here, the law defines an algorithmic tool as any machine learning, artificial intelligence, or predictive analytics that makes decisions, or helps implement policy, that has a material impact on the *rights, liberties, benefits, safety, or interests of the public*. [beat] Things that *do* things in the world that affect people. [beat] That's how we think about AI as well.
-->

---

# What we should know about AI systems?

<div class="text-base mt-2 opacity-70">Regulations are converging on similar disclosure requirements.</div>

<table class="text-base mt-6 mx-auto">
  <thead>
    <tr class="bg-gray-100"><th class="px-3 py-1"></th><th class="px-3 py-1">EU AI Act</th></tr>
  </thead>
<tbody>
<tr><td class="px-3 py-1"><strong>What is it for</strong> — name &amp; purpose</td><td class="px-3 py-1">Art. 13 · Annex IV</td></tr>
<tr><td class="px-3 py-1"><strong>What does it do</strong> — function &amp; autonomy</td><td class="px-3 py-1">Art. 13, 50 · Annex III</td></tr>
<tr><td class="px-3 py-1"><strong>What data and algorithms does it use</strong> — type &amp; source</td><td class="px-3 py-1">Art. 10 · Annex IV</td></tr>
<tr><td class="px-3 py-1"><strong>Who built it, who deployed it</strong> — vendor &amp; deployer</td><td class="px-3 py-1">Art. 16, 50</td></tr>
<tr><td class="px-3 py-1"><strong>What could go wrong</strong> — risks &amp; mitigation</td><td class="px-3 py-1">Art. 9, 27 · Annex IV</td></tr>
<tr><td class="px-3 py-1"><strong>What rights does one have</strong> — contest, opt-out, human review</td><td class="px-3 py-1">Art. 14, 86</td></tr>
</tbody>
</table>

<!--
SLIDE 14 · 60s · The disclosure floor
Repositioned from "here's our taxonomy" to "here's what the law + the research already agree on as the minimum a disclosure must answer." DTPR's category structure earns its shape from this convergence — it doesn't invent it.
Cross-framework citations:
  - NYC LL35 § 3-119.5(c): the six required disclosures (name+desc, purpose, data type+source, output use, vendor, start date)
  - EU AI Act (Reg. 2024/1689): Art. 9 (risk mgmt), Art. 10 (data governance), Art. 13 (transparency/instructions for use), Art. 14 (human oversight), Art. 16 (provider obligations), Art. 27 (FRIA), Art. 50 (disclosure duties to natural persons), Art. 86 (right to explanation), Annex III (high-risk uses), Annex IV (technical documentation)
  - Research: Model Cards (Mitchell et al. 2019), Datasheets for Datasets (Gebru et al. 2018/2021), NIST AI RMF 1.0 (2023), OECD AI Classification Framework (2022), AIAAIC harm taxonomy (Abercrombie et al. 2024), Jashanmal AI Taxonomy v1.1 (2026), GDPR Art. 22 (automated decision-making rights).

LL35 dashes are not gaps in DTPR — they're gaps in LL35. Don't slag LL35 here; the celebratory opener carries the goodwill, and slide 26 frames the same delta as "DTPR extends to what LL35 doesn't yet require."

---

*Compact requirements table; LL35 / EU AI Act / research columns; small kicker that ties to slide 26.*

> Before I show you our categories, look at what the floor already is. [beat] Across NYC Local Law 35, across the EU AI Act, across Model Cards, NIST, OECD, AIAAIC — independent research, independent jurisdictions — they converge. [beat] Any AI disclosure has to say: *what it is. what it does. what data it uses. how the outputs are used. who's on the hook. what could go wrong. what rights you have when it does.* [beat] That's the floor. That's not me. That's what regulators and researchers — separately — already decided. [beat] DTPR's job is to make that floor *readable*. Same shape. New legibility.
-->

---
class: text-center flex flex-col items-center justify-center
---

<div class="relative inline-flex items-center gap-6">
  <img :src="'/images/dtpr-black.png'" alt="DTPR" class="h-32 w-auto" />
  <div class="text-7xl font-bold tracking-tight text-hp-blue-900">for&nbsp;AI</div>
  <span class="absolute -top-3 -right-14 bg-hp-blue text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md rotate-6">beta</span>
</div>

<div class="mt-12">
  <a href="https://dtpr.ai" class="text-4xl font-mono text-hp-blue-700 no-underline border-b-2 border-hp-blue pb-1">dtpr.ai</a>
</div>

<div class="mt-10 text-xl opacity-80 max-w-2xl mx-auto">
An open-source communication standard for algorithms and AI
</div>

<!--
SLIDE 14 · 25s · DTPR for AI — name the thing
First time the audience sees the URL on its own slide. Land the name, the URL, the one-line definition. Then set the beta expectation — this is the next iteration of an active beta, not a finished standard. Keep it short.

---

*Title-card style.*

> So — let me introduce DTPR for AI. [beat] Lives at dtpr.ai. An open communication standard for the algorithms in our cities. [beat] Important framing before we go further: this is the next version of the beta. Still a work in progress. I'm showing you where it is — not where it lands. [beat] Here's how it's organized.
-->

---
clicks: 4
---

# MySchools — Match

<MySchoolsMatchZoom
  :steps="[
    { cx: 0.5,  cy: 0.5,  scale: 1 },
    { cx: 0.28, cy: 0.09, scale: 2.2, label: 'Purpose Type' },
    { cx: 0.5,  cy: 0.91, scale: 1.8, label: 'Vendor' },
    { cx: 0.5,  cy: 1.4, scale: 1.8, label: 'Data Analyzed — Input' },
    { cx: 0.5,  cy: 1.7, scale: 1.8, label: 'Vendor' },
  ]"
  :duration="700"
/>

<!--
SLIDE 7 · 90s · One row — NYC HS Admissions Matching (the threaded example)
Loads with the full disclosure visible (matches the previous static-image state); each click pans/zooms through the disclosure — header → how matches are computed → oversight & rights → back to full. Tune cx/cy/scale against the live image before the talk.

The example we'll keep returning to across the rest of the talk. Picked because every parent in the room either lived through it or will, and because it exercises every modifier DTPR for AI carries: identifiable PII in *and* out, matching computation running in "Monitored" autonomy (no per-pairing human review; oversight asserted but unspecified), documented equity/segregation stakes, limited but real appeal rights.

The NYC HS admissions process is the famous deferred-acceptance Gale-Shapley variant designed by Roth, Sönmez, and Pathak. ~80,000 students go through it annually. Equity and segregation impacts have been studied extensively — including by the city itself in iterative reforms (Diversity in Admissions, screened-school changes).

Don't make this a takedown of NYCPS. The frame is: this is one of the eighty-six systems the report disclosed; the prose is dense; let's see whether a parent could read it.

TODO: verify all Patternizr → admissions value substitutions on subsequent slides against the live register entry before the talk.

---

*Page screenshot on left (loads as the full disclosure), key facts pulled out on right. Clicks walk through the sections.*

> Out of those eighty-six, I want to pull out one — and I'm going to keep coming back to it for the rest of the talk. [beat] *AI-powered school admissions matching.* The algorithm that assigns roughly eighty thousand New York City eighth-graders to a high-school seat every year. [beat] Maybe you've been on the receiving end of this. Maybe your kid has. Maybe you will. [beat] Read this page on the OTI report. Tell me — could a parent staring at their child's match tell you what this thing did? *(Click through to walk the room through the header, the matching computation, and what oversight and rights the disclosure names.)*
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <AlgorithmHeader
    src="/data/nyc-myschools-match.datachain.json"
    :highlight-category-id="$clicks >= 1 ? 'functional_modes' : null"
  />
</div>

<!--
Centered <AlgorithmHeader> — Slidev port of apps/guide-app/app/components/AlgorithmHeader.vue.
Reads /data/nyc-myschools-match.datachain.json, fetches the schema snapshot at mount,
renders the same context + flow rows the live guide-app page uses.

Click 1 draws a red rounded outline around the Functional Modes cell.
-->

---

# Context — who, what, why, risks, rights

<table class="text-sm mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-3 py-2 text-left">Category</th>
<th class="px-3 py-2 text-left">Question</th>
<th class="px-3 py-2 text-left">Contextual Information</th>
</tr>
</thead>
<tbody>
<tr>
  <td class="px-3 py-2"><strong>Accountable</strong></td>
  <td class="px-3 py-2">Who is accountable for this AI system?</td>
  <td class="px-3 py-2">
    <div class="text-[10px] uppercase tracking-wide opacity-60 mb-1">Role</div>
    <div class="flex flex-wrap gap-1">
      <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs">Vendor</span>
      <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-xs">Deployer</span>
    </div>
  </td>
</tr>
<tr>
  <td class="px-3 py-2"><strong>Functional Modes</strong></td>
  <td class="px-3 py-2">What does this AI system do? Pick one or more functional modes.</td>
  <td class="px-3 py-2">
    <div class="text-[10px] uppercase tracking-wide opacity-60 mb-1">Autonomy</div>
    <div class="flex flex-wrap gap-1">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#2A9D8F"></span>Human decides</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#6A1B7A"></span>Human executes</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#E76F51"></span>Autonomous</span>
    </div>
  </td>
</tr>
<tr><td class="px-3 py-2"><strong>Purpose</strong></td><td class="px-3 py-2">What is the purpose of this AI system?</td><td class="px-3 py-2 opacity-50">—</td></tr>
<tr><td class="px-3 py-2"><strong>Risks &amp; Mitigation</strong></td><td class="px-3 py-2">What are the risks associated with this AI system and what mitigation strategies are in place?</td><td class="px-3 py-2 opacity-50">—</td></tr>
<tr><td class="px-3 py-2"><strong>Rights</strong></td><td class="px-3 py-2">What are the user's rights in relation to the AI system?</td><td class="px-3 py-2 opacity-50">—</td></tr>
</tbody>
</table>

<!--
SLIDE 16 · 45s · Context section deep-dive (HS Admissions Matching)
Same five-category structure, filled in with the admissions matcher's disclosed values. Three things to land:
  - Autonomy is *Monitored* — the OTI report's third autonomy tier. The match runs without per-pairing human review, but the disclosure asserts oversight. Land this honestly: monitored is not autonomous and not human-decides.
  - Risks named: societal & cultural harm (school segregation, sorting effects) plus loss of autonomy (limited recourse for individual matches). Foreshadows the AIAAIC slide.
  - Rights: algorithmic transparency + a formal appeal process. Not "trust us."

TODO: verify the exact risk/rights values against the live register entry: https://nyc.clarable.ai/algorithms/3ce01f79-a2c6-4e7b-8f7c-561f2bf02f34. The values here are based on what NYCPS plausibly discloses, given the public record on segregation impact and the appeal process — confirm before delivering.

---

*Five-row context table with admissions matcher column populated.*

> Context. The frame around the system. [beat] *Accountable* is NYC Public Schools. *Functional Modes* — it matches students to schools, and the autonomy is *Monitored*. The match runs on its own; the report says the system is overseen, but the OTI report doesn't tell us by whom, how often, or against what. *Purpose* — place eighty thousand 8th-graders into a high school seat. *Risks* — societal and cultural harm, and loss of autonomy. The disclosure names them. *Rights* — algorithmic transparency, and a formal appeal process. [beat] All of this is in the OTI report. We haven't added anything yet. We've just made it readable.
-->

---

# Data flow — input, processing, output, storage

<table class="text-sm mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-3 py-2 text-left">Category</th>
<th class="px-3 py-2 text-left">Question</th>
<th class="px-3 py-2 text-left">Contextual Information</th>
</tr>
</thead>
<tbody>
<tr>
  <td class="px-3 py-2"><strong>Input Dataset</strong></td>
  <td class="px-3 py-2">What live data does this AI system process at runtime?</td>
  <td class="px-3 py-2">
    <div class="text-[10px] uppercase tracking-wide opacity-60 mb-1">Personal Information</div>
    <div class="flex flex-wrap gap-1">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#4A90D9"></span>Anonymous</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#9575CD"></span>Pseudonymous</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#FFD700"></span>Identifiable</span>
    </div>
  </td>
</tr>
<tr><td class="px-3 py-2"><strong>Processing</strong></td><td class="px-3 py-2">What algorithm family or model class processes inputs into outputs in this system?</td><td class="px-3 py-2 opacity-50">—</td></tr>
<tr>
  <td class="px-3 py-2"><strong>Output Dataset</strong></td>
  <td class="px-3 py-2">What does this AI system produce — what decisions, content, or signals come out?</td>
  <td class="px-3 py-2">
    <div class="text-[10px] uppercase tracking-wide opacity-60 mb-1">Personal Information</div>
    <div class="flex flex-wrap gap-1">
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#4A90D9"></span>Anonymous</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#9575CD"></span>Pseudonymous</span>
      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#FFD700"></span>Identifiable</span>
    </div>
  </td>
</tr>
<tr><td class="px-3 py-2"><strong>Retention</strong></td><td class="px-3 py-2">How long is the data kept?</td><td class="px-3 py-2 opacity-50">—</td></tr>
<tr><td class="px-3 py-2"><strong>Access</strong></td><td class="px-3 py-2">Who has access to the data produced by the AI system?</td><td class="px-3 py-2 opacity-50">—</td></tr>
<tr><td class="px-3 py-2"><strong>Storage</strong></td><td class="px-3 py-2">Where is the data produced by the AI system stored?</td><td class="px-3 py-2 opacity-50">—</td></tr>
</tbody>
</table>

<!--
SLIDE 16b · 45s · Data flow section deep-dive (HS Admissions Matching)
Same four-column structure as the Context slide. Three things to land:
  - Identifiable in, identifiable out — the PII never de-identifies, it just routes. Every student stays named through the entire flow.
  - The processing step names the algorithm (Gale-Shapley deferred-acceptance) — that's the part that does the matching.
  - Storage and Retention are silent on the OTI page. DTPR surfaces silence as a finding: "not specified" is itself a disclosure.

TODO: verify the input/output/access values against the live register entry: https://nyc.clarable.ai/algorithms/3ce01f79-a2c6-4e7b-8f7c-561f2bf02f34. Storage and Retention should remain "not specified" only if the live entry truly omits them.

---

*Six-row data-flow table with admissions matcher column populated.*

> Data flow. The path through the system. [beat] *Input Dataset* — student biographical info, academic records, school records. Identifiable. *Processing* — the Gale-Shapley deferred-acceptance match. *Output Dataset* — a school match for each student. Also identifiable. [beat] *Access* — the accountable organization, and the individual. *Storage* and *Retention* — silent on the OTI page. We render that silence as part of the disclosure. [beat] Same shape. Same source. Just legible.
-->

---

# Context flow reads as a sentence

<div class="text-base opacity-70 mb-6">
<em>Accountable</em> + <em>Functional Modes</em> + <em>Purpose</em> → plain English.
</div>

<ContextFlow />

<div class="mt-10 text-xl text-center leading-relaxed max-w-4xl mx-auto">
"<span class="text-emerald-700 font-semibold">NYC Public Schools</span> has deployed AI to <span class="text-amber-700 font-semibold">match</span> students to schools for the purpose of <span class="text-sky-700 font-semibold">placing 80,000 8th-graders into high-school seats</span>."
</div>

<!--
Three schema-driven DtprPlacement cards (institution + deployer,
analytical_mode + human_executes, education). Context tag labels +
composed-icon colours flow from the live schema. Sentence + framing
copy live on the slide; ContextFlow.vue owns the row + arrows only.
-->

---

# Disclosed risks and rights

<div class="grid grid-cols-2 gap-10 max-w-5xl mx-auto">

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Risks &amp; Mitigations</div>

<div class="flex flex-col gap-3">
  <DtprPlacement element-id="reputational_harm" :show-description="false" :icon-size="56" />
  <DtprPlacement element-id="societal_cultural_harm" :show-description="false" :icon-size="56" />
</div>

</div>

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Rights</div>

<div class="flex flex-col gap-3">
  <DtprPlacement element-id="right_to_notice" :show-description="false" :icon-size="56" />
  <DtprPlacement element-id="right_algorithmic_transparency" :show-description="false" :icon-size="56" />
  <DtprPlacement element-id="right_contest" :show-description="false" :icon-size="56" />
</div>

</div>

</div>


<!--
Pulled directly from the live LL35 register entry for HS admissions
matching. Two risks named (reputational harm, societal & cultural
harm) and three rights affirmed (notice, algorithmic transparency,
contest). All five render as schema-driven <DtprPlacement> cards —
titles and icons come from the published DTPR schema.
-->

---

# Data flow reads like a sentence

<div class="text-base opacity-70 mb-6">
Admissions matching: identifiable student data in, identifiable assignment out.
</div>

<DataFlow />

<div class="mt-10 text-base text-center opacity-75 max-w-4xl mx-auto">
Identifiable in. Identifiable out. The PII never de-identifies — it
routes. Every student stays named through the entire flow.
</div>

<!--
Three schema-driven DtprPlacement cards (input_about_a_person +
identifiable, optimization, output_decision + identifiable). Tag
colours and composed-icon fills come from the live schema. Caption +
framing copy live on the slide; DataFlow.vue owns the row + arrows
only.
-->

---

# Access, Storage &amp; Retention

<div class="grid grid-cols-3 gap-8 max-w-6xl mx-auto">

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Access</div>

<div class="flex flex-col gap-3">
  <DtprPlacement element-id="available_to_the_accountable_organization" :show-description="false" :icon-size="56" />
  <DtprPlacement element-id="available_to_me" :show-description="false" :icon-size="56" />
</div>

</div>

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Storage</div>

<div class="dtpr-empty-category">
  <div class="dtpr-empty-category__label">Not specified</div>
</div>

</div>

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Retention</div>

<div class="dtpr-empty-category">
  <div class="dtpr-empty-category__label">Not specified</div>
</div>

</div>

</div>

<style scoped>
.dtpr-empty-category {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 6rem;
  padding: 1rem;
  border: 1px dashed rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
}
.dtpr-empty-category__label {
  font-size: 0.95rem;
  font-style: italic;
  opacity: 0.55;
}
</style>

<!--
Pulled from the live LL35 register entry for HS admissions matching.
Access discloses two elements (available to the accountable
organization, available to me); Storage and Retention are silent —
rendered as dashed "Not specified" placeholders that mirror DTPR's
existing convention for legible gaps.
-->

---

# Risks & Mitigations

<DtprCategoryGrid category-id="risks_mitigation" />

<div class="mt-3 text-xs opacity-60 text-center">
Abercrombie et al. 2024 · <code>arXiv:2407.01294</code> · CC BY-SA 4.0
</div>

<!--
TEST SLIDE · live <DtprElement> grid for the risks_mitigation category.
Replaces the side-by-side AIAAIC mapping table with a grid of the 9
risk-mitigation elements rendered as DTPR cards. Data + icons come
straight from the dtpr.ai REST API.
-->

---

# Why victim-centered, not cause-centered

<div class="grid grid-cols-2 gap-8 mt-8">
<div class="p-6 border rounded">

**Cause framing** *(retired)*

"Opaque decision-making"

"Function creep"

"Unequal performance"

</div>
<div class="p-6 border-2 border-blue-500 rounded">

**Victim framing** *(adopted)*

"Loss of autonomy"

"Civil liberties harm"

"Reputational harm"

</div>
</div>

<div class="mt-12 text-xl text-center opacity-80">
"What could happen to <em>me</em>" lands.<br>
"Where the failure originated" doesn't.
</div>

<!--
SLIDE 24 · 30s · Why victim-centered
This is the design-decision slide. Make the rationale concrete with an example pair.

---

*Two versions of the same risk side by side.*

> "Opaque decision-making" is a cause. "Loss of autonomy" is what it does to you. [beat] Cause framing is for engineers. Victim framing is for the person living with the outcome. [beat] When you're on the receiving end of an AI decision, victim framing lands.
-->

---

# Functional Modes

<DtprCategoryGrid category-id="functional_modes" />

<div class="mt-3 text-xs opacity-60 text-center">
Jashanmal 2026 · <em>AI Taxonomy — An Operational Framework for Precision in AI Discourse</em> · v1.1
</div>

---
class: text-center flex flex-col items-center justify-center
---

# Let's make a datachain!

<!--
SLIDE · 15s · Demo intro
One demo, not two. We've been looking at the admissions-matching datachain since slide 14 — now we show how it got made. Hand the OTI admissions-matching page to the Claude skill (over an MCP connection); the agent reads the prose, fills the categories, and re-renders the same datachain the audience has already been reading.

---

*Title large; subtitle small.*

> So how did we *make* the datachain you've been looking at? [beat] We handed the admissions matcher's disclosure — the actual page from the OTI report — to an agent.
-->

---
layout: center
class: '!p-0'
---

<video
  :src="'/videos/dtpr-agent-skill.mp4'"
  controls
  autoplay
  muted
  loop
  playsinline
  class="absolute inset-0 w-full h-full object-contain bg-black"
/>

<!--
SLIDE · DTPR Agent Skill — full-screen screencast
Plays the DTPR Agent Skill screencast edge-to-edge on a black background. autoplay+muted+loop matches the other demo slide; controls are exposed so the speaker can scrub.
-->

---
class: text-center flex flex-col items-center justify-center relative overflow-hidden
---

<script setup>
const elementIds = [
  'accessibility', 'affect_emotion_analysis', 'agentic_mode', 'analytical_mode', 'anomaly_detection', 'arts_culture',
  'autonomy_loss', 'available_for_resale', 'available_to_3rd_parties', 'available_to_download', 'available_to_me', 'available_to_the_accountable_organization',
  'available_to_vendor', 'backed_up_internationally', 'backed_up_locally', 'biometric_recognition', 'border_immigration', 'civil_liberties_harm',
  'classification_prediction', 'clustering_segmentation', 'commerce', 'computer_vision', 'content_moderation', 'data_retained',
  'dining', 'ecology', 'education', 'eligibility_benefits', 'employment', 'energy_efficiency',
  'enforcement', 'entry', 'environmental_harm', 'financial_harm', 'financial_services', 'fire_emergency',
  'generative_mode', 'health', 'healthcare', 'inform', 'input_about_a_measurement', 'input_about_a_place',
  'input_about_behaviour', 'input_biometric', 'input_decision', 'input_generated_content', 'input_operational_data', 'input_physical_action',
  'input_recommendation', 'input_sensitive_personal', 'institution', 'language_models', 'logistics', 'marketing_personalization',
  'mobility', 'no_data_retained', 'not_available_to_me', 'not_available_to_the_accountable_organization', 'not_available_to_vendor', 'optimization',
  'organization', 'output_about_a_measurement', 'output_about_a_place', 'output_about_behaviour', 'output_biometric', 'output_decision',
  'output_generated_content', 'output_operational_data', 'output_physical_action', 'output_recommendation', 'output_sensitive_personal', 'perceptive_mode',
  'physical_harm', 'physical_mode', 'planning_decision_making', 'political_economic_harm', 'privacy_transformation', 'psychological_harm',
  'recommendation_ranking', 'reputational_harm', 'research_development', 'right_access', 'right_algorithmic_transparency', 'right_be_forgotten',
  'right_contest', 'right_correction', 'right_individual_decision_explanation', 'right_non_discrimination', 'right_object', 'right_purpose_limitation',
  'right_to_human_review', 'right_to_notice', 'risk_assessment', 'safety_security', 'search_retrieval', 'semantic_mode',
  'shared_storage_and_governance', 'social', 'societal_cultural_harm', 'speech_audio', 'stored_locally', 'stored_on_3rd_party_cloud',
  'stored_primarily_internationally', 'stored_primarily_locally', 'translation_language', 'waste_management', 'water_efficiency', 'wayfinding_services',
]
const iconUrl = (id) => `https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/${encodeURIComponent(id)}/icon.svg`
</script>

<div class="icon-wall">
  <img
    v-for="i in 135"
    :key="i"
    :src="iconUrl(elementIds[(i - 1) % elementIds.length])"
    class="icon-tile"
    :style="{ animationDelay: `${i * 18}ms` }"
    alt=""
    aria-hidden="true"
  />
</div>

<div class="relative z-10 bg-white/95 px-16 py-12 rounded-3xl shadow-2xl backdrop-blur-sm border border-hp-blue/10">
  <div class="text-3xl uppercase tracking-[0.25em] text-hp-blue-900 font-semibold">
    Let's put it all together
  </div>
  <div class="mt-8 text-5xl font-mono text-hp-blue-700 border-b-4 border-hp-blue pb-2 inline-block">
    nyc.clarable.ai
  </div>
</div>

<style scoped>
.icon-wall {
  position: absolute;
  inset: -2rem;
  z-index: 0;
  display: grid;
  grid-template-columns: repeat(15, minmax(0, 1fr));
  gap: 0.75rem;
  opacity: 0.55;
  pointer-events: none;
  overflow: hidden;
}
.icon-tile {
  aspect-ratio: 1 / 1;
  width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.6);
  animation: icon-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes icon-pop {
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
</style>

<!--
SLIDE 32 · 15s · Reveal transition (visual)
A wall of 135 cells, each filled with a real DTPR element icon fetched live from
api.dtpr.io. The icons cycle through all 108 elements in the AI schema (some repeat
to fill the grid). Stagger-pops in over ~2.4s; pause through the cascade, then
deliver and switch to the live browser on the next slide.

Network: 108 unique SVG fetches at slide load. Cache-Control is `public, max-age=3600`
so a rehearsal warms the cache before the live talk. If the venue Wi-Fi is shaky,
pre-render the icons to public/images/dtpr-icons/ and swap the iconUrl helper to
a relative path.

---

*Icon wall fills the slide; centered card carries the line + URL.*

> You've seen one row. [beat] Let me show you all eighty-six.
-->

---
layout: iframe
url: https://nyc.clarable.ai/register
---

<!--
SLIDE 33 · 3 min · LIVE register walkthrough
Switch to a real browser at presentation time for full control. Iframe here is the slide-deck fallback.

Speaker actions:
- Land on register home; let people see the breadth (86 / 20 orgs).
- Filter by Functional Mode → click Generative; click Perceptive.
- Filter by Organization → DOHMH (17). Mayor's Office. OTI.
- Pull up the 311 Translation system → show its datachain.
- Pull up the Midtown Traffic Signal system → show its datachain.
- One sentence on a more sensitive system without dwelling.

Beat: "The OTI report — 86 systems, 20 organizations — rendered as DTPR datachains."
TODO: record fallback screencast and reference here as a backup video tag if iframe fails.

---

*Live browser, full screen. Recorded fallback queued just in case.*

> *(Land on the register home. Let the room see the breadth.)*
>
> OTI published their 2025 AI Report openly — eighty-six systems, twenty organizations. [beat] We took that open data and rendered every entry as a DTPR datachain. This is `nyc.clarable.ai/register`. [beat]
>
> *(Filter by Functional Mode → Generative.)* Generative systems — anything that produces text, an image, a translation. *(Click Perceptive.)* Perceptive — anything that classifies, detects, recognizes. The shapes are doing the work.
>
> *(Filter by Organization → DOHMH.)* Department of Health, seventeen systems. *(Mayor's Office. OTI.)*
>
> *(Click into 311 Multilingual Translation.)* The one we demoed. Live, in production context. *(Click into the Midtown Traffic Signal entry.)* And this one.
>
> *(One sentence on a more sensitive entry — a risk-scoring tool, or a facial recognition entry — without dwelling.)* The visual vocabulary handles the hard cases too. We don't soften the disclosure. We make it readable.
>
> *(Back to register home.)* The OTI report. Eighty-six systems. Twenty organizations. Rendered as DTPR datachains.
-->

---

# Lots of tools for DTPR for AI

<div class="grid grid-cols-2 gap-4 mt-12 max-w-3xl mx-auto text-center">
<div class="p-4 border rounded"><div class="text-2xl">📋</div>Defined JSON Schema</div>
<div class="p-4 border rounded"><div class="text-2xl">🌐</div>REST API</div>
<div class="p-4 border rounded"><div class="text-2xl">🔌</div>MCP Server</div>
<div class="p-4 border rounded"><div class="text-2xl">🎨</div>@dtpr/ui component library</div>
<div class="p-4 border rounded"><div class="text-2xl">🤖</div>Agent skill</div>
<div class="p-4 border rounded"><div class="text-2xl">🧭</div>Datachain Visualiser</div>
</div>

---

# Comprehension audit

<div class="grid grid-cols-2 gap-8 mt-8">
<div>

Every element passes a public-comprehension rubric **before** it ships.

Comprehension is a quality gate, not a hope.

</div>
<div class="text-sm font-mono p-4 bg-gray-100 rounded">

*(snippet of real comprehension audit output from the Claude skill)*

</div>
</div>

<!--
SLIDE 29 · 45s · Comprehension audit
TODO: capture a real audit run output and embed as an image or code snippet.

---

*Snippet of a real comprehension audit output.*

> Every element — every single one — passes a public-comprehension rubric *before* it ships. [beat] We grade it: would a non-expert get this — wherever it shows up? The rubric is open. The audits are reproducible. [beat] Comprehension is a quality gate, not a hope.
-->

---

# Authoring provenance

<div class="grid grid-cols-2 gap-8 mt-6">
<div>

When AI helps draft a disclosure, the artifact carries:

- per-element rationale
- qualitative confidence (high/medium/low)
- **verbatim source quotes** the model leaned on

</div>
<div>

*(Admissions-matching datachain with `authoring_provenance` expanded — each category shows the verbatim quote from the OTI page the agent drew from)*

</div>
</div>

<div class="mt-12 text-2xl text-center font-bold">
AI doesn't get to hide behind fluent text.
</div>

<!--
SLIDE 30 · 60s · Authoring provenance (admissions matching)
This is a crucial slide. The bold final line is load-bearing — deliver it clearly with a pause.
TODO: real admissions-matching datachain screenshot with provenance section expanded — each category needs to show the verbatim quote from the OTI report page the agent leaned on. This is the artifact that proves the demo we just watched isn't hallucination.

---

*Datachain with the AI-provenance section expanded — verbatim source quotes, qualitative confidence, per-element rationale.*

> Here's one I care about a lot. [beat] When an AI helps draft a disclosure — and it will, because these reports are long and these documents are dense — the artifact carries the verbatim quotes the model leaned on. Per element. With a confidence rating. With a rationale you can read. [beat] *(Slow.)* AI does not get to hide behind fluent text. [beat] If a model wrote the words, the words have to point at the source.
-->

---

# Action affordances

<div class="text-base mt-2 opacity-70">
Every element can carry first-class actions — so a right turns into a button, not a sentence.
</div>

<div class="grid grid-cols-2 gap-10 mt-8 max-w-6xl mx-auto items-start">

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Action kinds (schema)</div>

<div class="space-y-2 text-base">
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">email</span> DPO contact, info request</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">url</span> appeal portal, opt-out page</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">phone</span> language hotline, ombuds</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">form</span> DSAR / complaint submission</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">postal</span> mailing address for written requests</div>
</div>

<div class="mt-6 text-xs opacity-60">
<code>InstanceAction</code> · <code>api/src/schema/datachain-instance.ts</code>
</div>

</div>

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Admissions matcher · mock</div>

<div class="space-y-3 text-sm">
  <div class="p-3 border rounded">
    <div class="font-semibold">Right to contest</div>
    <div class="mt-2 flex flex-wrap gap-2">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">form · File a Round 2 appeal</span>
    </div>
  </div>
  <div class="p-3 border rounded">
    <div class="font-semibold">Right to algorithmic transparency</div>
    <div class="mt-2 flex flex-wrap gap-2">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">email · NYCPS Privacy Officer</span>
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">url · OTI disclosure page</span>
    </div>
  </div>
  <div class="p-3 border rounded">
    <div class="font-semibold">Right to notice</div>
    <div class="mt-2 flex flex-wrap gap-2">
      <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">phone · 311 (multilingual)</span>
    </div>
  </div>
</div>

<div class="mt-3 text-xs italic opacity-60">
Coming to the visual layer next — schema-side already lives in <code>InstanceElement.actions</code>.
</div>

</div>

</div>

<div class="mt-10 text-2xl text-center font-bold">
A right with no path to exercise it isn't a right. It's a footnote.
</div>

<!--
SLIDE · 45s · Action affordances
Schema basis: `InstanceActionSchema` on `InstanceElement.actions` in api/src/schema/datachain-instance.ts. Kinds: email, url, phone, form, postal. Deliberately small — `other` is intentionally not in the enum. Each action has a localized label and a typed target (email address, URL, E.164 phone, form URL, or free-text postal address).

Not yet rendered in the dtpr.ai visual layer — the schema carries it, the UI is coming. Be honest about that.

The point: disclosure ends with paths a person can actually walk, not just labels. The Rights category names what you're entitled to; actions are how you reach it. For the admissions matcher, "right to contest" becomes a Round-2 appeal form; "right to algorithmic transparency" becomes a DPO email plus the OTI disclosure URL; "right to notice" becomes the 311 multilingual line for parents who need translation help.

Pairs with slide 28 (authoring provenance) and the comprehension-audit slide — both are about the layers DTPR adds on top of the raw disclosure. Provenance answers "where did this come from"; actions answer "what do I do now."

---

*Two-column: schema kinds on left; mocked admissions-matcher rights with action chips on right.*

> One more layer — and like provenance, it's about turning the disclosure into something you can use. [beat] Every element in a datachain can carry actions. Email. URL. Phone. A form. A postal address. Five kinds, on purpose — small enough that a renderer always knows what to do with them. [beat] So when the disclosure says "you have the right to contest" — that stops being a sentence the page asserts. It becomes a button. The appeal form opens. The privacy officer's email composes. The 311 line dials. [beat] *(Honest beat.)* This part isn't in the visual layer yet — the schema carries it; the UI is next. [beat] But the principle is the one I want you to leave with: a right with no path to exercise it isn't a right. It's a footnote.
-->

---
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <div class="text-center">
    <div class="text-[11px] uppercase tracking-[0.3em] text-hp-blue-700 font-semibold mb-3">Hands-on session · MakeShift 2026</div>
    <h1 class="!text-6xl !mb-3 !mt-0">Workshop</h1>
    <div class="text-2xl font-serif italic opacity-75">From any disclosure to a shippable datachain — in an hour.</div>
  </div>
  <div class="mt-12 grid grid-cols-3 gap-0 bg-white/95 rounded-3xl shadow-2xl border border-hp-blue/10 overflow-hidden">
    <div class="px-8 py-7 text-center border-r border-hp-blue/10">
      <div class="text-[10px] uppercase tracking-[0.25em] text-hp-blue-700 font-semibold mb-2">When</div>
      <div class="text-xs uppercase tracking-wider opacity-60">Thursday</div>
      <div class="text-4xl font-bold text-hp-blue-900 leading-none mt-1">May 21</div>
      <div class="mt-2 inline-block bg-hp-blue text-white text-sm font-semibold px-3 py-1 rounded-full">3 – 4 pm</div>
    </div>
    <div class="px-8 py-7 text-center border-r border-hp-blue/10">
      <div class="text-[10px] uppercase tracking-[0.25em] text-hp-blue-700 font-semibold mb-2">Where</div>
      <div class="text-xs uppercase tracking-wider opacity-60">School of Visual Arts</div>
      <div class="text-4xl font-bold text-hp-blue-900 leading-none mt-1">Room 110</div>
      <div class="text-sm opacity-70 mt-2">Classroom</div>
    </div>
    <div class="px-8 py-7 text-center">
      <div class="text-[10px] uppercase tracking-[0.25em] text-hp-blue-700 font-semibold mb-2">Bring</div>
      <div class="text-xs uppercase tracking-wider opacity-60">Your</div>
      <div class="text-4xl font-bold text-hp-blue-900 leading-none mt-1">Laptop</div>
      <div class="text-sm opacity-70 mt-2">+ a doc to render</div>
    </div>
  </div>
  <div class="mt-10 max-w-3xl mx-auto text-center text-lg opacity-80 leading-relaxed">
    Feed an <strong class="text-hp-blue-900">AIA</strong>, a <strong class="text-hp-blue-900">register row</strong>, or a <strong class="text-hp-blue-900">regulatory PDF</strong> through the agent skill — and walk out with a datachain you can ship.
  </div>
</div>

<!--
SLIDE 31 · 30s · CTA 1 — Workshop (event-card layout)
Save-the-date / event-poster style. Eyebrow + title + serif tagline up top; three-up info card (When / Where / Bring) in the middle; one-line value prop underneath. Clean white background — the visual motif is reserved for the reveal + finale slides.

Confirmed slot: Thursday, May 21 · 3–4pm · Classroom 110, School of Visual Arts.

---

*Event-card layout. Three-up info row carries day/time, room, and what to bring.*

> If any of this lands — come to the workshop. Thursday, three to four, Classroom 110. [beat] Bring your laptop, and bring a document — an AIA, a register row, a regulatory PDF, anything dense. [beat] We'll spend an hour feeding it through the agent skill and producing a datachain you can ship.
-->

---
class: text-center flex flex-col items-center justify-center relative overflow-hidden
---

<script setup>
const elementIds = [
  'accessibility', 'affect_emotion_analysis', 'agentic_mode', 'analytical_mode', 'anomaly_detection', 'arts_culture',
  'autonomy_loss', 'available_for_resale', 'available_to_3rd_parties', 'available_to_download', 'available_to_me', 'available_to_the_accountable_organization',
  'available_to_vendor', 'backed_up_internationally', 'backed_up_locally', 'biometric_recognition', 'border_immigration', 'civil_liberties_harm',
  'classification_prediction', 'clustering_segmentation', 'commerce', 'computer_vision', 'content_moderation', 'data_retained',
  'dining', 'ecology', 'education', 'eligibility_benefits', 'employment', 'energy_efficiency',
  'enforcement', 'entry', 'environmental_harm', 'financial_harm', 'financial_services', 'fire_emergency',
  'generative_mode', 'health', 'healthcare', 'inform', 'input_about_a_measurement', 'input_about_a_place',
  'input_about_behaviour', 'input_biometric', 'input_decision', 'input_generated_content', 'input_operational_data', 'input_physical_action',
  'input_recommendation', 'input_sensitive_personal', 'institution', 'language_models', 'logistics', 'marketing_personalization',
  'mobility', 'no_data_retained', 'not_available_to_me', 'not_available_to_the_accountable_organization', 'not_available_to_vendor', 'optimization',
  'organization', 'output_about_a_measurement', 'output_about_a_place', 'output_about_behaviour', 'output_biometric', 'output_decision',
  'output_generated_content', 'output_operational_data', 'output_physical_action', 'output_recommendation', 'output_sensitive_personal', 'perceptive_mode',
  'physical_harm', 'physical_mode', 'planning_decision_making', 'political_economic_harm', 'privacy_transformation', 'psychological_harm',
  'recommendation_ranking', 'reputational_harm', 'research_development', 'right_access', 'right_algorithmic_transparency', 'right_be_forgotten',
  'right_contest', 'right_correction', 'right_individual_decision_explanation', 'right_non_discrimination', 'right_object', 'right_purpose_limitation',
  'right_to_human_review', 'right_to_notice', 'risk_assessment', 'safety_security', 'search_retrieval', 'semantic_mode',
  'shared_storage_and_governance', 'social', 'societal_cultural_harm', 'speech_audio', 'stored_locally', 'stored_on_3rd_party_cloud',
  'stored_primarily_internationally', 'stored_primarily_locally', 'translation_language', 'waste_management', 'water_efficiency', 'wayfinding_services',
]
const iconUrl = (id) => `https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/${encodeURIComponent(id)}/icon.svg`
</script>

<div class="icon-wall">
  <img
    v-for="i in 135"
    :key="i"
    :src="iconUrl(elementIds[(i - 1) % elementIds.length])"
    class="icon-tile"
    :style="{ animationDelay: `${i * 18}ms` }"
    alt=""
    aria-hidden="true"
  />
</div>

<div class="relative z-10 w-full max-w-6xl mx-auto px-8">
  <div class="inline-flex items-center gap-5 bg-white/95 rounded-3xl shadow-2xl backdrop-blur-sm border border-hp-blue/10 px-10 py-6">
    <img :src="'/images/dtpr-black.png'" alt="DTPR" class="h-16 w-auto" />
    <div class="text-5xl font-bold tracking-tight text-hp-blue-900">for&nbsp;AI</div>
    <span class="bg-hp-blue text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full shadow-md">beta</span>
  </div>
  <div class="mt-10 grid grid-cols-3 gap-5 text-left">
    <div class="bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm border border-hp-blue/10 px-6 py-5">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">The standard</div>
      <div class="text-xl font-bold text-hp-blue-900">DTPR for AI</div>
      <div class="mt-1 text-sm opacity-75">An open communication standard for the algorithms in our cities.</div>
      <div class="mt-3 font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">dtpr.ai</div>
    </div>
    <div class="bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm border border-hp-blue/10 px-6 py-5">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">In production</div>
      <div class="text-xl font-bold text-hp-blue-900">Live registers</div>
      <div class="mt-1 text-sm opacity-75">Eighty-six NYC systems today. Canada's federal AI inventory next door.</div>
      <div class="mt-3 space-y-1">
        <div class="font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">nyc.clarable.ai</div>
        <div class="font-mono text-xs opacity-70">canada.clarable.ai</div>
      </div>
    </div>
    <div class="bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm border border-hp-blue/10 px-6 py-5">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">The stewards</div>
      <div class="text-xl font-bold text-hp-blue-900">Helpful Places</div>
      <div class="mt-1 text-sm opacity-75">We steward DTPR — the standard, the schema, the tooling — in the open.</div>
      <div class="mt-3 font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">helpfulplaces.com</div>
    </div>
  </div>
  <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
    <span class="inline-flex items-center gap-2 bg-hp-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"><span class="text-lg leading-none">🛠️</span> Help us build it</span>
    <span class="inline-flex items-center gap-2 bg-hp-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"><span class="text-lg leading-none">🚀</span> Deploy it</span>
    <span class="inline-flex items-center gap-2 bg-hp-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"><span class="text-lg leading-none">💬</span> Ask us anything</span>
  </div>
  <div class="mt-6 text-xs font-mono opacity-70 tracking-wide text-center">
    github.com/Helpful-Places/dtpr · CITATION.cff in the repo
  </div>
</div>

<style scoped>
.icon-wall {
  position: absolute;
  inset: -2rem;
  z-index: 0;
  display: grid;
  grid-template-columns: repeat(15, minmax(0, 1fr));
  gap: 0.75rem;
  opacity: 0.55;
  pointer-events: none;
  overflow: hidden;
}
.icon-tile {
  aspect-ratio: 1 / 1;
  width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 0;
  transform: scale(0.6);
  animation: icon-pop 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes icon-pop {
  0%   { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
</style>

<!--
SLIDE 32 · 45s · Finale — DTPR for AI, the deployments, and the stewards
Visual continuity with slide 25: same icon-wall background, same stagger-pop, same 15-col grid. 135 DTPR element icons fetched live from api.dtpr.io cycle through the AI schema's 108 elements. Three white-card columns stack the project (dtpr.ai), the live deployments (nyc.clarable.ai + canada.clarable.ai aside), and the steward (Helpful Places). CTA pills underneath name the three asks: build, deploy, ask.

Network: 108 unique SVG fetches at slide load — already warmed from slide 25 if the audience came in linearly, so the cache hits should be free.

Canada framing: canada.clarable.ai renders Canada's federal Algorithmic Impact Assessment inventory as DTPR datachains — same engine, same approach, different jurisdiction. Don't dwell; it's an aside that says "this isn't NYC-only."

Stewardship beat: this is the first time in the deck the audience hears "Helpful Places stewards DTPR" stated plainly. Land it. The standard is open (CC BY-SA 4.0); we're the people who hold the pen.

---

*Hex wall fills the slide; three white cards across the middle; CTA pills below; small repo line at the very bottom.*

> So — to close. [beat] DTPR for AI lives at `dtpr.ai`. Open standard. Open schema. Open tooling. [beat] You've seen the New York register tonight — `nyc.clarable.ai`. We did the same thing for Canada's federal AI inventory — `canada.clarable.ai`. Same engine. Different jurisdiction. The standard travels. [beat] We're Helpful Places. We steward DTPR — the standard, the schema, the icons, the tooling — in the open. [beat] Three asks. *Help us build it* — the repo is on GitHub, the schema is in beta, your issues land in our backlog. *Deploy it* — if you've got a register, an AIA, an inventory sitting in PDFs, we want to help you render it. *Ask us anything* — we're here for the rest of the conference. [beat] Thank you.
-->
