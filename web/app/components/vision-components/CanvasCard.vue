<script setup lang="ts">
// The canvas, folded — Level 2 of the one-record-many-surfaces framework.
// Same system and same grammar as DtprCanvas (face-gates, MT-FG-104),
// compressed to a single cell at natural card size. The fold keeps what
// the DTPR design principles say always survives — accountable, purpose,
// identifiability, autonomy, one path to act — and leaves the rest
// (vendor, retention facts, risks, escalation) on the full record. Use
// cases: the sheet a Line expands into, register list cards, first-run
// sheets, embeds; printed, the letter's block is this card on paper.
import { getElementIconUrl } from '../../setup/dtpr'

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string) => getElementIconUrl(SCHEMA, id)
</script>


<template>
  <div class="w-[372px] -rotate-[0.2deg] overflow-hidden border-2 border-dashed border-primary bg-elevated font-handwritten text-default shadow-[2px_3px_0_rgba(0,0,0,0.05)] rounded-[16px_5px_18px_4px/5px_16px_4px_18px]">
    <div class="flex items-start justify-between gap-3 px-4 pb-3 pt-3.5">
      <div>
        <span class="mb-0.5 block text-[0.62rem] font-bold text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">mt-fg-104</span>
        <h3 class="m-0 text-[1.02rem] font-bold leading-tight">Face-matching fare gates</h3>
      </div>
      <span class="flex-none -rotate-[1deg] inline-flex items-center gap-1.5 whitespace-nowrap rounded-[999px] border-[1.5px] border-dashed border-primary bg-elevated px-2.5 py-1 text-[0.72rem] font-bold">
        <img :src="icon('entry')" alt="" width="20" height="20" class="block object-contain" />
        <span><span class="font-bold text-[0.6rem] text-default/50">for</span> Entry</span>
      </span>
    </div>

    <div class="border-t-2 border-dashed border-primary/40 px-4 py-2.5">
      <div class="mb-1.5 text-[0.6rem] font-bold text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">run by</div>
      <div class="flex flex-wrap items-center gap-2">
        <img :src="icon('institution')" alt="" width="24" height="24" class="flex-none block object-contain" />
        <span class="text-[0.88rem] font-bold">Metro Transit</span>
      </div>
    </div>

    <div class="border-t-2 border-dashed border-primary/40 px-4 py-2.5">
      <div class="mb-1.5 text-[0.6rem] font-bold text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">the system</div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="flex flex-none gap-1">
          <img :src="icon('perceptive_mode')" alt="" width="26" height="26" class="block object-contain" />
          <img :src="icon('analytical_mode')" alt="" width="26" height="26" class="block object-contain" />
        </span>
        <span class="text-[0.82rem]">
          The system senses and decides
          <span
            class="relative rounded-sm px-0.5 [box-decoration-break:clone] [-webkit-box-decoration-break:clone]"
            style="background-image: linear-gradient(180deg, transparent 0 52%, color-mix(in srgb, #E76F51 58%, transparent) 52% 92%, transparent 92%);"
          >on its own</span>.
        </span>
        <span class="ml-auto flex-none inline-flex items-center gap-1.5 whitespace-nowrap rounded-[999px] border-[1.5px] border-dashed border-[#E76F51] bg-[color-mix(in_srgb,#E76F51_12%,white)] px-2.5 py-0.5 text-[0.62rem] font-bold">
          <span class="h-1.5 w-1.5 flex-none rounded-full bg-[#E76F51]" />
          Autonomous
        </span>
      </div>
    </div>

    <div class="border-t-2 border-dashed border-primary/40 px-4 py-2.5">
      <div class="mb-1.5 text-[0.6rem] font-bold text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">data</div>
      <div class="flex flex-wrap items-center gap-2">
        <img :src="icon('input_biometric')" alt="" width="24" height="24" class="flex-none block object-contain" />
        <span class="text-[0.82rem]"><b class="font-bold">your face</b> → match / no-match</span>
        <span class="ml-auto flex-none inline-flex items-center gap-1.5 whitespace-nowrap rounded-[999px] border-[1.5px] border-dashed border-[#FFD700] bg-[color-mix(in_srgb,#FFD700_12%,white)] px-2.5 py-0.5 text-[0.62rem] font-bold">
          <span class="h-1.5 w-1.5 flex-none rounded-full bg-[#FFD700]" />
          Identifiable
        </span>
      </div>
    </div>

    <div class="border-t-2 border-dashed border-primary/40 px-4 py-2.5">
      <div class="mb-1.5 text-[0.6rem] font-bold text-default/50 underline decoration-wavy decoration-primary/40 underline-offset-2">you can</div>
      <div class="flex flex-wrap items-center gap-2">
        <img :src="icon('right_object')" alt="" width="22" height="22" class="flex-none block object-contain" />
        <span class="inline-flex items-center gap-1.5 rounded-[999px] border-[1.5px] border-dashed border-primary bg-elevated px-2.5 py-0.5 text-[0.7rem] font-bold">Get a fare card</span>
        <span class="text-[0.66rem] text-default/50">+ 2 more on the full record</span>
      </div>
    </div>

    <div class="flex items-center justify-between gap-2.5 border-t-2 border-dashed border-primary/40 bg-elevated px-4 py-2.5">
      <span class="inline-flex items-center gap-1.5 rounded-[999px] border-2 border-dashed border-primary bg-primary/10 px-2.5 py-1 text-[0.7rem] font-bold">Full record →</span>
      <span class="font-handwritten text-[0.56rem] text-default/50">record MT-FG-104 · ai@2026-05-06-beta</span>
    </div>
  </div>
