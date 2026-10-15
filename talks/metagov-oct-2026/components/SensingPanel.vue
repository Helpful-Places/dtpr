<script setup lang="ts">
// What came back from one organization's questionnaire: two range bands and
// the ranked concerns. Data in sensing-data.ts (coded ordinals only).
import RangeBand from './RangeBand.vue'
import { CONFIDENCE, COMFORT, CONCERNS, RESPONDENTS, NON_USERS } from './sensing-data'

const max = Math.max(...CONCERNS.map((c) => c.n))
</script>

<template>
  <div class="sp">
    <div class="sp__head">
      <span class="sp__title">What came back</span>
      <span class="sp__n">{{ RESPONDENTS }} staff · {{ NON_USERS }} don’t use AI at work</span>
    </div>
    <div class="sp__bands">
      <RangeBand v-bind="COMFORT" />
      <RangeBand v-bind="CONFIDENCE" />
    </div>
    <div class="sp__concerns">
      <div class="sp__zl">What worries staff</div>
      <div v-for="c in CONCERNS" :key="c.key" class="con">
        <span class="con__bar" :style="{ width: `${(c.n / max) * 100}%` }" />
        <span class="con__label">{{ c.label }}</span>
        <span class="con__n">{{ c.n }}</span>
      </div>
    </div>
    <div class="sp__foot">From a one-off staff questionnaire, August 2026. The weekly check-in is the continuous version.</div>
  </div>
</template>

<style scoped>
.sp { text-align: left; font-family: var(--hp-sans); display: flex; flex-direction: column; gap: 0.6rem; }
.sp__head { display: flex; align-items: baseline; gap: 0.6rem; }
.sp__title { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--hp-blue-700); }
.sp__n { font-size: 0.62rem; color: #72726c; margin-left: auto; }
.sp__bands { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
.sp__zl { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #72726c; margin-bottom: 0.3rem; }
.con { position: relative; display: flex; align-items: center; height: 1.05rem; font-size: 0.64rem; }
.con__bar { position: absolute; left: 0; top: 2px; bottom: 2px; background: var(--hp-blue-100); border-radius: 3px; }
.con__label { position: relative; padding-left: 0.4rem; color: #001514; }
.con__n { position: relative; margin-left: auto; font-weight: 700; color: var(--hp-blue-900); font-variant-numeric: tabular-nums; }
.sp__foot { font-size: 0.6rem; color: #72726c; font-style: italic; font-family: var(--hp-serif); }
</style>
