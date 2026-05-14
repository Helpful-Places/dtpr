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
transition: slide-left
mdc: true
fonts:
  sans: 'Inter'
  serif: 'Source Serif Pro'
  mono: 'JetBrains Mono'
---

# DTPR for AI

A Translation Layer for the Algorithms in Our Cities

<div class="mt-12 text-lg opacity-80">
MakeShift 2026 · School of Visual Arts, NYC<br>
Jonathan Pichot · Helpful Places
</div>

<!--
SLIDE 1 · 15s · Title card
Brief hello. Set expectation that the talk builds to something real — a launch, not a survey.
-->

---
layout: image-right
image: /images/02-nyc-skyline.jpg
---

# We're in NYC

And NYC has done more than most cities to make AI declarable.

<!--
SLIDE 2 · 20s · We're in NYC
Set the location and the build-on tone. Constructive, not confrontational.
TODO: replace placeholder image with NYC skyline / OTI building / AI Action Plan cover.
-->

---

# The work this builds on

<div class="grid grid-cols-2 gap-6 mt-8 text-xl">
<div>

- Algorithmic Tools Directive
- AI Action Plan
- Local Law 144
</div>
<div>

- Algorithms Management & Policy Officer
- OTI's 2025 AI Report
- *(name people here)*
</div>
</div>

<!--
SLIDE 3 · 30s · Named credit
"This is the work of public servants who fought to make algorithms in city services declarable."
TODO: confirm exact agency names + people to credit by name.
-->

---
class: text-center
---

# 86 systems · 20 organizations

<div class="mt-12 grid grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
<div class="text-2xl"><strong>17</strong> · DOHMH</div>
<div class="text-2xl"><strong>10</strong> · Mayor's Office</div>
<div class="text-2xl"><strong>8</strong> · OTI</div>
<div class="text-2xl"><strong>7</strong> · NYC Public Schools</div>
<div class="text-2xl"><strong>4</strong> · ACS</div>
<div class="text-2xl text-gray-500"><strong>40</strong> · across 15 more orgs</div>
</div>

<div class="mt-12 text-lg opacity-70">Source: NYC OTI 2025 AI Report</div>

<!--
SLIDE 4 · 40s · 86 systems / 20 organizations
"Real wins. Disclosure is happening. Now look at what's actually disclosed."
TODO: replace inline grid with a proper heat-map visualization rendered from register data.
-->

---
layout: image
image: /images/05-oti-report-row.png
backgroundSize: contain
---

<!--
SLIDE 5 · 45s · One row from the report
Read one sentence from the row aloud. Pause.
"Could a New Yorker walking past this tell you what it does to them?"
TODO: capture a zoomed screenshot of one row from the OTI 2025 AI Report PDF.
TODO: pick the row carefully — should be adjacent to the demo systems, not 311 or Midtown Traffic.
-->

---
class: text-center flex flex-col items-center justify-center
---

# Declared ≠ Understood

<div class="mt-8 text-2xl opacity-80">
Disclosure is necessary. Comprehension is the next mile.
</div>

<!--
SLIDE 6 · 30s · The gap
Land the framing. This is not a regulation problem. It's a communication-design problem.
-->

---

# You already know DTPR

<div class="mt-8 grid grid-cols-2 gap-12">
<div>

The visual vocabulary.<br>
Shapes are grammar.<br>
Same icon means the same thing in Boston as Helsinki.

</div>
<div class="text-center">

*(original DTPR datachain visual)*

</div>
</div>

<!--
SLIDE 7 · 30s · You already know DTPR
Skip the origin story. Audience knows it.
TODO: insert original DTPR datachain (sensor) image — purpose hexagon, processing circle, etc.
-->

---

# It was always a translation layer

<div class="mt-8 grid grid-cols-2 gap-8 items-center">
<div class="text-lg opacity-80">

**Heterogeneous source-of-truth**

- Vendor specs
- Privacy notices
- Signage standards
- Procurement records
</div>
<div class="text-center">

→ **One comparable nugget**<br>
*a person can read*

</div>
</div>

<!--
SLIDE 8 · 45s · It was always a translation layer
"Take heterogeneous inputs from any city or vendor. Produce one comparable nugget a person can read."
This is the THESIS slide. Set up the reframe that DTPR for AI extends the same translation function.
-->

---
layout: image
image: /images/09-dtpr-guide-map.png
backgroundSize: contain
---

# Deployed in 15 cities and counting