</template>

<!-- <template>
  <div class="card-root">
    <div class="crow crow--head">
      <div>
        <span class="sysno">MT-FG-104</span>
        <h3>Face-matching fare gates</h3>
      </div>
      <span class="chip">
        <img :src="icon('entry')" alt="" width="20" height="20" />
        <span><span class="k">For</span> Entry</span>
      </span>
    </div>

    <div class="crow">
      <div class="zl">Run by</div>
      <div class="cline">
        <img :src="icon('institution')" alt="" width="24" height="24" />
        <span class="cname">Metro Transit</span>
      </div>
    </div>

    <div class="crow">
      <div class="zl">The system</div>
      <div class="cline">
        <span class="mode-icons">
          <img :src="icon('perceptive_mode')" alt="" width="26" height="26" />
          <img :src="icon('analytical_mode')" alt="" width="26" height="26" />
        </span>
        <span class="csent">The system senses and decides <span class="mk mk-color" style="--mkc: #E76F51">on its own</span>.</span>
        <span class="tag" style="--tagc: #E76F51">Autonomous</span>
      </div>
    </div>

    <div class="crow">
      <div class="zl">Data</div>
      <div class="cline">
        <img :src="icon('input_biometric')" alt="" width="24" height="24" />
        <span class="cdata"><b>your face</b> → match / no-match</span>
        <span class="tag" style="--tagc: #FFD700">Identifiable</span>
      </div>
    </div>

    <div class="crow">
      <div class="zl">You can</div>
      <div class="cline">
        <img :src="icon('right_object')" alt="" width="22" height="22" />
        <span class="act">Get a fare card</span>
        <span class="cmore">+ 2 more on the full record</span>
      </div>
    </div>

    <div class="crow crow--foot">
      <span class="act act--solid">Full record →</span>
      <span class="cref">record MT-FG-104 · ai@2026-05-06-beta</span>
    </div>
  </div>
</template>

<style scoped>
/* Same palette + grammar atoms as DtprCanvas (ported from
   prototypes/canvas canvas.css); the card is one tile of that board. */
.card-root {
  --card: #fff;
  --ink: #1b1b19;
  --muted: #72726c;
  --line: #e6e5e0;
  --chip: #f3f3ef;
  --teal: #0f5153;
  width: 372px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(27, 27, 25, 0.04), 0 16px 36px -30px rgba(27, 27, 25, 0.3);
  font-family: 'Public Sans', 'Helvetica Neue', system-ui, -apple-system, sans-serif;
  color: var(--ink);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}

.crow {
  padding: 9px 16px 10px;
  border-top: 1px solid var(--line);
}
.crow--head {
  border-top: none;
  padding: 13px 16px 11px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.sysno {
  display: block;
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 2px;
}
.crow--head h3 {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.chip {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  background: var(--chip);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 4px 11px 4px 7px;
  white-space: nowrap;
}
.chip img { display: block; object-fit: contain; }
.chip .k { font-weight: 600; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }

.zl {
  font-size: 0.56rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 5px;
}

.cline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.cline img { flex: none; object-fit: contain; display: block; }
.cname { font-size: 0.88rem; font-weight: 700; }
.mode-icons { display: inline-flex; gap: 5px; flex: none; }
.csent { font-size: 0.82rem; }
.cdata { font-size: 0.82rem; }
.cdata b { font-weight: 700; }
.cmore { font-size: 0.66rem; color: var(--muted); }

.mk {
  display: inline;
  padding: 0 0.12em;
  border-radius: 2px;
  background: linear-gradient(180deg, transparent 0 52%, var(--mkfill) 52% 92%, transparent 92%);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.mk-color { --mkfill: color-mix(in srgb, var(--mkc) 58%, transparent); }

.tag {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.62rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--ink);
  background: color-mix(in srgb, var(--tagc, var(--muted)) 12%, var(--card));
  border: 1px solid color-mix(in srgb, var(--tagc, var(--muted)) 42%, transparent);
  border-radius: 999px;
  padding: 2px 9px 2px 7px;
  margin-left: auto;
}
.tag::before {
  content: '';
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--tagc, var(--muted));
}

.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--teal);
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--teal) 34%, transparent);
  border-radius: 999px;
  padding: 3px 11px;
}
.act--solid {
  background: var(--teal);
  color: #fff;
  border-color: var(--teal);
}

.crow--foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: #fafaf8;
  padding: 10px 16px;
}
.cref {
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.56rem;
  color: var(--muted);
}
</style> -->
