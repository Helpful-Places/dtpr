<script setup>
useHead({
  title: 'AI Taxonomy'
})

const { locale } = useI18n()

// Query categories of type 'ai'
const categories = await queryCollection('categories')
  .where('datachain_type', '=', 'ai')
  .where('_locale', '=', locale.value)
  .all();

// Build query to find elements that belong to any of the ai categories
const categoryQuery = ['query'];
categories.forEach(category => {
  categoryQuery.push(`where('category', 'LIKE', '%${ category.dtpr_id }%')`);
});

// Query elements that match any of the ai categories
const elements = await queryCollection('elements')
  .where('_locale', '=', locale.value)
  .orWhere(query => { return eval(categoryQuery.join('.')) })
  .all();

const categoryOrder = [
  'ai__accountable',
  'ai__purpose',
  'ai__decision',
  'ai__input_dataset',
  'ai__processing',
  'ai__output_dataset',
  'ai__access',
  'ai__retention',
  // 'ai__storage',
  'ai__risks_mitigation',
  'ai__rights'
]
</script>

<template>
  <div>
    <TaxonomyLayout
      :categories="categories"
      :elements="elements"
      :category-order="categoryOrder"
      title="AI / Algorithm Taxonomy"
      description="The following DTPR elements can be used to construct a data chain for AI or algorithmic decision making systems."
    />
  </div>
</template>