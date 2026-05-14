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
  sans: 'Inter'
  serif: 'Source Serif Pro'
  mono: 'JetBrains Mono'
---

<div class="inline-block bg-black text-white px-8 py-4">
  <h1 class="!m-0 !p-0">DTPR for AI</h1>
</div>

<div class="mt-6 inline-block bg-black text-white px-6 py-3 text-2xl">
An Open-Source Communication Standard for AI
</div>

<div class="mt-12 inline-block bg-black text-white px-6 py-3 text-lg">
MakeShift 2026 · School of Visual Arts, NYC<br>
Jonathan Pichot · Helpful Places
</div>

<!--
SLIDE 1 · 15s · Title card
A grounded hello. Don't promise what the talk will do — let the audience discover it.

---

*Walk on. Smile. Look at the room before speaking.*

> Hello, I'm Jonathan Pichot, from Helpful Places. I'm here to talk to you about DTPR for AI — an open-source communication standard. Thanks for coming.

---

**Deck-wide practice notes**

- Word count target: ~140 wpm. If a slide feels tight in practice, cut a sentence rather than speed up.
- Pause discipline: every `[beat]` is roughly one second. The `[beat] [beat]` markers (slides 7, 27, 39) are load-bearing — resist filling them.
- Demo slides (16, 19): the temptation will be to narrate over the video. Don't. The artifact speaks.
- Slide 33 live demo: rehearse against the actual `nyc.clarable.ai/register` URL the week of. If the live version is even slightly slow, switch to the recorded fallback without apologizing for it.
- The repeated sentence (slide 27) and the final line (slide 39) are the only two places committing to *exact* wording. Everything else can drift naturally between runs.
-->

---
layout: image-right
image: https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=1600&q=80
---

# We're in NYC

NYC has done more than most cities to make AI transparent and understandable, thanks to

- Local Law 35 of 2022
- the Office of Technology & Innovation

<div class="absolute bottom-2 right-3 text-[10px] opacity-70 text-white drop-shadow">
  Photo by <a href="https://unsplash.com/@eejermaine" class="underline">Jermaine Ee</a> on <a href="https://unsplash.com/photos/new-york-central-park-A2CChTZvzTE" class="underline">Unsplash</a>
</div>

<!--
SLIDE 2 · 20s · We're in NYC
Set the location. Pay homage to LL35 + OTI. Constructive, humble.

---

> We're in New York City. New York City has done more than most cities to make AI transparent and understandable — thanks to Local Law 35 of 2022 and the Office of Technology and Innovation. [beat] We wanted to pay homage to that work.
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

# The work this builds on

NYC's leadership on AI builds on its open-data history — **Local Law 11 of 2012** ushered in a wave of civic tech that many people in this room helped accomplish.

I was lucky to be part of that era — from the early days of **Code for America** in 2010 to my time at NYC's **Department of City Planning**, building software for urban planners and helping open new datasets for the city.

<!--
SLIDE 4 · 30s · The work this builds on (personal history)
NYC's AI work isn't a one-off; it builds on a decade-plus of open-data work that this room helped accomplish. Personal credibility beat: speaker was part of that era. Sets up slide 5's "I know how hard this is" without overclaiming.

---

*List on screen: LL11 of 2012 · Code for America · NYC Department of City Planning. Personal, warm, brief.*

> The work New York City has done on AI builds on its history with open data. [beat] Local Law 11 of 2012 ushered in the wave of civic tech that many of you in this room helped create. [beat] I was lucky enough to be part of that era — from the early days of Code for America in 2010, to my time at New York City's Department of City Planning, where I helped build software for urban planners that took advantage of open data, and worked with colleagues to open new datasets for the city. [beat] That tradition is what makes this AI disclosure work possible today.
-->

---
class: text-center
---

# NYC OTI 2025 AI Report

86 systems · 20 agencies

<div class="mt-10 max-w-3xl mx-auto space-y-3 text-left">
<div class="text-xl"><strong>17</strong> · Department of Health and Mental Hygiene</div>
<div class="text-xl"><strong>10</strong> · Mayor's Office</div>
<div class="text-xl"><strong>8</strong> · Office of Technology and Innovation</div>
<div class="text-xl"><strong>7</strong> · New York City Public Schools</div>
<div class="text-xl"><strong>4</strong> · Administration for Children's Services</div>
<div class="text-xl text-gray-500"><strong>40</strong> · across 15 more agencies</div>
</div>

<!--
SLIDE 5 · 40s · 86 systems / 20 organizations
From the outside looking in: this kind of work is foundational. Speaker leans on "I was a public servant" continuity from slide 4. Continuous beat with slide 6 (the report scroll) — don't fully close out the "I really want to applaud them" line here; carry it into the scroll.
TODO: replace inline grid with a heat-map visualization rendered from register data.

---

*Let the numbers breathe.*

> Now from the outside looking in, it's impressive — the latest 2025 report from OTI registers eighty-six different algorithmic systems across twenty agencies. [beat] Department of Health: seventeen. The Mayor's Office: ten. OTI itself: eight. [beat] This kind of work is foundational. As a former public servant, I understand the difficulty — the work it takes to get this kind of information out the door, collated across agencies, consistently, every year. [beat] *(Click into slide 6 — the report begins to scroll.)*
-->

