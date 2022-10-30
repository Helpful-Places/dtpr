<template>
  <div class="app-container mt-4 nav-header">
    <div class="md:flex md:items-center md:justify-between">
      <div class="flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center">
          <img src="~/assets/images/dtpr_logo.svg" />
          <div class="font-[500] text-dtpr-blue text-xl ml-4">DTPR</div>
        </NuxtLink>
        <button class="cursor-pointer mx-2 md:hidden block print:hidden" @click="isOpen = !isOpen" type="button">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      </div>
      <div class="md:flex print:hidden">
        <nav class="flex items-center">
          <ul :class="isOpen ? 'block' : 'hidden'" class="mt-4 md:flex md:items-center md:m-0">
            <li><NuxtLink to="/guide">{{ $t('tools_resources') }}</NuxtLink></li>
            <li><NuxtLink to="/taxonomy">{{ $t('taxonomy') }}</NuxtLink></li>
            <li><NuxtLink to="/get-involved">{{ $t('get_involved') }}</NuxtLink></li>
          </ul>
        </nav>
        <form :class="isOpen ? 'block' : 'higstdden'" class="md:ml-4 mt-4 md:mt-0 flex md:flex">
          <select class="text-sm bg-gray-200 rounded-md px-1 py-0 grow md:grow-0" id="locale-select" v-model="$i18n.locale">
            <option value="en-US">🇺🇸 en</option>
            <option value="en-CA">🇨🇦 en</option>
            <option value="fr-FR">🇫🇷 fr</option>
            <option value="fr-CA">🇨🇦 fr</option>
          </select>
        </form>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
nav {  
  ul {
    li a {
      @apply text-black font-[700] text-sm rounded-xl py-1 px-3;
  
      &:hover {
        @apply text-dtpr-blue bg-gray-200
      }
    }
  
    li:not(:last-child) {
      @apply mr-3;
    }
  }
}

</style>

<script setup>
var isOpen = ref(true);
</script>