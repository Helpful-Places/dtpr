<!-- <script setup lang="ts">
// Speculative mock: the deck's real record (nyc-myschools-match) landing
// in a parent's mailbox as a placement letter. The bordered DTPR block is
// the Card level printed on paper: mini data-flow, autonomy sentence,
// rights with concrete actions, QR back to the register. Copy is mined
// from public/data/nyc-myschools-match.datachain.json but deliberately
// re-worded plain (no "Gale–Shapley", no "DIIT", no "FERPA") — the
// comprehension-audit pass, applied. `highlight` dims the letter and
// rings the block, matching AlgorithmHeader's slide convention.
import { getElementIconUrl } from '../../setup/dtpr'

interface Props {
  highlight?: boolean
}

withDefaults(defineProps<Props>(), { highlight: false })

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string, variant?: string) => getElementIconUrl(SCHEMA, id, variant)
</script>

<template>
  <div class="letter" :class="{ 'letter--highlight': highlight }">
    <div class="letter__head">
      <div class="letter__head-name">NYC Public Schools</div>
      <div class="letter__head-office">Office of Student Enrollment</div>
    </div>

    <div class="letter__meta">
      <span>March 5, 2027</span>
      <span class="letter__meta-re">Re: Your child’s high school match</span>
    </div>

    <div class="letter__body">
      <p>Dear Ms. Rivera,</p>
      <p>
        Your child has been matched to <b>Brooklyn Technical High School</b> — choice #2 on your
        application. Seats are assigned by a matching algorithm that compares each family’s
        ranked choices with each school’s seats and admissions priorities. Here is how that
        decision was made, and what you can do next.
      </p>
    </div>

    <div class="letter__dtpr">
      <div class="letter__zl">How this decision was made</div>

      <div class="letter__flow">
        <div class="letter__cell">
          <img :src="icon('input_sensitive_personal', 'identifiable')" alt="" width="30" height="30" />
          <div class="letter__cell-title">Your application</div>
          <span class="letter__pill" style="--tagc: #FFD700"><span class="letter__pill-dot" />Identifiable</span>
          <div class="letter__cell-caption">grades, test scores, home address, your ranked choices</div>
        </div>
        <div class="letter__arrow">→</div>
        <div class="letter__cell">
          <img :src="icon('optimization')" alt="" width="30" height="30" />
          <div class="letter__cell-title">Matching algorithm</div>
          <div class="letter__cell-caption">pairs students and schools using your choices and each school’s priorities</div>
        </div>
        <div class="letter__arrow">→</div>
        <div class="letter__cell">
          <img :src="icon('output_decision', 'identifiable')" alt="" width="30" height="30" />
          <div class="letter__cell-title">Your school match</div>
          <span class="letter__pill" style="--tagc: #FFD700"><span class="letter__pill-dot" />Identifiable</span>
          <div class="letter__cell-caption">a binding seat assignment</div>
        </div>
      </div>

      <div class="letter__autonomy">
        The algorithm decides the match; school staff then carry out enrollment. It runs daily
        during admissions season, monitored by NYC Public Schools staff.
      </div>

      <div class="letter__zl">Your rights</div>
      <div class="letter__rights">
        <div class="letter__right">
          <img :src="icon('right_contest')" alt="" width="20" height="20" />
          <span class="letter__right-title">Contest the match</span>
          <span class="letter__act">form · File a Round 2 appeal</span>
        </div>
        <div class="letter__right">
          <img :src="icon('right_to_human_review')" alt="" width="20" height="20" />
          <span class="letter__right-title">Ask for a human review</span>
          <span class="letter__act">url · Appeals process</span>
        </div>
      </div>

      <div class="letter__record">
        <QrPlaceholder :size="50" />
        <div class="letter__record-text">
          <div class="letter__record-scan">Scan for the full record · <b>nyc.clarable.ai</b></div>
          <div class="letter__record-ref">record nyc-myschools-match · ai@2026-05-06-beta</div>
        </div>
      </div>
    </div>

    <div class="letter__sig">
      <p>With best wishes for the school year ahead,</p>
      <p class="letter__sig-name">Office of Student Enrollment</p>
    </div>
  </div>
</template>

<style scoped>
.letter {
  width: 620px;
  max-width: 100%;
  background: #fff;
  padding: 1.25rem 2rem 1.2rem;
  box-shadow: 0 24px 50px -24px rgba(0, 21, 20, 0.4);
  color: #1b1b19;
  text-align: left;
}

