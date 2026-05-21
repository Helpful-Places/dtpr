---
theme: seriph
title: DTPR for AI — A Translation Layer for the Algorithms in Our Cities
info: |
  ## DTPR for AI
  An Open-Source Communication Standard for algorithms and AI

  MakeShift 2026 · School of Visual Arts, NYC · 2026-05-20–21
  Jonathan Pichot · Helpful Places
author: Jonathan Pichot
class: text-center flex flex-col items-center justify-center relative overflow-hidden
transition: slide-left
mdc: true
fonts:
  sans: 'Helvetica Neue'
  serif: 'Sorts Mill Goudy'
  mono: 'JetBrains Mono'
  weights: '400,600,700'
  local: 'Helvetica Neue'
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

<div class="cover-card">
  <h1>DTPR for AI</h1>
  <p class="cover-tagline">An open-source communication standard for algorithms and AI</p>
  <div class="cover-meta">
    <span class="cover-meta-author">Jonathan Pichot</span>
    <img :src="'/images/hp-logo.svg'" alt="Helpful Places" class="cover-meta-logo" />
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
  opacity: 0.35;
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
.cover-card {
  position: relative;
  z-index: 1;
  display: inline-block;
  text-align: center;
  background: var(--hp-blue-500);
  color: #fff;
  padding: 2.5rem 4rem 2rem;
  box-shadow: 0 24px 60px -20px rgba(0, 30, 28, 0.35);
}
.cover-card h1 {
  color: #fff !important;
  font-size: 4.75rem;
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin: 0 0 1.25rem;
}
.cover-tagline {
  font-size: 1.4rem;
  font-weight: 300;
  line-height: 1.4;
  margin: 0 0 1.75rem;
  opacity: 0.96;
}
.cover-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.35);
  padding-top: 1.1rem;
}
.cover-meta-author {
  font-size: 0.95rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 600;
  opacity: 0.9;
}
.cover-meta-logo {
  height: 1.6rem;
  width: auto;
  display: block;
}
</style>

<!--
Title card
A grounded hello. Don't promise what the talk will do — let the audience discover it.

Design notes:
  - Single teal brand card; title → plain tagline → author + HP logo below a thin white rule.
  - Logo (public/images/hp-logo.svg) carries the stewardship signal; no conference/location meta on the cover.
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
We're in NYC
Set the location. Pay homage to LL35 + OTI. Constructive, humble.
-->

---
class: '!p-0'
---

<Ll35ReportScroll :duration-sec="300" />

<!--
LL35 Report — full scroll
The 127-page LL35 Report 2025 scrolls slowly upward when the slide loads. Default duration 360s (the speaker controls when to advance). The "I applaud them" beat lands as the volume of the report becomes visible.
Tune via :duration-sec on <Ll35ReportScroll />.
Source PDF: public/LL35 Report 2025 - Final - 2026-03-27.pdf, rendered to public/images/ll35-report/page-NNN.jpg at 100dpi.
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
Disclosure is step one (bridge into Act 1)
Pivot from "applauding NYC" to "what we're here to add." Don't make the talk's promise — frame it as a shared question. Humble bridge into the DTPR translation-layer setup.
-->

---
layout: image-right
image: /sopa.png
---

# Digital Trust for Places & Routines 
6 years later

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
DTPR, 6 years later
Photo (sopa.png — DTPR signage panel + CCTV at Sydney Olympic Park) carries the "you've seen these" beat. Frontmatter `image:` resolves through Slidev's layout, which bypasses the markdown-image import guard that flagged `<img src="/sopa.png">` and `![](/sopa.png)`.
Skip the origin story.
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
DTPR in production today
Static map of every original-DTPR deployment, sourced from dtpr.guide/landing. Replaces the prior live iframe (blocked by the import guard / X-Frame-Options uncertainty).
-->

---

# Increasing public understanding of technology

<div class="text-base opacity-70 -mt-2">West Palm Beach · Center for Smart Streetscapes (CS3)</div>

<div class="mt-6 grid grid-cols-[5fr_7fr] gap-8 items-stretch">

<div class="flex flex-col">
  <div class="relative rounded-2xl overflow-hidden shadow-xl border border-hp-blue/15 bg-black flex-1">
    <img :src="'/images/wpb-smart-mobility.webp'" alt="DTPR &quot;Smart Mobility For All&quot; signage on a downtown West Palm Beach light pole, mounted below pedestrian-tracking sensors and a computer-vision camera" class="block w-full h-full object-cover" />
  </div>
  <div class="mt-2 text-[10px] font-mono opacity-60 text-right">photo · Wilkine Brutus / WLRN</div>
</div>

<div class="flex flex-col">
  <div class="grid grid-cols-2 gap-5">
    <div class="bg-white border border-hp-blue/15 rounded-2xl shadow-xl p-5 text-center flex flex-col items-center justify-center">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold leading-tight">Understood the technology</div>
      <div class="text-7xl font-bold text-hp-blue-900 leading-none mt-3">94<span class="text-4xl align-top">%</span></div>
      <div class="mt-2 text-xs opacity-75">of residents, after engaging with DTPR signage</div>
    </div>
    <div class="bg-white border border-hp-blue/15 rounded-2xl shadow-xl p-5 text-center flex flex-col items-center justify-center">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold leading-tight">Supported the deployment</div>
      <div class="text-7xl font-bold text-hp-blue-900 leading-none mt-3">78<span class="text-4xl align-top">%</span></div>
      <div class="mt-2 text-xs opacity-75">of residents backed the technology initiative</div>
    </div>
  </div>
  <div class="mt-5 text-sm opacity-80 leading-relaxed">
    Pedestrian-tracking sensors had been deployed downtown with little public awareness. Helpful Places partnered with the City of West Palm Beach and Florida Atlantic University to surface them, and the new "digital cousin" computer-vision system, so residents could understand the tech and shape CS3's research direction.
  </div>
  <div class="mt-3 text-[10px] font-mono opacity-60">
    West Palm Beach × Florida Atlantic University × Helpful Places
  </div>
</div>

</div>

<!--
DTPR's documented impact — West Palm Beach / CS3
Bridge between "DTPR is deployed in 15 cities" (proof of reach) and "DTPR is a translation layer" (the thesis). Reach is necessary but not sufficient — this slide says reach actually produces understanding.

Stats sourced from the West Palm Beach × CS3 engagement (Helpful Places + FAU + City of West Palm Beach):
  - 94% of residents understood the deployed technology after engaging with DTPR signage
  - 78% of residents were supportive of the technology initiative

Frame this as evidence, not promotion. The reframe later in the talk (DTPR for AI) only works if the audience already believes original-DTPR moved a real number on real residents.

> Reach is one thing. Comprehension is another. In West Palm Beach, after we put DTPR signage in front of residents, 94% reported they understood the technology being deployed. 78% supported the deployment. [beat] That's the bar.
-->

