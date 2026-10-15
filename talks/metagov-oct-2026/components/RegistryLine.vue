<script setup lang="ts">
// Internal registry on the left, a line, and the published subset on the
// right. The slide puts the live register iframe beside this, so the
// component only draws the internal column and the act of selection.
import { getElementIconUrl } from '../setup/dtpr'

const SCHEMA = 'dtpr@2026-09-01-beta'
const icon = (id: string) => getElementIconUrl(SCHEMA, id)

const ENTRIES = [
  { name: 'Drafting & editing writing', kind: 'use case', icon: 'inform', out: false },
  { name: 'Research', kind: 'use case', icon: 'research_development', out: false },
  { name: 'Data & spreadsheets', kind: 'use case', icon: 'planning_decision_making', out: false },
  { name: 'Grant screening assistant', kind: 'deployed system', icon: 'eligibility_benefits', out: true },
  { name: 'Visitor-count cameras', kind: 'deployed system', icon: 'safety_security', out: true },
  { name: 'Website chatbot', kind: 'deployed system', icon: 'wayfinding_services', out: true },
]
</script>

<template>
  <div class="rl">
    <div class="rl__col">
      <div class="rl__zl">Internal registry</div>
      <div v-for="e in ENTRIES" :key="e.name" class="ent" :class="{ 'ent--out': e.out }">
        <img :src="icon(e.icon)" alt="" width="22" height="22" />
        <span class="ent__name">{{ e.name }}</span>
        <span class="ent__kind">{{ e.kind }}</span>
        <span v-if="e.out" class="ent__arrow">→</span>
      </div>
    </div>
    <div class="rl__line"><span>selected for publication</span></div>
  </div>
</template>

<style scoped>
.rl { display: grid; grid-template-columns: 1fr 1.6rem; height: 100%; text-align: left; font-family: var(--hp-sans); }
.rl__zl { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--hp-blue-700); margin-bottom: 0.5rem; }
.rl__col { display: flex; flex-direction: column; gap: 0.4rem; }
.ent {
  display: grid;
  grid-template-columns: 22px 1fr auto;
  column-gap: 0.5rem;
  align-items: center;
  background: #fff;
  border: 1px solid rgba(0, 21, 20, 0.1);
  border-left: 3px solid #d3d2cc;
  border-radius: 6px;
  padding: 0.35rem 0.55rem;
  position: relative;
}
.ent--out { border-left-color: var(--hp-blue-500); }
.ent img { object-fit: contain; }
.ent__name { font-size: 0.72rem; font-weight: 700; color: #001514; }
.ent__kind { font-size: 0.56rem; letter-spacing: 0.1em; text-transform: uppercase; color: #72726c; }
.ent__arrow { position: absolute; right: -1.35rem; top: 50%; transform: translateY(-50%); color: var(--hp-blue-500); font-size: 1rem; }
.rl__line { position: relative; border-left: 1.5px dashed var(--hp-blue-500); margin-left: 0.9rem; }
.rl__line span {
  position: absolute;
  top: 50%;
  left: 0;
  transform: translate(-50%, -50%) rotate(-90deg);
  white-space: nowrap;
  font-size: 0.52rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--hp-blue-500);
  background: var(--hp-cream);
  padding: 0 0.4rem;
}
</style>
