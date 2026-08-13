<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import {
  dataStack, dataTag, peopleStack, orgStack, riskView, iconUrl,
  sentence as systemSentence, autonomyTag, dataSentence, processingSentence, peopleSentence, orgSentence,
} from '~/canvas-data/grammar'
import { SEAT, riskSeat, tr, type Loc, type SystemContent, type RightAction } from '~/canvas-data'
import { actHref as buildHref, externalAct } from '~/utils/rightActions'
import '~/components/canvas/canvas.css'

// Renders one canvas from resolved system content via the composition
// grammar. Every seat wrapper carries a stable `data-seat` key so the
// feedback layer (U6) can anchor per-piece reactions (R2 / R3).
const props = defineProps<{
  content: SystemContent
  /** Locale to render; defaults to the app locale. */
  loc?: Loc
  /** Board index (0-based) for the "System N" eyebrow. */
  index?: number
  /** Sentence view (U2): replace sentence-capable stacks with their
   *  composed C sentence. Seats with no sentence are unaffected. */
  sentence?: boolean
}>()

const { locale } = useI18n()
const loc = computed<Loc>(() => props.loc ?? (locale.value as Loc))
const sy = computed(() => props.content)

const purposeAlt = computed(() => tr(sy.value.purpose.t, loc.value))

// Build each risk's view once per render rather than re-deriving it per
// template binding (title / narrative / mitigation).
const riskViews = computed(() => sy.value.risks.map(r => riskView(r, loc.value)))

// ── Rights / escalation action links (shared with the compare matrix) ──
const actHref = (a: RightAction, right: string): string => buildHref(a, sy.value, right, loc.value)
const external = externalAct

// ── Immediate hover tooltip on every icon (delegated, ported from v6) ──
const rootEl = ref<HTMLElement | null>(null)
let tip: HTMLDivElement | null = null
function placeTip(el: HTMLElement) {
  const txt = el.getAttribute('data-tip')
  if (!txt || !tip) return
  tip.textContent = txt
  tip.style.display = 'block'
  tip.classList.remove('below')
  const r = el.getBoundingClientRect()
  const b = tip.getBoundingClientRect()
  const cx = r.left + r.width / 2
  let x = cx - b.width / 2
  let y = r.top - b.height - 9
  if (y < 4) { y = r.bottom + 9; tip.classList.add('below') }
  x = Math.max(6, Math.min(x, window.innerWidth - b.width - 6))
  tip.style.left = `${x}px`
  tip.style.top = `${y}px`
  tip.style.setProperty('--tipx', `${cx - x}px`)
}
const hideTip = () => { if (tip) tip.style.display = 'none' }
const onOver = (e: MouseEvent) => {
  const el = (e.target as HTMLElement)?.closest('[data-tip]') as HTMLElement | null
  if (el) placeTip(el)
}
const onOut = (e: MouseEvent) => {
  const el = (e.target as HTMLElement)?.closest('[data-tip]') as HTMLElement | null
  if (el && !el.contains(e.relatedTarget as Node)) hideTip()
}
onMounted(() => {
  tip = document.createElement('div')
  tip.className = 'canvas-tip'
  tip.setAttribute('role', 'tooltip')
  document.body.appendChild(tip)
  rootEl.value?.addEventListener('mouseover', onOver)
  rootEl.value?.addEventListener('mouseout', onOut)
  window.addEventListener('scroll', hideTip, true)
})
onBeforeUnmount(() => {
  rootEl.value?.removeEventListener('mouseover', onOver)
  rootEl.value?.removeEventListener('mouseout', onOut)
  window.removeEventListener('scroll', hideTip, true)
  tip?.remove()
  tip = null
})
</script>