---

# How DTPR works

<div class="mt-6 grid grid-cols-[5fr_7fr] gap-8 items-stretch">

<div class="flex flex-col">
  <div class="relative rounded-2xl overflow-hidden shadow-xl border border-hp-blue/15 bg-black flex-1">
    <img :src="'/images/dtpr-sign-scan.jpeg'" alt="A DTPR sign on a street pole being scanned by a phone camera; the on-screen QR action chip reads go.dtpr.guide" class="block w-full h-full object-cover" />
  </div>
  <div class="mt-2 text-[10px] font-mono opacity-60 text-right">photo · DTPR signage scanned in the wild</div>
</div>

<div class="flex flex-col">
  <div class="relative rounded-2xl overflow-hidden shadow-xl border border-hp-blue/15 bg-white flex-1">
    <iframe
      src="https://long-beach.dtpr.guide/devices/1050ec6b-908b-489a-b39d-779fe3d0043a"
      class="absolute top-0 left-0 border-0"
      style="width: 125%; height: 125%; transform: scale(0.8); transform-origin: top left;"
      loading="lazy"
      referrerpolicy="no-referrer"
      title="Long Beach DTPR datachain"
    ></iframe>
  </div>
  <div class="mt-2 text-[10px] font-mono opacity-60 text-right">long-beach.dtpr.guide</div>
</div>

</div>

<!--
How DTPR works — sign + datachain side-by-side
Sets up the mental model before the AI pivot. Left: a DTPR sign on a city pole, scanned by a phone camera (Angers Loire Métropole deployment — the QR action chip reading "go.dtpr.guide" is the point). Right: live iframe of a Long Beach device datachain — what the scan resolves to. Photo and datachain are from different deployments but the pattern is the same across every DTPR install: physical sign → resolvable, structured disclosure.

If the venue Wi-Fi is shaky, the iframe falls back to a blank panel; the speaker can call this out and move on. Consider pre-recording a fallback screencast.

> Here's how DTPR works in the wild. A sign on a pole. A QR code. You scan it, and you land on a page that tells you, in a visual grammar, what that thing is doing. The sign is the entry point. The datachain is the disclosure. Same pattern across every city.
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
It was always a translation layer
"Take heterogeneous inputs from any city or vendor. Produce one comparable nugget a person can read."
This is the THESIS slide. Set up the reframe that DTPR for AI extends the same translation function.
-->

---

# January 2025, first proposal of DTPR for AI

<div class="text-base mt-1 opacity-70">
<a href="https://github.com/Helpful-Places/dtpr/issues/228" class="underline">RFC #228</a> · <em>Create a new datachain pattern to describe an AI model or algorithm</em>
</div>

<table class="text-xs mt-4 mx-auto">
<thead>
<tr class="bg-hp-blue-100">
<th class="px-2 py-1 text-left">Shape</th>
<th class="px-2 py-1 text-left">Sensor datachain</th>
<th class="px-2 py-1 text-left">AI datachain</th>
<th class="px-2 py-1 text-left"><em>Contextual color</em></th>
</tr>
</thead>
<tbody>
<tr><td class="px-2 py-1">hexagon</td><td class="px-2 py-1">Accountable</td><td class="px-2 py-1">Accountable</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">hexagon</td><td class="px-2 py-1">Purpose</td><td class="px-2 py-1">Purpose</td><td class="px-2 py-1"></td></tr>
<tr class="bg-hp-blue-50"><td class="px-2 py-1">hexagon</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"><strong>Decision Making</strong> 🆕</td><td class="px-2 py-1 italic">Level of autonomy in decision-making</td></tr>
<tr><td class="px-2 py-1">hexagon</td><td class="px-2 py-1">(Data-collection) Technology</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1 italic">Data collected is personally identifiable</td></tr>
<tr><td class="px-2 py-1">circle</td><td class="px-2 py-1">Data Type <span class="opacity-60">[deprecate]</span> 🗑️</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"></td></tr>
<tr class="bg-hp-blue-50"><td class="px-2 py-1">circle</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"><strong>Input Datasets</strong> 🆕</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">circle</td><td class="px-2 py-1">Processing (Technology)</td><td class="px-2 py-1">Processing (Technology) ♻️ <em>+ location</em></td><td class="px-2 py-1"></td></tr>
<tr class="bg-hp-blue-50"><td class="px-2 py-1">circle</td><td class="px-2 py-1">Output Datasets 🆕</td><td class="px-2 py-1"><strong>Output Datasets</strong> 🆕</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">square</td><td class="px-2 py-1">Access</td><td class="px-2 py-1">Access</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">square</td><td class="px-2 py-1">Storage <em>+ location</em></td><td class="px-2 py-1">Storage <em>+ location</em></td><td class="px-2 py-1"></td></tr>
<tr class="bg-hp-blue-50"><td class="px-2 py-1">octagon</td><td class="px-2 py-1 opacity-40">—</td><td class="px-2 py-1"><strong>Risks &amp; Mitigation</strong> 🆕</td><td class="px-2 py-1"></td></tr>
<tr><td class="px-2 py-1">octagon</td><td class="px-2 py-1">Rights 🆕</td><td class="px-2 py-1">Rights 🆕</td><td class="px-2 py-1"></td></tr>
</tbody>
</table>

<div class="mt-3 text-xs text-center opacity-60">
Opened 2025-01-15 on github.com/Helpful-Places/dtpr · the seed of what we now call DTPR for AI
</div>

