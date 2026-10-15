<script setup lang="ts">
import { computed } from 'vue'

// A five-cell heat strip: each cell's teal intensity is the share of
// respondents who gave that answer, a caret below marks the median, and the
// anchor nearest the median is lit. Ported from the chalkline treatment used
// in the questionnaire deliverable. Values are 0-100, coded at 0/25/50/75/100.
const props = defineProps<{
  label: string
  question: string
  values: number[]
  anchors: string[]
}>()

const cells = computed(() => {
  const counts = [0, 0, 0, 0, 0]
  for (const v of props.values) counts[Math.min(4, Math.round(v / 25))]!++
  const max = Math.max(1, ...counts)
  return counts.map((count) => ({ count, mix: count === 0 ? 4 : Math.round(14 + 72 * (count / max)) }))
})

const median = computed(() => {
  if (!props.values.length) return null
  const s = [...props.values].sort((a, b) => a - b)
  const h = (s.length - 1) * 0.5
  const lo = Math.floor(h), hi = Math.ceil(h)
  return Math.round(s[lo]! + (s[hi]! - s[lo]!) * (h - lo))
})
const toStrip = (v: number) => 10 + v * 0.8
const activeAnchor = computed(() => (median.value === null ? -1 : Math.min(4, Math.round(median.value / 25))))
</script>

<template>
  <div class="rb">
    <div class="rb__head">
      <span class="rb__label">{{ label }}</span>
      <span class="rb__n">{{ values.length }} answered</span>
    </div>
    <div class="rb__q">{{ question }}</div>
    <span class="strip">
      <span
        v-for="(c, i) in cells"
        :key="i"
        class="cell"
        :style="{ background: `color-mix(in srgb, var(--hp-blue-500) ${c.mix}%, #fff)` }"
      ><span v-if="c.count" class="n">{{ c.count }}</span></span>
      <span v-if="median !== null" class="med" :style="{ left: `${toStrip(median)}%` }" />
    </span>
    <div class="anchors">
      <span v-for="(a, i) in anchors" :key="i" :class="{ on: i === activeAnchor }">{{ a }}</span>
    </div>
  </div>
</template>

<style scoped>
.rb { min-width: 0; text-align: left; font-family: var(--hp-sans); }
.rb__head { display: flex; align-items: baseline; gap: 0.5rem; }
.rb__label { font-size: 0.74rem; font-weight: 700; color: var(--hp-blue-900); }
.rb__n { font-size: 0.6rem; color: #72726c; margin-left: auto; }
.rb__q { font-size: 0.64rem; color: #4b4b47; margin: 0.05rem 0 0.4rem; }
.strip {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  height: 16px;
  border-radius: 999px;
}
.cell { position: relative; display: flex; align-items: center; justify-content: center; border: 1px solid #e6e5e0; }
.cell:first-child { border-radius: 999px 0 0 999px; }
.cell:last-child { border-radius: 0 999px 999px 0; }
.cell .n { font-size: 0.56rem; font-weight: 700; line-height: 1; color: rgba(0, 21, 20, 0.62); font-variant-numeric: tabular-nums; }
.med {
  position: absolute;
  top: calc(100% + 2px);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-bottom: 6px solid #001514;
  transform: translateX(-50%);
}
.anchors {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 2px;
  margin-top: 0.6rem;
  font-size: 0.56rem;
  line-height: 1.2;
  color: #72726c;
}
.anchors span { text-align: center; text-wrap: balance; }
.anchors .on { color: var(--hp-blue-700); font-weight: 700; }
</style>
