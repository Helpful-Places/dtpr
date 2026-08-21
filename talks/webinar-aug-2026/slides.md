---
theme: seriph
title: DTPR for AI — A Translation Layer for the Algorithms in Our Cities
info: |
  ## DTPR for AI
  An Open-Source Communication Standard for algorithms and AI

  Webinar · August 2026
  Jonathan Pichot · Helpful Places
author: Jonathan Pichot
# Slidev defaults the FIRST slide to `layout: cover`, and seriph's cover layout
# paints a grey gradient over a remote Unsplash background — wrong palette, and a
# network dependency on the opening slide. Pin the default layout so the cover
# sits on cream like every other slide.
layout: default
class: text-center flex flex-col items-center justify-center relative overflow-hidden
transition: slide-left
mdc: true
# The deck is designed light-on-cream. Without this, Slidev follows the OS
# color scheme and adds `html.dark` — which flips body text to white while
# style.css keeps the cream background, giving white-on-cream.
colorSchema: light
fonts:
  sans: 'Helvetica Neue'
  serif: 'Sorts Mill Goudy'
  mono: 'JetBrains Mono'
  weights: '400,600,700'
  local: 'Helvetica Neue'
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

# DTPR as a translation layer

<div class="tl mt-5 grid grid-cols-[360px_auto_1fr] gap-6 items-start">

<div>
  <div class="tl__cap">Source of truth</div>
  <div class="tl__sub"><em>scattered across agencies and vendors</em></div>

  <div class="tl__stage">
    <article class="doc doc--a">
      <div class="doc__title">Privacy Impact Assessment</div>
      <div class="doc__rule"></div>
      <div class="doc__line" style="width: 96%"></div>
      <div class="doc__line" style="width: 88%"></div>
      <div class="doc__line" style="width: 93%"></div>
      <div class="doc__line" style="width: 61%"></div>
    </article>
    <article class="doc doc--b">
      <div class="doc__title">Vendor specification</div>
      <div class="doc__rule"></div>
      <div class="doc__cols">
        <div>
          <div class="doc__line" style="width: 82%"></div>
          <div class="doc__line" style="width: 94%"></div>
          <div class="doc__line" style="width: 70%"></div>
        </div>
        <div class="doc__plate"></div>
      </div>
    </article>
    <article class="doc doc--c">
      <div class="doc__title">Data-sharing agreement</div>
      <div class="doc__rule"></div>
      <div class="doc__line" style="width: 91%"></div>
      <div class="doc__line" style="width: 76%"></div>
      <div class="doc__line" style="width: 97%"></div>
      <div class="doc__line" style="width: 84%"></div>
      <div class="doc__line" style="width: 44%"></div>
    </article>
    <article class="doc doc--d">
      <div class="doc__title">Procurement record</div>
      <div class="doc__rule"></div>
      <div class="doc__line" style="width: 68%"></div>
      <div class="doc__line" style="width: 89%"></div>
      <div class="doc__line" style="width: 79%"></div>
    </article>
  </div>
</div>

<div class="tl__arrow">→</div>

<div>
  <div class="tl__cap">DTPR datachain</div>
  <div class="tl__sub"><em>tells the story of data collection</em></div>

  <div class="tl__stage tl__stage--rec">
    <div class="rec">
      <div class="rec__head">
        <div class="rec__name">Automated License Plate Reader</div>
        <div class="rec__org">Long Beach Police Department</div>
      </div>
      <div class="rec__row"><span class="rec__k">Purpose</span><span class="rec__v">Safety &amp; Security</span></div>
      <div class="rec__row"><span class="rec__k">Technology</span><span class="rec__v">Identifiable Image</span></div>
      <div class="rec__row"><span class="rec__k">Data</span><span class="rec__v">Pixel-based Image</span></div>
      <div class="rec__row"><span class="rec__k">Processing</span><span class="rec__v">Encrypted at Rest</span></div>
      <div class="rec__row"><span class="rec__k">Access</span><span class="rec__v">Available to the accountable organization</span></div>
      <div class="rec__row"><span class="rec__k">Storage</span><span class="rec__v">Stored on 3rd Party Cloud</span></div>
      <div class="rec__foot">long-beach.dtpr.guide</div>
    </div>
  </div>
</div>

</div>

<style scoped>
.tl__cap {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--hp-blue-700);
}
.tl__sub {
  font-size: 0.82rem;
  color: rgba(0, 21, 20, 0.6);
  margin-top: 0.1rem;
}
.tl__stage {
  position: relative;
  height: 296px;
  margin-top: 0.7rem;
}
.tl__stage--rec {
  display: flex;
  align-items: center;
}
.tl__arrow {
  font-size: 2.5rem;
  line-height: 1;
  color: #001514;
  opacity: 0.35;
  margin-top: 172px;
}
.tl__foot {
  margin-top: 0.55rem;
  font-size: 0.6rem;
  color: #72726c;
}

/* Left: the pile. Four source documents, no two alike, none of them
   legible from the back of the room — which is the argument. */
.doc {
  position: absolute;
  width: 232px;
  background: #fff;
  border: 1px solid rgba(0, 21, 20, 0.1);
  box-shadow: 0 16px 30px -18px rgba(0, 21, 20, 0.45);
  padding: 0.5rem 0.6rem 0.6rem;
}
.doc__title {
  font-size: 0.58rem;
  font-weight: 700;
  color: #001514;
}
.doc__rule {
  height: 1.2px;
  background: #001514;
  opacity: 0.75;
  margin: 0.3rem 0 0.42rem;
}
.doc__line {
  height: 5px;
  border-radius: 2.5px;
  background: #e6e5e0;
  margin-bottom: 0.26rem;
}
.doc__cols {
  display: grid;
  grid-template-columns: 1fr 44px;
  gap: 0.4rem;
}
.doc__plate {
  border: 1px solid #e6e5e0;
  border-radius: 2px;
  height: 100%;
}
/* Cascade, not a heap — each card's title has to stay legible from the
   back of the room, so every step down clears the one above it. */
.doc--a { left: 0; top: 0; transform: rotate(-6deg); z-index: 1; }
.doc--b { left: 62px; top: 58px; transform: rotate(5deg); z-index: 2; }
.doc--c { left: 16px; top: 118px; transform: rotate(-3deg); z-index: 3; }
.doc--d { left: 74px; top: 178px; transform: rotate(4deg); z-index: 4; }

