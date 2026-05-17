<script setup lang="ts">
// Three-up flow of DTPR elements composing the Data Flow subchain:
// Input → Processing → Output. Each card is rendered through
// <DtprPlacement>, so titles, context tags, and composed-icon colours
// flow from the live schema. The component owns the row + arrows only;
// surrounding copy (slide title, caption, footnotes) belongs on the
// slide.
import DtprPlacement from './DtprPlacement.vue'
</script>

<template>
  <div class="data-flow">
    <DtprPlacement
      element-id="input_about_a_person"
      context-type-id="identifiable"
      :show-description="false"
      :icon-size="64"
    />
    <div class="data-flow__arrow">→</div>
    <DtprPlacement
      element-id="optimization"
      :show-description="false"
      :icon-size="64"
    />
    <div class="data-flow__arrow">→</div>
    <DtprPlacement
      element-id="output_decision"
      context-type-id="identifiable"
      :show-description="false"
      :icon-size="64"
    />
  </div>
</template>

<style scoped>
.data-flow {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  gap: 0.75rem;
  align-items: stretch;
}
.data-flow__arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.25rem;
  opacity: 0.5;
}
</style>
