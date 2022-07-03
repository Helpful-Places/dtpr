<template>
  <h3 id="data-type">Data Type</h3>
  <table>
    <thead>
      <tr>
        <th>Icon</th>
        <th>Technology</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="symbol in symbols" :key="symbol.id">
        <td>
          <img
            :src=symbol.icon
            :alt=symbol.name
          />
        </td>
        <td>{{symbol.name}}</td>
        <td v-html="$md.render(symbol.description)"></td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { watch } from 'vue'

const props = defineProps({
  'symbolCategory': String
})
const locale = useLocale();
const symbolCategorySyncId = `symbols-${props.symbolCategory}`;

const { data: symbols } = await useAsyncData(symbolCategorySyncId, () => {
  return queryContent(`/dtpr/symbols/${locale.value}`).where({ category: props.symbolCategory }).find();
});

watch(locale, async () => {
  refreshNuxtData(symbolCategorySyncId);
});
</script>
