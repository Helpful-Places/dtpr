<script setup>
useHead({
  title: 'Device Taxonomy'
})

const { locale } = useI18n()

// Query categories of type 'sensor'
const categories = await queryCollection('categories')
  .where('datachain_type', '=', 'device')
  .where('_locale', '=', locale.value)
  .all();

// Build query to find elements that belong to any of the sensor categories
const categoryQuery = ['query'];
categories.forEach(category => {
  categoryQuery.push(`where('category', 'LIKE', '%${ category.dtpr_id }%')`);
});

// Query elements that match any of the sensor categories
const elements = await queryCollection('elements')
  .where('_locale', '=', locale.value)
  .orWhere(query => { return eval(categoryQuery.join('.')) })
  .all();

const categoryOrder = [
  'device__accountable',
  'device__purpose',
  'device__tech',
  'device__data',
  'device__process',
  'device__access',
  'device__retention',
  'device__storage'
]
</script>

<template>
  <div>
    <TaxonomyLayout
      :categories="categories"
      :elements="elements"
      :category-order="categoryOrder"
      title="Device Taxonomy"
      description="The following DTPR elements can be used to construct a data chain for physical technologies, such as sensors, robotics, and other physical devices."
    />
  </div>
</template>