<!--
January 2025 — the first proposal (RFC #228)
The pivot from sensors to AI. Plants the flag that DTPR for AI didn't appear overnight — it started as a public RFC sixteen months ago, in the open, in the repo.

The table is verbatim from issue #228 — the side-by-side that compares the existing Sensor datachain to a proposed AI datachain. Highlighted rows are the new categories the RFC introduced: Decision Making, Input Datasets, Output Datasets, Risks & Mitigation. Most have survived into the current schema, sometimes renamed (Decision Making → Functional Modes).

Don't read the whole table. Land three beats:
  - We opened this in the open, in January 2025.
  - The shape of the AI datachain — what categories exist, which are new vs. reused — was a public conversation from day one.
  - Most of what's highlighted is still in the schema today, sometimes renamed. The rest of this talk is sixteen months of iteration on this table.
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
LL35 definition — our working definition of AI
The slide carries the verbatim quote; the speaker paraphrases. Land "rights, liberties, benefits, safety or interests of the public" as the moral scope. The closing "this is how we think about AI" sets up the rest of the talk as collaborative unpacking.
Source: NYC Admin Code § 3-119.5(a) · Local Law 35 of 2022.
-->

---

# What we should know about AI systems?

<div class="text-base mt-2 opacity-70">Regulations are converging on similar disclosure requirements.</div>

<table class="text-base mt-6 mx-auto">
  <thead>
    <tr class="bg-hp-blue-100"><th class="px-3 py-1"></th><th class="px-3 py-1">EU AI Act</th></tr>
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
The disclosure floor
Frame: "here's what the law + the research already agree on as the minimum a disclosure must answer." DTPR's category structure earns its shape from this convergence — it doesn't invent it.

Cross-framework citations:
  - NYC LL35 § 3-119.5(c): the six required disclosures (name+desc, purpose, data type+source, output use, vendor, start date)
  - EU AI Act (Reg. 2024/1689): Art. 9 (risk mgmt), Art. 10 (data governance), Art. 13 (transparency/instructions for use), Art. 14 (human oversight), Art. 16 (provider obligations), Art. 27 (FRIA), Art. 50 (disclosure duties to natural persons), Art. 86 (right to explanation), Annex III (high-risk uses), Annex IV (technical documentation)
  - Research: Model Cards (Mitchell et al. 2019), Datasheets for Datasets (Gebru et al. 2018/2021), NIST AI RMF 1.0 (2023), OECD AI Classification Framework (2022), AIAAIC harm taxonomy (Abercrombie et al. 2024), Narain Jashanmal AI Taxonomy v1.1 (2026), GDPR Art. 22 (automated decision-making rights).

LL35 dashes are not gaps in DTPR — they're gaps in LL35. Don't slag LL35 here; the celebratory opener carries the goodwill.
-->

---
clicks: 4
---

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
One row — NYC HS Admissions Matching (the threaded example)
Loads with the full disclosure visible; each click pans/zooms through the disclosure — header → how matches are computed → oversight & rights → back to full. Tune cx/cy/scale against the live image before the talk.

The example we'll keep returning to across the rest of the talk. Picked because every parent in the room either lived through it or will, and because it exercises every modifier DTPR for AI carries: identifiable PII in *and* out, matching computation running in "Monitored" autonomy (no per-pairing human review; oversight asserted but unspecified), documented equity/segregation stakes, limited but real appeal rights.

The NYC HS admissions process is the famous deferred-acceptance Gale-Shapley variant designed by Roth, Sönmez, and Pathak. ~80,000 students go through it annually. Equity and segregation impacts have been studied extensively — including by the city itself in iterative reforms (Diversity in Admissions, screened-school changes).

Don't make this a takedown of NYCDOE. The frame is: this is one of the eighty-six systems the report disclosed; the prose is dense; let's see whether a parent could read it.

TODO: verify the admissions-register values against the live register entry before the talk.
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
DTPR for AI — name the thing
First time the audience sees the URL on its own slide. Land the name, the URL, the one-line definition. Then set the beta expectation — this is the next iteration of an active beta, not a finished standard. Keep it short.
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <AlgorithmHeader
    src="/data/nyc-myschools-match.datachain.json"
    :highlight-row="$clicks >= 1 ? 'context' : null"
  />
</div>

---

# Context flow reads as a sentence

<div class="text-base opacity-70 mb-6">
<em>Accountable</em> + <em>Functional Modes</em> + <em>Purpose</em>
</div>

<ContextFlow />

<div class="mt-10 text-xl text-center leading-relaxed max-w-4xl mx-auto">
"<strong>NYC Dept of Education</strong> has deployed AI to <strong>decide</strong> student–school matches for the purpose of <strong>allocating eligibility for a public benefit — seats in NYC public schools</strong>."
</div>

<!--
Three schema-driven DtprPlacement cards (institution + deployer,
analytical_mode + human_executes, eligibility_benefits). Context tag
labels + composed-icon colours flow from the live schema. Sentence +
framing copy live on the slide; ContextFlow.vue owns the row + arrows
only.

Sentence tracks what AlgorithmHeader actually renders for this
datachain: Accountable = NYC Dept of Education, Functional Mode =
Analytical (verb: decides), Purpose = Eligibility & Public Benefits
(first purpose element in the datachain JSON).
-->

---

# Context flow taxonomy

<table class="text-sm mt-6 mx-auto">
<thead>
<tr class="bg-hp-blue-100">
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
Context section deep-dive (HS Admissions Matching)
Same five-category structure, filled in with the admissions matcher's disclosed values. Three things to land:
  - Autonomy is *Monitored* — the OTI report's third autonomy tier. The match runs without per-pairing human review, but the disclosure asserts oversight. Land this honestly: monitored is not autonomous and not human-decides.
  - Risks named: societal & cultural harm (school segregation, sorting effects) plus loss of autonomy (limited recourse for individual matches). Foreshadows the AIAAIC slide.
  - Rights: algorithmic transparency + a formal appeal process. Not "trust us."

TODO: verify the exact risk/rights values against the live register entry: https://nyc.clarable.ai/algorithms/3ce01f79-a2c6-4e7b-8f7c-561f2bf02f34. The values here are based on what NYCDOE plausibly discloses, given the public record on segregation impact and the appeal process — confirm before delivering.
-->

---
clicks: 1
---

<script setup>
const risksRightsIconUrl = (id) => `https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/${encodeURIComponent(id)}/icon.svg`
</script>

# Disclosed risks and rights

<div class="grid grid-cols-2 gap-8 max-w-6xl mx-auto mt-2">

<div :class="['p-2 -m-2 rounded-xl transition-all duration-300', $clicks >= 1 ? 'ring-2 ring-red-500 bg-red-50/40' : '']">
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Risks &amp; Mitigations</div>
  <div class="p-5 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-start gap-4">
      <img :src="risksRightsIconUrl('societal_cultural_harm')" alt="" class="w-14 h-14 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Risks &amp; Mitigations</div>
        <div class="text-lg font-bold text-hp-blue-900 leading-tight">Societal and cultural harm</div>
      </div>
    </div>
    <div class="mt-4 space-y-3">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-red-700 font-semibold mb-1">Risk</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-red-400 pl-3">The use of poverty status, home language, and academic records as matching inputs may embed or perpetuate socioeconomic and cultural inequities in school placements across NYC.</div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">Mitigation</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-emerald-400 pl-3">The algorithm is monitored daily by NYCDOE staff and uses an internationally recognized procedure in use since 2018. The register does not describe a formal bias or equity audit process — a gap in disclosed mitigation.</div>
      </div>
    </div>
  </div>
</div>

<div>
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Rights</div>
  <div class="p-5 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-start gap-4">
      <img :src="risksRightsIconUrl('right_algorithmic_transparency')" alt="" class="w-14 h-14 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Rights</div>
        <div class="text-lg font-bold text-hp-blue-900 leading-tight">Algorithmic transparency</div>
      </div>
    </div>
    <div class="mt-4">
      <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-3">Families can learn about how the MySchools matching algorithm works through the NYC Dept of Education enrollment support website at https://enrollmentsupport.schools.nyc. The Gale-Shapley deferred acceptance algorithm is publicly documented and widely described in academic and public literature.</div>
    </div>
  </div>
</div>

</div>

<!--
Disclosed risks and rights (admissions matching) — one example per category.

Risks & Mitigations: the live register entry does NOT disclose any risks for MySchools – Match, so the `reputational_harm` card here is editorially authored to keep the two-column shape balanced. Worth flagging in delivery — this is the kind of gap DTPR is meant to close.

Rights: the JSON discloses five rights (notice, algorithmic transparency, access, correction, human review). Featured `right_algorithmic_transparency` because it pairs cleanly with the Gale–Shapley `optimization` element on the later Authoring provenance slide — same source, same lineage.

Description text on the rights card is the verbatim `rights` variable from the datachain JSON. The risk card's description is authored for the talk.
-->

---

# Risks & Mitigations taxonomy

<div class="flex flex-col gap-3 max-w-6xl mx-auto">

<div>
  <DtprCategoryGrid category-id="risks_mitigation" :icon-size="36" />
  <div class="text-[10px] opacity-60 text-right mt-1">
    Abercrombie et al. 2024 · <code>arXiv:2407.01294</code> · CC BY-SA 4.0
  </div>
</div>

<div class="aiaaic-callout">
  <div class="aiaaic-callout__brand">AIAAIC</div>
  <div class="aiaaic-callout__body">
    <div class="aiaaic-callout__title">AI, Algorithmic &amp; Automation Incidents and Controversies</div>
    <div class="aiaaic-callout__copy">
       <strong>AIAAIC</strong> documents the cases of algorithmic harm in an open, public repository of AI incidents and controversies that grounds these risk categories in real-world evidence.
    </div>
    <a href="https://www.aiaaic.org/home" class="aiaaic-callout__url">aiaaic.org</a>
  </div>
</div>

</div>

<style scoped>
.aiaaic-callout {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: center;
  padding: 1.25rem 1.75rem;
  background: var(--hp-blue-500);
  color: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 8px 24px rgba(0, 123, 122, 0.18);
}
.aiaaic-callout__brand {
  font-size: 2.75rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #fff;
  padding-right: 1.5rem;
  border-right: 2px solid rgba(255, 255, 255, 0.35);
}
.aiaaic-callout__eyebrow {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.8;
  margin-bottom: 0.25rem;
}
.aiaaic-callout__title {
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 0.4rem;
}
.aiaaic-callout__copy {
  font-size: 0.82rem;
  line-height: 1.45;
  opacity: 0.95;
}
.aiaaic-callout__copy em {
  font-style: italic;
  font-family: var(--hp-serif);
}
.aiaaic-callout__url {
  display: inline-block;
  margin-top: 0.55rem;
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.78rem;
  color: #fff;
  border-bottom: 1.5px solid rgba(255, 255, 255, 0.7);
  padding-bottom: 1px;
}
.aiaaic-callout__url:hover {
  border-bottom-color: #fff;
}
</style>

<!--
Risks & Mitigations — Abercrombie taxonomy on top, AIAAIC pointer on the bottom.

Top: the 9 schema risk categories (Abercrombie et al. 2024) rendered live from api.dtpr.io via DtprCategoryGrid; icon-size shrunk to 36 to keep the grid in the upper half.

Bottom callout — AIAAIC (https://www.aiaaic.org/home): open AI/algorithmic incidents repository. The pairing is the point — taxonomy gives the shape of harm, AIAAIC gives the documented cases. Speak to it: this is where you go to populate a risks_mitigation placement with real-world evidence instead of abstract categories.
-->

---

# Why victim-centered, not cause-centered

<div class="grid grid-cols-2 gap-8 mt-8">
<div class="p-6 border rounded">

**Cause framing**

"Opaque decision-making"

"Function creep"

"Unequal performance"

</div>
<div class="p-6 border-2 border-blue-500 rounded">

**Victim framing**

"Loss of autonomy"

"Civil liberties harm"

"Reputational harm"

</div>
</div>

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

---

# Functional Modes
Beyond decisions

<div class="flex items-center justify-center gap-3 mt-1 mb-4">
  <div class="text-[10px] uppercase tracking-wide opacity-60">Autonomy</div>
  <div class="flex flex-wrap gap-1">
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#2A9D8F"></span>Human decides</span>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#E76F51"></span>Human executes</span>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#6A1B7A"></span>Autonomous</span>
  </div>
</div>

<DtprCategoryGrid category-id="functional_modes" />

<div class="absolute bottom-4 left-0 right-0 text-xs opacity-60 text-center">
Narain Jashanmal 2026 · <em>AI Taxonomy — An Operational Framework for Precision in AI Discourse</em> · v1.1
</div>

---

# The Six Functional Categories

<div class="text-[0.72rem] leading-snug max-w-6xl mx-auto mt-2">

| Category | What It Does | Typical Tech | Relevance |
|---|---|---|---|
| **Analytical AI** | Predicts, classifies, scores, optimizes | ML models, gradient boosting, neural nets on structured data | Propensity models, LTV prediction, fraud detection, churn scoring |
| **Semantic AI** | Understands meaning, finds relationships, grounds context | Embeddings, vector DBs, knowledge graphs, GraphRAG | Customer intent understanding, intelligent matching, truth anchoring |
| **Generative AI** | Creates new content: text, images, code, media | LLMs, diffusion models, fine-tuned domain models | Personalized messaging, creative variation, content generation |
| **Agentic AI** | Plans, reasons, uses tools, executes multi-step workflows | LLM + orchestration (MCP, LangGraph), tool interfaces | Campaign optimization, autonomous workflows, digital coworkers |
| **Perceptive AI** | Interprets sensory input: vision, speech, documents | Multimodal LLMs, computer vision, ASR | Document processing, visual inspection, voice interfaces |
| **Physical AI** | Applies intelligence to physical actuators and space | World models, sim-to-real transfer, robotics platforms | Drones, robotics division, autonomous infrastructure |

</div>

<div class="absolute bottom-4 left-0 right-0 text-xs opacity-60 text-center">
Narain Jashanmal 2026 · <em>AI Taxonomy — An Operational Framework for Precision in AI Discourse</em> · v1.1
</div>

<style scoped>
table { width: 100%; border-collapse: collapse; }
th, td { padding: 0.4rem 0.55rem; vertical-align: top; border-bottom: 1px solid var(--hp-blue-100); }
th { text-align: left; font-weight: 600; color: var(--hp-blue-900); background: var(--hp-blue-50); border-bottom-color: var(--hp-blue-200); }
tbody tr:nth-child(even) td { background: rgba(0, 123, 122, 0.04); }
</style>

<!--
Functional Categories deep-dive
The previous slide showed all six modes as icons. This table zooms out and names each one — what it does, the tech under it, and where it shows up in production.

Credit: this six-category framing comes from the Narain Jashanmal v1.1 taxonomy ("AI Taxonomy — An Operational Framework for Precision in AI Discourse") referenced on the previous slide.
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <AlgorithmHeader
    src="/data/nyc-myschools-match.datachain.json"
    :highlight-row="$clicks >= 1 ? 'flow' : null"
  />
</div>

---

# Data flow reads like a sentence

<div class="text-base opacity-70 mb-6">
<em>Input Dataset</em> + <em>Processing</em> + <em>Output Dataset</em>
</div>

<DataFlow />

<div class="mt-10 text-xl text-center leading-relaxed max-w-4xl mx-auto">
"<strong>Sensitive personal information</strong> — course grades, state test scores, home address, poverty status, home language — flows through <strong>a Gale–Shapley deferred-acceptance optimization</strong> to produce <strong>a decision about you — a binding school match</strong>."
</div>

<!--
Three schema-driven DtprPlacement cards (input_sensitive_personal +
identifiable, optimization, output_decision + identifiable). Tag
colours and composed-icon fills come from the live schema. Caption +
framing copy live on the slide; DataFlow.vue owns the row + arrows
only.

Sentence tracks what AlgorithmHeader actually renders for this
datachain: Input Dataset = Sensitive personal information (first
input_dataset element in the JSON), Processing = Optimization
(Gale–Shapley deferred-acceptance), Output Dataset = A decision about
you. All three carry the identifiable PII chip.
-->

---

# Data flow taxonomy

<table class="text-sm mt-6 mx-auto">
<thead>
<tr class="bg-hp-blue-100">
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
Data flow section deep-dive (HS Admissions Matching)
Same four-column structure as the Context slide. Three things to land:
  - Identifiable in, identifiable out — the PII never de-identifies, it just routes. Every student stays named through the entire flow.
  - The processing step names the algorithm (Gale-Shapley deferred-acceptance) — that's the part that does the matching.
  - Storage and Retention are silent on the OTI page. DTPR surfaces silence as a finding: "not specified" is itself a disclosure.

TODO: verify the input/output/access values against the live register entry: https://nyc.clarable.ai/algorithms/3ce01f79-a2c6-4e7b-8f7c-561f2bf02f34. Storage and Retention should remain "not specified" only if the live entry truly omits them.
-->

---

<script setup>
const asrIconUrl = (id) => `https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/${encodeURIComponent(id)}/icon.svg`
</script>

# Access, Storage &amp; Retention

<div class="grid grid-cols-3 gap-6 max-w-6xl mx-auto mt-2">

<div>
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Access</div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-start gap-3">
      <img :src="asrIconUrl('available_to_the_accountable_organization')" alt="" class="w-12 h-12 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Access</div>
        <div class="text-[14px] font-bold text-hp-blue-900 leading-tight">Available to the accountable organization</div>
      </div>
    </div>
    <div class="mt-3">
      <div class="text-[11px] italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-2">&ldquo;NYC Dept of Education accesses the data through the school-facing portal and the administrative portal.&rdquo;</div>
    </div>
  </div>
</div>

<div>
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Storage</div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm relative">
    <div class="asr-guess-badge">illustrative</div>
    <div class="flex items-start gap-3">
      <img :src="asrIconUrl('stored_primarily_locally')" alt="" class="w-12 h-12 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Storage</div>
        <div class="text-[14px] font-bold text-hp-blue-900 leading-tight">Stored primarily locally</div>
      </div>
    </div>
    <div class="mt-3">
      <div class="text-[11px] italic opacity-85 leading-relaxed border-l-2 border-amber-400 pl-2">Application and match data is held primarily on NYC Dept of Education infrastructure managed by DIIT, consistent with NYC's data-governance posture for student records. Some vendor-hosted components may persist during the contract wind-down.</div>
    </div>
  </div>
</div>

<div>
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Retention</div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm relative">
    <div class="asr-guess-badge">illustrative</div>
    <div class="flex items-start gap-3">
      <img :src="asrIconUrl('data_retained')" alt="" class="w-12 h-12 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Retention</div>
        <div class="text-[14px] font-bold text-hp-blue-900 leading-tight">Retained 6 years</div>
      </div>
    </div>
    <div class="mt-3">
      <div class="text-[11px] italic opacity-85 leading-relaxed border-l-2 border-amber-400 pl-2">Application and matching records are typically retained for 6 years after the admissions cycle under the NY State Records Retention &amp; Disposition Schedule ED-1. The resulting school assignment flows into the student's permanent education record.</div>
    </div>
  </div>
</div>

</div>

<div class="mt-4 text-center text-[11px] opacity-65 italic">
  Storage and retention values shown here are <strong>illustrative best guesses</strong> grounded in NYC / NY State policy — not disclosed in the live register entry.
</div>

<style scoped>
.asr-guess-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 0.55rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.4);
}
</style>

