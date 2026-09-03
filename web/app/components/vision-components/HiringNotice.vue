<script setup lang="ts">
// Speculative mock: the notice a candidate receives after an automated
// screening tool touched their application — the disclosure NYC Local
// Law 144 already gestures at, projected through DTPR. The block is a
// left-teal quote-block rather than the letter's box: same grammar,
// email-native frame. Fictional employer, `.example` domain on purpose.
import { getElementIconUrl } from '../../setup/dtpr'

const SCHEMA = 'ai@2026-05-06-beta'
const icon = (id: string, variant?: string) => getElementIconUrl(SCHEMA, id, variant)
</script>

<template>
  <div class="mail">
    <div class="mail__chrome">
      <div class="mail__subject">Your application to Fulton Analytics — how it was reviewed</div>
      <div class="mail__chrome-icons" aria-hidden="true">
        <span>↩</span>
        <span>⋯</span>
      </div>
    </div>

    <div class="mail__meta">
      <span class="mail__avatar" aria-hidden="true">F</span>
      <div class="mail__meta-lines">
        <div><b>Fulton Analytics Talent</b> &lt;talent@fultonanalytics.example&gt;</div>
        <div class="mail__meta-sub">to jordan@example.com · Aug 12, 2026</div>
      </div>
    </div>

    <div class="mail__body">
      <p>Hi Jordan,</p>
      <p>
        Thank you for applying for the <b>Data Analyst</b> role. Before a recruiter read your
        application, an automated screening tool ranked it against the role’s requirements.
        New York City law requires us to tell you how that tool works — here is the short version.
      </p>
    </div>

    <div class="mail__dtpr">
      <div class="mail__zl">How your application was screened</div>

      <div class="mail__row">
        <img :src="icon('analytical_mode', 'human_decides')" alt="" width="26" height="26" />
        <div class="mail__row-main">
          <span class="mail__row-title">Ranks applications; recruiters make every decision</span>
          <span class="mail__pill" style="--tagc: #2A9D8F"><span class="mail__pill-dot" />Human decides</span>
        </div>
      </div>

      <div class="mail__row">
        <img :src="icon('input_sensitive_personal', 'identifiable')" alt="" width="26" height="26" />
        <div class="mail__row-main">
          <span class="mail__row-title">Reads your résumé and work history</span>
          <span class="mail__pill" style="--tagc: #FFD700"><span class="mail__pill-dot" />Identifiable</span>
        </div>
      </div>

      <div class="mail__row">
        <img :src="icon('right_non_discrimination')" alt="" width="26" height="26" />
        <div class="mail__row-main">
          <span class="mail__row-title">Independent bias audit published — NYC Local Law 144, March 2026</span>
          <span class="mail__link">View audit results</span>
        </div>
      </div>

      <div class="mail__zl mail__zl--second">What you can do</div>

      <div class="mail__actions">
        <span class="mail__action-item">
          <img :src="icon('right_to_human_review')" alt="" width="20" height="20" />
          <span class="mail__act">email · Ask a recruiter to re-review</span>
        </span>
        <span class="mail__action-item">
          <img :src="icon('right_contest')" alt="" width="20" height="20" />
          <span class="mail__act">url · Contest the outcome</span>
        </span>
      </div>

      <div class="mail__record">
        View the full disclosure record → <b>dtpr.link/fulton-screening</b>
      </div>
    </div>

    <div class="mail__sig">— Fulton Analytics Talent Team</div>
  </div>
</template>

<style scoped>
.mail {
  width: 680px;
  max-width: 100%;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 18px 40px -24px rgba(0, 21, 20, 0.35);
  padding: 1rem 1.3rem 1.1rem;
  text-align: left;
  color: #1b1b19;
}

.mail__chrome {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.mail__subject {
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.mail__chrome-icons {
  display: flex;
  gap: 0.6rem;
  color: #72726c;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.mail__meta {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-top: 0.55rem;
  padding-bottom: 0.55rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.mail__avatar {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  background: var(--hp-blue-500, #007b7a);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}
.mail__meta-lines {
  font-size: 0.68rem;
  line-height: 1.4;
}
.mail__meta-sub {
  color: #72726c;
  font-size: 0.62rem;
}

.mail__body {
  font-size: 0.74rem;
  line-height: 1.5;
  margin-top: 0.55rem;
}
.mail__body p {
  margin: 0 0 0.4rem;
}

.mail__dtpr {
  border-left: 3px solid var(--hp-blue-500, #007b7a);
  background: #fafaf8;
  border-radius: 0 8px 8px 0;
  padding: 0.65rem 0.85rem 0.7rem;
  margin-top: 0.3rem;
}

.mail__zl {
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #72726c;
  margin-bottom: 0.45rem;
}
.mail__zl--second {
  margin-top: 0.6rem;
}

.mail__row {
  display: grid;
  grid-template-columns: 26px 1fr;
  gap: 0.55rem;
  align-items: center;
  padding: 0.22rem 0;
}
.mail__row-main {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.mail__row-title {
  font-size: 0.7rem;
  font-weight: 600;
}

.mail__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.58rem;
  font-weight: 600;
  border-radius: 999px;
  padding: 0.05rem 0.5rem 0.05rem 0.4rem;
  background: color-mix(in srgb, var(--tagc) 12%, #fff);
  border: 1px solid color-mix(in srgb, var(--tagc) 42%, transparent);
}
.mail__pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: var(--tagc);
}

.mail__link {
  font-size: 0.64rem;
  font-weight: 600;
  color: var(--hp-blue-500, #007b7a);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.mail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
}
.mail__action-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}
.mail__act {
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

.mail__record {
  font-size: 0.64rem;
  color: #72726c;
  margin-top: 0.6rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.mail__record b {
  color: var(--hp-blue-500, #007b7a);
}

.mail__sig {
  font-size: 0.7rem;
  color: #72726c;
  margin-top: 0.6rem;
}
</style>
