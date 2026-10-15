<script setup lang="ts">
// The data_flow subchain of dtpr@2026-09-01-beta, five seats wide:
// collection → input → model → output → manifestation. CBSA's assessment
// fills the middle three. The two ends stay empty on purpose: the deck
// never puts a value in a record that the source document doesn't state.
// Each filled seat renders through <DtprPlacement>, so titles, context
// chips and icon colours come from the live schema.
import DtprPlacement from './DtprPlacement.vue'
</script>

<template>
  <div class="data-flow">
    <div class="data-flow__empty">
      <div class="data-flow__empty-eyebrow">Collection</div>
      <div class="data-flow__empty-ring" aria-hidden="true" />
      <div class="data-flow__empty-note">not stated</div>
    </div>
    <div class="data-flow__arrow">→</div>
    <DtprPlacement
      element-id="input_sensitive_personal"
      context-type-id="identifiable"
      :show-description="false"
      :icon-size="56"
    />
    <div class="data-flow__arrow">→</div>
    <DtprPlacement
      element-id="classification_prediction"
      :show-description="false"
      :icon-size="56"
    />
    <div class="data-flow__arrow">→</div>
    <DtprPlacement
      element-id="output_recommendation"
      context-type-id="identifiable"
      :show-description="false"
      :icon-size="56"
    />
    <div class="data-flow__arrow">→</div>
    <div class="data-flow__empty">
      <div class="data-flow__empty-eyebrow">Manifestation</div>
      <div class="data-flow__empty-ring" aria-hidden="true" />
      <div class="data-flow__empty-note">not stated</div>
    </div>
  </div>
</template>

<style scoped>
.data-flow {
  width: 100%;
  display: grid;
  grid-template-columns: 0.8fr auto 1fr auto 1fr auto 1fr auto 0.8fr;
  gap: 0.5rem;
  align-items: stretch;
}
.data-flow__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  opacity: 0.45;
}
.data-flow__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1.5px dashed rgba(0, 21, 20, 0.2);
  border-radius: 0.75rem;
  padding: 0.75rem 0.5rem;
  text-align: center;
}
.data-flow__empty-eyebrow {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #72726c;
}
.data-flow__empty-ring {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: 1.5px dashed rgba(0, 21, 20, 0.25);
}
.data-flow__empty-note {
  font-size: 0.72rem;
  font-style: italic;
  color: #72726c;
}
</style>
