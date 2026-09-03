<script setup lang="ts">
// Slidev port of the canvas prototype's board (prototypes/canvas
// CanvasBoard.vue + composition grammar), hardcoded to the EN content of
// canvas-data/systems/face-gates.ts — "what a canvas can eventually look
// like," rendered live rather than screenshotted. Faithful to the
// grammar's contracts: deployment values render as highlighter markers,
// color is spent ONLY on published classifications (PII + autonomy),
// classifications ride at the row's end as pills, rights are actions.
// Interactivity (tooltips, feedback seats, sentence view) is omitted —
// this is the artifact, not the app.
import { getElementIconUrl } from '../../setup/dtpr'

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string) => getElementIconUrl(SCHEMA, id)
</script>

<template>
  <div class="canvas-root">
    <div class="board">
      <!-- header -->
      <div class="cell span2 head">
        <div class="head-top">
          <div>
            <span class="sysno">MT-FG-104</span>
            <h2>Face-matching fare gates</h2>
          </div>
          <span class="chip">
            <img :src="icon('entry')" alt="" width="22" height="22" />
            <span><span class="k">For</span> Entry</span>
          </span>
        </div>
        <p class="read">
          Metro Transit runs face-matching gates that decide on their own who may pass.
          Used on every rider; riders can opt out and ask for a human review.
        </p>
      </div>

      <!-- run by / built by -->
      <div class="cell">
        <div class="zl">Run by</div>
        <div class="pc-a">
          <div class="pc-ic"><img :src="icon('institution')" alt="" width="44" height="44" /></div>
          <div class="astack">
            <div class="a-l1">Metro Transit</div>
            <div class="a-l2"><span class="a-type">Deployer</span></div>
          </div>
        </div>
      </div>
      <div class="cell">
        <div class="zl">Built by</div>
        <div class="pc-a">
          <div class="pc-ic"><img :src="icon('organization')" alt="" width="44" height="44" /></div>
          <div class="astack">
            <div class="a-l1">FaceGate Inc.</div>
            <div class="a-l2"><span class="a-type">Vendor</span></div>
          </div>
        </div>
      </div>

      <!-- the system sentence -->
      <div class="cell span2">
        <div class="zl">The system</div>
        <div class="sysrow">
          <div class="mode-icons">
            <img :src="icon('perceptive_mode')" alt="" width="40" height="40" />
            <img :src="icon('analytical_mode')" alt="" width="40" height="40" />
          </div>
          <p class="sys-sentence">
            The system senses and decides
            <span class="mk mk-color" style="--mkc: #E76F51">on its own</span>.
          </p>
          <span class="tag" style="--tagc: #E76F51">Autonomous</span>
        </div>
      </div>

      <!-- data flow -->
      <div class="cell span2">
        <div class="zl">Data flow</div>
        <div class="vflow">
          <div class="pc-a">
            <div class="pc-ic"><img :src="icon('input_biometric')" alt="" width="40" height="40" /></div>
            <div class="astack">
              <div class="a-l1">your face</div>
              <div class="a-l2"><span class="a-type">Biometric</span></div>
              <div class="a-l3">kept for 24 h<span class="sep">·</span>on a vendor cloud</div>
            </div>
            <span class="tag" style="--tagc: #FFD700">Identifiable</span>
          </div>
          <div class="varrow">↓</div>
          <div class="pc-a">
            <div class="pc-ic"><img :src="icon('biometric_recognition')" alt="" width="40" height="40" /></div>
            <div class="astack">
              <div class="a-l1">face match</div>
              <div class="a-l2"><span class="a-type">Biometric Recognition</span></div>
            </div>
          </div>
          <div class="varrow">↓</div>
          <div class="pc-a">
            <div class="pc-ic"><img :src="icon('output_decision')" alt="" width="40" height="40" /></div>
            <div class="astack">
              <div class="a-l1">match / no-match</div>
              <div class="a-l2"><span class="a-type">A decision about you</span></div>
              <div class="a-l3">shared with transit police</div>
            </div>
            <span class="tag" style="--tagc: #FFD700">Identifiable</span>
          </div>
        </div>
      </div>

      <!-- risks -->
      <div class="cell span2">
        <div class="zl">Risks &amp; mitigation</div>
        <div class="pc-a">
          <div class="pc-ic"><img :src="icon('civil_liberties_harm')" alt="" width="40" height="40" /></div>
          <div class="astack">
            <div class="a-l1">Civil liberties harm</div>
            <div class="a-l2 risk-narr">A misidentification can stop the wrong person at the gate.</div>
            <div class="mitig"><span class="mit-k">Mitigation</span>Human review on request</div>
          </div>
        </div>
      </div>

      <!-- used on -->
      <div class="cell">
        <div class="zl">Used on</div>
        <div class="pc-a">
          <div class="pc-ic">
            <svg width="40" height="40" viewBox="0 0 36 36" aria-hidden="true">
              <path d="M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z" fill="none" stroke="#000" stroke-width="2" />
              <g fill="#000">
                <path d="M13.5 10.6667C15.1569 10.6667 16.5 12.0098 16.5 13.6667C16.5 15.3235 15.1569 16.6667 13.5 16.6667C11.8431 16.6667 10.5 15.3235 10.5 13.6667C10.5 12.0098 11.8431 10.6667 13.5 10.6667Z" />
                <path d="M22.5 10.6667C24.1569 10.6667 25.5 12.0098 25.5 13.6667C25.5 15.3235 24.1569 16.6667 22.5 16.6667C20.8431 16.6667 19.5 15.3235 19.5 13.6667C19.5 12.0098 20.8431 10.6667 22.5 10.6667Z" />
                <path d="M13.5 18C10.1863 18 7.5 20.6863 7.5 24V25.3333H19.5V24C19.5 20.6863 16.8137 18 13.5 18Z" />
                <path d="M22.5 18C21.9316 18 21.3818 18.0791 20.8608 18.2266C22.1863 19.7061 23 21.6589 23 24V25.3333H28.5V24C28.5 20.6863 25.8137 18 22.5 18Z" />
              </g>
            </svg>
          </div>
          <div class="astack">
            <div class="a-l1">All riders</div>
            <div class="a-l2"><span class="mk mk-neutral">Decided about</span></div>
            <div class="a-l3">~2.3M people a day</div>
          </div>
        </div>
      </div>

      <!-- rights -->
      <div class="cell">
        <div class="zl">You can</div>
        <div class="rights">
          <div class="right">
            <img :src="icon('right_object')" alt="" width="26" height="26" />
            <div>
              <span class="rn">Right to Stop Processing</span>
              <span class="rs"> — opt out, tap a card instead</span>
              <div class="racts"><span class="act">Get a fare card</span></div>
            </div>
          </div>
          <div class="right">
            <img :src="icon('right_contest')" alt="" width="26" height="26" />
            <div>
              <span class="rn">Right to Contest</span>
              <span class="rs"> — challenge a match</span>
              <div class="racts"><span class="act">Start an appeal</span></div>
            </div>
          </div>
          <div class="right">
            <img :src="icon('right_to_human_review')" alt="" width="26" height="26" />
            <div>
              <span class="rn">Right to a Human Review</span>
              <div class="racts"><span class="act">Email the review desk</span></div>
            </div>
          </div>
          <div class="esc">
            <span class="ek">If that fails — independent oversight</span>
            <div class="racts"><span class="act">Email the Transit Ombudsman</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ported from prototypes/canvas canvas.css (v6 grammar), palette vars
   inlined from its main.css so the board keeps its paper/ink look on the
   deck's cream background. */
