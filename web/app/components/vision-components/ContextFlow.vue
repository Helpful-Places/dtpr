<script setup lang="ts">
// Three-up flow of DTPR elements composing the top of a Context
// section: Accountable → Functional Modes → Purpose. Each card is
// rendered through <DtprPlacement>, so titles, context tags, and
// composed-icon colours all flow from the live schema. The component
// owns the row + arrows only; surrounding copy (slide title, the
// composed plain-English sentence, footer notes) belongs on the slide.
import DtprPlacement from './DtprPlacement.vue'
</script>

<template>
  <div class="context-flow">
    <DtprPlacement
      element-id="institution"
      context-type-id="deployer"
      title-override="Canada Border Services Agency"
      :show-description="false"
      :icon-size="64"
    />
    <div class="context-flow__arrow">→</div>
    <!--
      The TCI's AIA is explicit on autonomy: "the final decision to
      release or refer a traveller to secondary will always be made by
      the BSO" — DTPR's `human_decides`. (Partial automation in the
      AIA's own scoring.)
    -->
    <DtprPlacement
      element-id="analytical_mode"
      context-type-id="human_decides"
      :show-description="false"
      :icon-size="64"
    />
    <div class="context-flow__arrow">→</div>
    <!--
      AlgorithmHeader's purpose cell renders the first purpose
      element in the datachain (border_immigration), so this row
      mirrors that choice for consistency across the deck.
    -->
    <DtprPlacement
      element-id="border_immigration"
      :show-description="false"
      :icon-size="64"
    />
  </div>
</template>

<style scoped>
.context-flow {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 0.75rem;
  align-items: stretch;
}
.context-flow__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.25rem;
  opacity: 0.5;
}
</style>
