<script setup lang="ts">
// Every element in the pinned schema, fetched live, as a quiet wall behind
// the closing slide. The list endpoint paginates at 50 by default; ask for
// the lot.
import { ref, onMounted } from 'vue'
import { getElementIconUrl } from '../setup/dtpr'

const SCHEMA = 'dtpr@2026-09-01-beta'
const ids = ref<string[]>([])

onMounted(async () => {
  try {
    const res = await fetch(`https://api.dtpr.io/api/v2/schemas/${SCHEMA}/elements?limit=200&locales=en`)
    const json = (await res.json()) as { elements: Array<{ id: string }> }
    ids.value = json.elements.map((e) => e.id)
  } catch {
    ids.value = []
  }
})
</script>

<template>
  <div class="wall" aria-hidden="true">
    <img v-for="id in ids" :key="id" :src="getElementIconUrl(SCHEMA, id)" alt="" width="30" height="30" loading="lazy" />
  </div>
</template>

<style scoped>
.wall {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  opacity: 0.32;
}
.wall img { object-fit: contain; }
</style>