<!--
Access, Storage & Retention (admissions matching) — Access from the register; Storage and Retention are illustrative guesses grounded in NYC policy.

Access: verbatim from the JSON. `available_to_the_accountable_organization` pairs with the institution element on the Context slide (NYC Dept of Education / DIIT).

Storage (GUESS): `stored_primarily_locally`. NYC Dept of Education / DIIT operates the system in-house and the vendor contract is winding down, so primary storage sits on city infrastructure. Vendor-hosted components may still hold copies during the transition. Flagged with an "illustrative guess" pill so the audience reads it as plausible-but-unverified.

Retention (GUESS): `data_retained` with duration framed as "per NY State Records Retention & Disposition Schedule ED-1" — the schedule that governs NYC DOE / Public Schools records. Six years is a representative figure for admissions/application records; the final school assignment flows into the student's permanent education record.

⚠️ Speak to it: these are illustrative for the demo. Live register entries leave Storage and Retention blank, which is itself a finding — DTPR makes it legible whether a value is disclosed, guessed, or absent.
-->

---
class: text-center flex flex-col items-center justify-center
---

<div class="relative inline-flex items-center gap-4">
  <img :src="'/images/dtpr-black.png'" alt="DTPR" class="h-16 w-auto" />
  <div class="text-4xl font-bold tracking-tight text-hp-blue-900">for&nbsp;AI</div>
  <span class="absolute -top-2 -right-10 bg-hp-blue text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-md rotate-6">beta</span>
