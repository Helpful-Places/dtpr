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
      title-override="NYC Dept of Education"
      :show-description="false"
      :icon-size="64"
    />
    <div class="context-flow__arrow">→</div>
    <!--
      DTPR's schema-defined autonomy values are human_decides,
      human_executes, autonomous. The OTI report's "monitored"
      descriptor maps closest to `human_executes` (the system decides;
      humans carry out enrollment).
    -->
    <DtprPlacement
      element-id="analytical_mode"
      context-type-id="human_executes"
      :show-description="false"
      :icon-size="64"
    />
    <div class="context-flow__arrow">→</div>
    <!--
      AlgorithmHeader's purpose cell renders the first purpose
      element in the datachain (eligibility_benefits), so this row
      mirrors that choice for consistency across the deck.
    -->
    <DtprPlacement
      element-id="eligibility_benefits"
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
