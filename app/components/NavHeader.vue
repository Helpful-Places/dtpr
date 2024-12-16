<script setup>
var isOpen = ref(false);
</script>

<template>
  <div class="app-container mt-4 nav-header">
    <div class="lg:flex lg:items-center lg:justify-between">
      <div class="flex justify-between items-center">
        <NuxtLinkLocale to="/" class="flex items-center">
          <img src="/images/dtpr_logo.svg" />
          <div class="font-[500] text-dtpr-blue-950 text-xl ml-4">DTPR</div>
        </NuxtLinkLocale>
        <div class="flex">
          <!-- <LocaleSwitcher class="block lg:hidden" /> -->
          <button class="cursor-pointer mx-2 lg:hidden block print:hidden" @click="isOpen = !isOpen" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        </div>
      </div>
      <div class="flex print:hidden">
        <nav class="flex items-center">
          <ul :class="isOpen ? 'block' : 'hidden'" class="mt-4 lg:flex lg:items-center lg:m-0">
            <li><NuxtLinkLocale to="/tools-and-resources" @click="isOpen = false">Tools & Resources</NuxtLinkLocale></li>
            <li><NuxtLinkLocale to="/how-we-got-here" @click="isOpen=false">Origins</NuxtLinkLocale></li>
            <li><NuxtLinkLocale to="/governance" @click="isOpen-false">Governance</NuxtLinkLocale></li>
            <li><NuxtLinkLocale to="/awards" @click="isOpen-false">Awards</NuxtLinkLocale></li>
            <li><NuxtLinkLocale to="/get-involved" @click="isOpen = false">Get Involved</NuxtLinkLocale></li>
            <li><NuxtLinkLocale to="/taxonomy" @click="isOpen = false">Taxonomy</NuxtLinkLocale></li>
            <!-- <li><a href="https://vision.dtpr.io" class="flex items-center">{{ $t('vision') }}<Icon class="inline text-gray-400 ml-1" icon="fa6-solid:up-right-from-square" /></a></li> -->
          </ul>
        </nav>
        <!-- <LocaleSwitcher class="hidden lg:block ml-4" /> -->
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
        @apply text-dtpr-blue-950 bg-gray-200
      }
    }
  
    li:not(:last-child) {
      @apply mr-3;
    }
  }
}
</style>