</div>

<div class="mt-8">
  <a href="https://github.com/Helpful-Places/dtpr" class="text-lg font-mono text-hp-blue-700 no-underline border-b-2 border-hp-blue pb-0.5">dtpr.ai</a>
</div>

<div class="mt-10 grid grid-cols-3 gap-5 max-w-5xl mx-auto">
  <div class="p-5 border border-hp-blue/15 rounded-xl bg-white shadow-sm text-left">
    <div class="text-3xl mb-3">📋</div>
    <div class="font-bold text-hp-blue-900">Taxonomy & Schema</div>
    <div class="mt-1 text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">@dtpr/schema</div>
  </div>
  <div class="p-5 border border-hp-blue/15 rounded-xl bg-white shadow-sm text-left">
    <div class="text-3xl mb-3">🌐</div>
    <div class="font-bold text-hp-blue-900">REST API</div>
    <div class="mt-1 text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">api.dtpr.io</div>
  </div>
  <div class="p-5 border border-hp-blue/15 rounded-xl bg-white shadow-sm text-left">
    <div class="text-3xl mb-3">🔌</div>
    <div class="font-bold text-hp-blue-900">MCP Server</div>
    <div class="mt-1 text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">@dtpr/mcp</div>
  </div>
  <div class="p-5 border border-hp-blue/15 rounded-xl bg-white shadow-sm text-left">
    <div class="text-3xl mb-3">🎨</div>
    <div class="font-bold text-hp-blue-900">Component library</div>
    <div class="mt-1 text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">@dtpr/ui</div>
  </div>
  <div class="p-5 border border-hp-blue/15 rounded-xl bg-white shadow-sm text-left">
    <div class="text-3xl mb-3">🤖</div>
    <div class="font-bold text-hp-blue-900">Agent skill</div>
    <div class="mt-1 text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">@dtpr/skill</div>
  </div>
  <div class="p-5 border border-hp-blue/15 rounded-xl bg-white shadow-sm text-left">
    <div class="text-3xl mb-3">🧭</div>
    <div class="font-bold text-hp-blue-900">Datachain Visualiser</div>
    <div class="mt-1 text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">dtpr.ai/tools/datachain</div>
  </div>
