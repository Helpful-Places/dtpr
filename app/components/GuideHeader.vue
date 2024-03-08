<template>
  <div class="guide-header-background md:pb-12 md:pt-[200px] py-5 mt-4">
    <div class="app-container ">
      <div class="bg-white rounded-2xl p-8 max-w-2xl outline outline-4 outline-dtpr-green-lighter">
        <h2>{{ $t('tools_resources' ) }}</h2>
        <div class="text-xl">
          We believe that creating a unified taxonomy and visual language is a critical starting point, 
          and that digital tools could help people to follow up and learn more.
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.guide-header-background {
  background-image: url('/images/guide_header.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

h2 {
  @apply text-2xl text-dtpr-green font-[700] pb-4;
}
</style>