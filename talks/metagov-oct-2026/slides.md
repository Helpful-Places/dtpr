---
theme: seriph
title: A proposed maturity model of AI transparency
info: |
  ## A proposed maturity model of AI transparency
  Metagov seminar · October 2026
  Jonathan Pichot · Helpful Places
author: Jonathan Pichot
# Slidev defaults the FIRST slide to `layout: cover`, and seriph's cover layout
# paints a grey gradient over a remote Unsplash background. Pin the default
# layout so the cover sits on cream like every other slide.
layout: default
class: text-center flex flex-col items-center justify-center relative overflow-hidden
transition: slide-left
mdc: true
# The deck is designed light-on-cream. Without this, Slidev follows the OS
# color scheme and adds `html.dark`, which flips body text to white.
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
</div>

<div class="mt-10">
  <a href="https://dtpr.io" class="text-4xl font-mono text-hp-blue-700 no-underline border-b-2 border-hp-blue pb-1">dtpr.io</a>
</div>

<div class="mt-8 text-xl opacity-80 max-w-3xl mx-auto leading-relaxed">
Digital Trust for Places and Routines (DTPR) is an open standard that explains how technology uses data, in plain language and icons anyone can understand.
</div>

<!--
Cover
Name it and move. DTPR: Digital Trust for Places and Routines. One standard that now covers both sensors in public space and AI systems that make decisions. Sixteen slides, about fifteen minutes, then I want your reactions to one design question at the end.
-->

---

# Where it started: a sign on a street

<div class="tl mt-5 grid grid-cols-[1fr_auto_1fr] gap-8 items-start">

<div>
  <div class="tl__cap">In the world</div>
  <div class="tl__sub"><em>a sign next to the technology</em></div>
  <div class="tl__stage">
    <img :src="'/images/dtpr-sign-scan.jpeg'" alt="A DTPR sign being scanned with a phone" class="tl__photo" />
  </div>
</div>

<div class="tl__arrow">→</div>