<template>
  <div ref="rootEl" class="canvas-root">
    <div class="board">
      <!-- header -->
      <div class="cell span2 head">
        <div class="head-top">
          <div>
            <span class="sysno">
              <template v-if="index != null">{{ $t('canvas.systemNo', { n: index + 1 }) }} · </template>{{ sy.ref }}
            </span>
            <h2>{{ tr(sy.name, loc) }}</h2>
          </div>
          <span class="chip" :data-seat="SEAT.purpose">
            <img :src="iconUrl(sy.purpose.id)" :alt="purposeAlt" :data-tip="purposeAlt" width="22" height="22" loading="lazy" style="object-fit:contain">
            <span><span class="k">{{ $t('canvas.for') }}</span> {{ tr(sy.purpose.t, loc) }}</span>
          </span>
        </div>
        <p class="read">{{ tr(sy.read, loc) }}</p>
      </div>

      <!-- run by / built by -->
      <div class="cell" :data-seat="SEAT.runBy">
        <div class="zl">{{ $t('canvas.runBy') }}</div>
        <PieceStack :stack="orgStack(sy.runby, loc)" :sentence="props.sentence ? orgSentence(sy.runby, loc) : null">
          <template #icon>
            <img :src="iconUrl(sy.runby.el)" :alt="tr(sy.runby.role, loc)" :data-tip="tr(sy.runby.role, loc)" width="44" height="44" loading="lazy" style="object-fit:contain">
          </template>
        </PieceStack>
      </div>
      <div class="cell" :data-seat="SEAT.builtBy">
        <div class="zl">{{ $t('canvas.builtBy') }}</div>
        <PieceStack :stack="orgStack(sy.builtby, loc)" :sentence="props.sentence ? orgSentence(sy.builtby, loc) : null">
          <template #icon>
            <img :src="iconUrl(sy.builtby.el)" :alt="tr(sy.builtby.role, loc)" :data-tip="tr(sy.builtby.role, loc)" width="44" height="44" loading="lazy" style="object-fit:contain">
          </template>
        </PieceStack>
      </div>

      <!-- the system sentence -->
      <div class="cell span2" :data-seat="SEAT.system">
        <div class="zl">{{ $t('canvas.theSystem') }}</div>
        <div class="sysrow">
          <div class="mode-icons">
            <img
              v-for="m in sy.modes" :key="m.id"
              :src="iconUrl(m.id)" :alt="`${tr(m.t, loc)} (${tr(m.s, loc)})`" :data-tip="`${tr(m.t, loc)} (${tr(m.s, loc)})`"
              width="40" height="40" loading="lazy" style="object-fit:contain"
            >
          </div>
          <p class="sys-sentence">
            <template v-for="(seg, i) in systemSentence(sy, loc)" :key="i">
              <Marker v-if="seg.kind === 'mark'" :mark="seg.mark" />
              <span v-else>{{ seg.text }}</span>
            </template>
          </p>
          <Tag :tag="autonomyTag(sy, loc)" />
        </div>
      </div>

      <!-- data flow -->
      <div class="cell span2">
        <div class="zl">{{ $t('canvas.dataFlow') }}</div>
        <div class="vflow">
          <div :data-seat="SEAT.dataInput">
            <PieceStack :stack="dataStack(sy.input, loc)" :tag="dataTag(sy.input, loc)" :sentence="props.sentence ? dataSentence(sy.input, loc) : null">
              <template #icon>
                <img :src="iconUrl(sy.input.id)" :alt="tr(sy.input.type, loc)" :data-tip="tr(sy.input.type, loc)" width="40" height="40" loading="lazy" style="object-fit:contain">
              </template>
            </PieceStack>
          </div>
          <div class="varrow">↓</div>
          <div :data-seat="SEAT.processing">
            <PieceStack :stack="dataStack(sy.processing, loc)" :tag="dataTag(sy.processing, loc)" :sentence="props.sentence ? processingSentence(sy.processing, loc) : null">
              <template #icon>
                <img :src="iconUrl(sy.processing.id)" :alt="tr(sy.processing.type, loc)" :data-tip="tr(sy.processing.type, loc)" width="40" height="40" loading="lazy" style="object-fit:contain">
              </template>
            </PieceStack>
          </div>
          <div class="varrow">↓</div>
          <div :data-seat="SEAT.dataOutput">
            <PieceStack :stack="dataStack(sy.output, loc)" :tag="dataTag(sy.output, loc)" :sentence="props.sentence ? dataSentence(sy.output, loc) : null">
              <template #icon>
                <img :src="iconUrl(sy.output.id)" :alt="tr(sy.output.type, loc)" :data-tip="tr(sy.output.type, loc)" width="40" height="40" loading="lazy" style="object-fit:contain">
              </template>
            </PieceStack>
          </div>
        </div>
      </div>

      <!-- risks -->
      <div v-if="sy.risks.length" class="cell span2">
        <div class="zl">{{ $t('canvas.risks') }}</div>
        <div class="risk-list">
          <div v-for="(r, i) in sy.risks" :key="i" :data-seat="riskSeat(i)" class="pc">
            <div class="pc-a">
              <div class="pc-ic">
                <img :src="iconUrl(r.harm)" :alt="tr(r.title, loc)" :data-tip="tr(r.title, loc)" width="40" height="40" loading="lazy" style="object-fit:contain">
              </div>
              <div class="astack">
                <div class="a-l1">{{ riskViews[i].title }}</div>
                <div class="a-l2 risk-narr">{{ riskViews[i].narrative }}</div>
                <div v-if="riskViews[i].mitigation" class="mitig">
                  <span class="mit-k">{{ $t('canvas.mitigation') }}</span>{{ riskViews[i].mitigation }}
                </div>
                <div v-else class="alarm mit-alarm">
                  <span class="bang">!</span>{{ $t('canvas.noMitigation') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- used on -->
      <div class="cell" :data-seat="SEAT.usedOn">
        <div class="zl">{{ $t('canvas.usedOn') }}</div>
        <PieceStack :stack="peopleStack(sy.usedon, loc)" :sentence="props.sentence ? peopleSentence(sy.usedon, loc) : null">
          <template #icon>
            <svg width="40" height="40" viewBox="0 0 36 36" aria-hidden="true">
              <path d="M31.8564 8.8453L19 1.42265C18.3812 1.06538 17.6188 1.06538 17 1.42265L4.14359 8.8453C3.52479 9.20257 3.14359 9.86282 3.14359 10.5774V25.4226C3.14359 26.1372 3.52479 26.7974 4.14359 27.1547L17 34.5774C17.6188 34.9346 18.3812 34.9346 19 34.5774L31.8564 27.1547C32.4752 26.7974 32.8564 26.1372 32.8564 25.4226V10.5774C32.8564 9.86282 32.4752 9.20256 31.8564 8.8453Z" fill="none" stroke="#000" stroke-width="2" />
              <g fill="#000">
                <path d="M13.5 10.6667C15.1569 10.6667 16.5 12.0098 16.5 13.6667C16.5 15.3235 15.1569 16.6667 13.5 16.6667C11.8431 16.6667 10.5 15.3235 10.5 13.6667C10.5 12.0098 11.8431 10.6667 13.5 10.6667Z" />
                <path d="M22.5 10.6667C24.1569 10.6667 25.5 12.0098 25.5 13.6667C25.5 15.3235 24.1569 16.6667 22.5 16.6667C20.8431 16.6667 19.5 15.3235 19.5 13.6667C19.5 12.0098 20.8431 10.6667 22.5 10.6667Z" />
                <path d="M13.5 18C10.1863 18 7.5 20.6863 7.5 24V25.3333H19.5V24C19.5 20.6863 16.8137 18 13.5 18Z" />
                <path d="M22.5 18C21.9316 18 21.3818 18.0791 20.8608 18.2266C22.1863 19.7061 23 21.6589 23 24V25.3333H28.5V24C28.5 20.6863 25.8137 18 22.5 18Z" />
              </g>
            </svg>
          </template>
        </PieceStack>
      </div>

      <!-- rights -->
      <div class="cell" :data-seat="SEAT.rights">
        <div class="zl">{{ $t('canvas.youCan') }}</div>
        <div class="rights">
          <template v-if="sy.rights.length">
            <div v-for="r in sy.rights" :key="r.id" class="right">
              <img :src="iconUrl(r.id)" :alt="tr(r.t, loc)" :data-tip="tr(r.t, loc)" width="26" height="26" loading="lazy" style="object-fit:contain">
              <div>
                <span class="rn">{{ tr(r.t, loc) }}</span>
                <span v-if="r.s" class="rs"> — {{ tr(r.s, loc) }}</span>
                <div v-if="r.acts && r.acts.length" class="racts">
                  <a
                    v-for="(a, ai) in r.acts" :key="ai" class="act"
                    :href="actHref(a, tr(r.t, loc))"
                    :target="external(a) ? '_blank' : undefined"
                    :rel="external(a) ? 'noopener' : undefined"
                  >{{ tr(a.label, loc) }}</a>
                </div>
              </div>
            </div>
          </template>
          <div v-else class="alarm"><span class="bang">!</span>{{ $t('canvas.noRights') }}</div>

          <div v-if="sy.escalate" class="esc">
            <span class="ek">{{ tr(sy.escalate.k, loc) }}</span>
            <div class="racts" style="margin-top:0">
              <a
                v-for="(a, ai) in sy.escalate.acts" :key="ai" class="act"
                :href="actHref(a, $t('canvas.complaint'))"
                :target="external(a) ? '_blank' : undefined"
                :rel="external(a) ? 'noopener' : undefined"
              >{{ tr(a.label, loc) }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* The floating tooltip lives on <body>, so it is styled unscoped. */
.canvas-tip {
  position: fixed;
  z-index: 1000;
  display: none;
  background: var(--ink, #1b1b19);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.3;
  padding: 5px 9px;
  border-radius: 7px;
  pointer-events: none;
  white-space: nowrap;
  max-width: 280px;
  box-shadow: 0 6px 20px -6px rgba(27, 27, 25, 0.45);
}
.canvas-tip::after {
  content: '';
  position: absolute;
  left: var(--tipx, 50%);
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--ink, #1b1b19);
  top: 100%;
}
.canvas-tip.below::after {
  top: auto;
  bottom: 100%;
  border-top-color: transparent;
  border-bottom-color: var(--ink, #1b1b19);
}
</style>
