<script setup lang="ts">
// The maturity model, drawn as progressive resolution. Six stages, left to
// right: In the dark, Sensing, Governing, Describing, Publishing, Engaging.
// The same set of "uses" is drawn in every column; what changes is how much
// structure they have. Left columns are dashed and muted, right columns are
// solid and carry real DTPR icons from the API. No status badges: the
// fuzziness is the status.
//
// `loops`: 'none' hides the two feedback arcs, 'faint' draws them lightly,
// 'lit' draws them in teal with their captions (the two-track slide).
// `dim` fades the columns so the loops carry the slide.
import { getElementIconUrl } from '../setup/dtpr'

// `bare` shows the six columns only: no captions, no loops, no DTPR bracket.
withDefaults(defineProps<{ loops?: 'none' | 'faint' | 'lit', dim?: boolean, compact?: boolean, bare?: boolean }>(), {
  loops: 'faint',
  dim: false,
  compact: false,
  bare: false,
})

const SCHEMA = 'dtpr@2026-09-01-beta'
const icon = (id: string) => getElementIconUrl(SCHEMA, id)

// Twelve uses. Positions are fixed so the cloud looks the same every run.
const DOTS = [
  [18, 22], [44, 12], [70, 30], [28, 48], [58, 52], [82, 60],
  [14, 72], [40, 80], [66, 86], [86, 18], [50, 34], [24, 94],
]
const LABELS = ['drafting', 'research', 'spreadsheets', 'summaries', 'admin', 'grants']
const GROUPS = [
  { name: 'Drafting', n: 4 },
  { name: 'Research', n: 3 },
  { name: 'Data', n: 3 },
]
const CARDS = [
  { name: 'Drafting & editing', icon: 'inform' },
  { name: 'Research', icon: 'research_development' },
  { name: 'Data & spreadsheets', icon: 'planning_decision_making' },
]
</script>

<template>
  <div class="spec" :class="[`loops-${loops}`, { dim, compact, bare }]">
    <div class="stages">
      <!-- 0 · in the dark -->
      <div class="stage s0">
        <div class="head head--none">in the dark</div>
        <div class="art">
          <span v-for="(d, i) in DOTS" :key="i" class="dot dot--fog" :style="{ left: d[0] + '%', top: d[1] + '%' }" />
        </div>
        <div class="cap">Staff use AI. Nobody can see how.</div>
      </div>

      <!-- 1 · sensing -->
      <div class="stage s1">
        <div class="head">Sensing</div>
        <div class="art">
          <div class="labels">
            <span v-for="(l, i) in LABELS" :key="l" class="lbl" :style="{ transform: `rotate(${(i % 3) - 1}deg)` }">
              <span class="dot dot--sketch" />{{ l }}
            </span>
          </div>
        </div>
        <div class="cap">Light check-ins. People say what they did.</div>
      </div>

      <!-- 2 · governing -->
      <div class="stage s2">
        <div class="head">Governing</div>
        <div class="art">
          <div class="groups">
            <div v-for="g in GROUPS" :key="g.name" class="group">
              <span class="group__name">{{ g.name }}</span>
              <span class="group__dots"><span v-for="n in g.n" :key="n" class="dot dot--sketch" /></span>
            </div>
          </div>
        </div>
        <div class="cap">Uses become use cases. Blanks become policy questions.</div>
      </div>

      <!-- 3 · describing -->
      <div class="stage s3">
        <div class="head">Describing</div>
        <div class="art">
          <div class="cards">
            <div v-for="c in CARDS" :key="c.name" class="card">
              <img :src="icon(c.icon)" alt="" width="22" height="22" />
              <span class="card__t">{{ c.name }}</span>
              <i /><i />
            </div>
          </div>
        </div>
        <div class="cap">An internal registry. Each system, one record.</div>
      </div>

      <!-- 4 · publishing -->
      <div class="stage s4">
        <div class="head">Publishing</div>
        <div class="art art--line">
          <div class="publine"><span>public</span></div>
          <div class="cards cards--split">
            <div class="card card--kept">
              <img :src="icon(CARDS[2].icon)" alt="" width="22" height="22" />
              <span class="card__t">{{ CARDS[2].name }}</span>
              <i /><i />
            </div>
            <div class="card card--out">
              <img :src="icon(CARDS[0].icon)" alt="" width="22" height="22" />
              <span class="card__t">{{ CARDS[0].name }}</span>
              <i /><i />
            </div>
            <div class="card card--out">
              <img :src="icon(CARDS[1].icon)" alt="" width="22" height="22" />
              <span class="card__t">{{ CARDS[1].name }}</span>
              <i /><i />
            </div>
          </div>
        </div>
        <div class="cap">Selected records cross the line, in the open standard.</div>
      </div>

      <!-- 5 · engaging -->
      <div class="stage s5">
        <div class="head">Engaging</div>
        <div class="art">
          <div class="cards">
            <div class="card card--marked">
              <img :src="icon(CARDS[0].icon)" alt="" width="22" height="22" />
              <span class="card__t">{{ CARDS[0].name }}</span>
              <i /><i />
              <span class="mark mark--a" /><span class="mark mark--b" />
            </div>
            <div class="card card--marked">
              <img :src="icon(CARDS[1].icon)" alt="" width="22" height="22" />
              <span class="card__t">{{ CARDS[1].name }}</span>
              <i /><i />
              <span class="mark mark--c" />
            </div>
          </div>
        </div>
        <div class="cap">People read, use their rights, and answer back.</div>
      </div>
    </div>

    <!-- feedback loops, drawn under the columns -->
    <svg class="loops" viewBox="0 0 600 70" preserveAspectRatio="none" aria-hidden="true">
      <!-- internal: Describing → Governing -->
      <path class="loop loop--in" d="M 350 4 C 350 50, 250 50, 250 10" />
      <polygon class="ah ah--in" points="244,13 256,13 250,3" />
      <!-- external: Engaging → Sensing -->
      <path class="loop loop--out" d="M 550 4 C 550 90, 150 90, 150 10" />
      <polygon class="ah ah--out" points="144,13 156,13 150,3" />
    </svg>
    <div v-if="loops === 'lit'" class="loop-cap loop-cap--in">Staff respond. Policy adjusts.</div>
    <div v-if="loops === 'lit'" class="loop-cap loop-cap--out">What people raise is something new to listen for.</div>

    <!-- DTPR bracket -->
    <div class="bracket">
      <div class="bracket__lead" />
      <div class="bracket__solid"><span>DTPR</span></div>
    </div>
  </div>