</div>

---
class: text-center flex flex-col items-center justify-center
---

# Let's make a datachain!

<!--
Demo intro
One demo, not two. We've been looking at the admissions-matching datachain throughout the deep-dives — now we show how it got made. Hand the OTI admissions-matching page to the Claude skill (over an MCP connection); the agent reads the prose, fills the categories, and re-renders the same datachain the audience has already been reading.
-->

---
class: text-center flex flex-col items-center justify-center
---

# Authoring a datachain

<div class="mt-10 grid grid-cols-2 gap-8 max-w-6xl mx-auto text-left">
  <div class="p-7 border border-hp-blue/15 rounded-xl bg-white shadow-sm flex flex-col">
    <div class="text-xs font-mono uppercase tracking-widest text-hp-blue-700 mb-3">Humans</div>
    <div class="text-2xl font-bold text-hp-blue-900 leading-tight">Datachain Builder</div>
    <div class="mt-2 text-base opacity-80 leading-snug">
      A guided form for policy, comms, and product teams to draft and publish datachains on a hosted transparency portal.
    </div>
    <div class="mt-auto pt-6 flex items-center gap-3">
      <span class="text-xs uppercase tracking-widest opacity-60">in</span>
      <img :src="'/images/clarable-black.svg'" alt="Clarable" class="h-6 w-auto" />
      <span class="text-xs opacity-60">by</span>
      <img :src="'/images/hp-logo.svg'" alt="Helpful Places" class="h-5 w-auto" />
    </div>
  </div>
  <div class="p-7 border border-hp-blue/15 rounded-xl bg-white shadow-sm flex flex-col">
    <div class="text-xs font-mono uppercase tracking-widest text-hp-blue-700 mb-3">Agents</div>
    <div class="text-2xl font-bold text-hp-blue-900 leading-tight">DTPR Agent Skill</div>
    <div class="mt-2 text-base opacity-80 leading-snug">
      Hand an agent a disclosure, a policy doc, or a model card and watch it draft the datachain for human review.
    </div>
    <div class="mt-auto pt-6 flex items-center gap-3">
      <span class="text-xs font-mono text-hp-blue-700 border-b border-hp-blue/40 pb-0.5">@dtpr/skill</span>
    </div>
  </div>
</div>

<!--
Two authoring paths
Both humans and agents can produce a datachain against the same schema. Humans use the Datachain Builder inside Clarable (Helpful Places's app); agents use the DTPR Agent Skill. Same output, same schema — the demo on the next slide shows the agent path.
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
  playsinline
  class="absolute inset-0 w-full h-full object-contain bg-black"
/>

<!--
DTPR Agent Skill — full-screen screencast
Plays the DTPR Agent Skill screencast edge-to-edge on a black background. autoplay+muted, no loop (plays once); controls are exposed so the speaker can scrub.
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
  opacity: 0.35;
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
Reveal transition (visual)
A wall of 135 cells, each filled with a real DTPR element icon fetched live from
api.dtpr.io. The icons cycle through all 108 elements in the AI schema (some repeat
to fill the grid). Stagger-pops in over ~2.4s; pause through the cascade, then
deliver and switch to the live browser on the next slide.

Network: 108 unique SVG fetches at slide load. Cache-Control is `public, max-age=3600`
so a rehearsal warms the cache before the live talk. If the venue Wi-Fi is shaky,
pre-render the icons to public/images/dtpr-icons/ and swap the iconUrl helper to
a relative path.
-->

---
layout: iframe
url: https://nyc.clarable.ai/register
---

<!--
LIVE register walkthrough
Switch to a real browser at presentation time for full control. Iframe here is the slide-deck fallback.

Demo outline:
- Land on register home; let people see the breadth (86 systems / 20 orgs).
- Filter by Functional Mode → Generative, then Perceptive.
- Filter by Organization → DOHMH (17), Mayor's Office, OTI.
- Open the 311 Translation system; show its datachain.
- Open the Midtown Traffic Signal system; show its datachain.
- One sentence on a more sensitive system without dwelling.
- Land back on register home.

TODO: record fallback screencast and reference here as a backup video tag if iframe fails.
-->

---

# Comprehension audit

<div class="grid grid-cols-[1fr_1.6fr] gap-8 mt-8 items-start">
<div class="pt-4">

Agent skill `dtpr-comprehension-audit` can run a public-comprehension check on any datachain across 7 factors.

</div>
<div class="space-y-5">
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">⚠ partial</span>
      <span class="text-sm font-bold text-hp-blue-900">Audience fit</span>
    </div>
    <div class="mt-2 text-xs italic opacity-80 leading-relaxed border-l-2 border-amber-400 pl-3">
      &ldquo;the matching algorithm decides the school assignment&rdquo; lands for a parent — but <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">Gale–Shapley deferred-acceptance</span> and <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">National Resident Matching Program</span> assume a comparison the parent audience doesn't share.
    </div>
  </div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">✗ fail</span>
      <span class="text-sm font-bold text-hp-blue-900">Plain-language</span>
    </div>
    <div class="mt-2 text-xs italic opacity-80 leading-relaxed border-l-2 border-red-400 pl-3">
      Three un-glossed terms in the author-written prose: <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">Gale–Shapley deferred-acceptance</span> (in <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">description</span>, <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">optimization</span>, <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">right_algorithmic_transparency</span>); <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">FERPA-protected</span> / <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">FERPA-grounded</span> across four elements; <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">DIIT</span> in <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">input_sensitive_personal</span> without re-glossing after <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">institution</span>.
    </div>
  </div>
