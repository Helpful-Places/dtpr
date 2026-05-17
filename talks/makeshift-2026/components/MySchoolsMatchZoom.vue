<script setup lang="ts">
import { computed } from 'vue'
import { useSlideContext } from '@slidev/client'

type Step = { cx: number; cy: number; scale: number; label?: string }

const props = withDefaults(
  defineProps<{
    src?: string
    alt?: string
    steps?: Step[]
    height?: string
    duration?: number
  }>(),
  {
    src: '/images/myschools-match-stitched.jpg',
    alt: 'MySchools – Match disclosure, stitched from the NYC OTI 2025 AI Report.',
    steps: () => [{ cx: 0.5, cy: 0.5, scale: 1 }],
    height: '78vh',
    duration: 800,
  },
)

const { $clicks } = useSlideContext()

const idx = computed(() =>
  Math.min(Math.max($clicks.value ?? 0, 0), props.steps.length - 1),
)
const step = computed(() => props.steps[idx.value])
const origin = computed(() => `${step.value.cx * 100}% ${step.value.cy * 100}%`)
const transform = computed(() => `scale(${step.value.scale})`)
const transition = computed(
  () =>
    `transform ${props.duration}ms cubic-bezier(.4,0,.2,1), transform-origin ${props.duration}ms cubic-bezier(.4,0,.2,1)`,
)
</script>

<template>
  <div class="ms-zoom" :style="{ height }">
    <img
      :src="src"
      :alt="alt"
      :style="{ transformOrigin: origin, transform, transition }"
    />
    <div v-if="step.label" class="ms-zoom__label">{{ step.label }}</div>
  </div>
</template>

<style scoped>
.ms-zoom {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow: hidden;
  width: 100%;
}
.ms-zoom img {
  max-height: 100%;
  width: auto;
  display: block;
  will-change: transform;
}
.ms-zoom__label {
  position: absolute;
  bottom: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  border-radius: 0.375rem;
  backdrop-filter: blur(2px);
}
</style>