.canvas-root {
  --card: #fff;
  --ink: #1b1b19;
  --muted: #72726c;
  --line: #e6e5e0;
  --line-strong: #d3d2cc;
  --chip: #f3f3ef;
  --alarm: #b42318;
  --teal: #0f5153;
  width: 850px;
  font-family: 'Public Sans', 'Helvetica Neue', system-ui, -apple-system, sans-serif;
  color: var(--ink);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  text-align: left;
}

.board {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--line);
  border: 1px solid var(--line);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(27, 27, 25, 0.04), 0 16px 36px -30px rgba(27, 27, 25, 0.3);
}
.cell {
  background: var(--card);
  padding: 13px 18px;
  min-width: 0;
}
.span2 { grid-column: 1 / -1; }
.zl {
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 8px;
}

.head { padding: 15px 18px 13px; }
.head-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.sysno {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
  margin-bottom: 3px;
}
.head h2 { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -0.01em; }
.read { margin: 7px 0 0; font-size: 0.92rem; color: var(--muted); max-width: 72ch; }

.chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.8rem;
  font-weight: 600;
  background: var(--chip);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 5px 13px 5px 8px;
  white-space: nowrap;
}
.chip img { display: block; object-fit: contain; }
.chip .k { font-weight: 600; font-size: 0.66rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); }