<!--
SLIDE 9 · 30s · DTPR in production today
"This isn't theoretical. The original is deployed in 15 cities and counting."
TODO: screenshot of dtpr.guide map at the right zoom to show all 15 pins.
-->

---
class: text-center
---

# Same translation function

# New beast

<div class="mt-12 text-2xl opacity-80">
AI needs new affordances.
</div>

<!--
SLIDE 10 · 30s · Bridge into Act 2
Pace this slowly. The pivot from sensors to AI.
-->

---

# AI is a different beast

<div class="grid grid-cols-3 gap-6 mt-12 text-xl">

<div>**Decides**</div>
<div>**Acts**</div>
<div>**Generates**</div>

<div>**Autonomy gradients**</div>
<div>**Novel failure modes**</div>
<div>**Hides inside other systems**</div>

</div>

<div class="mt-16 text-2xl text-center opacity-80">
It doesn't just collect. It *does*.
</div>

<!--
SLIDE 11 · 45s · AI is a different beast
Why the original DTPR's category structure isn't enough. Set up the four questions on the next slide.
-->

---
class: text-center
---

# Four questions a person actually has

<div class="grid grid-cols-2 gap-12 mt-12 text-xl">
<div class="p-6 border rounded">

What is this **doing to me?**

</div>
<div class="p-6 border rounded">

Who's **responsible** when it goes wrong?

</div>
<div class="p-6 border rounded">

Could it **hurt me?**

</div>
<div class="p-6 border rounded">

What about my **data?**

</div>
</div>

<!--
SLIDE 12 · 30s · The four questions
The audience-side framing. Everything else hangs from these four.
-->

---

# 11 categories · ~110 elements

<div class="mt-6 text-lg opacity-80">Each shape encodes a kind of answer.</div>

<div class="grid grid-cols-2 gap-8 mt-8">
<div>

**What is this doing to me?**
- `purpose`
- `functional_modes`

**Could it hurt me?**
- `risks_mitigation`

**Who's responsible?**
- `accountable`
- `rights`

</div>
<div>

**What about my data?**
- `input_dataset`
- `processing`
- `output_dataset`
- `access`
- `retention`
- `storage`

</div>
</div>

<!--
SLIDE 13 · 60s · The 11 categories
The DTPR for AI category structure mapped to the four questions.
TODO: render this as a proper diagram with category shapes (hexagon, octagon, circle).
-->

---
class: text-center
---

# Let me show you

<div class="mt-12 text-2xl opacity-80">
We'll start with the AI in your phone.
</div>

<!--
SLIDE 14 · 10s · Demo intro
Quick. Ramp into the demo.
TODO: thumbnail of 311 Multilingual Translation row from OTI report.
-->

---
layout: center
---

<video controls autoplay muted loop class="w-full max-w-5xl">
  <source src="/videos/15-demo-311-translation.mp4" type="video/mp4">
</video>

<!--
SLIDE 15 · 40s · DEMO 1 — 311 Translation
Pre-recorded sped-up screencast: register row → Claude skill → datachain renders.
Silent or minimal narration; let the video carry it.
TODO: record video, place at public/videos/15-demo-311-translation.mp4
-->

---
class: text-center
---

# AI in your phone

<div class="mt-8">

*(311 Translation datachain — full size)*

</div>

<div class="mt-6 text-xl opacity-80">Same row. New legibility.</div>

<!--
SLIDE 16 · 15s · 311 datachain still
TODO: render live <DtprDatachain :data="data311Translation" /> here using @dtpr/ui/vue.
Until then, hold a screenshot.
-->

---
layout: image
image: /images/17-midtown-traffic-signal.jpg
class: text-center text-white
---

<div class="absolute bottom-12 left-0 right-0 text-3xl">
And it's not just digital.
</div>

<!--
SLIDE 17 · 10s · Contrast beat
Full-bleed photo of a Midtown traffic signal at street level. Embodied moment.
TODO: source photo at public/images/17-midtown-traffic-signal.jpg
-->

---
layout: center
---

<video controls autoplay muted loop class="w-full max-w-5xl">
  <source src="/videos/18-demo-traffic-signal.mp4" type="video/mp4">
</video>

<!--
SLIDE 18 · 40s · DEMO 2 — Midtown Traffic Signal
Pre-recorded sped-up screencast: DOT row → Claude skill → datachain renders.
Silent; let the video carry it.
TODO: record video, place at public/videos/18-demo-traffic-signal.mp4
-->

