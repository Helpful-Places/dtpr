<script setup lang="ts">
// Speculative mock: a chat client for the fictional "City Benefits
// Assistant" with a DTPR disclosure strip under the composer — the Line
// level of the one-record-many-surfaces framework. `expanded` (driven by
// the slide's $clicks) unfolds the strip into its Card-level panel:
// layered notice, demonstrated live. All copy is hardcoded; the composed
// icons from api.dtpr.io are the only network dependency.
import { getElementIconUrl } from '../setup/dtpr'

interface Props {
  expanded?: boolean
}

withDefaults(defineProps<Props>(), { expanded: false })

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string, variant?: string) => getElementIconUrl(SCHEMA, id, variant)

const MESSAGES = [
  { role: 'user', text: 'Do I qualify for help paying for child care?' },
  { role: 'assistant', text: 'Maybe — for a household of three earning about $52,000, you may qualify for a child care voucher. I can start an application; a caseworker makes the final decision.' },
]

interface PanelRow {
  eyebrow: string
  iconId: string
  variant?: string
  title: string
  body?: string
  pill?: { label: string, color: string }
  action?: string
}

const PANEL_ROWS: PanelRow[] = [
  {
    eyebrow: 'What it is',
    iconId: 'generative_mode',
    variant: 'human_decides',
    title: 'Generative AI assistant — drafts answers, caseworkers decide',
    pill: { label: 'Human decides', color: '#2A9D8F' },
  },
  {
    eyebrow: 'Run by',
    iconId: 'institution',
    title: 'City Benefits Office · built by CivicSoft Labs',
  },
  {
    eyebrow: 'Your data',
    iconId: 'input_sensitive_personal',
    variant: 'identifiable',
    title: 'What you type',
    body: 'May include income and household details. Kept 90 days, then deleted.',
    pill: { label: 'Identifiable', color: '#FFD700' },
  },
  {
    eyebrow: 'Your rights',
    iconId: 'right_to_human_review',
    title: 'Talk to a person — ask anytime',
    action: 'phone · 311',
  },
]
</script>

<template>
  <div class="chat">
    <div class="chat__bar">
      <span class="chat__avatar" aria-hidden="true" />
      <span class="chat__name">City Benefits Assistant</span>
      <span class="chat__bar-note">Automated service</span>
    </div>

    <div class="chat__msgs">
      <div
        v-for="(msg, i) in MESSAGES"
        :key="i"
        class="chat__msg"
        :class="msg.role === 'user' ? 'chat__msg--user' : 'chat__msg--assistant'"
      >
        {{ msg.text }}
      </div>
    </div>

    <div class="chat__composer">
      <span class="chat__input">Message the assistant…</span>
      <span class="chat__send" aria-hidden="true">↑</span>
    </div>

    <div class="chat__strip">
      <img :src="icon('generative_mode')" alt="" width="16" height="16" class="chat__strip-icon" />
      <span class="chat__strip-text">
        AI assistant · run by the City Benefits Office · a person decides · chats kept 90 days
      </span>
      <span class="chat__how">How this works {{ expanded ? '▴' : '▾' }}</span>
    </div>

    <div class="chat__panel" :class="{ 'chat__panel--open': expanded }">
      <div class="chat__panel-inner">
        <div class="chat__panel-body">
          <div v-for="row in PANEL_ROWS" :key="row.eyebrow" class="chat__row">
            <img :src="icon(row.iconId, row.variant)" alt="" width="26" height="26" class="chat__row-icon" />
            <div class="chat__row-main">
              <div class="chat__eyebrow">{{ row.eyebrow }}</div>
              <div class="chat__row-line">
                <span class="chat__row-title">{{ row.title }}</span>
                <span
                  v-if="row.pill"
                  class="chat__pill"
                  :style="{ '--tagc': row.pill.color }"
                >
                  <span class="chat__pill-dot" />
                  {{ row.pill.label }}
                </span>
                <span v-if="row.action" class="chat__act">{{ row.action }}</span>
              </div>
              <div v-if="row.body" class="chat__row-body">{{ row.body }}</div>
            </div>
          </div>
          <div class="chat__panel-foot">
            <span class="chat__act">See the full record →</span>
            <span class="chat__record">record cba-2026-001 · ai@2026-05-06-beta</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat {
  width: 640px;
  max-width: 100%;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 16px;
  box-shadow: 0 18px 40px -24px rgba(0, 21, 20, 0.35);
  overflow: hidden;
  text-align: left;
  font-size: 0.78rem;
}

.chat__bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.chat__avatar {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  background: var(--hp-blue-500, #007b7a);
  flex-shrink: 0;
}
.chat__name {
  font-weight: 600;
  font-size: 0.78rem;
}
.chat__bar-note {
  margin-left: auto;
  font-size: 0.62rem;
  color: #72726c;
}

.chat__msgs {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.6rem 0.9rem;
}
.chat__msg {
  max-width: 78%;
  padding: 0.45rem 0.7rem;
  border-radius: 0.9rem;
  line-height: 1.4;
}
.chat__msg--user {
  align-self: flex-end;
  background: color-mix(in srgb, var(--hp-blue-500, #007b7a) 12%, #fff);
  border-bottom-right-radius: 0.25rem;
}
.chat__msg--assistant {
  align-self: flex-start;
  background: #f3f3ef;
  border-bottom-left-radius: 0.25rem;
}

.chat__composer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 0.9rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.chat__input {
  flex: 1;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: #f3f3ef;
  color: #72726c;
  font-size: 0.72rem;
}
.chat__send {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  background: var(--hp-blue-500, #007b7a);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
}

/* The Line: one row of disclosure under the composer. */
.chat__strip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.4rem 0.9rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafaf8;
  font-size: 0.66rem;
  color: #72726c;
}
.chat__strip-icon {
  flex-shrink: 0;
}
.chat__strip-text {
  min-width: 0;
}
.chat__how {
  margin-left: auto;
  flex-shrink: 0;
  color: var(--hp-blue-500, #007b7a);
  font-weight: 600;
  cursor: pointer;
}

/* The Card: the strip's expanded layer. */
.chat__panel {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 320ms ease;
  background: #fafaf8;
}
.chat__panel--open {
  grid-template-rows: 1fr;
}
.chat__panel-inner {
  overflow: hidden;
  min-height: 0;
}
.chat__panel-body {
  padding: 0.6rem 0.9rem 0.7rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.chat__row {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 0.6rem;
  align-items: start;
}
.chat__row-icon {
  margin-top: 0.1rem;
}
.chat__eyebrow {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #72726c;
}
.chat__row-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.1rem;
}
.chat__row-title {
  font-size: 0.74rem;
  font-weight: 600;
  color: #1b1b19;
}
.chat__row-body {
  font-size: 0.66rem;
  color: #72726c;
  margin-top: 0.1rem;
  line-height: 1.4;
}

.chat__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.1rem 0.55rem 0.1rem 0.45rem;
  background: color-mix(in srgb, var(--tagc) 12%, #fff);
  border: 1px solid color-mix(in srgb, var(--tagc) 42%, transparent);
  color: #1b1b19;
}
.chat__pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--tagc);
}

.chat__act {
  display: inline-flex;
  align-items: center;
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--hp-blue-500, #007b7a);
  border: 1px solid color-mix(in srgb, var(--hp-blue-500, #007b7a) 34%, transparent);
  border-radius: 999px;
  padding: 0.1rem 0.6rem;
  background: #fff;
}

.chat__panel-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-top: 0.15rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.chat__record {
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.56rem;
  color: #72726c;
}
</style>
