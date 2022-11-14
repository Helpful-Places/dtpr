<template>
  <div class="intro-header md:pb-12 md:pt-[200px] py-5 mt-4">
    <div class="app-container">
      <div class="bg-white rounded-2xl py-6 px-8 max-w-2xl outline outline-4 outline-dtpr-blue-lighter">
        <div class="text-2xl">
          <strong>Digital Trust for Places & Routines</strong> (DTPR) is 
          an open-source communication standard to increase the transparency, legibility and 
          accountability of digital technology in the built environment.<br />
        </div>
        <h2>
          <NuxtLink to="/tools-and-resources" class="u-line border-dtpr-blue">Discover DTPR</NuxtLink>
        </h2>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.intro-header {
  height: fit-content;
  background-image: url('~/assets/images/intro_header.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

h2 {
  @apply mt-4 text-xl text-dtpr-blue font-[500];
}
</style>