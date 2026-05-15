<script setup lang="ts">
useHead({ title: 'Datachain visualizer' })
</script>

<template>
  <div class="datachain-visualizer">
    <header class="datachain-visualizer__header">
      <h1 class="datachain-visualizer__title">Datachain visualizer</h1>
      <p class="datachain-visualizer__subtitle">
        Paste or drop a <code>DatachainInstance</code> JSON to validate and render it.
      </p>
    </header>

    <div class="datachain-visualizer__layout">
      <main class="datachain-visualizer__main">
        <p class="datachain-visualizer__placeholder">
          The visualizer is being built. Subsequent units fill in the input,
          validation, render, locale, collection, and deep-link surfaces.
        </p>
      </main>
    </div>
  </div>
</template>

<style scoped>
.datachain-visualizer {
  min-height: 100vh;
}

.datachain-visualizer__header {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 0.5rem;
}

.datachain-visualizer__title {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
}

.datachain-visualizer__subtitle {
  margin: 0.25rem 0 0;
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.875rem;
}

.datachain-visualizer__subtitle code {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 0.85em;
}

.datachain-visualizer__layout {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1.5rem;
}

.datachain-visualizer__placeholder {
  color: var(--ui-text-dimmed, rgb(107, 114, 128));
  font-size: 0.9375rem;
}
</style>