---
class: '!p-0'
---

<Ll35ReportScroll :duration-sec="360" />

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

<div class="mt-8 text-2xl opacity-80">
Moving from PDFs and CSVs to understanding
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

<ul>
<li>Initially developed in 2019 and 2020</li>
<li>Focused on bringing transparency and understandability to <em>data collection in public space</em></li>
</ul>

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
Deployed in 15 cities and counting
</div>

<!--
SLIDE 10 · 30s · DTPR in production today
Static map of every original-DTPR deployment, sourced from dtpr.guide/landing. Replaces the prior live iframe (blocked by the import guard / X-Frame-Options uncertainty).

---

*Map fills the slide. Title chip top-left; URL chip bottom-left.*

> And this isn't a thought experiment. The original DTPR is deployed in fifteen cities — Boston, Sydney, Paris, Detroit, on and on. It's been doing translation work, for connected things in public space, for years.
-->

---

# DTPR as translation layer

Making sense of piles of PDFs

<div class="mt-8 grid grid-cols-[1fr_auto_1fr] gap-8 items-center">

<div class="text-lg opacity-80">

**Heterogeneous source-of-truth**

- Vendor specs
- Privacy notices
- Signage standards
- Procurement records

</div>

<div class="text-5xl opacity-70 text-center">→</div>

<div>

**DTPR datachain**<br>
*a person can read*

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
class: text-center
---

# DTPR for AI

<div class="mt-16 text-5xl text-center font-bold">
Same mission.
</div>

<div class="mt-6 text-5xl text-center font-bold opacity-60">
New domain.
</div>

<!--
SLIDE 11 · 30s · DTPR for AI — same mission, new functions
The pivot from sensors to AI. Title introduces "DTPR for AI" as a phrase for the first time. Body lands the parallel statement. Pace slowly.

---

*Pace slowly. This is the pivot.*

> So — DTPR for AI. Same mission. New functions.
-->

---


<div class="mt-8 text-xl opacity-80 text-center">
AI is not physical the same way sensors are.
</div>

<div class="grid grid-cols-3 gap-6 mt-10 text-3xl text-center">
<div><strong>Decides</strong></div>
<div><strong>Acts</strong></div>
<div><strong>Generates</strong></div>
</div>

<div class="mt-10 text-xl opacity-80 text-center">
New risks. Composed with other systems.
</div>

<div class="mt-10 text-3xl text-center font-bold">
More complicated. More critical.
</div>

<!--
SLIDE 12 · 45s · AI is a different beast
Four moves: not physical → decides/acts/generates → new risks + composition → "more complicated, more critical" punch line. Autonomy-gradients material now lives entirely on slide 25 (Function · Jashanmal) — don't enumerate it here.

---

*Three crisp moves. Don't enumerate failure modes — they live on slide 25.*

> AI is not physical the same way sensors are. It has other kinds of affordances — it *does* things. It can decide. It can act. It can generate. [beat] It has new risks. It can be composed with other kinds of systems. [beat] All of which makes the disclosure and transparency work both more complicated — and more critical.
-->

---

# The disclosure floor everyone agrees on

<div class="text-base mt-2 opacity-70">NYC Local Law 35 and the EU AI Act converge on the same minimum.</div>

<table class="text-base mt-6 mx-auto">
<tbody>
<tr><td class="px-3 py-1"><strong>What it is</strong> — name &amp; purpose</td><td class="px-3 py-1">✓</td><td class="px-3 py-1">Art. 13 · Annex IV</td></tr>
<tr><td class="px-3 py-1"><strong>What it does</strong> — function &amp; autonomy</td><td class="px-3 py-1 opacity-50">—</td><td class="px-3 py-1">Art. 13, 50 · Annex III</td></tr>
<tr><td class="px-3 py-1"><strong>What data it uses</strong> — type &amp; source</td><td class="px-3 py-1">✓</td><td class="px-3 py-1">Art. 10 · Annex IV</td></tr>
<tr><td class="px-3 py-1"><strong>How outputs are used</strong></td><td class="px-3 py-1">✓</td><td class="px-3 py-1">Art. 13</td></tr>
<tr><td class="px-3 py-1"><strong>Who's accountable</strong> — vendor &amp; contact</td><td class="px-3 py-1">✓</td><td class="px-3 py-1">Art. 16, 50</td></tr>
<tr><td class="px-3 py-1"><strong>What could go wrong</strong> — risks &amp; mitigation</td><td class="px-3 py-1 opacity-50">—</td><td class="px-3 py-1">Art. 9, 27 · Annex IV</td></tr>
<tr><td class="px-3 py-1"><strong>What rights you have</strong> — contest, opt-out, human review</td><td class="px-3 py-1 opacity-50">—</td><td class="px-3 py-1">Art. 14, 86</td></tr>
</tbody>
</table>

<div class="mt-6 text-lg text-center opacity-80">
DTPR for AI's 11 categories surface every one of these. <span class="opacity-60 text-sm">(specific LL35 mapping → slide 26)</span>
</div>

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

