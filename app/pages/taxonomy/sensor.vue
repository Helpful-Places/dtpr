<script setup>
useHead({
  title: 'Sensor Taxonomy'
})

const { locale } = useI18n()

// Query categories of type 'sensor'
const categories = await queryCollection('categories')
  .where('datachain_type', '=', 'sensor')
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
  'sensor__accountable',
  'sensor__purpose',
  'sensor__tech',
  'sensor__data',
  'sensor__process',
  'sensor__access',
  'sensor__retention',
  'sensor__storage'
]
</script>

<template>
  <div>
    <TaxonomyLayout
      :categories="categories"
      :elements="elements"
      :category-order="categoryOrder"
      title="Sensor Taxonomy"
      description="The following DTPR elements can be used to construct a data chain for physical technologies, such as sensors or robotics."
    />
  </div>
</template>