---
class: text-center
---

# AI on your street

<div class="mt-8">

*(Midtown Traffic Signal datachain — full size)*

</div>

<div class="mt-6 text-xl opacity-80">You walked under one of these to get here today.</div>

<!--
SLIDE 19 · 15s · Traffic datachain still
TODO: live <DtprDatachain :data="dataMidtownTraffic" /> here.
-->

---

# Same vocabulary. Two beasts.

<div class="grid grid-cols-2 gap-8 mt-12">
<div class="text-center">

*(311 Translation datachain)*

<div class="mt-4 text-lg opacity-70">AI in your phone</div>

</div>
<div class="text-center">

*(Midtown Traffic Signal datachain)*

<div class="mt-4 text-lg opacity-70">AI on your street</div>

</div>
</div>

<!--
SLIDE 20 · 30s · Same vocabulary, two beasts
"Same translation layer. Same visual vocabulary. Two very different systems."
TODO: render both <DtprDatachain> components side-by-side.
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
SLIDE 21 · 20s · Methodology intro
Set up the next 5 slides.
-->

---

# Risks — what could happen to a person

<div class="text-sm mt-4 opacity-70">DTPR `risks_mitigation` ↔ AIAAIC ↔ EU AI Act</div>

<table class="text-sm mt-4">
<thead>
<tr>
<th>DTPR (victim-centered)</th>
<th>AIAAIC harm type</th>
<th>EU AI Act framing</th>
</tr>
</thead>
<tbody>
<tr><td>Loss of autonomy</td><td>Autonomy</td><td>Charter Art. 1 (dignity); Art 5(1) prohibited manipulation</td></tr>
<tr><td>Physical harm</td><td>Physical</td><td>Health & safety (Art. 9 risk-management)</td></tr>
<tr><td>Psychological harm</td><td>Psychological</td><td>Charter Art. 3 (mental integrity)</td></tr>
<tr><td>Reputational harm</td><td>Reputational</td><td>Charter Art. 7 (private life), Art. 8 (data)</td></tr>
<tr><td>Financial &amp; business harm</td><td>Financial &amp; Business</td><td>Art 5(1)(c) social-scoring; consumer protection</td></tr>
<tr><td>Civil liberties harm</td><td>Human Rights &amp; Civil Liberties</td><td>Charter Arts. 7, 8, 11, 12; Annex III §1, §6</td></tr>
<tr><td>Societal &amp; cultural harm</td><td>Societal &amp; Cultural</td><td>Democratic processes (Annex III §8)</td></tr>
<tr><td>Political &amp; economic harm</td><td>Political &amp; Economic</td><td>Rule of law; Art. 27 FRIA</td></tr>
<tr><td>Environmental harm</td><td>Environmental</td><td>Recital 27; Art. 95 codes of conduct</td></tr>
</tbody>
</table>

<!--
SLIDE 22 · 60s · Risks mapping table
"We adopted AIAAIC's victim-centered cut. Their research, with attribution. License travels."
Source: see MAPPING-TABLES.md § Risks. v1 draft — confirm before locking.
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
SLIDE 23 · 30s · Why victim-centered
This is the design-decision slide. Make the rationale concrete with an example pair.
-->

---

# Function & autonomy

<div class="text-sm mt-4 opacity-70">DTPR `functional_modes` + autonomy axis ↔ EU Annex III ↔ OECD</div>

<table class="text-sm mt-4">
<thead>
<tr>
<th>Question</th>
<th>DTPR</th>
<th>EU AI Act</th>
<th>OECD</th>
</tr>
</thead>
<tbody>
<tr>
<td>What does it do?</td>
<td><code>functional_modes</code> — analytical, semantic, generative, agentic, perceptive, physical</td>
<td>—</td>
<td>Task &amp; Output dimension</td>
</tr>
<tr>
<td>How autonomous?</td>
<td>Autonomy axis — human decides / human executes / autonomous</td>
<td>Implicit (Annex III + Art. 14 human oversight)</td>
<td>Autonomy &amp; adaptiveness ratings</td>
</tr>
<tr>
<td>In what domain?</td>
<td><code>purpose</code> — 23 elements (health, transport, education, etc.)</td>
<td>Annex III — 8 high-risk domains</td>
<td>Economic Context dimension</td>
</tr>
</tbody>
</table>

<div class="mt-8 text-xl text-center opacity-80">
The autonomy axis separates <em>what the AI does</em><br>
from <em>who's on the hook for the outcome</em>.
</div>

