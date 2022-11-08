<template>
  <div class="app-container mt-12">
    <div class="md:flex gap-8">
      <Card class="md:w-[60%] bg-dtpr-red text-dtpr-red-lighter">
        <h2>Get Involved</h2>
        <h1>Join an emerging coalition</h1>

        <p>
          We are always looking for new collaborators — from pilot opportunities and implementers,
          to funders and service providers - to help us test, improve, and advance adoption of the open source standard.
        </p>

        <ul>
          <li><a href="https://join.slack.com/t/dtprworkspace/shared_invite/zt-rjy2fvch-4JpFFwIgpasqJH7lTAl~dA" class="u-line border-dtpr-red-lighter">Join the DTPR Slack</a></li>
          <li><a href="https://github.com/Helpful-Places/dtpr" class="u-line border-dtpr-red-lighter">Contribute to the open-source resources</a></li>
        </ul>
      </Card>  
      
      <Card class="bg-deployment md:w-[40%] min-h-[12rem]"></Card>
    </div>

    <div class="flex gap-8">
      <Card class="bg-dtpr-red-lighter border-4 border-dtpr-red w-[100%] md:mt-8">
        <h2 class="text-dtpr-red">Subscribe to our Newsletter</h2>
        <TallyForm />
      </Card>
    </div>
  </div>
</template>

<script setup>
  useHead({
    title: 'Get Involved'
  })
</script>

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