# DTPR for AI

<div class="mt-6 text-3xl">dtpr.ai</div>

<div class="mt-12 text-xl opacity-80 max-w-2xl">
An open communication standard for the algorithms in our cities.
</div>

<!--
SLIDE 14 · 20s · DTPR for AI — name the thing
First time the audience sees the URL on its own slide. Land the name, the URL, the one-line definition. Keep it short — the taxonomy slide that follows does the unpacking.

---

*Title-card style.*

> So — let me introduce DTPR for AI. [beat] Lives at dtpr.ai. An open communication standard for the algorithms in our cities. [beat] Here's how it's organized.
-->

---

# The DTPR for AI taxonomy

<div class="text-base mt-2 opacity-70">10 categories, organized into 3 sections — <em>Context</em>, <em>Data Flow</em>, <em>Data Storage</em>.</div>

<table class="text-sm mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-3 py-2 text-left">Section</th>
<th class="px-3 py-2 text-left">Category</th>
<th class="px-3 py-2 text-left">Question</th>
<th class="px-3 py-2 text-left">Visual modifier</th>
</tr>
</thead>
<tbody>
<tr><td class="px-3 py-1 font-semibold">Context</td><td class="px-3 py-1">Accountable</td><td class="px-3 py-1">Who is responsible for this system?</td><td class="px-3 py-1">Role <span class="opacity-60">(vendor / deployer)</span></td></tr>
<tr><td class="px-3 py-1 font-semibold">Context</td><td class="px-3 py-1">Functional Modes</td><td class="px-3 py-1">What does this system do, and how does the public encounter it?</td><td class="px-3 py-1">Autonomy level <span class="opacity-60">(color)</span></td></tr>
<tr><td class="px-3 py-1 font-semibold">Context</td><td class="px-3 py-1">Purpose</td><td class="px-3 py-1">Why is this system deployed?</td><td class="px-3 py-1 opacity-50">—</td></tr>
<tr><td class="px-3 py-1 font-semibold">Context</td><td class="px-3 py-1">Risks &amp; Mitigation</td><td class="px-3 py-1">What are the identified risks and safeguards?</td><td class="px-3 py-1 opacity-50">—</td></tr>
<tr><td class="px-3 py-1 font-semibold">Context</td><td class="px-3 py-1">Rights</td><td class="px-3 py-1">What rights do citizens have?</td><td class="px-3 py-1">Actions</td></tr>
<tr><td class="px-3 py-1 font-semibold text-blue-700">Data Flow</td><td class="px-3 py-1">Input Datasets</td><td class="px-3 py-1 opacity-50">—</td><td class="px-3 py-1">Level of PII <span class="opacity-60">(color)</span></td></tr>
<tr><td class="px-3 py-1 font-semibold text-blue-700">Data Flow</td><td class="px-3 py-1">Processing Algorithm or AI</td><td class="px-3 py-1 opacity-50">—</td><td class="px-3 py-1 opacity-50">—</td></tr>
<tr><td class="px-3 py-1 font-semibold text-blue-700">Data Flow</td><td class="px-3 py-1">Output Datasets</td><td class="px-3 py-1 opacity-50">—</td><td class="px-3 py-1">Level of PII <span class="opacity-60">(color)</span></td></tr>
<tr><td class="px-3 py-1 font-semibold text-purple-700">Data Storage</td><td class="px-3 py-1">Access</td><td class="px-3 py-1">Who has access to the system and its outputs?</td><td class="px-3 py-1 opacity-50">—</td></tr>
<tr><td class="px-3 py-1 font-semibold text-purple-700">Data Storage</td><td class="px-3 py-1">Storage</td><td class="px-3 py-1">Where is data stored, and for how long?</td><td class="px-3 py-1 opacity-50">—</td></tr>
</tbody>
</table>

<!--
SLIDE 15 · 60s · The DTPR for AI taxonomy
Land the structure: 3 sections, 10 categories. Don't read every row. Hover on Functional Modes ("autonomy level encoded as color"), Input/Output Datasets ("PII level encoded as color"), Rights ("actions citizens can take"). Set up the three section deep-dives that follow.

---

*Full taxonomy table; section column color-coded by group.*

> Ten categories. Three sections. [beat] **Context** — five categories that frame *who, what, why, what could go wrong, what you can do.* [beat] **Data Flow** — three categories that follow the data through the system. [beat] **Data Storage** — two categories for *who has access* and *where it lives.* [beat] You'll notice the right column. Some categories carry a visual modifier that encodes a key attribute right on the icon. The icon itself isn't just a label — it's a reading.
-->

---

# Context — who, what, why, risks, rights

<div class="text-base mt-2 opacity-70">5 categories that frame the system.</div>

