<template>
  <div class="app-container mt-12">
    <div class="flex gap-8">
      <Card class="w-[60%] bg-dtpr-red text-dtpr-red-lighter">
        <h2>Get Involved</h2>
        <div class="text-[3rem] font-[700] leading-tight mb-4">Join an emerging coalition</div>

        <p>
          We are always looking for new collaborators — from pilot opportunities and implementers,
          to funders and service providers - to help us test, improve, and advance adoption of the open source standard.
        </p>

        <ul>
          <li><NuxtLink to="#" class="u-line border-dtpr-red-lighter">Sign up to our newsletter</NuxtLink></li>
          <li><NuxtLink to="#" class="u-line border-dtpr-red-lighter">Join the DTPR Slack</NuxtLink></li>
          <li><NuxtLink to="#" class="u-line border-dtpr-red-lighter">Contribute to the open-source resources</NuxtLink></li>
        </ul>
      </Card>  
      
      <Card class="bg-deployment w-[40%]"></Card>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.bg-deployment {
  background-image: url('~/assets/images/tools_codesign.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

li {
  @apply text-xl font-bold leading-relaxed;
}
</style>