.letter__head {
  border-bottom: 1.5px solid #001514;
  padding-bottom: 0.45rem;
}
.letter__head-name {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.letter__head-office {
  font-size: 0.6rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #72726c;
  margin-top: 0.1rem;
}

.letter__meta {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  font-family: var(--hp-serif, 'Sorts Mill Goudy', serif);
  font-size: 0.74rem;
  margin-top: 0.6rem;
  color: rgba(27, 27, 25, 0.85);
}
.letter__meta-re {
  font-style: italic;
}

.letter__body {
  font-family: var(--hp-serif, 'Sorts Mill Goudy', serif);
  font-size: 0.76rem;
  line-height: 1.45;
  margin-top: 0.4rem;
}
.letter__body p {
  margin: 0 0 0.45rem;
}

.letter__head,
.letter__meta,
.letter__body,
.letter__sig {
  transition: opacity 300ms ease;
}
.letter--highlight .letter__head,
.letter--highlight .letter__meta,
.letter--highlight .letter__body,
.letter--highlight .letter__sig {
  opacity: 0.35;
}

/* The DTPR block: sans-serif on a serif letter — the grammar is the
   constant across media, the medium supplies the frame. */
.letter__dtpr {
  border: 1.5px solid #001514;
  border-radius: 4px;
  padding: 0.75rem 0.9rem 0.7rem;
  margin-top: 0.4rem;
  transition: box-shadow 300ms ease, background-color 300ms ease;
}
.letter--highlight .letter__dtpr {
  box-shadow: 0 0 0 3px #dc2626;
  background: rgba(220, 38, 38, 0.02);
}

.letter__zl {
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #72726c;
  margin-bottom: 0.45rem;
}
.letter__zl + .letter__zl,
.letter__autonomy + .letter__zl {
  margin-top: 0.6rem;
}

.letter__flow {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 0.5rem;
  align-items: start;
}
.letter__cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.2rem;
}
.letter__cell-title {
  font-size: 0.68rem;
  font-weight: 700;
  margin-top: 0.1rem;
}
.letter__cell-caption {
  font-size: 0.58rem;
  color: #72726c;
  line-height: 1.35;
}
.letter__arrow {
  align-self: center;
  font-size: 1rem;
  color: #72726c;
  opacity: 0.7;
}

.letter__autonomy {
  font-size: 0.66rem;
  line-height: 1.45;
  color: rgba(27, 27, 25, 0.85);
  margin-top: 0.55rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.letter__rights {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.4rem;
}
.letter__right {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.letter__right-title {
  font-size: 0.66rem;
  font-weight: 600;
}

.letter__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.56rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.05rem 0.5rem 0.05rem 0.4rem;
  background: color-mix(in srgb, var(--tagc) 12%, #fff);
  border: 1px solid color-mix(in srgb, var(--tagc) 42%, transparent);
}
.letter__pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--tagc);
}

