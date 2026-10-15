<script setup lang="ts">
// The weekly check-in as the employee sees it, rebuilt from the real
// question copy. The bot is unnamed on purpose: the slide is about the
// instrument, not the product. The staff reply is invented and generic.
const TRUST_ANCHORS = [
  'Wouldn’t repeat it',
  'Checked every claim',
  'Spot-checked it',
  'Skimmed, looked right',
  'Didn’t need to check',
]
</script>

<template>
  <div class="ci">
    <div class="ci__bar">
      <span class="ci__avatar" aria-hidden="true" />
      <span class="ci__name">Weekly check-in</span>
      <span class="ci__when">Friday · 3:00 PM</span>
    </div>

    <div class="ci__msg ci__msg--bot">
      <div class="ci__q">What did you use AI for this week?</div>
      <div class="ci__sub">A sentence or two is plenty.</div>
      <div class="ci__btns"><span class="ci__btn ci__btn--ghost">Nothing this week</span></div>
    </div>

    <div class="ci__msg ci__msg--me">
      Rewrote a funder update and asked it to check two spreadsheets for duplicates.
    </div>

    <div class="ci__msg ci__msg--bot">
      <div class="ci__q">How much did you trust its accuracy?</div>
      <div class="ci__scale">
        <span v-for="(a, i) in TRUST_ANCHORS" :key="a" class="ci__btn" :class="{ 'ci__btn--on': i === 2 }">
          <b>{{ i + 1 }}</b>{{ a }}
        </span>
      </div>
    </div>

    <div class="ci__foot">Shown back without names. Say <em>pause</em>, <em>leave</em> or <em>delete</em> at any time.</div>
  </div>
</template>

<style scoped>
.ci {
  width: 100%;
  background: #fff;
  border: 1px solid rgba(0, 21, 20, 0.1);
  border-radius: 12px;
  box-shadow: 0 18px 34px -24px rgba(0, 21, 20, 0.45);
  font-family: var(--hp-sans);
  text-align: left;
  padding: 0.6rem 0.8rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.ci__bar { display: flex; align-items: center; gap: 0.5rem; padding-bottom: 0.45rem; border-bottom: 1px solid rgba(0, 0, 0, 0.07); }
.ci__avatar { width: 18px; height: 18px; border-radius: 5px; background: var(--hp-blue-500); }
.ci__name { font-weight: 700; font-size: 0.78rem; color: var(--hp-blue-900); }
.ci__when { margin-left: auto; font-size: 0.62rem; color: #72726c; }
.ci__msg { font-size: 0.76rem; line-height: 1.35; border-radius: 10px; padding: 0.5rem 0.65rem; max-width: 92%; }
.ci__msg--bot { background: #f3f3ef; align-self: flex-start; }
.ci__msg--me { background: var(--hp-blue-50); align-self: flex-end; color: var(--hp-blue-900); }
.ci__q { font-weight: 600; color: #001514; }
.ci__sub { color: #72726c; font-size: 0.68rem; margin-top: 0.1rem; }
.ci__btns { margin-top: 0.4rem; }
.ci__scale { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.45rem; }
.ci__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6rem;
  font-weight: 600;
  background: #fff;
  border: 1px solid rgba(0, 21, 20, 0.18);
  border-radius: 999px;
  padding: 0.15rem 0.55rem 0.15rem 0.3rem;
  color: #001514;
}
.ci__btn b { width: 14px; height: 14px; border-radius: 999px; background: #e6e5e0; display: inline-flex; align-items: center; justify-content: center; font-size: 0.55rem; }
.ci__btn--on { border-color: var(--hp-blue-500); background: var(--hp-blue-50); color: var(--hp-blue-700); }
.ci__btn--on b { background: var(--hp-blue-500); color: #fff; }
.ci__btn--ghost { color: #72726c; }
.ci__foot { font-size: 0.6rem; color: #72726c; margin-top: 0.1rem; }
.ci__foot em { font-style: normal; font-weight: 600; color: #4b4b47; }
</style>