/* Right: one record, the same shape every time. */
.rec {
  width: 100%;
  background: #fff;
  border: 1px solid rgba(0, 21, 20, 0.1);
  border-left: 3px solid var(--hp-blue-500);
  box-shadow: 0 18px 34px -20px rgba(0, 21, 20, 0.45);
  padding: 0.7rem 0.9rem 0.6rem;
}
.rec__head {
  border-bottom: 1.5px solid #001514;
  padding-bottom: 0.42rem;
}
.rec__name {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--hp-blue-900);
  letter-spacing: -0.01em;
}
.rec__org {
  font-size: 0.6rem;
  color: #72726c;
  margin-top: 0.1rem;
}
.rec__row {
  display: grid;
  grid-template-columns: 6.2rem 1fr;
  gap: 0.5rem;
  align-items: baseline;
  padding: 0.32rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.07);
}
.rec__k {
  font-size: 0.55rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #72726c;
}
.rec__v {
  font-size: 0.72rem;
  font-weight: 600;
  color: #001514;
}
.rec__foot {
  margin-top: 0.45rem;
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.52rem;
  color: #72726c;
  text-align: right;
}
</style>

<!--
It was always a translation layer
"Take heterogeneous inputs from any city or vendor. Produce one comparable nugget a person can read."
This is the THESIS slide. Set up the reframe that DTPR for AI extends the same translation function.

The argument is the asymmetry, not the words: four documents, no two alike, none readable — versus one card whose shape never changes. Don't read the pile out loud; let it look like what it is.

The record on the right is the SAME device the audience just watched load in the iframe on the previous slide — Long Beach's Automated License Plate Reader (long-beach.dtpr.guide/devices/1050ec6b-…). Every value is verbatim from that live page: accountable = Long Beach Police Department, purpose = Safety & Security, technology = Identifiable Image, data = Pixel-based Image, processing = Encrypted at Rest, access = Available to the accountable organization, storage = Stored on 3rd Party Cloud. So this slide isn't an illustration — it's the previous slide, redrawn as structure. Nothing here is fetched at render time, so it survives bad venue Wi-Fi even if the slide-6 iframe didn't.

The four document titles on the left are illustrative artifact types a city actually holds (PIA, vendor spec, data-sharing agreement, procurement record) — not specific Long Beach filings. Don't attribute them to LBPD if asked.

> Everything a city knows about that camera already exists — in a privacy impact assessment, a vendor spec, a data-sharing agreement, a procurement record. Four documents, four formats, all written for compliance. [beat] DTPR is the translation layer. Same facts, one record, same seven questions — and the next city's camera answers them in the same order. That's what makes it comparable. Hold onto that shape; we're about to point it at AI.
-->

---
clicks: 1
---

# What should we know about AI systems?

<div class="text-base mt-2 opacity-70">Regulation and public-sector policy are converging on similar disclosure requirements.</div>

<div class="floor mt-7 mx-auto" :class="{ 'floor--dots': $clicks >= 1 }">
  <div class="floor__row floor__row--head">
    <span></span>
    <span></span>
    <span class="floor__fw">EU AI Act</span>
    <span class="floor__fw">Canada AIA</span>
    <span class="floor__fw">NYC LL35</span>
    <span class="floor__fw">GDPR</span>
    <span class="floor__fw">UK ATRS</span>
  </div>
  <div class="floor__row">
    <span class="floor__no">01</span>
    <span class="floor__q"><b>What is it for</b><span class="floor__gloss"> — purpose</span></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
  </div>
  <div class="floor__row">
    <span class="floor__no">02</span>
    <span class="floor__q"><b>Who runs it, who built it</b><span class="floor__gloss"> — deployer &amp; vendor</span></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
  </div>
  <div class="floor__row">
    <span class="floor__no">03</span>
    <span class="floor__q"><b>What does it do</b><span class="floor__gloss"> — function, and how much it decides alone</span></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
  </div>
  <div class="floor__row">
    <span class="floor__no">04</span>
    <span class="floor__q"><b>What does it use</b><span class="floor__gloss"> — data in, algorithm, data out</span></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
  </div>
  <div class="floor__row">
    <span class="floor__no">05</span>
    <span class="floor__q"><b>Who is it used on</b><span class="floor__gloss"> — subjects, bystanders, communities</span></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><span class="floor__none">–</span></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
  </div>
  <div class="floor__row">
    <span class="floor__no">06</span>
    <span class="floor__q"><b>What could go wrong</b><span class="floor__gloss"> — risks &amp; mitigation</span></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><span class="floor__none">–</span></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
  </div>
  <div class="floor__row">
    <span class="floor__no">07</span>
    <span class="floor__q"><b>What can you do</b><span class="floor__gloss"> — contest, opt out, reach a person</span></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><span class="floor__none">–</span></span>
    <span class="floor__cell"><i class="dot dot--full"></i></span>
    <span class="floor__cell"><i class="dot dot--half"></i></span>
  </div>
  <div class="floor__legend">
    <span><i class="dot dot--full"></i> required</span>
    <span><i class="dot dot--half"></i> partial</span>
    <span><span class="floor__none">–</span> absent</span>
  </div>
</div>

