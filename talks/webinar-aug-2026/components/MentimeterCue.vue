<script setup lang="ts">
withDefaults(
  defineProps<{
    /** Audience-facing line under the title — how many questions, about what. */
    kicker?: string
  }>(),
  { kicker: '' },
)
</script>

<template>
  <div class="mmcue">
    <!-- Mock tab strip pinned to the slide's top edge, echoing the real browser
         chrome sitting a few pixels above it on the presenter's screen. The deck
         tab is active (cream, merging into the slide below — you are here); the
         arrow points at the Mentimeter tab, where the poll questions are loaded. -->
    <div class="mmcue__chrome">
      <span class="mmcue__lights">
        <i style="background: #ff5f57"></i>
        <i style="background: #febc2e"></i>
        <i style="background: #28c840"></i>
      </span>

      <div class="mmcue__tab mmcue__tab--active">
        <svg class="mmcue__fav" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M8 1.5 13.6 4.75v6.5L8 14.5 2.4 11.25v-6.5Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
        <span class="mmcue__tab-label">DTPR for AI — slides</span>
      </div>

      <div class="mmcue__tab">
        <svg class="mmcue__fav mmcue__fav--mm" viewBox="0 0 16 16" aria-hidden="true">
          <line x1="4" y1="12.5" x2="4" y2="9.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <line x1="8" y1="12.5" x2="8" y2="5.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
          <line x1="12" y1="12.5" x2="12" y2="7.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
        <span class="mmcue__tab-label">Mentimeter</span>
        <span class="mmcue__badge"></span>
      </div>
    </div>

    <!-- The arrow: from the prompt, up to the Mentimeter tab. -->
    <!-- Arrowhead drawn as an explicit path, not a <marker>: both poll slides
         stay mounted in the DOM, and a duplicated marker id resolves to the
         hidden twin and silently doesn't paint. -->
    <svg class="mmcue__arrow" viewBox="0 0 980 552" aria-hidden="true">
      <path
        d="M 690 325 C 825 255 740 88 352 62"
        fill="none"
        stroke="#007b7a"
        stroke-width="5"
        stroke-linecap="round"
      />
      <path
        d="M 371 73 L 352 62 L 372 53"
        fill="none"
        stroke="#007b7a"
        stroke-width="5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div class="mmcue__body">
      <div class="mmcue__eyebrow"><span class="mmcue__live"></span>Live poll</div>
      <div class="mmcue__title">Over to you</div>
      <div v-if="kicker" class="mmcue__kicker">{{ kicker }}</div>

      <!-- Poll-results sketch, in the deck's placeholder-bar grammar. -->
      <div class="mmcue__card">
        <div class="mmcue__q"></div>
        <div class="mmcue__bar" style="width: 84%"></div>
        <div class="mmcue__bar" style="width: 61%"></div>
        <div class="mmcue__bar" style="width: 37%"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mmcue {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.mmcue__chrome {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 46px;
  background: #e2dfd6;
  display: flex;
  align-items: flex-end;
  padding-left: 18px;
  border-bottom: 1px solid rgba(0, 21, 20, 0.1);
}
.mmcue__lights {
  display: flex;
  gap: 7px;
  align-self: center;
  margin-right: 18px;
}
.mmcue__lights i {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.mmcue__tab {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 37px;
  padding: 0 18px;
  border-radius: 9px 9px 0 0;
  font-size: 12.5px;
  font-weight: 600;
  color: rgba(0, 21, 20, 0.55);
}
.mmcue__tab--active {
  background: var(--hp-cream, #f6f4ee);
  color: var(--hp-blue-900, #002827);
  border: 1px solid rgba(0, 21, 20, 0.1);
  border-bottom: none;
  margin-bottom: -1px;
  height: 38px;
}
.mmcue__fav {
  width: 15px;
  height: 15px;
  color: rgba(0, 21, 20, 0.6);
}
.mmcue__fav--mm {
  color: var(--hp-blue-500, #007b7a);
}
.mmcue__badge {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e0443e;
  margin-left: 2px;
  animation: mmcue-pulse 1.8s ease-in-out infinite;
}

.mmcue__arrow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.mmcue__body {
  position: absolute;
  inset: 46px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.mmcue__eyebrow {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--hp-blue-700, #005857);
}
.mmcue__live {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #e0443e;
  animation: mmcue-pulse 1.8s ease-in-out infinite;
}
.mmcue__title {
  margin-top: 0.8rem;
  font-size: 3.4rem;
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--hp-blue-900, #002827);
}
.mmcue__kicker {
  margin-top: 0.8rem;
  font-size: 1.15rem;
  color: rgba(0, 21, 20, 0.72);
  max-width: 34rem;
}

.mmcue__card {
  margin-top: 1.9rem;
  width: 330px;
  background: #fff;
  border: 1px solid rgba(0, 123, 122, 0.15);
  border-radius: 14px;
  box-shadow: 0 14px 30px -18px rgba(0, 21, 20, 0.4);
  padding: 1rem 1.15rem 0.7rem;
  text-align: left;
}
.mmcue__q {
  height: 7px;
  width: 62%;
  border-radius: 3.5px;
  background: rgba(0, 21, 20, 0.75);
  margin-bottom: 0.75rem;
}
.mmcue__bar {
  height: 9px;
  border-radius: 4.5px;
  background: #e6e5e0;
  margin-bottom: 0.5rem;
}
.mmcue__cap {
  margin-top: 0.65rem;
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.58rem;
  color: #72726c;
  text-align: right;
}

@keyframes mmcue-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
</style>
