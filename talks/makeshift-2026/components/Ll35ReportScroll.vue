<script setup lang="ts">
interface Props {
  pages?: number
  durationSec?: number
  basePath?: string
  pad?: number
  ext?: string
  width?: string
}

const props = withDefaults(defineProps<Props>(), {
  pages: 127,
  durationSec: 120,
  basePath: '/images/ll35-report/page-',
  pad: 3,
  ext: 'jpg',
  width: '55%',
})

const pageList = Array.from({ length: props.pages }, (_, i) => {
  const n = String(i + 1).padStart(props.pad, '0')
  return `${props.basePath}${n}.${props.ext}`
})
</script>

<template>
  <div class="ll35-scroll" :style="{ '--duration': `${props.durationSec}s`, '--width': props.width }">
    <div class="ll35-scroll__track">
      <img
        v-for="(src, i) in pageList"
        :key="src"
        :src="src"
        :alt="`LL35 Report 2025 — page ${i + 1}`"
        class="ll35-scroll__page"
        :loading="i < 3 ? 'eager' : 'lazy'"
        :fetchpriority="i === 0 ? 'high' : 'auto'"
        decoding="async"
      />
    </div>
    <div class="ll35-scroll__overlay" />
  </div>
</template>

<style scoped>
.ll35-scroll {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #0e0e0e;
}

.ll35-scroll__track {
  position: absolute;
  top: 0;
  left: 50%;
  width: var(--width);
  transform: translate(-50%, 0);
  animation: ll35-scroll-up var(--duration) linear forwards;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ll35-scroll__page {
  display: block;
  width: 100%;
  height: auto;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
  background: #ffffff;
}

.ll35-scroll__overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(to bottom, rgba(14, 14, 14, 0.55) 0%, rgba(14, 14, 14, 0) 8%, rgba(14, 14, 14, 0) 92%, rgba(14, 14, 14, 0.55) 100%);
}

@keyframes ll35-scroll-up {
  from {
    transform: translate(-50%, 0);
  }
  to {
    transform: translate(-50%, -100%);
  }
}
</style>
