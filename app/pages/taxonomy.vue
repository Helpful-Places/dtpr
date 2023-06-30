<template>
  <div class="app-container">
    <ElementSection element-category="accountable" element-category-name="Accountable" />
    <ElementSection element-category="purpose" element-category-name="Purpose" />
    <ElementSection element-category="tech" element-category-name="Technology" />
    <ElementSection element-category="data" element-category-name="Data Type" />
    <ElementSection element-category="process" element-category-name="Data Processing" />
    <ElementSection element-category="access" element-category-name="Data Access" />
    <ElementSection element-category="storage" element-category-name="Data Storage" />
  </div>
</template>

<script setup>
  useHead({
    title: 'Taxonomy'
  })
</script>