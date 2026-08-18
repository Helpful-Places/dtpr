<script setup lang="ts">
import { computed } from 'vue'
import {
  orgStack, dataStack, dataTag, peopleStack, riskView, sentence, relTail, iconUrl,
} from '~/canvas-data/grammar'
import { actHref, externalAct } from '~/utils/rightActions'
import { tr, type Loc, type ResolvedCanvas, type RightAction, type SystemContent } from '~/canvas-data'
import '~/components/canvas/canvas.css'

// The systems matrix (U3, ported from `canvas-affected-v5-compare.html`):
// columns = live systems, rows = fixed seats. View-only — no feedback, no
// sentence toggle. Cells are driven by the same grammar builders the board
// uses, so the two views never diverge. Wrapped in `.canvas-root` to inherit
// the board's marker / alarm / action-pill styles from canvas.css.
const props = defineProps<{ canvases: ResolvedCanvas[] }>()

const { t, locale } = useI18n()
const loc = computed<Loc>(() => locale.value as Loc)

// Precompute every cell once per column, so the template stays declarative.
const columns = computed(() => props.canvases.map((cv, i) => {
  const c = cv.content
  const l = loc.value
  const used = peopleStack(c.usedon, l)
  return {
    key: `${cv.systemKey}-${cv.variantKey}-${cv.versionKey}`,
    no: t('canvas.systemNo', { n: i + 1 }),
    ref: c.ref,
    name: tr(c.name, l),
    purpose: { icon: iconUrl(c.purpose.id), label: tr(c.purpose.t, l) },
    runby: { icon: iconUrl(c.runby.el), ...orgStack(c.runby, l) },
    builtby: { icon: iconUrl(c.builtby.el), ...orgStack(c.builtby, l) },
    modes: c.modes.map(m => ({ icon: iconUrl(m.id), alt: `${tr(m.t, l)} (${tr(m.s, l)})` })),
    sentence: sentence(c, l),
    data: {
      input: { icon: iconUrl(c.input.id), ...dataStack(c.input, l), tag: dataTag(c.input, l) },
      processing: { icon: iconUrl(c.processing.id), ...dataStack(c.processing, l), tag: dataTag(c.processing, l) },
      output: { icon: iconUrl(c.output.id), ...dataStack(c.output, l), tag: dataTag(c.output, l) },
    },
    risks: c.risks.map(r => ({ icon: iconUrl(r.harm), ...riskView(r, l) })),
    usedon: { word: used.mark?.text ?? '', who: used.headline, scale: used.facts[0] ?? '', tail: relTail(c.usedon, l) },
    rights: c.rights.map(r => ({ icon: iconUrl(r.id), label: tr(r.t, l), acts: r.acts ?? [] })),
    escalate: c.escalate,
    content: c as SystemContent,
  }
}))

const href = (a: RightAction, sy: SystemContent, right: string) => actHref(a, sy, right, loc.value)
</script>