<div>
  <div class="tl__cap">The record</div>
  <div class="tl__sub"><em>the same questions, in every city</em></div>
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
.tl__cap { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: var(--hp-blue-700); }
.tl__sub { font-size: 0.82rem; color: rgba(0, 21, 20, 0.6); margin-top: 0.1rem; }
.tl__stage { position: relative; height: 300px; margin-top: 0.7rem; }
.tl__stage--rec { display: flex; align-items: center; }
.tl__photo { height: 100%; width: 100%; object-fit: cover; border-radius: 10px; border: 1px solid rgba(0, 21, 20, 0.1); box-shadow: 0 18px 34px -20px rgba(0, 21, 20, 0.45); }
.tl__arrow { font-size: 2.5rem; line-height: 1; color: #001514; opacity: 0.35; margin-top: 172px; }
.rec { width: 100%; background: #fff; border: 1px solid rgba(0, 21, 20, 0.1); border-left: 3px solid var(--hp-blue-500); box-shadow: 0 18px 34px -20px rgba(0, 21, 20, 0.45); padding: 0.7rem 0.9rem 0.6rem; }
.rec__head { border-bottom: 1.5px solid #001514; padding-bottom: 0.42rem; }
.rec__name { font-size: 0.88rem; font-weight: 700; color: var(--hp-blue-900); letter-spacing: -0.01em; }
.rec__org { font-size: 0.6rem; color: #72726c; margin-top: 0.1rem; }
.rec__row { display: grid; grid-template-columns: 6.2rem 1fr; gap: 0.5rem; align-items: baseline; padding: 0.32rem 0; border-bottom: 1px solid rgba(0, 0, 0, 0.07); }
.rec__k { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #72726c; }
.rec__v { font-size: 0.72rem; font-weight: 600; color: #001514; }
.rec__foot { margin-top: 0.45rem; font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace); font-size: 0.52rem; color: #72726c; text-align: right; }
</style>

<!--
Where it started
Six years ago, physical things in public space: cameras, sensors, counters. A sign next to the thing, a QR code, and one record with the same questions in every city. Who runs it, what it's for, what it collects, who can see the data, where it's kept.

The record on the right is a real one: Long Beach's license plate reader, every value verbatim from long-beach.dtpr.guide. Hold onto the shape. We're about to point it at something that isn't physical.
-->

---
clicks: 1
---

# Same shape, pointed at an algorithm

<div class="hdr-box">
  <AlgorithmHeader
    src="/data/cbsa-tci.datachain.json"
    headline="Traveller Compliance Indicator"
    subtitle="Canada Border Services Agency · from its published Algorithmic Impact Assessment"
    :highlight-row="$clicks >= 1 ? 'context' : null"
  />
</div>

<style scoped>
.hdr-box { margin-top: 0.5rem; transform: scale(0.84); transform-origin: top center; }
</style>

<!--
Same shape, pointed at an algorithm
In 2025 we asked whether the same method could describe an AI system that makes or shapes decisions. Not a camera on a pole. A model inside a government workflow.

This is CBSA's Traveller Compliance Indicator, drawn from the assessment Canada publishes for every automated decision system. A decision tree that flags travellers likely to meet customs obligations. An officer always decides.

[click] The top row is the context: who's accountable, who's affected, what it does and with how much autonomy, and what it's for. Same seats as the sign on the street, and a new one: the people the system is about. Travellers never see the indicator.

The icons here come from the current schema, dtpr@2026-09-01-beta, which merged the sensor and AI vocabularies into one. One schema for the camera and the model.
-->

---

# Data flow reads like a sentence

<div class="mt-8">
  <DataFlow />
</div>

<div class="mt-8 text-center text-lg max-w-3xl mx-auto leading-relaxed">
Information about <strong>an identified traveller</strong> goes into a <strong>decision-tree model</strong>, which produces <strong>a recommendation</strong> about that traveller.
</div>

<div class="mt-4 text-center text-sm opacity-60 max-w-2xl mx-auto">
Collection and manifestation stay empty here because the assessment doesn't say. The record never carries a value its source doesn't state.
</div>

<!--
Data flow reads like a sentence
The middle of the record is a sentence a non-expert can read. What goes in, what happens to it, what comes out, and whether each end is about an identifiable person. The gold chip is the point: identifiable in, identifiable out.

The nuance the record can't carry: names, birth dates and document numbers are stripped before scoring. The record grades the domain, the speaker carries the nuance.

The two dashed ends are new in the merged schema: how data is collected and how the output shows up in the world. For a camera those are the whole story. For this system the assessment doesn't say, so the seats stay empty. That rule matters: we never fill a seat the source doesn't support.
-->

---

# Rights, actions, risks and mitigations

<div class="flex items-start justify-center gap-10 mt-1">
  <div class="canvas-box">
    <DtprCanvas focus="rights" />
  </div>
  <div class="side">
    <div class="side__cap">A composite system, drawn to show the full record</div>
    <ul class="side__list">
      <li>The <strong>risk</strong> the organization named, and what it planned against it.</li>
      <li>The <strong>rights</strong> you have over this system.</li>
      <li>A <strong>button</strong> for each one: opt out, start an appeal, email the review desk.</li>
      <li>An <strong>escalation</strong> outside the organization when that fails.</li>
    </ul>
    <div class="side__foot">Public feedback starts here, with recourse. A reaction score is the thin end.</div>
  </div>
</div>

<style scoped>
.canvas-box {
  --scale: 0.45;
  --hair: calc(1px / var(--scale));
  width: 383px;
  height: 580px;
  overflow: visible;
  flex: none;
}
.canvas-box > * { transform: scale(var(--scale)); transform-origin: top left; }
.canvas-box :deep(.board) { gap: var(--hair); border-width: var(--hair); }
.canvas-box :deep(.chip), .canvas-box :deep(.tag), .canvas-box :deep(.act) { border-width: var(--hair); }
.canvas-box :deep(.esc) { border-top-width: var(--hair); }
.side { max-width: 20rem; text-align: left; padding-top: 1.5rem; }
.side__cap { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--hp-blue-700); margin-bottom: 0.8rem; }
.side__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; font-size: 0.9rem; line-height: 1.4; }
.side__list li { padding-left: 0.9rem; border-left: 2px solid var(--hp-blue-200); }
.side__foot { margin-top: 1.2rem; font-family: var(--hp-serif); font-style: italic; font-size: 0.95rem; color: var(--hp-blue-900); }
</style>

<!--
Rights, actions, risks and mitigations
This is what makes the record more than a label. The system is fictional, a composite, so I could draw every seat filled: face-matching fare gates in a transit system. The data flow is dimmed on purpose.

Look at the bottom. The risk the operator named, a misidentification stops the wrong person, and the mitigation they planned. Then the rights: stop processing, contest, a human review. Each right ends in something you can do, and there's an ombudsman under the dashed line when the operator's own process fails.

When I say "public feedback" later in this talk, this is what I mean. Rights people can use, recourse they can reach, risks already on the table. A one-to-five reaction is the thinnest layer, not the substance.

Also notice: a camera and a model in one record. That's the merged schema doing its job.
-->

---

# One record, many surfaces

<div class="mt-6 grid grid-cols-3 gap-4 w-full max-w-6xl mx-auto">

<div class="lvl">
  <div class="lvl__glyph"><span class="g-canvas"><i></i><i></i><i></i><i></i></span></div>
  <div class="lvl__name">Canvas</div>
  <div class="lvl__job">The whole record</div>
</div>

<div class="lvl">
  <div class="lvl__glyph"><span class="g-card"><i></i><i></i><i></i></span></div>
  <div class="lvl__name">Card</div>
  <div class="lvl__job">Headline facts, comparable across systems</div>
</div>

<div class="lvl">
  <div class="lvl__glyph"><span class="g-line"><i></i><b></b></span></div>
  <div class="lvl__name">Line</div>
  <div class="lvl__job">Light enough to sit inside another product</div>
</div>

</div>

<div class="mt-4 grid grid-cols-2 gap-4 w-full max-w-6xl mx-auto">
  <div class="track">
    <span class="track__glyph"><span class="g-sign"><i></i><b></b></span></span>
    <span class="track__text">
      <span class="track__name">Non-digital</span>
      <span class="track__job">a mark on a document · a sign on a post</span>
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
The record is canonical. Everything a person sees is a disclosure drawn from it, in whatever form is useful where they are.
</div>

<style scoped>
.lvl { background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0, 0, 0, 0.06); border-radius: 14px; padding: 0.9rem 1rem; text-align: center; }
.lvl__glyph { display: flex; justify-content: center; align-items: flex-end; height: 64px; margin-bottom: 0.6rem; }
.g-canvas { width: 86px; height: 60px; border: 1.5px solid #001514; border-radius: 6px; padding: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 3px; }
.g-canvas i { background: #e6e5e0; border-radius: 2px; }
.g-canvas i:last-child { grid-column: 1 / -1; }
.g-card { width: 44px; height: 60px; border: 1.5px solid #001514; border-radius: 4px; padding: 9px 5px 5px; display: flex; flex-direction: column; gap: 3px; position: relative; overflow: hidden; }
.g-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 5px; background: #001514; }
.g-card i { height: 4px; background: #e6e5e0; border-radius: 2px; }
.g-card i:last-child { width: 60%; }
.g-line { width: 86px; height: 16px; border: 1.5px solid #001514; border-radius: 999px; display: flex; align-items: center; gap: 4px; padding: 0 6px; }
.g-line i { width: 6px; height: 6px; border-radius: 999px; background: var(--hp-blue-500); flex-shrink: 0; }
.g-line b { height: 4px; flex: 1; background: #e6e5e0; border-radius: 2px; }
.lvl__name { font-weight: 700; font-size: 0.82rem; color: var(--hp-blue-900); }
.lvl__job { font-size: 0.72rem; margin-top: 0.35rem; opacity: 0.85; }
.track { background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(0, 0, 0, 0.06); border-radius: 14px; padding: 0.55rem 1.1rem; font-size: 0.7rem; color: #4b4b47; display: flex; align-items: center; gap: 0.9rem; text-align: left; }
.track__glyph { width: 52px; display: flex; justify-content: center; flex-shrink: 0; }
.track__text { display: flex; flex-direction: column; gap: 0.18rem; }
.track__name { font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.6rem; color: var(--hp-blue-700); }
.track__job { font-size: 0.7rem; }
.g-sign { position: relative; display: block; width: 40px; height: 42px; }
.g-sign i { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 32px; height: 22px; border: 1.5px solid #001514; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.g-sign i::after { content: ''; width: 7px; height: 7px; border-radius: 999px; background: var(--hp-blue-500); }
.g-sign b { position: absolute; top: 22px; bottom: 0; left: 50%; width: 2px; margin-left: -1px; background: #001514; border-radius: 1px; }
.g-mach { display: inline-flex; align-items: center; gap: 4px; font-family: 'JetBrains Mono', monospace; font-size: 1.1rem; color: #001514; }
.g-mach i { width: 22px; height: 4px; background: #e6e5e0; border-radius: 2px; }
</style>

<!--
One record, many surfaces
Thirty seconds. The record you just saw is the canonical thing. What a person sees is a disclosure drawn from it: the full canvas, a card with the headline facts, or one line inside another product. Plus a sign on a post and a mark on a document for the physical world, and a machine-readable file so browsers and agents can read it too.
-->

---

# How two registers got filled

<div class="mt-8 grid grid-cols-3 gap-6 max-w-6xl mx-auto text-left">
  <div class="auth">
    <div class="auth__k">People</div>
    <div class="auth__t">Datachain Builder</div>
    <div class="auth__d">A guided form for policy, communications and product teams to draft and publish a record.</div>
    <div class="auth__f"><span class="text-xs uppercase tracking-widest opacity-60">in</span><img :src="'/images/clarable-black.svg'" alt="Clarable" class="h-5 w-auto" /></div>
  </div>
  <div class="auth">
    <div class="auth__k">Agents</div>
    <div class="auth__t">DTPR agent skill</div>
    <div class="auth__d">Hand an agent a published assessment, a policy document or a model card. It drafts the record for a person to review.</div>
    <div class="auth__f"><span class="auth__code">@dtpr/skill</span></div>
  </div>
  <div class="auth">
    <div class="auth__k">The contract</div>
    <div class="auth__t">Schema, API and MCP server</div>
    <div class="auth__d">Both paths write to the same schema and validate against the same API. The MCP server is how the agent checks its work.</div>
    <div class="auth__f"><span class="auth__code">api.dtpr.io</span></div>
  </div>
</div>

<div class="mt-8 text-center text-base opacity-75 max-w-3xl mx-auto">
The NYC and Canada registers were drafted this way from assessments the governments had already published, then reviewed by a person.
</div>

<style scoped>
.auth { background: #fff; border: 1px solid rgba(0, 123, 122, 0.15); border-radius: 12px; padding: 1.2rem 1.3rem; box-shadow: 0 1px 2px rgba(0,0,0,0.03); display: flex; flex-direction: column; min-height: 13rem; }
.auth__k { font-size: 0.62rem; font-family: 'JetBrains Mono', monospace; text-transform: uppercase; letter-spacing: 0.18em; color: var(--hp-blue-700); margin-bottom: 0.6rem; }
.auth__t { font-size: 1.25rem; font-weight: 700; color: var(--hp-blue-900); line-height: 1.15; }
.auth__d { margin-top: 0.5rem; font-size: 0.82rem; line-height: 1.4; opacity: 0.85; }
.auth__f { margin-top: auto; padding-top: 1rem; display: flex; align-items: center; gap: 0.5rem; }
.auth__code { font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; color: var(--hp-blue-700); border-bottom: 1px solid rgba(0, 123, 122, 0.4); padding-bottom: 1px; }
</style>

<!--
How two registers got filled
Quick mechanics, because the question always comes. A person can fill the record in a guided form. An agent can draft it from a document that already exists: Canada's assessments, New York's annual algorithm reports. Both write to the same schema, and the agent validates against the same API through an MCP server, so it can't invent a category or skip a required one.

That's how the Canada register got to several hundred systems. Drafted by an agent from public documents, reviewed by a person. The schema is the contract both sides write to, and it's all open.
-->

---
clicks: 1
---

<div class="h-full flex items-center justify-center">
  <ChatFooter :expanded="$clicks >= 1" />
</div>

<!--
The line
The lightest surface, and where most people actually meet AI now: a chat window. One line under the input. What it is, who runs it, who decides, how long your words are kept, a link.

[click] Tap it and the line unfolds into the card. Layered notice: glanceable by default, expandable when you care, full record one step further.

Keep this picture. A chat window, inside an organization, with a person typing into it. That's where the next chapter starts.
-->

---
layout: center
class: text-center
---

<div class="pivot">
  <div class="pivot__line">Deployed systems are the easy case.</div>
  <div class="pivot__line pivot__line--2">Most AI in an organization today is a chat window open on someone's desk.</div>
  <div class="pivot__meta">Summer 2026 · a small cultural organization in Canada · 18 staff</div>
</div>

<style scoped>
.pivot { max-width: 46rem; margin: 0 auto; }
.pivot__line { font-family: var(--hp-serif); font-size: 2.1rem; line-height: 1.2; color: var(--hp-blue-900); }
.pivot__line--2 { margin-top: 1.2rem; color: #001514; }
.pivot__meta { margin-top: 3rem; font-size: 0.72rem; letter-spacing: 0.18em; text-transform: uppercase; color: #72726c; }
</style>

<!--
Then we asked organizations about their own use
Everything so far is a deployed system: a fixed purpose, a fixed place in a process, an owner. That's the easy case for a disclosure standard. Hard, but tractable.

This summer we worked with a small cultural organization in Canada. Eighteen staff. I'm not going to name them. They had no AI policy and no picture of how their own people were using these tools. Nobody did. Leadership knew staff used AI; they just couldn't see it.

So we asked. What came back surprised everyone, from the director to the newest hire, mostly because nobody had seen it laid out before. That's the next slide.
-->

---

# Sensing: ask lightly, show it back

<div class="mt-3 grid grid-cols-[300px_1fr] gap-8 items-start">
  <CheckIn />
  <SensingPanel />
</div>

<!--
Sensing
Left: the instrument we're building now. A weekly check-in by Slack or email, Friday afternoon. One open question: what did you use AI for this week. Then a few scales: how much of it was AI-generated, how much did you trust it, how good was the result. The model extracts the tool and the kind of work; nobody fills in a form. Everything is shown back without names, and you can pause or leave any time.

Right: what came back from the first organization, through a one-off questionnaire rather than the bot. The caption says so. Comfort disclosing: the median is "openly yes". Confidence they're using it appropriately: "mostly sure", with a real spread. And the concerns, ranked. Losing the organization's own voice came first, fourteen of eighteen. Accuracy and environmental impact tied. Privacy of what goes in, close behind.

Three of eighteen don't use AI at work at all, and they had the longest list of concerns. That's a governance fact, not a usage fact, and you only get it by asking everyone.
-->

---

# Governing: a use case drawn in DTPR

<div class="mt-1 grid grid-cols-[345px_1fr] gap-8 items-start">
  <div class="uc-box">
    <DtprCanvas :content="DRAFTING_WRITING" focus="blanks" />
  </div>
  <div class="gov">
    <div class="gov__cap">What staff want a policy to answer</div>
    <ol class="gov__qs">
      <li v-for="q in POLICY_QUESTIONS" :key="q">{{ q }}</li>
    </ol>
    <div class="gov__blanks">
      <span class="gov__k">The blanks are the agenda</span>
      Unvetted tools. No rule on what's safe to share. No safeguard yet for confidentiality. Each red line on the record is a decision the organization hasn't made.
    </div>
    <div class="gov__policy">
      <span class="gov__pk">proposed</span>
      A living policy: use cases with an owner and a yes, no, or not yet. An idea, not a built thing.
    </div>
  </div>
</div>

<script setup lang="ts">
import { DRAFTING_WRITING } from './components/canvas-content'
import { POLICY_QUESTIONS } from './components/sensing-data'
</script>

<style scoped>
.uc-box {
  --scale: 0.4;
  --hair: calc(1px / var(--scale));
  width: 345px;
  height: 560px;
  overflow: visible;
  flex: none;
}
.uc-box > * { transform: scale(var(--scale)); transform-origin: top left; }
.uc-box :deep(.board) { gap: var(--hair); border-width: var(--hair); }
.uc-box :deep(.chip), .uc-box :deep(.tag), .uc-box :deep(.act) { border-width: var(--hair); }
.uc-box :deep(.esc) { border-top-width: var(--hair); }
.gov { text-align: left; padding-top: 0.4rem; display: flex; flex-direction: column; gap: 1rem; }
.gov__cap { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--hp-blue-700); }
.gov__qs { margin: -0.4rem 0 0; padding-left: 1.2rem; font-size: 0.86rem; line-height: 1.35; display: flex; flex-direction: column; gap: 0.35rem; color: #001514; }
.gov__qs li::marker { color: var(--hp-blue-500); font-weight: 700; }
.gov__blanks { font-size: 0.8rem; line-height: 1.4; color: #001514; border-left: 2px solid #b42318; padding-left: 0.8rem; }
.gov__k { display: block; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #b42318; margin-bottom: 0.2rem; }
.gov__policy { font-size: 0.78rem; line-height: 1.4; color: #4b4b47; border: 1.5px dashed rgba(0, 21, 20, 0.3); border-radius: 8px; padding: 0.6rem 0.8rem; }
.gov__pk { display: block; font-size: 0.56rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #72726c; margin-bottom: 0.2rem; }
</style>

<!--
Governing
Here's the experiment. We took the most common use case, drafting and editing writing, eight of eighteen staff, and drew it as a DTPR record. Before any deployed system exists. Before any policy exists.

Look at what the record says when you do that. Run by: the organization, with no formal AI guidance yet. Built by: whatever tools staff named, none of them vetted. Risk: losing the organization's voice, with the mitigation staff already practise on their own. Risk: confidentiality, with no safeguard at all. The red lines are the blanks.

The blanks are the policy agenda. And the questions staff asked line up with them almost one to one: which tools, what's safe to share, and whether we tell partners and funders when AI helped. That last one is a disclosure question, in staff's own words, which hands us to the rest of the ladder.

The dashed box is an idea, a living policy, use cases with owners and a yes, no or not yet. We haven't built it. I'm not going to oversell it.
-->

---

# Describing to Publishing: internal, then external

<div class="mt-2 grid grid-cols-[320px_1fr] gap-6 items-stretch" style="height: 420px">
  <RegistryLine />
  <div class="reg-frame">
    <div class="reg-frame__bar"><span class="reg-frame__dot" /><span class="reg-frame__url">canada.clarable.ai/register</span></div>
    <iframe src="https://canada.clarable.ai/register" class="reg-frame__iframe" title="Canada AI register" />
  </div>
</div>

<style scoped>
.reg-frame { display: flex; flex-direction: column; border: 1px solid rgba(0, 21, 20, 0.12); border-radius: 10px; overflow: hidden; background: #fff; box-shadow: 0 18px 34px -24px rgba(0, 21, 20, 0.45); }
.reg-frame__bar { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0.7rem; background: #f3f3ef; border-bottom: 1px solid rgba(0, 21, 20, 0.08); }
.reg-frame__dot { width: 9px; height: 9px; border-radius: 999px; background: #d3d2cc; }
.reg-frame__url { font-family: 'JetBrains Mono', monospace; font-size: 0.62rem; color: #72726c; }
.reg-frame__iframe { flex: 1; border: 0; width: 100%; }
</style>

<!--
Describing to Publishing
Once use cases and deployed systems are drawn as records, you have an internal registry. Some entries stay inside: the drafting use case is the organization's own business. Some cross the line: a grant-screening assistant that affects applicants, cameras counting visitors, a public chatbot.

The act in the middle is selection. Who decides what crosses, and on what basis. We don't have a settled answer; today it's a judgment call by whoever owns the registry.

On the right is the half that exists. Canada's register, every entry in the open standard, several hundred systems from the government's own published assessments. Same shape as the sign on the street at the start.
-->

---

# A proposed maturity model of AI transparency

<div class="mt-4">
  <SpectrumSlide loops="faint" />
</div>

<!--
A proposed maturity model
Everything in this talk, in order. An organization is somewhere on this line.

In the dark: staff use AI, nobody can see how. Sensing: ask lightly, and the dots get names. Governing: the dots cluster into use cases, and the blanks become policy questions. Describing: each system gets a record, an internal registry. Publishing: selected records cross the line in the open standard. Engaging: people outside read them, use their rights, and answer back.

Notice there are no status badges. The left is drawn fuzzy because it is fuzzy: that's where we're experimenting, with one organization, this year. The right is drawn solid because it exists: two public registers, a schema, an API. DTPR's bracket starts faint under Governing, where we just showed you a use case drawn as a record, and goes solid from Describing.

The two arcs underneath are feedback. Next slide.
-->

---

# Two tracks, one question

<div class="mt-1">
  <SpectrumSlide loops="lit" dim compact />
</div>

<div class="tracks mt-2 grid grid-cols-2 gap-8 max-w-5xl mx-auto text-left">
  <div class="trk">
    <div class="trk__k trk__k--in">Internal track · staff</div>
    <ul>
      <li>See how colleagues use AI</li>
      <li>See how much they trust it</li>
      <li>See where the organization's median is heading</li>
    </ul>
  </div>
  <div class="trk">
    <div class="trk__k trk__k--out">External track · the public</div>
    <ul>
      <li>Rights, and a way to use each one</li>
      <li>Risks, and the mitigations already planned</li>
      <li>What people raise, back into the organization</li>
    </ul>
  </div>
</div>

<div class="q mt-3 text-center">One record with two audiences, or two systems?</div>

<style scoped>
.trk ul { list-style: none; padding: 0; margin: 0.3rem 0 0; font-size: 0.8rem; line-height: 1.35; display: flex; flex-direction: column; gap: 0.15rem; }
.trk li::before { content: '· '; color: #72726c; }
.trk__k { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; }
.trk__k--in { color: #001514; }
.trk__k--out { color: var(--hp-blue-700); }
.q { font-family: var(--hp-serif); font-size: 1.5rem; color: var(--hp-blue-900); }
</style>

<!--
Two tracks, one question
Two loops. The internal one, in black, runs from the internal registry back to Governing. Staff see how colleagues use AI, how much they trust it, where the organization's median is moving. The first organization told us that was the useful part, for leadership and staff alike. Disclosure that's useful to the people disclosing.

The external one, in teal, runs from Engaging all the way back to Sensing. What the public raises, through their rights and their recourse, is something new for the organization to listen for.

They return to different places and they serve different people. So: one record with two audiences, or two systems? We haven't decided, and this is the room I'd most like to hear argue it.
-->

---

# What exists, and what we're asking for

<div class="mt-6 grid grid-cols-2 gap-10 max-w-5xl mx-auto text-left">
  <div class="ex">
    <div class="ex__k">Exists today</div>
    <ul class="ex__list">
      <li><strong>The standard</strong>, open: schema, REST API, MCP server, agent skill, UI components. One type for sensors and AI, eleven languages.</li>
      <li><strong>Two public registers</strong>: nyc.clarable.ai and canada.clarable.ai, drafted from governments' own assessments.</li>
      <li><strong>Two sensing instruments</strong>: a staff questionnaire, run once, and a weekly check-in, built and not yet run end to end.</li>
    </ul>
  </div>
  <div class="ex ex--ask">
    <div class="ex__k ex__k--ask">Two asks</div>
    <ul class="ex__list">
      <li><strong>Organizations willing to try Sensing.</strong> A few weeks of check-ins, shown back without names, and a use-case record at the end.</li>
      <li><strong>Research collaborators</strong> on comprehension and legitimacy. Does a non-expert understand what a record says? Does a published registry change what an organization does?</li>
    </ul>
  </div>
</div>

<style scoped>
.ex__k { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #72726c; margin-bottom: 0.8rem; }
.ex__k--ask { color: var(--hp-blue-700); }
.ex__list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.8rem; font-size: 0.86rem; line-height: 1.4; }
.ex__list li { padding-left: 0.9rem; border-left: 2px solid rgba(0, 21, 20, 0.15); }
.ex--ask .ex__list li { border-left-color: var(--hp-blue-500); }
</style>

<!--
What exists, and the ask
Left: the built half. Everything is open. Right: two asks, not three. Organizations willing to try Sensing with us, a few weeks of check-ins. And researchers who want to study whether any of this lands: comprehension on the public side, legitimacy on the organizational side.
-->

---
layout: center
class: text-center
---

<div class="relative w-full">
  <IconWall />
  <div class="absolute inset-0 flex flex-col items-center justify-center">
    <div class="thanks">
      <img :src="'/images/dtpr-black.png'" alt="DTPR" class="h-16 w-auto mx-auto" />
      <div class="thanks__links">
        <a href="https://dtpr.io">dtpr.io</a>
        <span>·</span>
        <a href="https://canada.clarable.ai">canada.clarable.ai</a>
        <span>·</span>
        <a href="https://helpfulplaces.com">helpfulplaces.com</a>
      </div>
      <div class="thanks__who">Jonathan Pichot · Helpful Places</div>
    </div>
  </div>
</div>

<style scoped>
.thanks { background: var(--hp-cream); padding: 1.6rem 2.4rem; border-radius: 16px; box-shadow: 0 0 0 1px rgba(0, 21, 20, 0.08); }
.thanks__links { margin-top: 1rem; font-family: 'JetBrains Mono', monospace; font-size: 0.95rem; display: flex; gap: 0.8rem; justify-content: center; }
.thanks__links a { color: var(--hp-blue-700); text-decoration: none; border-bottom: 1px solid rgba(0, 123, 122, 0.4); }
.thanks__links span { color: #72726c; }
.thanks__who { margin-top: 0.9rem; font-size: 0.8rem; color: #72726c; }
</style>

<!--
Thanks
Every element in the schema behind me, fetched live. Links, name, and the question again: one record with two audiences, or two systems.
-->