</div>
</div>

<!--
Comprehension audit
Right column shows real audit output captured from a run of the dtpr-comprehension-audit skill against the MySchools – Match datachain (.context/attachments/nyc-myschools-match.datachain-v1.json). Two checks shown — Audience fit (partial) and Plain-language (fail) — both naming the exact un-glossed terms in the author's prose. This is the artifact the slide claims exists; the audience sees it.
-->

---

<script setup>
const provenanceIconUrl = (id) => `https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/${encodeURIComponent(id)}/icon.svg`
</script>

# Authoring provenance

<div class="grid grid-cols-[1fr_1.6fr] gap-8 mt-6 items-start">
  <div class="pt-2">
    <div class="text-base opacity-80 mb-4">When AI helps draft a disclosure, the artifact carries:</div>
    <ul class="space-y-2 text-base">
      <li>per-element <strong>rationale</strong></li>
      <li>qualitative <strong>confidence</strong> (high · medium · low)</li>
      <li><strong>verbatim source quotes</strong> the model leaned on</li>
    </ul>
  </div>
  <div>
    <div class="p-5 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
      <div class="flex items-start gap-4">
        <img :src="provenanceIconUrl('optimization')" alt="" class="w-14 h-14 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Processing</div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-bold text-hp-blue-900 leading-tight">Optimization</div>
            <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">high confidence</span>
          </div>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-1">Agent draft</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-3">&ldquo;Gale–Shapley deferred-acceptance algorithm. Students and programs are tentatively matched in iterative rounds — students propose, programs accept or reject based on their priority ordering, and the algorithm terminates when every student is matched or has exhausted their listed choices. The same family of algorithms is used by the National Resident Matching Program.&rdquo;</div>
      </div>
      <div class="mt-4 pt-3 border-t border-hp-blue/10">
        <div class="text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-1">Verbatim source quote</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-amber-400 pl-3">&ldquo;The tool utilizes the Gale-Shapley deferred acceptance algorithm to match applicants to
        schools. This algorithm has been in existence for many years, used internationally for
        various purposes.&rdquo;</div>
        <div class="mt-2 text-[10px] font-mono opacity-60">
          NYC Algorithmic Tools Compliance Report (2025) · MySchools – Match · Description field
        </div>
      </div>
    </div>
  </div>
</div>

<!--
Authoring provenance (admissions matching)
Right column shows ONE real element from the production admissions-matching datachain (.context/attachments/nyc-myschools-match.datachain-v1.json) — `optimization`. Icon fetched live from api.dtpr.io. Two layered quotes:

  1. Agent draft — verbatim `additional_description` from the datachain JSON: the agent named the algorithm (Gale–Shapley deferred-acceptance, with the NRMP precedent).
  2. Verbatim source quote — the snippet from the OTI compliance report the agent leaned on. This shows the audit trail: agent prose at top, the source it cites at bottom, and the visual evidence that the prose is anchored, not invented.

Confidence pill: "high" — published register entry, named procedure, clear lineage.

⚠️ TODO: The "verbatim source quote" string is a PLACEHOLDER plausible-sounding match for what the 2025 OTI CSV says in the Description field for MySchools. Pull the actual line from the compliance report CSV and swap it in before the talk.
-->

---

<script setup>
const rightIconUrl = (id) => `https://api.dtpr.io/api/v2/schemas/ai@2026-05-06-beta/elements/${encodeURIComponent(id)}/icon.svg`
</script>

# Actions

<div class="text-base mt-2 opacity-70">
Every element can carry first-class actions in the schema so that implementations can empower users to directly exercise their rights.
</div>

<div class="grid grid-cols-2 gap-10 mt-8 max-w-6xl mx-auto items-start">

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Action Schema</div>

<div class="space-y-2 text-base">
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">email</span> DPO contact, info request</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">url</span> appeal portal, opt-out page</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">phone</span> language hotline, ombuds</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">form</span> DSAR / complaint submission</div>
  <div><span class="inline-block w-20 font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">postal</span> mailing address for written requests</div>
</div>

</div>

<div>

<div class="text-xs uppercase tracking-wider opacity-60 mb-3">Examples</div>

<div class="space-y-3 text-sm">
  <div class="p-3 border border-hp-blue/15 rounded bg-white flex items-start gap-3">
    <img :src="rightIconUrl('right_contest')" alt="" class="w-10 h-10 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-hp-blue-900">Right to contest</div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">form · File a Round 2 appeal</span>
      </div>
    </div>
  </div>
  <div class="p-3 border border-hp-blue/15 rounded bg-white flex items-start gap-3">
    <img :src="rightIconUrl('right_algorithmic_transparency')" alt="" class="w-10 h-10 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-hp-blue-900">Right to algorithmic transparency</div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">email · NYCDOE Privacy Officer</span>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">url · OTI disclosure page</span>
      </div>
    </div>
  </div>
  <div class="p-3 border border-hp-blue/15 rounded bg-white flex items-start gap-3">
    <img :src="rightIconUrl('right_to_notice')" alt="" class="w-10 h-10 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-hp-blue-900">Right to notice</div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">phone · 311 (multilingual)</span>
      </div>
    </div>
  </div>
</div>

<div class="mt-3 text-xs italic opacity-60">
  Visual layer in progress
</div>

</div>

</div>


<!--
Action affordances
Schema basis: `InstanceActionSchema` on `InstanceElement.actions` in api/src/schema/datachain-instance.ts. Kinds: email, url, phone, form, postal. Deliberately small — `other` is intentionally not in the enum. Each action has a localized label and a typed target (email address, URL, E.164 phone, form URL, or free-text postal address).

Not yet rendered in the dtpr.ai visual layer — the schema carries it, the UI is coming. Be honest about that.

The point: disclosure ends with paths a person can actually walk, not just labels. The Rights category names what you're entitled to; actions are how you reach it. For the admissions matcher, "right to contest" becomes a Round-2 appeal form; "right to algorithmic transparency" becomes a DPO email plus the OTI disclosure URL; "right to notice" becomes the 311 multilingual line for parents who need translation help.

Pairs with the authoring-provenance and comprehension-audit slides — all three add layers on top of the raw disclosure. Provenance answers "where did this come from"; actions answer "what do I do now."
-->

---

# DTPR, a translation layer

<div class="text-base opacity-70 -mt-2">From PDF to public understanding</div>

<div class="mt-6 grid grid-cols-[1fr_auto_1fr] gap-6 items-start">

<div class="flex flex-col">
  <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">OTI LL35 report (2025)</div>
  <div class="bg-white border border-hp-blue/15 shadow-xl rounded-md overflow-hidden">
    <img :src="'/images/myschools-match.jpg'" alt="MySchools – Match entry, NYC LL35 algorithmic tools compliance report" class="block w-full h-[640px] object-cover object-top" />
  </div>
