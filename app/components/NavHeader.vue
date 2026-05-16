<script setup>
var isOpen = ref(false);
var dropdownOpen = ref(false);
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
      <div class="print:hidden">
        <nav class="lg:flex lg:items-center">
          <ul :class="isOpen ? 'block' : 'hidden'" class="mt-4 lg:flex lg:items-center lg:m-0">
            <li class="external bg-dtpr-blue-100 font-[700] text-sm rounded-xl py-1 px-3"><a target="_blank" href="https://dtpr.guide/landing">DTPR in the World</a></li>

            <li :class="{ 'open': dropdownOpen }" class="dropdown-toggle external bg-dtpr-blue-100 font-[700] text-sm rounded-xl py-1 px-3" @click="dropdownOpen = !dropdownOpen">Documentation  <Icon name="icons8:angle-down" class="dropdown-chevron"/>
              <ul class="dropdown bg-dtpr-blue-950">
                <li class="font-[700] text-sm text-white py-1 px-3"><a class="text-white" href="https://docs.dtpr.io" target="_blank">For Sensors</a></li>
                <li class="font-[700] text-sm text-white py-1 px-3"><a class="text-white" href="https://www.dtpr.ai" target="_blank">For AI</a></li>
              </ul>
            </li>

            <li class="regular-nav"><NuxtLinkLocale to="/taxonomy/device" @click="isOpen = false">Taxonomy</NuxtLinkLocale></li>
            
            <!-- <li><NuxtLinkLocale to="/tools-and-resources" @click="isOpen = false">Tools & Resources</NuxtLinkLocale></li> -->
            <li class="regular-nav"><NuxtLinkLocale to="/how-we-got-here" @click="isOpen=false">Origins</NuxtLinkLocale></li>
            <!-- <li><NuxtLinkLocale to="/governance" @click="isOpen-false">Governance</NuxtLinkLocale></li> -->
            <!-- <li><NuxtLinkLocale to="/awards" @click="isOpen-false">Awards</NuxtLinkLocale></li> -->
            <li class="regular-nav"><NuxtLinkLocale to="/get-involved" @click="isOpen = false">Get Involved</NuxtLinkLocale></li>
            
            <!-- <li><a href="https://vision.dtpr.io" class="flex items-center">Vision<Icon class="inline text-gray-400 ml-1" icon="fa6-solid:up-right-from-square" /></a></li> -->
            
            
          </ul>
          
        </nav>
        
        <!-- <LocaleSwitcher class="hidden lg:block ml-4" /> -->
      </div>
      
    </div>
  </div>
</template>

<style lang="postcss" scoped>
nav {  
  ul {
    .regular-nav a {
      @apply text-black font-[700] text-sm rounded-xl py-1 px-3;
  
      &:hover {
        @apply text-dtpr-blue-950 bg-gray-200
      }
    }
  
    li:not(:last-child) {
      @apply mb-2 lg:mb-0 lg:mr-3;
    }

    .external{
      display:block;
      padding:0.5rem 1rem;

      &:hover{
        @apply text-white bg-dtpr-blue-950;
      }
    }

    @media (min-width: 1024px) {
      .external{
        display:inline-block;
      }
    }

    .dropdown-toggle{
      cursor:pointer;
      margin-left:0;
      position:relative;
      transition: border-radius 150ms ease;
    }

    .dropdown-chevron{
      transition: transform 200ms ease;
    }

    .dropdown-toggle:hover,
    .dropdown-toggle.open{
      border-radius: 0.75rem 0.75rem 0 0;
    }

    .dropdown-toggle:hover .dropdown-chevron,
    .dropdown-toggle.open .dropdown-chevron{
      transform: rotate(180deg);
    }

    .dropdown{
      display:flex;
      flex-direction:column;
      padding:0.25rem 0;
      border-radius: 0 0 0.75rem 0.75rem;
      overflow:hidden;
      opacity:0;
      visibility:hidden;
      max-height:0;
      transition: opacity 180ms ease, max-height 220ms ease, visibility 220ms;
      pointer-events:none;
    }

    @media (min-width: 1024px) {
      .dropdown{
        position:absolute;
        width:156px;
        margin-left:-1rem;
        max-height:none;
        transform: translateY(-6px);
        transition: opacity 180ms ease, transform 180ms ease, visibility 180ms;
        box-shadow: 0 6px 16px -8px rgba(0,0,0,0.25);
        z-index:50;
      }
    }

    .dropdown-toggle:hover .dropdown,
    .dropdown-toggle.open .dropdown{
      opacity:1;
      visibility:visible;
      max-height:20rem;
      pointer-events:auto;
    }

    @media (min-width: 1024px) {
      .dropdown-toggle:hover .dropdown,
      .dropdown-toggle.open .dropdown{
        transform: translateY(0);
      }
    }

    .dropdown li{
      margin:0;
      border-radius:0;
      display:block;
      padding:0.5rem 1rem;
      transition: background-color 150ms ease;
    }
    .dropdown li:hover{
      @apply bg-dtpr-blue-900;
    }
    .dropdown li a{display:block; width:100%; }

    


  }
}
</style>
