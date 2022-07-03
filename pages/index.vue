<template>
  <LocaleSwitcher />

  <SymbolSection symbol-category="purpose" />
  <SymbolSection symbol-category="tech" />
  <SymbolSection symbol-category="data" />
  <SymbolSection symbol-category="process" />
  <SymbolSection symbol-category="access" />
  <SymbolSection symbol-category="storage" />
</template>

<style lang="postcss">
h1 {
  @apply text-3xl;
}

a {
  @apply text-blue-300;
}
</style>