<table class="text-base mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-4 py-2 text-left">Category</th>
<th class="px-4 py-2 text-left">Question</th>
<th class="px-4 py-2 text-left">Visual modifier</th>
</tr>
</thead>
<tbody>
<tr><td class="px-4 py-1"><strong>Accountable</strong></td><td class="px-4 py-1">Who is responsible for this system?</td><td class="px-4 py-1">Role <span class="opacity-60">(vendor / deployer)</span></td></tr>
<tr><td class="px-4 py-1"><strong>Functional Modes</strong></td><td class="px-4 py-1">What does this system do?</td><td class="px-4 py-1">Autonomy level <span class="opacity-60">(color)</span></td></tr>
<tr><td class="px-4 py-1"><strong>Purpose</strong></td><td class="px-4 py-1">Why is this system deployed?</td><td class="px-4 py-1 opacity-50">—</td></tr>
<tr><td class="px-4 py-1"><strong>Risks &amp; Mitigation</strong></td><td class="px-4 py-1">What are the identified risks and safeguards?</td><td class="px-4 py-1 opacity-50">—</td></tr>
<tr><td class="px-4 py-1"><strong>Rights</strong></td><td class="px-4 py-1">What rights do citizens have?</td><td class="px-4 py-1">Actions</td></tr>
</tbody>
</table>

<!--
SLIDE 16 · 45s · Context section deep-dive
The frame around the system: agency, function, motivation, harm, recourse. These five categories carry the most weight in establishing whether the public should trust this deployment. Functional Modes and Rights both carry visual modifiers — the autonomy color is what tells someone at a glance "this thing acts on its own" vs. "a person reviews it first."

---

*Five-row context table.*

> Context is the frame. [beat] *Accountable* — who's on the hook. Vendor or deployer is encoded on the icon itself. *Functional Modes* — what the system does, with autonomy color showing how much rope it has. *Purpose* — why it's there. *Risks and Mitigation* — what could go wrong and what's being done about it. *Rights* — what a citizen can actually do.
-->

---

# Three categories read as a sentence

<div class="text-base mt-2 opacity-70"><em>Accountable</em> + <em>Functional Modes</em> + <em>Purpose</em> → plain English.</div>

<div class="mt-8 grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-stretch">

<div class="p-5 border-2 border-emerald-600 rounded text-center">
<div class="text-xs uppercase tracking-wider opacity-60">Accountable</div>
<div class="font-semibold text-lg mt-2">NYC DOT</div>
<div class="text-xs mt-2 opacity-60">deployer</div>
</div>

<div class="text-4xl opacity-60 self-center">→</div>

<div class="p-5 border-2 border-amber-600 rounded text-center">
<div class="text-xs uppercase tracking-wider opacity-60">Functional Modes</div>
<div class="font-semibold text-lg mt-2">understand</div>
<div class="text-xs mt-2 opacity-60">semantic</div>
</div>

<div class="text-4xl opacity-60 self-center">→</div>

<div class="p-5 border-2 border-sky-600 rounded text-center">
<div class="text-xs uppercase tracking-wider opacity-60">Purpose</div>
<div class="font-semibold text-lg mt-2">improving mobility</div>
<div class="text-xs mt-2 opacity-60">&nbsp;</div>
</div>

</div>

<div class="mt-10 text-xl text-center leading-relaxed max-w-4xl mx-auto">
"<span class="text-emerald-700 font-semibold">NYC DOT</span> has deployed AI to <span class="text-amber-700 font-semibold">understand</span> traffic flows for the purpose of <span class="text-sky-700 font-semibold">improving mobility</span>."
</div>

<!--
SLIDE 17 · 30s · Context reads as a sentence
A concrete payoff for the Context section: the three top categories aren't independent attributes — together they parse as a plain-English sentence a non-expert can read. Boxes mirror the Data Flow visual treatment so the parallel between "system frame" and "data path" is reinforced.

Example was provided verbatim by the speaker — Midtown Traffic Signal-style framing, fits the second demo system later in the deck. If we change the demo system, update this example to match.

---

*Three colored boxes — Accountable / Functional Modes / Purpose — then the rendered sentence beneath, with each clause highlighted in its category color.*

> The three Context categories at the top — Accountable, Functional Modes, Purpose — aren't just attributes side by side. They read as a sentence. [beat] *"NYC DOT has deployed AI to understand traffic flows for the purpose of improving mobility."* [beat] That's a plain-English description, generated directly from the structured data. A non-expert reads it once and knows who's on the hook, what the system does, and why it's there.
-->

---

# Data Flow — input → processing → output

<div class="text-base mt-2 opacity-70">3 categories that follow the data through the system.</div>

<div class="mt-8 grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 items-stretch">

<div class="p-5 border-2 border-blue-500 rounded text-center">
<div class="font-semibold text-lg">Input Datasets</div>
<div class="text-sm mt-2 opacity-70">What goes in?</div>
<div class="text-xs mt-3">Level of PII <span class="opacity-60">(color)</span></div>
</div>

<div class="text-4xl opacity-60 self-center">→</div>

<div class="p-5 border-2 border-blue-500 rounded text-center">
<div class="font-semibold text-lg">Processing Algorithm or AI</div>
<div class="text-sm mt-2 opacity-70">What happens inside?</div>
<div class="text-xs mt-3 opacity-50">—</div>
</div>

<div class="text-4xl opacity-60 self-center">→</div>

<div class="p-5 border-2 border-blue-500 rounded text-center">
<div class="font-semibold text-lg">Output Datasets</div>
<div class="text-sm mt-2 opacity-70">What comes out?</div>
<div class="text-xs mt-3">Level of PII <span class="opacity-60">(color)</span></div>
</div>

