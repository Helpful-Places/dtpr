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
      <!-- <ContentList path="/articles" v-slot="{ list }">
        <div v-for="article in list" :key="article._path">
          <h2>{{ article.title }}</h2>
          <p>{{ article.description }}</p>
        </div>
      </ContentList> -->

      <tr v-for="symbol in symbols" :key="symbol.id">
        <td>
          <img
            :src=symbol.icon
            alt=""
          />
        </td>
        <td>{{symbol.name}}</td>
        <td>{{symbol.description}}</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { watch } from 'vue'

const locale = useLocale();
const { data: symbols } = await useAsyncData('symbols', () => {
  return queryContent( `/dtpr/symbols/${locale.value}`).where({ category: 'data' }).find();
});

watch(locale, async () => {
  refreshNuxtData('symbols');
});
</script>