<style scoped>
.floor {
  max-width: 860px;
  width: 100%;
  text-align: left;
}
.floor__row {
  display: grid;
  grid-template-columns: 2.1rem 1fr repeat(5, 4.7rem);
  align-items: center;
  padding: 0.42rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.floor__row--head {
  border-bottom: 1.5px solid #001514;
  padding-bottom: 0.3rem;
}
.floor__fw {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #72726c;
  text-align: center;
}
.floor__no {
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.6rem;
  color: #72726c;
}
.floor__q {
  font-size: 0.92rem;
  line-height: 1.3;
  padding-right: 1rem;
}
.floor__gloss {
  color: rgba(0, 21, 20, 0.55);
}
.floor__cell {
  display: flex;
  justify-content: center;
}
.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  vertical-align: middle;
}
.dot--full {
  background: #001514;
}
.dot--half {
  border: 1.5px solid #001514;
  background: linear-gradient(90deg, #001514 0 50%, transparent 50%);
}
.floor__none {
  color: rgba(0, 21, 20, 0.3);
  font-size: 0.8rem;
  line-height: 1;
}
.floor__legend {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-top: 0.55rem;
  font-size: 0.62rem;
  color: #72726c;
}
.floor__legend .dot {
  width: 9px;
  height: 9px;
  margin-right: 0.25rem;
}
.floor__legend-note {
  margin-left: auto;
  font-size: 0.58rem;
}
/* Two-beat build: the seven questions land first; the click fades in the
   framework columns + legend. Layout is reserved either way, so nothing
   shifts — and print/export renders the final state. */
.floor__fw,
.floor__cell,
.floor__legend {
  transition: opacity 0.4s ease;
}
.floor:not(.floor--dots) .floor__fw,
.floor:not(.floor--dots) .floor__cell,
.floor:not(.floor--dots) .floor__legend {
  opacity: 0;
}
</style>

<!--
Seven questions × five frameworks — the convergence matrix.

The slide lands as the seven questions alone; [click] fades in the five framework columns. Let the questions register as reasonable before showing that the law agrees.

Five named laws/policies, one dot per cell — the convergence claim is shown, not asserted. The visual argument is in the gaps as much as the dots — each framework covers a subset; the union is the disclosure floor. DTPR's category structure earns its shape from that union, it doesn't invent it. Rows run in canvas-seat order, and rows 05 ("Used on") and 07 ("What can you do") name the seats the audience meets on the canvas later.

SCHEMA NOTE for Q&A: this deck pins ai@2026-05-06-beta, which answers row 05 inside element descriptions rather than with a dedicated category. The next schema iteration (already live on api.dtpr.io as ai@2026-08-12-beta) adds a required "People affected" category — subject / bystander / community — which is exactly the "used on" seat the closing canvas previews. If asked why the register header shows no such row: active beta, next iteration — same framing as the cover.

GRADING CRITERION (say it if asked): a full dot means the framework requires this to be disclosed to the affected person or the public. Documentation that stays internal or goes only to a regulator scores a half. A dash means the framework doesn't address it. Verified against sources Aug 2026; still summaries, not legal advice.

- EU AI Act (Reg. 2024/1689): 01-02 full — the Art 71 EU database is public and carries intended purpose + provider (Annex VIII); 03 full — Art 50 interaction disclosure, Art 26(11) deployers must inform persons subject to high-risk decisions; 04 HALF — data governance (Art 10) and technical docs (Annex IV) are provider/authority-facing, instructions for use go to deployers, not the public (the GPAI training-content summary, Art 53(1)(d), is public but GPAI-only); 05 HALF — the FRIA (Art 27) enumerates affected categories but is notified to the market-surveillance authority, not published; 06 HALF — risk management (Art 9) is internal, known risks reach deployers via instructions (Art 13); 07 full — Art 86 right to explanation of the AI's role in the decision + Art 85 complaint right.
- Canada Directive on ADM + AIA: 01/04/05 full — the completed AIA (purpose, data sources, impact on clients, impact level) is published on open.canada.ca; 02 full — the publishing department is the accountable deployer (vendor name only appears when the AIA names procured software — say so if asked); 03 full — §6.2.1 requires notice that a decision is made "in whole or in part" by an automated system (the autonomy disclosure), §6.2.2 a meaningful explanation of how and why; 06 full — impact level + mitigation/quality-assurance measures in the published AIA, peer review published at impact level 2+; 07 full — §6.4 requires providing clients recourse options that are timely, effective, easy to access.
- NYC LL35 §3-119.5(c): name+description, purpose, data type+source, output use, vendor → 01/02/04 full; output use only gestures at autonomy (half on 03); nothing on affected people, risks, or rights — the dashes. Don't slag LL35; the celebratory opener carries the goodwill.
- GDPR: 01-02 full — purposes + controller identity (Arts 13-14); 03 full — Art 22 solely-automated trigger + meaningful information about the logic, significance and consequences (13(2)(f)/15(1)(h)); 04 full — categories of personal data disclosed to the data subject (14(1)(d), 15); 05 HALF — data subjects are inherent, bystander/community framing absent; 06 HALF — DPIA (Art 35) exists but is internal, "envisaged consequences" only gestures; 07 full — Art 22(3) right to human intervention, to express a view, and to contest.
- UK ATRS (mandatory for central government; records published at gov.uk/algorithmic-transparency-records): Tier 2 sections are owner & responsibility (incl. supplier/procurement) → 02 full; description & rationale → 01 full; wider decision-making process & human oversight → 03 full; technical specification & data → 04 full; risks, mitigations & impact assessments → 06 full; 05 HALF — affected groups surface via impact assessments, no dedicated field; 07 HALF — the decision-process section can describe existing review/appeal routes, but ATRS records recourse, it doesn't require offering it (unlike DADM §6.4 or GDPR 22(3)). Verify the live template before leaning on 07.
-->

---
class: flex items-center justify-center !p-5
---

<div class="w-full flex items-center justify-center gap-5">

<div class="bg-white border border-hp-blue/15 shadow-xl rounded-md overflow-hidden shrink-0 w-[409px] h-[508px]">
  <img :src="'/images/cbsa-tci-aia.png'" alt="Traveller Compliance Indicator — Algorithmic Impact Assessment results, Canada Border Services Agency" class="block w-full h-full object-cover object-top" />
</div>

<div class="text-4xl leading-none opacity-40 shrink-0">→</div>

<div class="bg-white border border-hp-blue/15 shadow-xl rounded-md overflow-hidden relative flex-1 h-[508px]">
  <iframe
    src="https://canada.clarable.ai/algorithms/eff58688-1bea-4d42-90c7-b4053a131122"
    class="absolute top-0 left-0 border-0"
    style="width: 153.846%; height: 153.846%; transform: scale(0.65); transform-origin: top left;"
    loading="lazy"
    referrerpolicy="no-referrer"
    title="canada.clarable.ai register"
  ></iframe>
</div>

</div>

<!--
Translation layer, revisited
Callback to the earlier translation-layer slide — same shape, AI version. CBSA's published Algorithmic Impact Assessment for the Traveller Compliance Indicator becomes a row on canada.clarable.ai. Same thesis: take a heterogeneous source-of-truth and produce one comparable artifact a person can read.

Deliberately wordless — no title, no subtitle, no panel labels. The two artifacts and the arrow between them are the whole slide, so the speaker names them out loud instead. If you need the labels back, they were "CBSA AIA — Traveller Compliance Indicator" (left) and "canada.clarable.ai" (right).

Left is page 1 of the AIA Results published under the Directive on Automated Decision-Making (the PDF is vendored at talks/webinar-aug-2026/sources/). Worth knowing cold for Q&A: TCI is a decision-tree compliance predictor for border officers — impact level 2 (score 45, mitigation 32), trained on de-identified passage history, surfaces an indicator to the officer, officers retain discretion, initial deployment at ferry and land crossings starting 2026. Right is the live register row built by importing exactly these AIAs; it loads over the presenting machine's connection — pre-load the deck before going live, and if it comes up blank on the share, call it out and move on.

> Remember the translation-layer slide from earlier — piles of PDFs going in, one readable thing coming out? This is what that looks like for AI. The document on the left is CBSA's published impact assessment. The row on the right is the same system on canada.clarable.ai. Same translation, different medium.

NOTE: the TCI is the deck's running example from here on — the AlgorithmHeader datachain (public/data/cbsa-tci.datachain.json, validated against ai@2026-05-06-beta), ContextFlow/DataFlow, risks & rights, ASR, Actions, comprehension-audit, and provenance slides all draw on this AIA. The one deliberate exception is the DecisionLetter in the closing section, which stays a school-placement letter (border indicators don't mail decisions).
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <AlgorithmHeader
    src="/data/cbsa-tci.datachain.json"
    :highlight-row="$clicks >= 1 ? 'context' : null"
  />