</div>

<div class="mt-8 text-base text-center opacity-70">
Input and output icons both carry a <strong>PII color</strong> — at a glance you can see whether a system ingests, produces, or transforms personal data.
</div>

<!--
SLIDE 17 · 45s · Data Flow section deep-dive
Three sequential boxes — input, processing, output — with arrows. The visual modifier story here is PII color: a green input chained to a red output tells a story without the viewer reading a word.

---

*Three connected boxes; arrows between; PII-color callout below.*

> Data Flow is the literal path through the system. [beat] Input datasets — what goes in. Processing — what happens inside. Output datasets — what comes out. [beat] Input and output icons carry a PII color, so at a glance you can see whether a system ingests personal data and produces something less sensitive, or — more concerning — produces something *more* sensitive than what went in.
-->

---

# Data Storage — access &amp; storage

<div class="text-base mt-2 opacity-70">2 categories for what happens after.</div>

<table class="text-base mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-4 py-2 text-left">Category</th>
<th class="px-4 py-2 text-left">Question</th>
</tr>
</thead>
<tbody>
<tr><td class="px-4 py-1"><strong>Access</strong></td><td class="px-4 py-1">Who has access to the system and its outputs?</td></tr>
<tr><td class="px-4 py-1"><strong>Storage</strong></td><td class="px-4 py-1">Where is data stored, and for how long?</td></tr>
</tbody>
</table>

<!--
SLIDE 18 · 30s · Data Storage section deep-dive
The two categories most often missing from public AI disclosures. Access = who, Storage = where & how long. These are the questions that decide whether a deployment is governable after the fact.

---

*Two-row table.*

> And finally — Data Storage. [beat] Access — who can see the system and its outputs. Storage — where data lives, and how long it stays there. [beat] These two are the categories most often missing from public AI disclosures. They're also the ones that decide whether a deployment is governable after the fact.
-->

---

# Risks — what could happen to a person

<div class="text-base mt-3 opacity-70">DTPR <code>risks_mitigation</code> adopts AIAAIC's victim-centered taxonomy</div>

<table class="text-lg mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-4 py-2 text-left">DTPR (victim-centered)</th>
<th class="px-4 py-2 text-left">AIAAIC harm type</th>
</tr>
</thead>
<tbody>
<tr><td class="px-4 py-1">Loss of autonomy</td><td class="px-4 py-1">Autonomy</td></tr>
<tr><td class="px-4 py-1">Physical harm</td><td class="px-4 py-1">Physical</td></tr>
<tr><td class="px-4 py-1">Psychological harm</td><td class="px-4 py-1">Psychological</td></tr>
<tr><td class="px-4 py-1">Reputational harm</td><td class="px-4 py-1">Reputational</td></tr>
<tr><td class="px-4 py-1">Financial &amp; business harm</td><td class="px-4 py-1">Financial &amp; Business</td></tr>
<tr><td class="px-4 py-1">Civil liberties harm</td><td class="px-4 py-1">Human Rights &amp; Civil Liberties</td></tr>
<tr><td class="px-4 py-1">Societal &amp; cultural harm</td><td class="px-4 py-1">Societal &amp; Cultural</td></tr>
<tr><td class="px-4 py-1">Political &amp; economic harm</td><td class="px-4 py-1">Political &amp; Economic</td></tr>
<tr><td class="px-4 py-1">Environmental harm</td><td class="px-4 py-1">Environmental</td></tr>
</tbody>
</table>

<div class="mt-6 text-sm opacity-60 text-center">
Abercrombie et al. 2024 · <code>arXiv:2407.01294</code> · CC BY-SA 4.0
</div>

<!--
SLIDE 23 · 60s · Risks mapping — AIAAIC
"We adopted AIAAIC's victim-centered harm taxonomy. Their research, attribution preserved, ShareAlike license travels with the schema."
This is the FIRST strong mapping. Lead with verbatim adoption + license preservation.
Source: see MAPPING-TABLES.md § Risks.

---

*Two columns: DTPR `risks_mitigation` ↔ AIAAIC taxonomy.*

> Risks. [beat] We didn't invent a risk taxonomy — we adopted one. The AIAAIC taxonomy, from Abercrombie and colleagues, 2024, Creative Commons ShareAlike. A *victim-centered* cut at AI harms. [beat] Our nine risk-mitigation elements are a verbatim adoption of their nine harm types. Their research. Their wording where we could keep it. The license travels with it.
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

# Function — what does the AI do?

<div class="text-base mt-3 opacity-70">DTPR <code>functional_modes</code> adopts Jashanmal's verb framing</div>

