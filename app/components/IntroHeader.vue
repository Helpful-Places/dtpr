<template>
  <div class="intro-header md:pb-12 md:pt-[200px] py-5 mt-4">
    <div class="app-container">
      <div class="bg-white rounded-2xl py-6 px-8 max-w-2xl">
        <div class="text-2xl">
          <strong>Digital Trust for Places & Routines</strong> (DTPR) is 
          an open-source communication standard whose goal is to increase the transparency and accountability
          of digital technology in public places.<br />
        </div>
        <h2>
          <NuxtLink to="/guide" class="u-line border-dtpr-blue">Discover DTPR</NuxtLink>
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