<script setup>
useHead({
  title: 'Taxonomy'
})

const { locale } = useI18n();

await useAsyncData('dtpr-elements', () => queryContent('dtpr/elements').where({
    _locale: locale.value
  }).find()
);

await useAsyncData('dtpr-categories', () => queryContent('dtpr/categories').where({
    _locale: locale.value
  }).find()
);
</script>

<template>
  <div class="app-container">
    <ElementSection element-category="accountable" />
    <ElementSection element-category="purpose" />
    <ElementSection element-category="tech" />
    <ElementSection element-category="data" />
    <ElementSection element-category="process" />
    <ElementSection element-category="access" />
    <ElementSection element-category="storage" />
  </div>
</template>