<table class="text-lg mt-6 mx-auto">
<thead>
<tr class="bg-gray-100">
<th class="px-4 py-2 text-left">DTPR mode</th>
<th class="px-4 py-2 text-left">Verb</th>
<th class="px-4 py-2 text-left">Plain-language reading</th>
</tr>
</thead>
<tbody>
<tr><td class="px-4 py-1"><strong>Analytical</strong></td><td class="px-4 py-1">decides</td><td class="px-4 py-1 opacity-80">"decides who to flag"</td></tr>
<tr><td class="px-4 py-1"><strong>Semantic</strong></td><td class="px-4 py-1">understands &amp; remembers</td><td class="px-4 py-1 opacity-80">"knows what you mean"</td></tr>
<tr><td class="px-4 py-1"><strong>Generative</strong></td><td class="px-4 py-1">creates</td><td class="px-4 py-1 opacity-80">"writes the message"</td></tr>
<tr><td class="px-4 py-1"><strong>Agentic</strong></td><td class="px-4 py-1">acts</td><td class="px-4 py-1 opacity-80">"takes the next step"</td></tr>
<tr><td class="px-4 py-1"><strong>Perceptive</strong></td><td class="px-4 py-1">senses</td><td class="px-4 py-1 opacity-80">"watches the road"</td></tr>
<tr><td class="px-4 py-1"><strong>Physical</strong></td><td class="px-4 py-1">moves</td><td class="px-4 py-1 opacity-80">"moves the gate"</td></tr>
</tbody>
</table>

<div class="mt-6 text-sm opacity-60 text-center">
Jashanmal 2026 · <em>AI Taxonomy — An Operational Framework for Precision in AI Discourse</em> · v1.1
</div>

<div class="mt-6 text-base text-center opacity-80">
Autonomy axis (orthogonal): <strong>human decides</strong> · <strong>human executes</strong> · <strong>autonomous</strong>
</div>

<!--
SLIDE 25 · 60s · Function & autonomy — Jashanmal
"Six verbs. Decides, understands, creates, acts, senses, moves. From Narain Jashanmal's framework. A citizen recognizes 'decides' without us defining 'agentic'."
This is the SECOND strong mapping. Verb framing is the load-bearing claim.
Land the orthogonality line second: "What the AI does is separate from who's on the hook."
Source: see MAPPING-TABLES.md § Function & Autonomy.

---

*Three columns: DTPR functional modes ↔ Jashanmal's verbs ↔ plain-language reading. Autonomy axis below.*

> Function. [beat] What the AI *does* — in plain-language verbs. Narain Jashanmal's AI Taxonomy gave us the verb framing: *decides, understands, creates, acts, senses, moves.* [beat] A citizen recognizes "decides" without us defining "agentic." That's why we adopted it. [beat] And the autonomy axis is orthogonal — what the AI *does* is separate from who's on the hook for the outcome. That distinction matters when something goes wrong.
-->

---
class: text-center
---

# Let me show you

<div class="mt-12 text-2xl opacity-80">
Two systems from the register. Same translation layer.
</div>

<!--
SLIDE 15 · 10s · Demo intro
Quick. Ramp into the demo.
TODO: thumbnail of 311 Multilingual Translation row from OTI report.

---

*Thumbnail: 311 row.*

> Let me show you. Two systems from the register. Same translation layer.
-->

---
layout: center
---

<DemoVideo src="/videos/15-demo-311-translation.mp4" label="311 Translation row → Claude skill → datachain renders" />

<!--
SLIDE 16 · 40s · DEMO 1 — 311 Translation
Pre-recorded sped-up screencast: register row → Claude skill → datachain renders.
Silent or minimal narration; let the video carry it.
TODO: record video, place at public/videos/15-demo-311-translation.mp4

---

*Pre-recorded sped-up screencast. Stay quiet. Let the video do the work. Maybe one line at the end:*

> *(Last five seconds, as the datachain finishes rendering:)* That. From that. In about a minute.
-->

---
class: text-center
---

# 311 Multilingual Translation

<div class="mt-8">

*(311 Translation datachain — full size)*

</div>

<div class="mt-6 text-xl opacity-80">Same row. New legibility.</div>

<!--
SLIDE 17 · 15s · 311 datachain still
TODO: render live <DtprDatachain :data="data311Translation" /> here using @dtpr/ui/vue.
Until then, hold a screenshot.

---

*Finished datachain, full size. Caption: "311 Multilingual Translation."*

> Same row from the OTI report. New legibility.
-->

---
layout: image
image: /images/17-midtown-traffic-signal.jpg
class: text-center text-white
---

<div class="absolute bottom-12 left-0 right-0 text-3xl">
Different deployment. Same translation layer.
</div>

<!--
SLIDE 18 · 10s · Second system
Visual cue for the next system. Either a register-row card or a Midtown traffic signal photo works — this is a transition, not a digital-vs-physical contrast.
TODO: source visual at public/images/17-second-system.jpg

---

*Visual cue for the next system — a Midtown traffic signal photo, or a clean register-row card. Either works; the point is a transition, not a digital-vs-physical contrast.*

> Different deployment. Same translation layer.
-->

---
layout: center
---

<DemoVideo src="/videos/18-demo-traffic-signal.mp4" label="Midtown Traffic Signal row → Claude skill → datachain renders" />

<!--
SLIDE 19 · 40s · DEMO 2 — Midtown Traffic Signal
Pre-recorded sped-up screencast: DOT row → Claude skill → datachain renders.
Silent; let the video carry it.
TODO: record video, place at public/videos/18-demo-traffic-signal.mp4

---

