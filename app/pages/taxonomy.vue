<template>
  <div class="app-container">
    <SymbolSection symbol-category="accountable" symbol-category-name="Accountable" />
    <SymbolSection symbol-category="purpose" symbol-category-name="Purpose" />
    <SymbolSection symbol-category="tech" symbol-category-name="Technology" />
    <SymbolSection symbol-category="data" symbol-category-name="Data Type" />
    <SymbolSection symbol-category="process" symbol-category-name="Data Processing" />
    <SymbolSection symbol-category="access" symbol-category-name="Data Access" />
    <SymbolSection symbol-category="storage" symbol-category-name="Data Storage" />
  </div>
</template>

<script setup>
  useHead({
    title: 'Taxonomy'
  })
</script>