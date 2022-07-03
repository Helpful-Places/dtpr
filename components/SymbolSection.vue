<template>
  <div class="border-b-2 border-dtpr-green mb-12 mt-16">
    <h3 id="data-type" class="dtpr-container">{{props.symbolCategoryName}}</h3>
  </div>
  <table class="dtpr-container">
    <thead>
      <tr class="text-left">
        <th class="shrink">Icon</th>
        <th class="w-1/6">Technology</th>
        <th class="">Description</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="symbol in symbols" :key="`${locale}-${symbol.id}`">
        <td><SymbolIcon :iconTitle="symbol.title" /></td>
        <td>{{symbol.name}}</td>
        <td v-html="$md.render(symbol.description)"></td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { watch, ref } from 'vue'

const props = defineProps({
  'symbolCategory': String,
  'symbolCategoryName': String
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

<style lang="postcss" scoped>
h3 {
  @apply text-xl text-dtpr-green my-2 font-bold;
}

tr {
  @apply border-t;
}

td, th {
  @apply px-1 py-2;
}
</style>