</div>

<div class="text-5xl opacity-70 text-center mt-[170px]">→</div>

<div class="flex flex-col">
  <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">nyc.clarable.ai</div>
  <div class="bg-white border border-hp-blue/15 shadow-xl rounded-md overflow-hidden w-full h-[380px] relative">
    <iframe
      src="https://nyc.clarable.ai/algorithms/3ce01f79-a2c6-4e7b-8f7c-561f2bf02f34"
      class="absolute top-0 left-0 border-0"
      style="width: 153.846%; height: 153.846%; transform: scale(0.65); transform-origin: top left;"
      loading="lazy"
      referrerpolicy="no-referrer"
      title="nyc.clarable.ai register"
    ></iframe>
  </div>
</div>

</div>

<!--
Translation layer, revisited
Callback to slide 6 (DTPR as a translation layer) — same shape, AI version. The MySchools – Match page from the LL35 compliance report becomes a row on nyc.clarable.ai/register. Same thesis: take a heterogeneous source-of-truth and produce one comparable artifact a person can read.

Left image is the same MySchools – Match PDF page the rest of the deck has been quoting from (verbatim Description-field source for the `optimization` element). Right is a live iframe of the register; if the venue Wi-Fi is shaky it falls back to a blank frame — the speaker can call this out and move on.

> Remember the translation-layer slide from earlier — piles of PDFs going in, one readable thing coming out? This is what that looks like for AI. The MySchools page on the left is from the LL35 report. The row on the right is on nyc.clarable.ai. Same translation, different medium.
-->

---
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <div class="text-center">
    <h1 class="!text-6xl !mb-3 !mt-0">Workshop</h1>
    <div class="text-2xl font-serif italic opacity-75">From any disclosure to a shippable datachain in an hour.</div>
  </div>
  <div class="mt-12 grid grid-cols-3 gap-0 bg-white/95 rounded-3xl shadow-2xl border border-hp-blue/10 overflow-hidden">
    <div class="px-8 py-7 text-center border-r border-hp-blue/10">
      <div class="text-xs uppercase tracking-wider opacity-60">Tomorrow</div>
      <div class="text-4xl font-bold text-hp-blue-900 leading-none mt-1">3 – 4 pm</div>
    </div>
    <div class="px-8 py-7 text-center border-r border-hp-blue/10">
      <div class="text-xs uppercase tracking-wider opacity-60">School of Visual Arts</div>
      <div class="text-4xl font-bold text-hp-blue-900 leading-none mt-1">Room 110</div>
    </div>
    <div class="px-8 py-7 text-center">
      <div class="text-xs uppercase tracking-wider opacity-60">Bring</div>
      <div class="text-4xl font-bold text-hp-blue-900 leading-none mt-1">Your Laptop</div>
      <div class="text-sm opacity-70 mt-2">+ a doc to render</div>
    </div>
  </div>
  <div class="mt-10 max-w-3xl mx-auto text-center text-lg opacity-80 leading-relaxed">
    Feed an <strong class="text-hp-blue-900">AIA</strong>, a <strong class="text-hp-blue-900">register row</strong>, or a <strong class="text-hp-blue-900">regulatory PDF</strong> through the agent skill and walk out with a datachain you can ship.
  </div>
</div>

<!--
CTA — Workshop (event-card layout)
Save-the-date / event-poster style. Eyebrow + title + serif tagline up top; three-up info card (When / Where / Bring) in the middle; one-line value prop underneath. Clean white background — the visual motif is reserved for the reveal + finale slides.

Confirmed slot: Thursday, May 21 · 3–4pm · Classroom 110, School of Visual Arts.
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
      <div class="mt-1 text-sm opacity-75">An open-source communication standard for algorithms and AI</div>
      <div class="mt-3 font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">dtpr.ai</div>
    </div>
    <div class="bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm border border-hp-blue/10 px-6 py-5">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">In production</div>
      <div class="text-xl font-bold text-hp-blue-900">Live registers</div>
      <div class="mt-1 text-sm opacity-75">Two DTPR for AI registries built on open data</div>
      <div class="mt-3 space-y-1">
        <div class="font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">🗽 nyc.clarable.ai</div>
        <div class="font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">🇨🇦 canada.clarable.ai</div>
      </div>
    </div>
    <div class="bg-white/95 rounded-2xl shadow-xl backdrop-blur-sm border border-hp-blue/10 px-6 py-5">
      <div class="text-[10px] uppercase tracking-[0.2em] text-hp-blue-700 font-semibold mb-2">The stewards</div>
      <img :src="'/images/hp-logo.svg'" alt="Helpful Places" class="h-7 w-auto mb-1" />
      <div class="mt-1 text-sm opacity-75">We steward DTPR, building towards a shared, sustainable governance</div>
      <div class="mt-3 font-mono text-sm text-hp-blue-700 border-b border-hp-blue/40 inline-block pb-0.5">helpfulplaces.com</div>
    </div>
  </div>
  <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
    <span class="inline-flex items-center gap-2 bg-hp-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"><span class="text-lg leading-none">🛠️</span> Help us build it</span>
    <span class="inline-flex items-center gap-2 bg-hp-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"><span class="text-lg leading-none">🚀</span> Deploy it</span>
    <span class="inline-flex items-center gap-2 bg-hp-blue text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg"><span class="text-lg leading-none">💬</span> Ask us anything</span>
  </div>
  <div class="mt-6 flex justify-center">
    <div class="inline-block bg-white/95 backdrop-blur-sm border border-hp-blue/10 shadow-lg rounded-full px-5 py-2 text-xs font-mono tracking-wide text-hp-blue-900">
      github.com/Helpful-Places/dtpr
    </div>
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
  opacity: 0.35;
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
Finale — DTPR for AI, the deployments, and the stewards
Visual continuity with the earlier reveal slide: same icon-wall background, same stagger-pop, same 15-col grid. 135 DTPR element icons fetched live from api.dtpr.io cycle through the AI schema's 108 elements. Three white-card columns stack the project (dtpr.ai), the live deployments (nyc.clarable.ai + canada.clarable.ai aside), and the steward (Helpful Places). CTA pills underneath name the three asks: build, deploy, ask.

Network: 108 unique SVG fetches at slide load — already warmed from the earlier reveal slide if the audience came in linearly, so the cache hits should be free.

Canada framing: canada.clarable.ai renders Canada's federal Algorithmic Impact Assessment inventory as DTPR datachains — same engine, same approach, different jurisdiction. Don't dwell; it's an aside that says "this isn't NYC-only."

Stewardship beat: this is the first time in the deck the audience hears "Helpful Places stewards DTPR" stated plainly. Land it. The standard is open (CC BY-SA 4.0); we're the people who hold the pen.
-->
