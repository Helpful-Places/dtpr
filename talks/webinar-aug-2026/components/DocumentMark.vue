<script setup lang="ts">
// Speculative mock: the smallest disclosure that survives printing — a
// standardized mark in the margin of a document AI helped make. Here, a
// résumé corner: glyph + claim + record reference, kin to content
// credentials and the notary stamp. The Line level, on paper.
import { getElementIconUrl } from '../setup/dtpr'

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string) => getElementIconUrl(SCHEMA, id)

// Skeleton line widths (%) — enough texture to read as a résumé without
// competing with the mark.
const EXPERIENCE_LINES = [96, 88, 72]
const EXPERIENCE_LINES_2 = [92, 80]
const EDUCATION_LINES = [84, 58]
</script>

<template>
  <div class="cv">
    <div class="cv__name">Jordan Alvarez</div>
    <div class="cv__role">Data Analyst · Brooklyn, NY · jordan@example.com</div>

    <div class="cv__rule" />

    <div class="cv__section">Experience</div>
    <div class="cv__entry">
      <div class="cv__entry-head">
        <span class="cv__entry-title">Senior Reporting Analyst — Harborlight Health</span>
        <span class="cv__entry-dates">2023 – present</span>
      </div>
      <div v-for="(w, i) in EXPERIENCE_LINES" :key="i" class="cv__line" :style="{ width: `${w}%` }" />
    </div>
    <div class="cv__entry">
      <div class="cv__entry-head">
        <span class="cv__entry-title">Data Analyst — Meridian Retail Group</span>
        <span class="cv__entry-dates">2020 – 2023</span>
      </div>
      <div v-for="(w, i) in EXPERIENCE_LINES_2" :key="i" class="cv__line" :style="{ width: `${w}%` }" />
    </div>

    <div class="cv__section">Education</div>
    <div class="cv__entry">
      <div v-for="(w, i) in EDUCATION_LINES" :key="i" class="cv__line" :style="{ width: `${w}%` }" />
    </div>

    <div class="cv__mark">
      <img :src="icon('output_generated_content')" alt="" width="18" height="18" />
      <span class="cv__mark-text">
        <span class="cv__mark-claim">Made with AI assistance</span>
        <span class="cv__mark-ref">dtpr.link/r/ja-cv-0425</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.cv {
  position: relative;
  width: 460px;
  max-width: 100%;
  background: #fff;
  padding: 1.5rem 1.8rem 1.3rem;
  box-shadow: 0 24px 50px -24px rgba(0, 21, 20, 0.4);
  color: #1b1b19;
  text-align: left;
}

.cv__name {
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.cv__role {
  font-size: 0.64rem;
  color: #72726c;
  margin-top: 0.15rem;
}
.cv__rule {
  height: 1.5px;
  background: #001514;
  margin: 0.55rem 0 0.6rem;
}

.cv__section {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #72726c;
  margin: 0.55rem 0 0.35rem;
}

.cv__entry {
  margin-bottom: 0.45rem;
}
.cv__entry-head {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  font-size: 0.66rem;
  margin-bottom: 0.3rem;
}
.cv__entry-title {
  font-weight: 600;
}
.cv__entry-dates {
  color: #72726c;
  flex-shrink: 0;
}

.cv__line {
  height: 6px;
  border-radius: 3px;
  background: #e6e5e0;
  margin-bottom: 0.28rem;
}

/* The mark: a stamp-like chip in the document's bottom corner. */
.cv__mark {
  position: absolute;
  right: 1.4rem;
  bottom: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  background: #fff;
  border: 1px solid #1b1b19;
  border-radius: 6px;
  padding: 0.3rem 0.55rem;
  transform: rotate(-1.5deg);
  box-shadow: 0 2px 8px -4px rgba(0, 21, 20, 0.3);
}
.cv__mark-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.cv__mark-claim {
  font-size: 0.6rem;
  font-weight: 700;
}
.cv__mark-ref {
  font-family: var(--slidev-code-font-family, 'JetBrains Mono', monospace);
  font-size: 0.52rem;
  color: #72726c;
}
</style>