</div>

<!--
The running example gets its register header. This is AlgorithmHeader rendering the TCI datachain — the same component the register uses; everything on screen is driven by the record, not authored for the slide. Name the system out loud: CBSA's Traveller Compliance Indicator, the one whose AIA you just saw become a register row.

[click] highlights the CONTEXT row — accountable · functional modes · purpose. That row is the next slide, read out as a sentence.
-->

---

# Context flow reads as a sentence

<div class="text-base opacity-70 mb-6">
<em>Accountable</em> + <em>Functional Modes</em> + <em>Purpose</em>
</div>

<ContextFlow />

<div class="mt-10 text-xl text-center leading-relaxed max-w-4xl mx-auto">
"<strong>Canada Border Services Agency</strong> has deployed AI to <strong>recommend</strong> which travellers are likely to meet border rules for the purpose of <strong>border &amp; immigration processing</strong>."
</div>

<!--
Three schema-driven DtprPlacement cards (institution + deployer,
analytical_mode + human_decides, border_immigration). Context tag
labels + composed-icon colours flow from the live schema. Sentence +
framing copy live on the slide; ContextFlow.vue owns the row + arrows
only.

Sentence tracks what AlgorithmHeader actually renders for this
datachain: Accountable = Canada Border Services Agency, Functional
Mode = Analytical with the human_decides autonomy chip (verb:
recommends — the AIA is explicit that officers make every final call),
Purpose = Border & Immigration (first purpose element in the JSON).
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <AlgorithmHeader
    src="/data/cbsa-tci.datachain.json"
    :highlight-category-id="$clicks >= 1 ? 'functional_modes' : null"
  />
</div>

<!--
Back to the header — second callback. [click] highlights one cell of the context row: Functional Modes, with its autonomy chip (Analytical · human decides). The next slide opens the full mode vocabulary that chip comes from.
-->

---

# Functional Modes

<div class="flex items-center justify-center gap-3 mt-1 mb-4">
  <div class="text-[10px] uppercase tracking-wide opacity-60">Autonomy</div>
  <div class="flex flex-wrap gap-1">
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#2A9D8F"></span>Human decides</span>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#6A1B7A"></span>Human executes</span>
    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs"><span class="w-2 h-2 rounded-full" style="background:#E76F51"></span>Autonomous</span>
  </div>
</div>

<DtprCategoryGrid category-id="functional_modes" />

<div class="absolute bottom-4 left-0 right-0 text-xs opacity-60 text-center">
Narain Jashanmal 2026 · <em>AI Taxonomy — An Operational Framework for Precision in AI Discourse</em> · v1.1
</div>

<!--
Functional Modes — the verb vocabulary
The six modes render live from the schema (analytical, generative, perceptive, semantic, agentic, physical). The autonomy legend on top is the second axis: every mode placement carries one of three chips — human decides (teal), human executes (purple), autonomous (orange). Chip colours match the schema and the grid below.

Callback: the TCI is analytical + human decides — the officer makes every call. Credit the mode vocabulary to Narain Jashanmal's AI Taxonomy (v1.1, 2026), cited on the slide.
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<div class="w-full max-w-5xl mx-auto">
  <AlgorithmHeader
    src="/data/cbsa-tci.datachain.json"
    :highlight-row="$clicks >= 1 ? 'flow' : null"
  />
</div>

<!--
Header again — third and last callback. [click] highlights the FLOW row: input → algorithm → output. Same move as context: the row reads as a sentence on the next slide. Both endpoints carry gold identifiable chips — matching the register row the audience saw earlier.
-->

---

# Data flow reads like a sentence

<div class="text-base opacity-70 mb-6">
<em>Input Dataset</em> + <em>Processing</em> + <em>Output Dataset</em>
</div>

<DataFlow />

<div class="mt-10 text-xl text-center leading-relaxed max-w-4xl mx-auto">
"<strong>Sensitive personal information</strong> — your travel documents, licence plate, and history of past crossings — flows through <strong>a decision-tree compliance classifier</strong> to produce <strong>a recommendation about you — an indicator the officer weighs</strong>."
</div>

<!--
Three schema-driven DtprPlacement cards (input_sensitive_personal +
identifiable, classification_prediction, output_recommendation +
identifiable). Tag colours and composed-icon fills come from the live
schema. Caption + framing copy live on the slide; DataFlow.vue owns
the row + arrows only.