*Pre-recorded sped-up screencast. Stay quiet.*

> *(Last five seconds:)* Same translation layer. Different system entirely.
-->

---
class: text-center
---

# Midtown Traffic Signal

<div class="mt-8">

*(Midtown Traffic Signal datachain — full size)*

</div>

<div class="mt-6 text-xl opacity-80">One register. Eighty-six of these.</div>

<!--
SLIDE 20 · 15s · Traffic datachain still
TODO: live <DtprDatachain :data="dataMidtownTraffic" /> here.

---

*Finished datachain. Caption: "Midtown Traffic Signal."*

> One register. Eighty-six of these.
-->

---

# Same vocabulary. Two systems.

<div class="grid grid-cols-2 gap-8 mt-12">
<div class="text-center">

*(311 Translation datachain)*

<div class="mt-4 text-lg opacity-70">311 Multilingual Translation</div>

</div>
<div class="text-center">

*(Midtown Traffic Signal datachain)*

<div class="mt-4 text-lg opacity-70">Midtown Traffic Signal</div>

</div>
</div>

<!--
SLIDE 21 · 30s · Same vocabulary, two systems
"Same translation layer. Same visual vocabulary. Two very different systems."
TODO: render both <DtprDatachain> components side-by-side.

---

*Both datachains side-by-side.*

> A translation system inside 311, and an adaptive signal at an intersection. [beat] Two very different deployments. Same visual vocabulary. Same four questions. [beat] That's the translation layer doing its job.
-->

---
class: text-center
---

# How do we decide what goes in?

<div class="mt-12 text-xl opacity-80">
If this is the translation layer,<br>
we have to be honest about what we're translating <em>from</em>.
</div>

<!--
SLIDE 22 · 20s · Methodology intro
Set up the next 5 slides.

---

*Question card.*

> Now — fair question. How do we decide what goes *in*? [beat] If this is the translation layer, we have to be honest about what we're translating *from*.
-->

---

# Five surfaces. One vocabulary.

<div class="grid grid-cols-5 gap-4 mt-12 text-center">
<div class="p-4 border rounded"><div class="text-2xl">📋</div>Schema</div>
<div class="p-4 border rounded"><div class="text-2xl">🌐</div>REST</div>
<div class="p-4 border rounded"><div class="text-2xl">🔌</div>MCP</div>
<div class="p-4 border rounded"><div class="text-2xl">🎨</div>@dtpr/ui</div>
<div class="p-4 border rounded"><div class="text-2xl">🤖</div>Claude plugin</div>
</div>

<div class="mt-12 text-xl text-center opacity-80">
<strong>dtpr.ai</strong> · CC-BY-4.0
</div>

<!--
SLIDE 28 · 45s · Five surfaces, one vocabulary
"One open vocabulary. Five ways to consume it. So nobody has an excuse to leave the disclosure trapped in a PDF."
Note: emojis are placeholders for proper iconography in design pass. (Speaker also generally avoids emojis in delivery.)

---

*Pentagon diagram, `dtpr.ai` at the center, CC-BY-4.0 stamp.*

> One open vocabulary. Five ways to consume it. [beat] A schema. A REST API. An MCP server. A UI component library — `at-dtpr-slash-ui`. And a Claude skill. [beat] Pick your stack. Pick your surface. The goal is that nobody has to leave AI disclosure trapped in a PDF.
-->

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

*(rendered datachain with `authoring_provenance` expanded)*

</div>
</div>

<div class="mt-12 text-2xl text-center font-bold">
AI doesn't get to hide behind fluent text.
</div>

<!--
SLIDE 30 · 60s · Authoring provenance
This is a crucial slide. The bold final line is load-bearing — deliver it clearly with a pause.
TODO: real datachain screenshot with provenance section expanded.

---

*Datachain with the AI-provenance section expanded — verbatim source quotes, qualitative confidence, per-element rationale.*

> Here's one I care about a lot. [beat] When an AI helps draft a disclosure — and it will, because these reports are long and these documents are dense — the artifact carries the verbatim quotes the model leaned on. Per element. With a confidence rating. With a rationale you can read. [beat] *(Slow.)* AI does not get to hide behind fluent text. [beat] If a model wrote the words, the words have to point at the source.
-->

---
class: text-center
---

# Open commons

<div class="mt-8 text-2xl">

CC-BY-4.0 · github.com/Helpful-Places/dtpr · **dtpr.ai**

</div>

<div class="mt-12 text-xl opacity-80">
Free to use. Free to fork. Cite us.
</div>

<!--
SLIDE 31 · 20s · Open commons
Quick. Land the license. Move to reveal.

---

*CC-BY-4.0 logo, GitHub mark, `dtpr.ai`.*

> Creative Commons. On GitHub. `dtpr.ai`. [beat] Free to use. Free to fork. Cite us.
-->

---
class: text-center flex flex-col items-center justify-center
---

# You've seen one row.

# Let me show you all 86.

<!--
SLIDE 32 · 15s · Reveal transition
Deliver. Pause. Then switch to the live browser on the next slide.

---

*Large type: "You've seen one row. Let me show you all 86."*

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
class: text-center
---

# Built on open data