.letter__act {
  display: inline-flex;
  align-items: center;
  font-size: 0.6rem;
  font-weight: 600;
  color: var(--hp-blue-500, #007b7a);
  border: 1px solid color-mix(in srgb, var(--hp-blue-500, #007b7a) 34%, transparent);
  border-radius: 999px;
  padding: 0.08rem 0.55rem;
  background: #fff;
}

.letter__record {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.letter__record-scan {
  font-size: 0.64rem;
}
.letter__record-scan b {
  color: var(--hp-blue-500, #007b7a);
}
.letter__record-ref {
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.54rem;
  color: #72726c;
  margin-top: 0.15rem;
}

.letter__sig {
  font-family: var(--hp-serif, 'Sorts Mill Goudy', serif);
  font-size: 0.78rem;
  margin-top: 0.7rem;
}
.letter__sig p {
  margin: 0 0 0.2rem;
}
.letter__sig-name {
  font-weight: 600;
}
</style> -->


<script setup lang="ts">
// Speculative mock: the deck's real record (nyc-myschools-match) landing
// in a parent's mailbox as a placement letter. The bordered DTPR block is
// the Card level printed on paper: mini data-flow, autonomy sentence,
// rights with concrete actions, QR back to the register. Copy is mined
// from public/data/nyc-myschools-match.datachain.json but deliberately
// re-worded plain (no "Gale–Shapley", no "DIIT", no "FERPA") — the
// comprehension-audit pass, applied. `highlight` dims the letter and
// rings the block, matching AlgorithmHeader's slide convention.
//
// LO-FI PASS: same structure/content, restyled as a paper-prototype sketch
// using Tailwind utilities only (arbitrary values for the hand-drawn
// details). Icons are untouched — no filters, no swaps.
import { getElementIconUrl } from '../../setup/dtpr'

interface Props {
  highlight?: boolean
}

withDefaults(defineProps<Props>(), { highlight: false })

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string, variant?: string) => getElementIconUrl(SCHEMA, id, variant)
</script>

<template>
  <div
    class="relative w-[620px] max-w-full -rotate-[0.3deg] bg-elevated px-8 py-5 text-left text-[#2b2b28] font-handwritten shadow-[2px_3px_0_rgba(43,43,40,0.08),0_20px_45px_-26px_rgba(0,0,0,0.35)]"
  >
    <!-- faux torn/rough paper edge -->
    <div
      class="pointer-events-none absolute -inset-1 rotate-[0.4deg] rounded-[3px_6px_2px_7px/6px_2px_7px_3px] border-[1.5px] border-[#2b2b28]/35"
    />

    <div
      class="border-b-2 border-[#2b2b28] pb-2 transition-opacity duration-300"
      :class="highlight ? 'opacity-30' : 'opacity-100'"
    >
      <div class="font-handwritten text-2xl font-bold leading-none">Public School</div>
      <div class="mt-1 text-[0.68rem] tracking-wide text-[#6b6a63]">office of student enrollment</div>
    </div>

    <div
      class="mt-2 flex justify-between gap-4 text-[0.82rem] text-[#2b2b28]/75 transition-opacity duration-300"
      :class="highlight ? 'opacity-30' : 'opacity-100'"
    >
      <span>March 5, 2027</span>
      <span class="underline decoration-wavy decoration-[#2b2b28]/40 underline-offset-2">re: your child's high school match</span>
    </div>

    <div
      class="mt-1.5 text-[0.85rem] leading-relaxed transition-opacity duration-300"
      :class="highlight ? 'opacity-30' : 'opacity-100'"
    >
      <p class="mb-2">Dear Ms. Rivera,</p>
      <p class="mb-2">
        Your child has been matched to <b>Technical High School</b> — choice #2 on your
        application. Seats are assigned by a matching algorithm that compares each family's
        ranked choices with each school's seats and admissions priorities. Here's how that
        decision was made, and what you can do next.
      </p>
    </div>

    <div
      class="relative mt-2 rotate-[0.4deg] rounded-[14px_3px_16px_4px/4px_14px_3px_16px] border-2 border-dashed border-[#2b2b28] px-4 py-3 transition-all duration-300"
      :class="highlight ? '-rotate-[0.2deg] scale-[1.01] bg-elevated' : ''"
    >
      <!-- wobbly highlight ring -->
      <div
        v-if="highlight"
        class="pointer-events-none absolute -inset-2 rounded-[40%_45%_42%_48%/48%_42%_45%_40%] border-[3px] border-red-600/75"
      />

      <div class="mb-1.5 text-[0.72rem] font-bold text-[#6b6a63] underline decoration-wavy decoration-[#2b2b28]/30 underline-offset-4">
        how this decision was made
      </div>

      <div class="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-2">
        <div class="flex flex-col items-center gap-1 text-center">
          <span class="flex h-10 w-10 items-center justify-center rounded-[46%_54%_52%_48%/48%_44%_56%_52%] border-[1.5px] border-dashed border-[#2b2b28]">
            <img :src="icon('input_sensitive_personal', 'identifiable')" alt="" width="26" height="26" />
          </span>
          <div class="mt-px text-[0.78rem] font-bold">your application</div>
          <span class="-rotate-[1.5deg] inline-flex items-center gap-1 rounded-40% border-[1.5px] border-dashed border-[#2b2b28] px-2 py-0.5 text-[0.64rem] font-bold">
            <span class="h-1.5 w-1.5 rounded-full bg-elevated" />identifiable
          </span>
          <div class="text-[0.66rem] leading-snug text-[#6b6a63]">grades, test scores, home address, your ranked choices</div>
        </div>

        <div class="mt-4 -rotate-3 self-center text-[0.95rem] font-bold">~&gt;</div>

        <div class="flex flex-col items-center gap-1 text-center">
          <span class="flex h-10 w-10 items-center justify-center rounded-[46%_54%_52%_48%/48%_44%_56%_52%] border-[1.5px] border-dashed border-[#2b2b28]">
            <img :src="icon('optimization')" alt="" width="26" height="26" />
          </span>
          <div class="mt-px text-[0.78rem] font-bold">matching algorithm</div>
          <div class="text-[0.66rem] leading-snug text-[#6b6a63]">pairs students &amp; schools using your choices and each school's priorities</div>
        </div>

        <div class="mt-4 -rotate-3 self-center text-[0.95rem] font-bold">~&gt;</div>

        <div class="flex flex-col items-center gap-1 text-center">
          <span class="flex h-10 w-10 items-center justify-center rounded-[46%_54%_52%_48%/48%_44%_56%_52%] border-[1.5px] border-dashed border-[#2b2b28]">
            <img :src="icon('output_decision', 'identifiable')" alt="" width="26" height="26" />
          </span>
          <div class="mt-px text-[0.78rem] font-bold">your school match</div>
          <span class="-rotate-[1.5deg] inline-flex items-center gap-1 rounded-40% border-[1.5px] border-dashed border-[#2b2b28] px-2 py-0.5 text-[0.64rem] font-bold">
            <span class="h-1.5 w-1.5 rounded-full bg-elevated" />identifiable
          </span>
          <div class="text-[0.66rem] leading-snug text-[#6b6a63]">a binding seat assignment</div>
        </div>
      </div>

      <div class="mt-2 flex gap-2 border-t-2 border-dotted border-[#2b2b28]/40 pt-2 text-[0.74rem] leading-relaxed text-[#2b2b28]/85">
        <span class="-rotate-[8deg] shrink-0 opacity-70">✎</span>
        the algorithm decides the match; school staff then carry out enrollment. it runs daily
        during admissions season, monitored by NYC Public Schools staff.
      </div>

      <div class="mt-2.5 mb-1.5 text-[0.72rem] font-bold text-[#6b6a63] underline decoration-wavy decoration-[#2b2b28]/30 underline-offset-4">
        your rights
      </div>
      <div class="flex flex-wrap gap-x-5 gap-y-2">
        <div class="inline-flex items-center gap-1.5">
          <img :src="icon('right_contest')" alt="" width="16" height="16" />
          <span class="text-[0.74rem] font-bold underline decoration-wavy decoration-[#2b2b28]/35 underline-offset-2">contest the match</span>
          <span class="border-b-2 border-dashed border-[#2b2b28]/50 pb-px text-[0.68rem] font-bold">[ form ] file a round 2 appeal</span>
        </div>
        <div class="inline-flex items-center gap-1.5">
          <img :src="icon('right_to_human_review')" alt="" width="16" height="16" />
          <span class="text-[0.74rem] font-bold underline decoration-wavy decoration-[#2b2b28]/35 underline-offset-2">ask for a human review</span>
          <span class="border-b-2 border-dashed border-[#2b2b28]/50 pb-px text-[0.68rem] font-bold">[ url ] appeals process</span>
        </div>
      </div>

      <div class="mt-2.5 flex items-center gap-3 border-t-2 border-dotted border-[#2b2b28]/40 pt-2">
        <div class="rotate-[1.5deg] shrink-0 rounded-md border-2 border-dashed border-[#2b2b28] p-1 opacity-85">
          <QrPlaceholder :size="42" />
        </div>
        <div>
          <div class="text-[0.72rem]">
            scan for the full record → <b class="underline decoration-wavy">nyc.clarable.ai</b>
          </div>
          <div class="mt-1 font-handwritten text-[0.6rem] text-[#6b6a63]">record nyc-myschools-match · ai@2026-05-06-beta</div>
        </div>
      </div>
    </div>

    <div
      class="mt-3 text-[0.85rem] transition-opacity duration-300"
      :class="highlight ? 'opacity-30' : 'opacity-100'"
    >
      <p class="mb-1">With best wishes for the school year ahead,</p>
      <p class="font-handwritten text-[1.3rem] font-semibold">Office of Student Enrollment</p>
    </div>
  </div>
</template>