Sentence tracks what AlgorithmHeader actually renders for this
datachain: Input Dataset = Sensitive personal information (first
input_dataset element in the JSON), Processing = Classification &
Prediction (the AIA's decision tree), Output Dataset = A
recommendation or prediction. These MATCH the register row on
canada.clarable.ai the audience saw earlier — same input element, same
gold identifiable chips on both ends.

Nuance worth a sentence out loud: inside the pipeline the AIA purges
names, birth dates and document numbers before scoring (travellers
binned into four-year age bands). The sensitivity lives in what the
records are about — immigration and enforcement history — not in the
model seeing your name.
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
      <img :src="asrIconUrl('not_available_to_me')" alt="" class="w-12 h-12 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Access</div>
        <div class="text-[14px] font-bold text-hp-blue-900 leading-tight">Not available to me</div>
      </div>
    </div>
    <div class="mt-3">
      <div class="text-[11px] italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-2">&ldquo;The TCI is not a public facing tool and is only available to BSOs&rdquo; — the indicator appears only on the officer's screen, never the traveller's.</div>
    </div>
  </div>
</div>

<div>
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Storage</div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-start gap-3">
      <img :src="asrIconUrl('stored_primarily_locally')" alt="" class="w-12 h-12 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Storage</div>
        <div class="text-[14px] font-bold text-hp-blue-900 leading-tight">Stored primarily locally</div>
      </div>
    </div>
    <div class="mt-3">
      <div class="text-[11px] italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-2">&ldquo;All data derived by the TCI system originates from internal CBSA systems&rdquo; — live scans plus the Enterprise Data Warehouse holding Passage History and enforcement records; the officer platform is moving to a hybrid cloud.</div>
    </div>
  </div>
</div>

<div>
  <div class="text-xs uppercase tracking-wider opacity-60 mb-3">Retention</div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm relative">
    <div class="asr-guess-badge">no duration</div>
    <div class="flex items-start gap-3">
      <img :src="asrIconUrl('data_retained')" alt="" class="w-12 h-12 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Retention</div>
        <div class="text-[14px] font-bold text-hp-blue-900 leading-tight">Retained — for system analysis only</div>
      </div>
    </div>
    <div class="mt-3">
      <div class="text-[11px] italic opacity-85 leading-relaxed border-l-2 border-amber-400 pl-2">&ldquo;TCI outputs are kept for the sole purposes of system analysis and are not used when calculating subsequent passages by the same traveller.&rdquo; Source records follow their own schedules (Passage History PPU 1101; enforcement PPU 016). No duration is stated.</div>
    </div>
  </div>
</div>

</div>

<div class="mt-4 text-center text-[11px] opacity-65 italic">
  Access, storage and retention language comes from the published AIA — but <strong>no retention duration is disclosed</strong>, and DTPR makes that absence legible.
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
Access, Storage & Retention (Traveller Compliance Indicator) — all three cards quote the published AIA; only the retention DURATION is missing.

Access: `not_available_to_me` — the AIA's own words ("not a public facing tool and is only available to BSOs", client-needs Q3). The datachain also carries `available_to_the_accountable_organization` for the officer-side view; this card features the traveller's side because that's the audience.

Storage: `stored_primarily_locally` — "All data derived by the TCI system originates from internal CBSA systems" (data source Q54): live scans + the Enterprise Data Warehouse (Passage History + ICES). The OE platform migration to hybrid cloud is disclosed in the project description — mention if asked.

Retention: verbatim "kept for the sole purposes of system analysis and are not used when calculating subsequent passages" (impact Q31), plus the named PIBs (ICES PPU 016, Passage History PPU 1101, Q46). No DURATION is disclosed anywhere in the AIA — hence the amber pill. Speak to it: DTPR makes it legible whether a value is disclosed, partial, or absent; this one is partial.
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
      <img :src="risksRightsIconUrl('civil_liberties_harm')" alt="" class="w-14 h-14 flex-shrink-0" />
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Risks &amp; Mitigations</div>
        <div class="text-lg font-bold text-hp-blue-900 leading-tight">Civil liberties harm</div>
      </div>
    </div>
    <div class="mt-4 space-y-3">
      <div>
        <div class="text-[10px] uppercase tracking-wider text-red-700 font-semibold mb-1">Risk</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-red-400 pl-3">Patterns learned from five years of past referrals and enforcement records could steer officer attention unfairly — echoing historical bias at the border.</div>
      </div>
      <div>
        <div class="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold mb-1">Mitigation</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-emerald-400 pl-3">Disclosed in the AIA: random referrals are mixed into the training data, model accuracy is tracked across sociodemographic groups on near-real-time dashboards, and privacy and GBA Plus assessments were completed. An officer decides every outcome.</div>
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
      <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-3">A plain-language description of how the indicator works is published in the Algorithmic Impact Assessment on open.canada.ca. The decision tree was deliberately chosen so its logic can be understood and explained.</div>
    </div>
  </div>
</div>

</div>

<!--
Disclosed risks and rights (Traveller Compliance Indicator) — one example per category.

Risks & Mitigations: notably, the TCI's published AIA DOES disclose its mitigations — random referrals in the training data, accuracy tracked across sociodemographic groups, near-real-time dashboards, PIA and GBA Plus completed. The risk phrasing is authored for the talk; every mitigation listed is from the AIA. Say that contrast out loud: this is what a disclosure regime maturing looks like.

Rights: the JSON discloses five rights (notice, algorithmic transparency, human review, decision explanation, access). Featured `right_algorithmic_transparency` because it pairs with `classification_prediction` on the later Authoring provenance slide — same source, same lineage (the AIA's own "explainability over predictive power" design choice). One absence worth knowing for Q&A: the AIA answers "No" to a dedicated recourse process for challenging decisions (the TCI doesn't make the decision), so the datachain carries no right_contest.

Description text on the rights card is the verbatim `rights` variable from the datachain JSON.
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
    <img :src="rightIconUrl('right_algorithmic_transparency')" alt="" class="w-10 h-10 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-hp-blue-900">Right to algorithmic transparency</div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">url · AIA on open.canada.ca</span>
      </div>
    </div>
  </div>
  <div class="p-3 border border-hp-blue/15 rounded bg-white flex items-start gap-3">
    <img :src="rightIconUrl('right_access')" alt="" class="w-10 h-10 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-hp-blue-900">Right to access</div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">form · ATIP online request</span>
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">postal · CBSA ATIP Division</span>
      </div>
    </div>
  </div>
  <div class="p-3 border border-hp-blue/15 rounded bg-white flex items-start gap-3">
    <img :src="rightIconUrl('right_to_notice')" alt="" class="w-10 h-10 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-hp-blue-900">Right to notice</div>
      <div class="mt-2 flex flex-wrap gap-2">
        <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-hp-blue text-white text-xs">phone · Border Information Service</span>
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

The point: disclosure ends with paths a person can actually walk, not just labels. The Rights category names what you're entitled to; actions are how you reach it. For the Traveller Compliance Indicator, "right to algorithmic transparency" becomes the published AIA on open.canada.ca; "right to access" becomes the ATIP online request form (or a letter to CBSA's ATIP Division — the postal kind earns its place here); "right to notice" becomes the Border Information Service line. One deliberate absence: no right-to-contest example — the TCI's AIA answers "No" to a dedicated recourse process (the indicator isn't the decision; the officer is). That absence is exactly the kind of thing DTPR renders visibly.

Pairs with the authoring-provenance and comprehension-audit slides — all three add layers on top of the raw disclosure. Provenance answers "where did this come from"; actions answer "what do I do now."
-->

---
layout: iframe
url: https://canada.clarable.ai/register
---

<!--
LIVE register walkthrough
Switch to a real browser at presentation time for full control. Iframe here is the slide-deck fallback.

Demo outline (Government of Canada AI Register):
- Land on register home; let people see the breadth (421 systems / 163 organizations — re-verify these counts before the webinar; the register grows).
- Filter by Functional Mode → Generative, then Perceptive.
- Filter by Department → Statistics Canada, Transport Canada, Global Affairs Canada.
- Open "AI Assistant for Employment Insurance Policy Research" (ESDC); show its datachain.
- "AI Assistant for Airport Security Screening Decisions" — one sentence on a more sensitive system without dwelling.
- Land back on register home.

TODO: record fallback screencast and reference here as a backup video tag if iframe fails.
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
  <a href="https://dtpr.ai" class="text-lg font-mono text-hp-blue-700 no-underline border-b-2 border-hp-blue pb-0.5">dtpr.ai</a>
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