<div class="mt-12 text-xl space-y-4">
<div>Open data: <strong>NYC Office of Technology &amp; Innovation</strong></div>
<div>Built by <strong>Helpful Places</strong> with <strong>Clarable</strong></div>
<div>Powered by <strong>DTPR for AI</strong></div>
</div>

<!--
SLIDE 34 · 30s · Credits
NOT a partnership with OTI. OTI published their AI report openly; Helpful Places (with Clarable) took that open data and built this register on top of it. Speaker beat: credit OTI for the public-sector work, then name Helpful Places + Clarable explicitly. Standard is the commons; Clarable is one implementation.

---

*"Open data: NYC OTI · Built by Helpful Places with Clarable · Powered by DTPR for AI."*

> To be clear about how this got built: OTI did the hard public-sector work — they made eighty-six systems disclosable and they published the data openly. We — Helpful Places, with Clarable — took that open data and built this register on top of it. [beat] The standard is the commons. Clarable is one implementation of it. There can be — there should be — more.
-->

---
layout: image
image: /images/35-dtpr-guide-map.png
backgroundSize: contain
class: text-center
---

<!--
SLIDE 35 · 60s · Global map
"NYC is one node in a growing global network. 15 deployments today. The original DTPR has been doing translation work for sensors in cities for years. DTPR for AI joins that commons."
TODO: capture dtpr.guide map screenshot at the right zoom to show all 15 pins.
Cities to ensure are visible: Boston, Charlotte, Long Beach, West Palm Beach, DC, Detroit, Miami, Angers, Paris, Lure, Sydney, Sydney Olympic Park (+ CA, UK, PT).

---

*`dtpr.guide` map screenshot — fifteen pins.*

> New York is one node. [beat] Fifteen deployments today, on this map. Boston. Sydney. Paris. Detroit. Lure. The original DTPR has been doing this translation work for years, for sensors, in cities all over the world. [beat] DTPR for AI joins that commons. Same vocabulary. Same idea. New beast.
-->

---
class: text-center
---

# This is the brick we're bringing

<div class="mt-12 text-xl opacity-80">
DTPR for AI is in beta.<br>
The schema will evolve. The visual language will be refined.
</div>

<!--
SLIDE 36 · 20s · The brick
Set up the two CTAs.

---

*Brick illustration, or the phrase in large type.*

> DTPR for AI is in beta. The schema will evolve. The visual language will be refined. [beat] This is the brick we're bringing.
-->

---

# Workshop

<div class="mt-8 text-2xl space-y-4">
<div>**[Day]** · **[Time]** · **[Room]**</div>
<div class="opacity-80">Bring your laptop.</div>
</div>

<div class="mt-12 text-xl">
We'll spend an hour walking you through feeding any AIA, register row, or regulatory document through the agent skill — and producing a datachain you can ship.
</div>

<!--
SLIDE 37 · 30s · CTA 1 — Workshop
TODO: fill in workshop slot once confirmed.

---

*Workshop time, day, room.*

> If any of this lands — come to the workshop. *(Time, day, room.)* Bring your laptop. We'll spend an hour walking you through feeding an Algorithmic Impact Assessment, or a register row, or a regulatory document, through the agent skill — and producing a datachain you can ship.
-->

---

# Engage with the beta

<div class="mt-8 text-xl space-y-4">
<div>📍 <strong>dtpr.ai</strong></div>
<div>📦 <strong>github.com/Helpful-Places/dtpr</strong></div>
<div>📚 <strong>Cite us</strong> — CITATION.cff in the repo</div>
<div>🚀 <strong>Deploy us</strong> · 🐛 <strong>File issues</strong></div>
</div>

<div class="mt-12 text-2xl text-center opacity-80">
Come help us shape the schema.
</div>

<!--
SLIDE 38 · 30s · CTA 2 — Engage with the beta
Note: emojis here are placeholders for icon design.

---

*`dtpr.ai` · GitHub · CITATION.cff · forum.*

> `dtpr.ai`. GitHub. Cite us. Deploy us. File issues. [beat] Come help us shape the schema — it's early, and your input is going to make it better.
-->

---
class: text-center flex flex-col items-center justify-center
---

# Regulators write the rules.

# Researchers describe the harms.

# Vendors document their systems.

<div class="mt-8 text-3xl font-bold">
DTPR for AI is the layer that brings all of that<br>
into something a person on the receiving end can read.
</div>

<div class="mt-16 text-lg opacity-60">
Thank you · @jonathanpichot · jonathan@helpfulplaces.com
</div>

<!--
SLIDE 39 · 30s · Final line + thanks
Deliver the four sentences. Thank you. Hand off to Q&A.

---

*Large type, verbatim.*

> *(Slow. Eye contact. The load-bearing sentence.)*
>
> Regulators write the rules. Researchers describe the harms. Vendors document their systems. [beat] DTPR for AI is the layer that brings all of that into something a person on the receiving end can read. [beat] [beat] Thank you.

*Alternative closers to try in rehearsal — pick whichever lands best:*
> *…into something the people affected can read.*
> *…into something a person can read.*
> *…into something a New Yorker can read.*

*Hand off to Q&A.*
-->