<!--
SLIDE 24 · 60s · Function & autonomy mapping table
Source: see MAPPING-TABLES.md § Function & Autonomy. v1 draft.
-->

---

# Transparency obligations

<div class="text-sm mt-4 opacity-70">NYC LL144 ↔ EU AI Act Articles 13/26/50 ↔ what DTPR surfaces</div>

<table class="text-sm mt-4">
<thead>
<tr>
<th>Disclosure question</th>
<th>NYC LL144 (AEDT)</th>
<th>EU AI Act</th>
<th>DTPR for AI surfaces</th>
</tr>
</thead>
<tbody>
<tr><td>That AI is in use</td><td>Notice to candidate</td><td>Art. 50 (interaction, AI-generated content)</td><td><code>purpose</code>, <code>functional_modes</code></td></tr>
<tr><td>What it does</td><td>(implicit in audit)</td><td>Art. 13 (instructions for use)</td><td><code>functional_modes</code>, <code>processing</code></td></tr>
<tr><td>Who's responsible</td><td>Employer using AEDT</td><td>Provider + Deployer roles</td><td><code>accountable</code></td></tr>
<tr><td>Risk profile</td><td>Bias-audit summary</td><td>Art. 27 FRIA</td><td><code>risks_mitigation</code></td></tr>
<tr><td>Data handling</td><td>Source, retention</td><td>Art. 13 + Art. 10</td><td><code>input_dataset</code>, <code>retention</code>, <code>storage</code>, <code>access</code></td></tr>
<tr><td>Rights / redress</td><td>Alternative process</td><td>Art. 86 (right to explanation)</td><td><code>rights</code></td></tr>
</tbody>
</table>

<!--
SLIDE 25 · 45s · Transparency mapping table
"Regulators set the floor of what must be disclosed. DTPR is the form that makes it legible."
Source: see MAPPING-TABLES.md § Transparency. v1 draft.
-->

---
class: text-center flex flex-col items-center justify-center
---

# We don't replace any of these.

# We let a person read across them.

<div class="mt-12 text-lg opacity-60">
EU · OECD · NIST · AIAAIC · NYC → one datachain
</div>

<!--
SLIDE 26 · 30s · The repeated sentence
Deliver verbatim. Pause.
TODO: render the icon flow visualization (regulatory bodies → datachain).
-->

---

# Standing on shoulders

<div class="grid grid-cols-3 gap-6 mt-8 text-lg">
<div>**AIAAIC**<br>victim-centered harm taxonomy</div>
<div>**OECD.AI**<br>system classification</div>
<div>**EU AI Office**<br>regulatory framework</div>
<div>**AlgorithmWatch**<br>automating-society reporting</div>
<div>**AI Now Institute**<br>policy research</div>
<div>**NIST AI RMF**<br>risk management</div>
</div>

<div class="mt-12 text-xl text-center opacity-80">
We didn't invent any of this. We made it readable.
</div>

<!--
SLIDE 27 · 30s · Acknowledgements
TODO: confirm exactly which orgs to credit — these are starting candidates.
Add NYC OTI / public servants too.
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
-->

---
class: text-center flex flex-col items-center justify-center
---

# You've seen one row.

# Let me show you all 86.

<!--
SLIDE 32 · 15s · Reveal transition
Deliver. Pause. Then switch to the live browser on the next slide.
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
-->

---
class: text-center
---

# Built together

<div class="mt-12 text-xl space-y-4">
<div>Hosted by <strong>NYC Office of Technology &amp; Innovation</strong></div>
<div>Built with <strong>Clarable</strong>, by <strong>Helpful Places</strong></div>
<div>Powered by <strong>DTPR for AI</strong></div>
</div>

<!--
SLIDE 34 · 30s · Credits
Name Clarable + Helpful Places explicitly. Standard is the commons; Clarable is one implementation.
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
-->

---
class: text-center flex flex-col items-center justify-center
---

# Regulators write the rules.

# Researchers describe the harms.

# Vendors document their systems.

<div class="mt-8 text-3xl font-bold">
DTPR for AI is the layer that brings all of that<br>
into something a person on the sidewalk can read.
</div>

<div class="mt-16 text-lg opacity-60">
Thank you · @jonathanpichot · jonathan@helpfulplaces.com
</div>

<!--
SLIDE 39 · 30s · Final line + thanks
Deliver the four sentences. Thank you. Hand off to Q&A.
-->
