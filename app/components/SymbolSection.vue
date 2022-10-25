<template>
  <div class="break-after-page flex flex-col">
    <div class="border-b-2 border-dtpr-green mb-12 mt-16">
      <h3 id="data-type" class="dtpr-container">{{ category.name }}</h3>
    </div>
    <table class="dtpr-container grow">
      <thead>
        <tr class="text-left">
          <th class="w-1/12">{{ $t('icon') }}</th>
          <th class="w-1/6">{{category.name}}</th>
          <th class="">{{ $t('description') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="symbol in symbols" :key="`${locale}-${symbol.id}`">
          <td><img :src=symbol.icon /></td>
          <td>{{symbol.name}}</td>
          <td v-html="$md.render(symbol.description)"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

const props = defineProps({
  'symbolCategory': String,
  'symbolCategoryName': String
})

const symbolCategorySyncId = `symbols-${props.symbolCategory}`;
const { data: symbols } = await useAsyncData(symbolCategorySyncId, () => {
  return queryContent(`/dtpr/symbols/${locale.value.split('-')[0]}`).where({ category: props.symbolCategory }).find();
});

const categorySyncId = `category-${props.symbolCategory}`;
const { data: category } = await useAsyncData(categorySyncId, () => {
  return queryContent(`/dtpr/categories/${locale.value.split('-')[0]}`).where({ id: props.symbolCategory }).findOne();
});

watch(locale, async () => {
  refreshNuxtData(symbolCategorySyncId);
  refreshNuxtData(categorySyncId);
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