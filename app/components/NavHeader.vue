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
      <div class=" print:hidden">
        <nav class="flex items-center">
          <ul :class="isOpen ? 'block' : 'hidden'" class="mt-4 lg:flex lg:items-center lg:m-0">
            <li class="external bg-dtpr-blue-100 font-[700] text-sm rounded-xl py-1 px-3;"><a target="_blank" href="https://dtpr.guide/landing">DTPR in the World</a> </li>

            <li class="dropdown-toggle external bg-dtpr-blue-100 font-[700] text-sm rounded-xl py- px-3;">Documentation  <Icon name="icons8:angle-down"/>
              <ul class="dropdown bg-dtpr-blue-950">
                <a class="text-white" href="https://docs.dtpr.io" target="_blank"><li class="bg-dtpr-blue-950 font-[700] text-sm text-white rounded-xl py-1 px-3;">For Humans</li></a>
                <a class="text-white" href="https://www.dtpr.ai" target="_blank"><li class="bg-dtpr-blue-950 text-white font-[700] text-sm rounded-xl py-1 px-3;">For AI</li></a>
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
      @apply mr-3; 
    }

    .external{
      display:inline-block;
      padding:0.5rem 1rem;

      &:hover{
        @apply text-white bg-dtpr-blue-950;
      }
    }
    .dropdown-toggle{
      cursor:pointer;
      margin-left:0;
      
    }

    .dropdown-toggle:hover{
      border-radius: 0.75rem 0.75rem 0 0;
    }

    .dropdown-toggle:hover ul{
      display:flex;
      flex-direction:column;
      position:absolute;
      padding:0;

      
    }

    .dropdown{
      display:none;
      width:156px;
      margin-left:-1rem; 
      
    }

    .dropdown li{
      margin:1rem 0;
      border-radius:0;
      display:inline-block;
      padding:0.5rem 1rem;

    }
    .dropdown li a{width:100%; }

    


  }
}
</style>
