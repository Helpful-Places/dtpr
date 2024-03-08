<script setup>
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <div class="dropdown dropdown-hover dropdown-end">
    <div tabindex="0" role="button" class="btn btn-sm m-1">{{ locale }}</div>
    <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
      <li
        v-for="l in locales"
        :key="l"
      >
        <NuxtLink :to="switchLocalePath(l)">{{ l }}</NuxtLink>
      </li>
    </ul>
  </div>
</template>