<!--
The open-source surface area — six pieces, one breath each
Everything the deck has shown runs on these: the schema package (taxonomy + datachain types), the REST API (every icon in this deck is fetched from it live), the MCP server (what the agent demo drives), the UI component library (AlgorithmHeader and friends), the agent skill (demo two slides ahead), and the datachain visualiser. Don't enumerate features — the point is that the whole stack is open and buildable-on; the link goes to the GitHub org, dtpr.ai stays the reading entry point from the cover.
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
      &ldquo;an indicator is displayed to the officer&rdquo; lands for a traveller — but <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">non-resultant secondary inspections</span> and <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">primary inspection lanes (PIL)</span> assume operational vocabulary the travelling public doesn't share.
    </div>
  </div>
  <div class="p-4 bg-white border border-hp-blue/15 rounded-xl shadow-sm">
    <div class="flex items-center gap-2">
      <span class="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-red-100 text-red-800">✗ fail</span>
      <span class="text-sm font-bold text-hp-blue-900">Plain-language</span>
    </div>
    <div class="mt-2 text-xs italic opacity-80 leading-relaxed border-l-2 border-red-400 pl-3">
      Un-glossed terms across the AIA's public text: <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">BSO</span> (dozens of uses after one expansion), <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">ICES</span> and <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">Passage History</span> as system names, <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">non-resultant referral</span>, <span class="not-italic font-mono text-[11px] bg-gray-100 px-1 rounded">Officer Experience (OE) solution</span> — each carries operational meaning a traveller can't unpack.
    </div>
  </div>
</div>
</div>

<!--
Comprehension audit
Right column shows findings from applying the dtpr-comprehension-audit rubric (Audience fit, Plain-language) to the published TCI AIA's own text (vendored at talks/webinar-aug-2026/sources/). Every quoted term appears verbatim in the AIA. Two checks shown — Audience fit (partial: the plain sentences land, the operational vocabulary doesn't) and Plain-language (fail: BSO, ICES, non-resultant referral, OE).

The payoff line: the deck's TCI datachain reads plainly BECAUSE this lens was applied — "border services officer" not BSO, "past referrals and enforcement records" not ICES, "unnecessary secondary inspections" not non-resultant referrals. The audit is how AIA language becomes public language.
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
        <img :src="provenanceIconUrl('classification_prediction')" alt="" class="w-14 h-14 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <div class="text-[10px] uppercase tracking-wider text-hp-blue-700 font-semibold">Processing</div>
          <div class="flex items-center gap-2">
            <div class="text-lg font-bold text-hp-blue-900 leading-tight">Classification &amp; Prediction</div>
            <span class="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">high confidence</span>
          </div>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-1">Agent draft</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-hp-blue/40 pl-3">&ldquo;A decision-tree model chosen for explainability over predictive power. Trained on five years of de-identified passage and enforcement records; accuracy is tracked across sociodemographic groups and monitored in near real time.&rdquo;</div>
      </div>
      <div class="mt-4 pt-3 border-t border-hp-blue/10">
        <div class="text-[10px] uppercase tracking-wider opacity-60 font-semibold mb-1">Verbatim source quote</div>
        <div class="text-xs italic opacity-85 leading-relaxed border-l-2 border-amber-400 pl-3">&ldquo;The algorithm, structured as a decision tree, learns general patterns to predict compliance for new passages. [&hellip;] The approach uses explainable artificial intelligence, so the decision logic can be easily understood and analyzed.&rdquo;</div>
        <div class="mt-2 text-[10px] font-mono opacity-60">
          Algorithmic Impact Assessment v0.10.0 · Traveller Compliance Indicator · Project description
        </div>
      </div>
    </div>
  </div>
</div>

<!--
Authoring provenance (Traveller Compliance Indicator)
Right column shows ONE element from the deck's TCI datachain (public/data/cbsa-tci.datachain.json) — `classification_prediction`. Icon fetched live from api.dtpr.io. Two layered quotes:

  1. Agent draft — verbatim `additional_description` from the datachain JSON: the plain-language rendering of the model.
  2. Verbatim source quote — the exact sentences from the published AIA the draft leans on (two spans from the project description, joined with an ellipsis; the full PDF is vendored at talks/webinar-aug-2026/sources/). This is the audit trail: agent prose at top, the source it cites at bottom, visual evidence that the prose is anchored, not invented.

Confidence pill: "high" — published AIA, named model type, the explainability choice stated in the source itself.

The quote is REAL — pulled verbatim from page 2 of the AIA. (The MySchools version of this slide carried a placeholder quote; that TODO is resolved by the migration.)
-->

---

# Levels of disclosure

<div class="mt-6 grid grid-cols-3 gap-4 w-full max-w-6xl mx-auto">

<div class="lvl">
  <div class="lvl__glyph"><span class="g-canvas"><i></i><i></i><i></i><i></i></span></div>
  <div class="lvl__name">Level 1 · Canvas</div>
  <div class="lvl__job">Contains the whole datachain</div>
</div>

<div class="lvl">
  <div class="lvl__glyph"><span class="g-card"><i></i><i></i><i></i></span></div>
  <div class="lvl__name">Level 2 · Card</div>
  <div class="lvl__job">Headline facts, standardized and comparable</div>
</div>

<div class="lvl">
  <div class="lvl__glyph"><span class="g-line"><i></i><b></b></span></div>
  <div class="lvl__name">Level 3 · Footer</div>
  <div class="lvl__job">Lightweight for embedding in other products</div>
</div>

</div>

<div class="mt-4 grid grid-cols-2 gap-4 w-full max-w-6xl mx-auto">
  <div class="track">
    <span class="track__glyph"><span class="g-sign"><i></i><b></b></span></span>
    <span class="track__text">
      <span class="track__name">Non-digital</span>
      <span class="track__job">document mark · physical signage</span>
    </span>
  </div>
  <div class="track">
    <span class="track__glyph"><span class="g-mach"><b>&#123;</b><i></i><b>&#125;</b></span></span>
    <span class="track__text">
      <span class="track__name">For machines</span>
      <span class="track__job">.well-known/dtpr.json · embedded metadata</span>
    </span>
  </div>
</div>

<div class="mt-6 text-lg text-center max-w-3xl mx-auto leading-relaxed">
The datachain is the <strong>canonical record</strong>. Everything a person sees is a <strong>disclosure</strong>, in whatever form is most useful.
</div>