.mk {
  display: inline;
  padding: 0 0.12em;
  border-radius: 2px;
  background: linear-gradient(180deg, transparent 0 52%, var(--mkfill) 52% 92%, transparent 92%);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
}
.mk-neutral { --mkfill: rgba(114, 114, 108, 0.28); }
.mk-color { --mkfill: color-mix(in srgb, var(--mkc) 58%, transparent); }

.tag {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  color: var(--ink);
  background: color-mix(in srgb, var(--tagc, var(--muted)) 12%, var(--card));
  border: 1px solid color-mix(in srgb, var(--tagc, var(--muted)) 42%, transparent);
  border-radius: 999px;
  padding: 3px 11px 3px 8px;
}
.tag::before {
  content: '';
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tagc, var(--muted));
}
.pc-a > .tag { margin-left: auto; margin-top: 2px; }
.sysrow > .tag { margin-left: auto; }

.pc-a { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
.pc-ic { flex: none; display: block; }
.pc-ic img { object-fit: contain; display: block; }
.astack { min-width: 0; }
.a-l1 { font-weight: 700; font-size: 1rem; line-height: 1.25; }
.a-l2 { font-size: 0.9rem; margin-top: 3px; line-height: 1.35; }
.a-l2 .a-type { color: var(--ink); font-weight: 600; }
.a-l3 { font-size: 0.78rem; color: var(--muted); margin-top: 3px; line-height: 1.35; }
.sep { color: var(--line-strong); margin: 0 0.5em; }
.risk-narr { color: var(--muted); font-weight: 400; max-width: 64ch; }

.vflow { display: flex; flex-direction: column; }
.varrow { color: var(--muted); font-size: 1.05rem; line-height: 1; margin: 4px 0 4px 15px; }

.mitig { margin-top: 6px; font-size: 0.84rem; }
.mit-k { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-right: 8px; }

.sysrow { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
.mode-icons { display: flex; gap: 8px; flex: none; }
.mode-icons img { object-fit: contain; display: block; }
.sys-sentence { margin: 0; font-size: 0.98rem; color: var(--ink); }

.rights { display: flex; flex-direction: column; gap: 9px; }
.right { display: flex; align-items: flex-start; gap: 10px; font-size: 0.85rem; }
.right img { flex: none; object-fit: contain; }
.right .rn { font-weight: 600; }
.right .rs { color: var(--muted); font-weight: 400; }
.racts { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 5px; }
.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--teal);
  background: var(--card);
  border: 1px solid color-mix(in srgb, var(--teal) 34%, transparent);
  border-radius: 999px;
  padding: 3px 11px;
}
.esc { padding-top: 8px; border-top: 1px dashed var(--line); margin-top: 0; }
.esc .ek { display: block; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
</style>
