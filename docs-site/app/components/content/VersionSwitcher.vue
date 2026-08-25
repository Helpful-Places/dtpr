<script setup lang="ts">
const route = useRoute()

// v2 is the maintained API. v1 and v0 are frozen: preserved byte-for-byte
// from the retired dtpr.io service, never updated again. The v0 pages live
// under `_v0/`, which keeps them out of the nav but also out of the router
// at `/api/v0/...` — so its path here is the real one it renders at.
const versions = [
  { id: 'v2', label: 'v2 (Current)', path: '/api/v2/overview' },
  { id: 'v1', label: 'v1 (Frozen)', path: '/api/v1/overview' },
  { id: 'v0', label: 'v0 (Frozen)', path: '/api/_v0/overview' }
]

const currentVersion = computed(() => {
  const path = route.path
  // Match version segment in /api/v1/..., /api/v0/..., /api/2026-06/..., etc.
  const match = path.match(/\/api\/(v\d+|_v\d+|\d{4}-\d{2})/)
  if (match) {
    return match[1].replace(/^_/, '')
  }
  return null
})

const isFrozen = computed(() => {
  return currentVersion.value !== null && currentVersion.value !== 'v2'
})

function navigateToVersion(version: typeof versions[number]) {
  navigateTo(version.path)
}
</script>

<template>
  <div v-if="currentVersion" class="version-switcher">
    <span class="version-switcher-label">API Version:</span>
    <select
      :value="currentVersion"
      class="version-switcher-select"
      @change="navigateToVersion(versions.find(v => v.id === ($event.target as HTMLSelectElement).value)!)"
    >
      <option
        v-for="version in versions"
        :key="version.id"
        :value="version.id"
      >
        {{ version.label }}
      </option>
    </select>
    <span v-if="isFrozen" class="version-switcher-badge">
      Frozen
    </span>
  </div>
</template>

<style scoped>
.version-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.version-switcher-label {
  font-weight: 500;
  color: var(--color-gray-600);
}

.version-switcher-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.375rem;
  background: var(--color-white);
  font-size: 0.875rem;
  cursor: pointer;
}

.dark .version-switcher-select {
  background: var(--color-gray-800);
  border-color: var(--color-gray-600);
  color: var(--color-gray-200);
}

.version-switcher-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: var(--color-amber-100);
  color: var(--color-amber-800);
  font-size: 0.75rem;
  font-weight: 600;
}

.dark .version-switcher-badge {
  background: var(--color-amber-900);
  color: var(--color-amber-200);
}
</style>