<style scoped>
.lvl {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 0.9rem 1rem;
  text-align: center;
}
.lvl__glyph { display: flex; justify-content: center; align-items: flex-end; height: 64px; margin-bottom: 0.6rem; }
.g-canvas {
  width: 86px; height: 60px;
  border: 1.5px solid #001514; border-radius: 6px;
  padding: 5px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 3px;
}
.g-canvas i { background: #e6e5e0; border-radius: 2px; }
.g-canvas i:last-child { grid-column: 1 / -1; }
.g-card {
  width: 44px; height: 60px;
  border: 1.5px solid #001514; border-radius: 4px;
  padding: 9px 5px 5px;
  display: flex; flex-direction: column; gap: 3px;
  position: relative; overflow: hidden;
}
.g-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: #001514; }
.g-card i { height: 4px; background: #e6e5e0; border-radius: 2px; }
.g-card i:last-child { width: 60%; }
.g-line {
  width: 86px; height: 16px;
  border: 1.5px solid #001514; border-radius: 999px;
  display: flex; align-items: center; gap: 4px;
  padding: 0 6px;
}
.g-line i { width: 6px; height: 6px; border-radius: 999px; background: var(--hp-blue-500); flex-shrink: 0; }
.g-line b { height: 4px; flex: 1; background: #e6e5e0; border-radius: 2px; }
.lvl__name { font-weight: 700; font-size: 0.82rem; color: var(--hp-blue-900); }
.lvl__scale { font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase; color: #72726c; margin-top: 0.1rem; }
.lvl__job { font-size: 0.72rem; margin-top: 0.35rem; opacity: 0.85; }
.lvl__ideas { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.3rem; margin-top: 0.5rem; }
.lvl__ideas span {
  font-size: 0.58rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 999px;
  padding: 0.08rem 0.5rem;
  color: #4b4b47;
  background: #fff;
}
.track {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 14px;
  padding: 0.55rem 1.1rem;
  font-size: 0.7rem;
  color: #4b4b47;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  text-align: left;
}
.track__glyph { width: 52px; display: flex; justify-content: center; flex-shrink: 0; }
.track__text { display: flex; flex-direction: column; gap: 0.18rem; }
.track__name {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.6rem;
  color: var(--hp-blue-700);
}
.track__job { font-size: 0.7rem; }
/* Non-digital: a DTPR sign on its post — the record's dot out in the world. */
.g-sign {
  position: relative;
  display: block;
  width: 40px;
  height: 42px;
}
.g-sign i {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 22px;
  border: 1.5px solid #001514;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.g-sign i::after {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--hp-blue-500);
}
.g-sign b {
  position: absolute;
  top: 22px;
  bottom: 0;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: #001514;
  border-radius: 1px;
}
/* For machines: the same dot, wrapped in braces. */
.g-mach {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 42px;
}
.g-mach b {
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 26px;
  font-weight: 500;
  line-height: 1;
  color: #001514;
}
.g-mach i { width: 7px; height: 7px; border-radius: 999px; background: var(--hp-blue-500); }
</style>

<!--
Section pivot: the framework
Everything in the talk so far produced ONE canonical record — the datachain. This closing section speculates where that record can surface when a person actually meets the system. Say the word "speculative" out loud once here; the next slides are mocks, not shipped products.

Three levels of precision for screens — Canvas (a full page), Card (a panel), Line (one line or less) — each answers a different question: "how does it all work?" / "what does it do with me?" / "is AI here, and who runs it?". They chain: tap the line, get the card; follow the card, reach the canvas. Two more tracks off-screen: non-digital (documents, signage, speech) and machine-readable (the substrate that lets software surface the rest automatically).

The sizes recur across media — canvas/poster, card/letter-block/sign, line/mark — precision tiers are medium-independent.
-->

---
class: flex items-center justify-center
---


<div class="canvas-box">
  <DtprCanvas />
</div>


<style scoped>
/* The board renders at its natural ~861 × 1024 and is scaled down to fit. It's
   height-bound — 0.53 is about the ceiling before it touches the slide edges.
   The box only reserves layout space (transforms don't), so its dimensions have
   to track the scaled size or the flex centering lies and the board rides high. */
.canvas-box {
  --scale: 0.53;
  /* Every rule inside the board is a 1px hairline in the board's own
     coordinates — the grid `gap` that lets the line colour show through, the
     outer border, the dashed escalation rule, the pill outlines. Scaled down
     they land on sub-pixel boundaries and the renderer drops them, so
     pre-divide by the scale to land back on ~1px on the slide. */
  --hair: calc(1px / var(--scale));
  width: 455px;
  height: 544px;
  overflow: visible;
}
.canvas-box > * {
  transform: scale(var(--scale));
  transform-origin: top left;
}
/* Named one by one on purpose. UnoCSS preflight sets `border-style: solid` with
   width 0 on every element, so a blanket `:deep(*) { border-width }` boxes the
   whole board in outlines. These five are every hairline DtprCanvas draws. */
.canvas-box :deep(.board) {
  gap: var(--hair);
  border-width: var(--hair);
}
.canvas-box :deep(.chip),
.canvas-box :deep(.tag),
.canvas-box :deep(.act) {
  border-width: var(--hair);
}
.canvas-box :deep(.esc) {
  border-top-width: var(--hair);
}
</style>

<!--
Level 1 — the full canvas
This is the canvas prototype — the DTPR AI register — rendering a fictional face-matching fare-gate system, MT-FG-104. The seats never move: run by / built by / the system / data flow / risks & mitigation / used on / you can. The sameness is the point: two systems' canvases compare seat by seat.

Read the grammar out loud. The system sentence is generated from the record — "senses and decides *on its own*" — with the autonomy phrase as the colored marker AND repeated as the pill. Color is spent only on published classifications: identifiable gold, autonomous orange; relationships and harm types stay neutral. Rights end in things you can actually do — get a fare card, start an appeal, email the review desk — with an independent-oversight escalation under a dashed rule.

In the live prototype every seat takes reactions (clear / confusing / unsure), so the register doubles as an instrument for learning which presentation lands. The AlgorithmHeader from earlier slides is the register-entry header; this canvas is the full page it opens into. Same size: "About this AI" pages, model cards, comparison views.

SCHEMA NOTE: the "used on" seat previews the "People affected" category (subject / bystander / community) that ships in the next schema iteration — already live on api.dtpr.io as ai@2026-08-12-beta, while this deck pins 05-06-beta. The canvas is deliberately one step ahead; if asked, that's the beta iterating in the open.
-->

---
class: flex items-center justify-center
---

<div class="grid grid-cols-[auto_1fr] gap-12 items-center max-w-5xl">

<CanvasCard />


</div>

<!--
Level 2 — the canvas, folded
Same system as the previous slide — MT-FG-104 — compressed to a single cell, at natural card size (no scaling trick here; this is how big a card actually is). Walk the fold: what survived is exactly the design-principles hierarchy — who runs it, what it's for (the purpose chip), the generated system sentence with its autonomy marker, the data endpoints with identifiability, one action. What got cut — vendor, retention facts, the risk row, escalation — didn't disappear; it lives on the full record, one tap away ("+ 2 more on the full record" says so out loud).

The standardized-rows evidence still backs this form — the CMU privacy-label RCT (Kelley et al., 2009: a fixed table with a small symbol vocabulary beat prose policies) and Apple's privacy labels — but the costume stays DTPR's own: same paper, same markers, same pills as the board.

Where a card actually appears: the sheet a chat strip expands into (next slide), register list cards (the canvas prototype's index page already renders these), first-run sheets, app-store listings, embeds. Printed, the letter's disclosure block is this card on paper.
-->

---
clicks: 1
class: flex flex-col items-center justify-center
---

<ChatFooter :expanded="$clicks >= 1" />

<!--
Level 3 — the line
Where most people will actually meet AI: a chat box. The disclosure is ONE line under the input — mode icon, who runs it, who decides, retention, a link. That's the whole ask at this level: presence, accountability, a pointer.

[click] The strip unfolds into a card — the same folded-canvas form one slide back, here filled with the chatbot's own record. Layered notice, demonstrated live: glanceable by default, expandable when you care, full record one tap further.

Kin at this level: the provenance chip on generated content, an agentic status dot (the mic-indicator, but for agency, colored by autonomy), a receipt line.
-->

---
clicks: 1
class: overflow-hidden
---

<div class="letter-wrap">
  <DecisionLetter :highlight="$clicks >= 1" />
</div>

<style scoped>
.letter-note {
  position: absolute;
  top: 1rem;
  left: 3.5rem;
  font-size: 0.68rem;
  opacity: 0.55;
}
.letter-wrap {
  display: flex;
  justify-content: center;
  margin-top: 0.4rem;
  transform: scale(0.86);
  transform-origin: top center;
}
</style>

<!--
Paper is a surface too
A school-placement decision landing in a parent's mailbox — the nyc-myschools-match record, kept deliberately on this slide even though the deck's running example is now the border indicator: the TCI never mails anyone a decision, and the letter beat needs a system that does. Different system, same grammar — which is itself the point of the section. The bordered block is the card level, printed: mini data-flow with PII pills, an autonomy sentence, rights with concrete actions, QR to its register entry on nyc.clarable.ai.

[click] Highlight the block. Say out loud: the copy went through the plain-language pass — no "Gale–Shapley", no "DIIT", no "FERPA" — the comprehension audit from earlier, applied to a second system.

The signature cropping off the bottom is deliberate — it's a letter, not a slide.
-->

---
class: flex flex-col items-center justify-center
---

<HiringNotice />

<!--
Hiring — the same grammar in an employer's voice
Private sector now. NYC's Local Law 144 already requires bias audits and advance notice for automated employment decision tools — this is what that notice could look like as a DTPR projection: what the tool does and who decides, what it reads, the published bias audit, and two things you can actually do, each with an action.

The block is a left-teal quote-block rather than the letter's box — same grammar, email-native frame. No QR; links are email's native affordance. Employer is fictional (.example domain on purpose).
-->

---
class: flex items-center justify-center
---

<div class="grid grid-cols-[auto_1fr] gap-12 items-center max-w-5xl">

<DocumentMark />

<div class="text-left max-w-sm space-y-3">
  <div class="text-sm opacity-80 leading-relaxed">A standardized mark for documents AI helped make: a glyph, a claim, a record reference. Kin to content credentials and the notary stamp.</div>
</div>

</div>

<!--
The mark
Flip the hiring story around: this is the résumé the employer receives, and the document itself declares the AI involvement — the line level, printed. A glyph (the DTPR composed icon), a claim ("made with AI assistance"), and a record reference you can follow.

Kinship to name: C2PA content credentials do this for images cryptographically; the notary stamp did it for documents for centuries. A DTPR mark is the human-legible face of the same move — and on paper, it's all you get, so it has to carry accountability in a few square centimeters.
-->

---
class: flex flex-col justify-center
---

# Beyond screens

<div class="mach grid grid-cols-2 gap-10 w-full max-w-6xl mx-auto mt-2 items-start">

<div>

<div class="call">
  <div class="call__org">City Benefits Office</div>
  <div class="call__num">311 · automated assistant</div>
  <div class="call__timer">02:14</div>
  <div class="call__wave"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  <div class="call__quote">“You're speaking with an automated assistant run by the City Benefits Office. It can look up your case and start applications; a caseworker makes final decisions. Say ‘agent’ at any time to reach a person.”</div>
</div>

</div>

<div class="text-left">

```http
HTTP/1.1 200 OK
Content-Type: text/html
DTPR-Datachain: https://benefits.example/.well-known/dtpr.json
```

```json
{
  "dtpr": "1.0",
  "systems": [{
    "id": "city-benefits-assistant",
    "record": "api.dtpr.io/…/datachains/cba-2026-001",
    "schema": "ai@2026-05-06-beta",
    "modes": ["generative_mode"],
    "autonomy": "human_decides"
  }]
}
```

<div class="mt-2 text-sm opacity-80 leading-relaxed">Browsers, operating systems, and other agents can read this and surface the DTPR canvas.</div>

</div>

</div>

<style scoped>
.call {
  background: #001514;
  color: #fff;
  border-radius: 20px;
  padding: 1.4rem 1.5rem 1.2rem;
  text-align: center;
}
.call__org { font-weight: 700; font-size: 0.95rem; }
.call__num { font-size: 0.66rem; opacity: 0.6; margin-top: 0.15rem; }
.call__timer { font-family: var(--slidev-code-font-family, monospace); font-size: 0.8rem; opacity: 0.8; margin-top: 0.5rem; }
.call__wave {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 30px;
  margin: 0.6rem 0 0.8rem;
}
.call__wave i {
  width: 3px;
  border-radius: 2px;
  background: color-mix(in srgb, var(--hp-blue-500) 60%, #fff);
  height: 8px;
}
.call__wave i:nth-child(2n) { height: 16px; }
.call__wave i:nth-child(3n) { height: 22px; }
.call__wave i:nth-child(5n) { height: 12px; }
.call__quote {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0.7rem 0.9rem;
  font-size: 0.72rem;
  line-height: 1.5;
  text-align: left;
}
.mach pre,
.mach pre code {
  font-size: 0.66rem !important;
  line-height: 1.5;
  white-space: pre-wrap !important;
  word-break: break-all;
}
</style>

<!--
Beyond screens
Two surfaces with no pixels of ours at all.

Left: the spoken disclosure. A voice agent opens with one sentence — who runs it, what it can do, who decides — and an escape word. That's the line level with no screen; an SMS follow-up can carry the link to the record.

Right: the machine-readable layer. An HTTP header and a .well-known file (both illustrative, not a shipped spec — say so). Once the record is machine-readable, OTHER software can do the disclosing: a browser site-info panel listing the AI systems a site declared, an OS surfacing them at install time, agents reading each other's disclosures. That's the padlock move — nobody reads the certificate; everybody reads the padlock.
-->

---
class: 'relative !p-0'
---

<MentimeterCue kicker="Two questions before we close" />

<!--
POLL CUE — switch to the Mentimeter tab for the closing questions. This is the deck's last slide, so the webinar ends in the poll: land the goodbye (dtpr.ai, "bring us a register") out loud over the results.

Mentimeter questions (verbatim):
1. How might disclosures like this for AI be helpful to you?
2. Where else would you like to see disclosures like this?

This is the webinar's harvest — where the audience wants DTPR next. Read a few aloud as they come in.
-->