</template>

<style scoped>
.spec {
  --ink: #001514;
  --muted: #72726c;
  --fog: #c9c8c0;
  --line: #d3d2cc;
  --teal: var(--hp-blue-500);
  position: relative;
  width: 100%;
  font-family: var(--hp-sans);
  text-align: left;
}
.stages {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.6rem;
}
.stage { min-width: 0; display: flex; flex-direction: column; }
.head {
  font-weight: 700;
  font-size: 0.86rem;
  color: var(--ink);
  padding-bottom: 0.3rem;
  border-bottom: 1.5px solid var(--ink);
  margin-bottom: 0.5rem;
}
.head--none {
  font-family: var(--hp-serif);
  font-style: italic;
  font-weight: 400;
  color: var(--muted);
  border-bottom-color: transparent;
}
.s1 .head, .s2 .head { color: #3f3f3b; border-bottom-style: dashed; border-bottom-width: 1px; }
.art { position: relative; height: 190px; }
.compact .art { height: 118px; overflow: hidden; }
.compact .cap { display: none; }
.compact .labels .lbl:nth-child(n+5), .compact .groups .group:nth-child(n+3), .compact .cards .card:nth-child(n+3) { display: none; }
.cap { font-size: 0.66rem; line-height: 1.3; color: var(--muted); margin-top: 0.5rem; }
.s0 .cap, .s1 .cap { font-family: var(--hp-serif); font-style: italic; }

/* dots */
.dot { display: inline-block; width: 9px; height: 9px; border-radius: 999px; }
.dot--fog { position: absolute; background: var(--fog); filter: blur(1.4px); opacity: 0.85; }
.dot--sketch { border: 1.5px dashed #5e5e58; background: transparent; margin-right: 5px; vertical-align: -1px; }

/* sensing: labelled dots */
.labels { display: flex; flex-direction: column; gap: 0.3rem; padding-top: 0.2rem; }
.lbl {
  font-family: var(--hp-serif);
  font-style: italic;
  font-size: 0.78rem;
  color: #3f3f3b;
  display: inline-flex;
  align-items: center;
  width: fit-content;
}

/* governing: dashed groups */
.groups { display: flex; flex-direction: column; gap: 0.5rem; padding-top: 0.2rem; }
.group {
  border: 1.5px dashed #5e5e58;
  border-radius: 8px;
  padding: 0.3rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.group__name { font-size: 0.72rem; font-weight: 600; color: #3f3f3b; }
.group__dots { display: flex; gap: 0; }

/* describing onward: cards */
.cards { display: flex; flex-direction: column; gap: 0.45rem; padding-top: 0.2rem; }
.card {
  position: relative;
  background: #fff;
  border: 1px solid rgba(0, 21, 20, 0.12);
  border-left: 3px solid var(--teal);
  border-radius: 6px;
  padding: 0.35rem 0.5rem 0.4rem;
  display: grid;
  grid-template-columns: 22px 1fr;
  column-gap: 0.4rem;
  align-items: center;
  box-shadow: 0 6px 14px -12px rgba(0, 21, 20, 0.5);
}
.card img { grid-row: 1 / span 1; object-fit: contain; }
.card__t { font-size: 0.66rem; font-weight: 700; color: var(--ink); line-height: 1.15; }
.card i { grid-column: 2; height: 3px; background: #e6e5e0; border-radius: 2px; margin-top: 3px; }
.card i:last-of-type { width: 60%; }

/* publishing: the line */
.art--line { padding-left: 0.9rem; }
.publine {
  position: absolute;
  left: 0.2rem;
  top: 0;
  bottom: 0;
  border-left: 1.5px dashed var(--teal);
}
.publine span {
  position: absolute;
  top: 50%;
  left: -0.2rem;
  transform: translate(-50%, -50%) rotate(-90deg);
  font-size: 0.52rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--teal);
  background: var(--hp-cream);
  padding: 0 0.3rem;
}
.card--kept { opacity: 0.4; margin-left: -1.2rem; border-left-color: var(--line); }
.card--out { margin-left: 0.2rem; }

/* engaging: marks from outside */
.mark {
  position: absolute;
  width: 11px;
  height: 11px;
  border-radius: 999px 999px 999px 2px;
  background: var(--teal);
}
.mark--a { right: -6px; top: -5px; }
.mark--b { right: 10px; bottom: -6px; transform: scaleX(-1); opacity: 0.7; }
.mark--c { right: -6px; bottom: -5px; opacity: 0.85; }

/* loops */
.loops {
  display: block;
  width: 100%;
  height: 64px;
  margin-top: 0.1rem;
  overflow: visible;
}
.loop { fill: none; stroke-width: 1.5; stroke-linecap: round; }
.loop--in { stroke: var(--ink); stroke-dasharray: 3 4; }
.loop--out { stroke: var(--teal); }
.ah--in { fill: var(--ink); }
.ah--out { fill: var(--teal); }
.loops-none .loops { visibility: hidden; }
.loops-faint .loop, .loops-faint .ah { opacity: 0.35; }
.loops-lit .loop { stroke-width: 2.2; }
.loop-cap {
  position: absolute;
  font-size: 0.68rem;
  line-height: 1.25;
  max-width: 13rem;
  background: var(--hp-cream);
  padding: 0 0.25rem;
}
.loop-cap--in { left: 60%; bottom: 2.7rem; color: var(--ink); }
.loop-cap--out { left: 1%; bottom: 1.7rem; color: var(--teal); font-weight: 600; max-width: 15rem; }

/* DTPR bracket */
.bracket {
  display: grid;
  grid-template-columns: 2fr 1fr 3fr;
  margin-top: 0.3rem;
  height: 1.2rem;
}
.bracket__lead { grid-column: 2; border-top: 1.5px dashed rgba(0, 123, 122, 0.45); margin-top: 0.55rem; }
.bracket__solid {
  grid-column: 3;
  border-top: 2px solid var(--teal);
  border-left: 2px solid var(--teal);
  border-right: 2px solid var(--teal);
  height: 0.55rem;
  margin-top: 0.55rem;
  position: relative;
}
.bracket__solid span {
  position: absolute;
  left: 50%;
  top: -0.05rem;
  transform: translate(-50%, -50%);
  background: var(--hp-cream);
  padding: 0 0.5rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--teal);
}

/* bare: columns only */
.bare .cap, .bare .loops, .bare .loop-cap, .bare .bracket { display: none; }

/* dim for the two-track slide */
.dim .stages, .dim .bracket { opacity: 0.38; }
</style>