<template>
  <div class="canvas-root">
    <div class="scroller">
      <table class="matrix">
        <thead>
          <tr>
            <th></th>
            <td v-for="col in columns" :key="col.key">
              <span class="sysno">{{ col.no }} · {{ col.ref }}</span>
              <div class="sysname">{{ col.name }}</div>
              <span class="purpose">
                <img :src="col.purpose.icon" :alt="col.purpose.label" width="20" height="20" loading="lazy" style="object-fit:contain">
                {{ col.purpose.label }}
              </span>
            </td>
          </tr>
        </thead>
        <tbody>
          <!-- Run by -->
          <tr>
            <th scope="row">{{ $t('canvas.runBy') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div class="piece">
                <img :src="col.runby.icon" :alt="col.runby.label" width="30" height="30" loading="lazy" style="object-fit:contain">
                <div class="pn">{{ col.runby.headline }}<span class="ps">{{ col.runby.label }}</span></div>
              </div>
            </td>
          </tr>
          <!-- Built by -->
          <tr>
            <th scope="row">{{ $t('canvas.builtBy') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div class="piece">
                <img :src="col.builtby.icon" :alt="col.builtby.label" width="30" height="30" loading="lazy" style="object-fit:contain">
                <div class="pn">{{ col.builtby.headline }}<span class="ps">{{ col.builtby.label }}</span></div>
              </div>
            </td>
          </tr>
          <!-- The system -->
          <tr>
            <th scope="row">{{ $t('canvas.theSystem') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div class="mode-icons">
                <img
                  v-for="(m, mi) in col.modes" :key="mi"
                  :src="m.icon" :alt="m.alt" :title="m.alt" width="26" height="26" loading="lazy" style="object-fit:contain"
                >
              </div>
              <p class="msent">
                <template v-for="(seg, si) in col.sentence" :key="si">
                  <Marker v-if="seg.kind === 'mark'" :mark="seg.mark" />
                  <span v-else>{{ seg.text }}</span>
                </template>
              </p>
            </td>
          </tr>
          <!-- Data flow -->
          <tr>
            <th scope="row">{{ $t('canvas.dataFlow') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div class="stack">
                <div class="piece">
                  <img :src="col.data.input.icon" :alt="col.data.input.label" width="26" height="26" loading="lazy" style="object-fit:contain">
                  <div class="pn">
                    {{ col.data.input.headline }}
                    <Tag v-if="col.data.input.tag" :tag="col.data.input.tag" />
                    <span class="ps">{{ col.data.input.label }}</span>
                  </div>
                </div>
                <span v-if="col.data.input.facts.length" class="tiny">{{ col.data.input.facts.join(' · ') }}</span>
                <span class="arrow">↓</span>
                <div class="piece">
                  <img :src="col.data.processing.icon" :alt="col.data.processing.label" width="26" height="26" loading="lazy" style="object-fit:contain">
                  <div class="pn">{{ col.data.processing.headline }}<span class="ps">{{ col.data.processing.label }}</span></div>
                </div>
                <span class="arrow">↓</span>
                <div class="piece">
                  <img :src="col.data.output.icon" :alt="col.data.output.label" width="26" height="26" loading="lazy" style="object-fit:contain">
                  <div class="pn">
                    {{ col.data.output.headline }}
                    <Tag v-if="col.data.output.tag" :tag="col.data.output.tag" />
                    <span class="ps">{{ col.data.output.label }}</span>
                  </div>
                </div>
                <span v-if="col.data.output.facts.length" class="tiny">{{ col.data.output.facts.join(' · ') }}</span>
              </div>
            </td>
          </tr>
          <!-- Risks & safeguards -->
          <tr>
            <th scope="row">{{ $t('canvas.risks') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div class="stack">
                <template v-for="(r, ri) in col.risks" :key="ri">
                  <div class="piece">
                    <img :src="r.icon" :alt="r.title" width="26" height="26" loading="lazy" style="object-fit:contain">
                    <div class="pn">{{ r.title }}<span class="ps">{{ r.narrative }}</span></div>
                  </div>
                  <span v-if="r.mitigation" class="safeguard"><span class="k">{{ $t('canvas.mitigation') }}</span>{{ r.mitigation }}</span>
                  <span v-else class="alarm"><span class="bang">!</span>{{ $t('canvas.noMitigation') }}</span>
                </template>
              </div>
            </td>
          </tr>
          <!-- Used on -->
          <tr>
            <th scope="row">{{ $t('canvas.usedOn') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div class="stack">
                <div class="piece">
                  <svg width="30" height="30" viewBox="0 0 36 36" aria-hidden="true">
                    <path d="M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z" fill="none" stroke="#000" stroke-width="2" />
                    <g fill="#000">
                      <path d="M13.5 10.6667C15.1569 10.6667 16.5 12.0098 16.5 13.6667C16.5 15.3235 15.1569 16.6667 13.5 16.6667C11.8431 16.6667 10.5 15.3235 10.5 13.6667C10.5 12.0098 11.8431 10.6667 13.5 10.6667Z" />
                      <path d="M22.5 10.6667C24.1569 10.6667 25.5 12.0098 25.5 13.6667C25.5 15.3235 24.1569 16.6667 22.5 16.6667C20.8431 16.6667 19.5 15.3235 19.5 13.6667C19.5 12.0098 20.8431 10.6667 22.5 10.6667Z" />
                      <path d="M13.5 18C10.1863 18 7.5 20.6863 7.5 24V25.3333H19.5V24C19.5 20.6863 16.8137 18 13.5 18Z" />
                      <path d="M22.5 18C21.9316 18 21.3818 18.0791 20.8608 18.2266C22.1863 19.7061 23 21.6589 23 24V25.3333H28.5V24C28.5 20.6863 25.8137 18 22.5 18Z" />
                    </g>
                  </svg>
                  <div class="pn">
                    {{ col.usedon.who }}
                    <span v-if="col.usedon.word" class="ps">{{ col.usedon.word }}</span>
                  </div>
                </div>
                <span v-if="col.usedon.scale" class="tiny">{{ col.usedon.scale }}</span>
                <span class="tiny">{{ col.usedon.tail }}</span>
              </div>
            </td>
          </tr>
          <!-- You can -->
          <tr>
            <th scope="row">{{ $t('canvas.youCan') }}</th>
            <td v-for="col in columns" :key="col.key">
              <div v-if="col.rights.length" class="stack">
                <div v-for="(r, ri) in col.rights" :key="ri">
                  <div class="piece">
                    <img :src="r.icon" :alt="r.label" width="22" height="22" loading="lazy" style="object-fit:contain">
                    <div class="pn">{{ r.label }}</div>
                  </div>
                  <div v-if="r.acts.length" class="racts">
                    <a
                      v-for="(a, ai) in r.acts" :key="ai" class="act"
                      :href="href(a, col.content, r.label)"
                      :target="externalAct(a) ? '_blank' : undefined"
                      :rel="externalAct(a) ? 'noopener' : undefined"
                    >{{ tr(a.label, loc) }}</a>
                  </div>
                </div>
              </div>
              <span v-else class="alarm"><span class="bang">!</span>{{ $t('canvas.noRights') }}</span>

              <div v-if="col.escalate" class="esc">
                <span class="ek">{{ tr(col.escalate.k, loc) }}</span>
                <div class="racts" style="margin-top:0">
                  <a
                    v-for="(a, ai) in col.escalate.acts" :key="ai" class="act"
                    :href="href(a, col.content, $t('canvas.complaint'))"
                    :target="externalAct(a) ? '_blank' : undefined"
                    :rel="externalAct(a) ? 'noopener' : undefined"
                  >{{ tr(a.label, loc) }}</a>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* Table layout ported from canvas-affected-v5-compare.html. Marker, alarm,
   and action-pill styles are inherited from canvas.css via `.canvas-root`. */
.scroller {
  overflow-x: auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--card);
  box-shadow: 0 1px 2px rgba(27, 27, 25, 0.04), 0 16px 36px -30px rgba(27, 27, 25, 0.3);
}
.matrix { border-collapse: collapse; width: 100%; min-width: 980px; }
.matrix th, .matrix td {
  text-align: left;
  vertical-align: top;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
  border-left: 1px solid var(--line);
  min-width: 0;
}
.matrix tr:last-child th, .matrix tr:last-child td { border-bottom: none; }
.matrix th:first-child, .matrix td:first-child { border-left: none; }

/* seat labels (row headers) */
.matrix tbody th {
  width: 104px;
  min-width: 104px;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.13em;
  text-transform: uppercase;
  color: var(--muted);
  padding-top: 20px;
  background: var(--chip);
}
/* name row — the canvas top */
.matrix thead td { border-bottom: 2px solid var(--ink); background: var(--card); }
.matrix thead th { background: var(--chip); border-bottom: 2px solid var(--ink); }
.sysno { display: block; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.11em; text-transform: uppercase; color: var(--muted); margin-bottom: 2px; }
.sysname { font-size: 1.02rem; font-weight: 700; letter-spacing: -0.005em; line-height: 1.25; }
.purpose {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  margin-top: 8px;
  background: var(--chip);
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 3px 10px 3px 5px;
  white-space: nowrap;
}

.piece { display: flex; align-items: center; gap: 9px; min-width: 0; }
.piece img, .piece svg { flex: none; display: block; }
.pn { font-weight: 600; font-size: 0.85rem; line-height: 1.3; }
.ps { display: block; font-weight: 400; font-size: 0.72rem; color: var(--muted); }
.stack { display: flex; flex-direction: column; gap: 10px; }
.msent { margin: 8px 0 0; font-size: 0.8rem; color: var(--ink); }
.arrow { color: var(--muted); margin: 0 2px; }
.tiny { font-size: 0.72rem; color: var(--muted); }
.safeguard { font-size: 0.72rem; margin-top: 2px; }
.safeguard .k { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: var(--muted); margin-right: 6px; }

/* the matrix's action pills sit tighter than the board's default */
.canvas-root :deep(.racts) { margin-top: 5px; }
</style>
