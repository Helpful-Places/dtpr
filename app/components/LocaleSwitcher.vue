<template>
  <div class="locale-switcher">
    <select id="locale-chooser" v-model="locale" class="m-auto w-50 border n-border-base rounded p-1">
      <option v-for="l of locales" :key="l" :value="l">
        {{ l }}
      </option>
    </select>
  </div>
</template>

<script setup>
const locales = useLocales()
const locale = useLocale()
</script>