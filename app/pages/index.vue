<template>
  <div>
    <NavHeader />

    <SymbolSection symbol-category="accountable" symbol-category-name="Accountable" />
    <SymbolSection symbol-category="purpose" symbol-category-name="Purpose" />
    <SymbolSection symbol-category="tech" symbol-category-name="Technology" />
    <SymbolSection symbol-category="data" symbol-category-name="Data Type" />
    <SymbolSection symbol-category="process" symbol-category-name="Data Processing" />
    <SymbolSection symbol-category="access" symbol-category-name="Data Access" />
    <SymbolSection symbol-category="storage" symbol-category-name="Data Storage" />
  </div>
</template>

<style lang="postcss">
h1 {
  @apply text-3xl;
}

a {
  @apply text-blue-300;
}

.dtpr-container {
  @apply container mx-auto;
}
</style>