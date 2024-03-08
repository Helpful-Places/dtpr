<template>
  <div class="app-container mt-12">
    <div class="md:flex gap-8">
      <Card class="md:w-[60%] bg-dtpr-red text-dtpr-red-lighter">
        <h2>Get Involved</h2>
        <h1>Join an emerging community of practice</h1>

        <p>
          We are always looking for new collaborators — from pilot opportunities and implementers,
          to funders and service providers - to help us test, improve, and advance adoption of the open source standard.
        </p>

        <p>
          As an increasing number of organizations begin to test and pilot DTPR, there is a need to establish clear processes
          that allow these organizations to identify needed changes and new use cases. This feedback loop between users of DTPR
          and the standard is critical so that DTPR can continue to evolve, and result in improvements to the open-source resources
          for everyone. 
        </p>

        <p>
          Depending on resources and interest, the Helpful Places team hopes to begin this work in 2023. Have an idea on how to support the iteration and adoption of DTPR?  Please do get in touch!
        </p>

        <ul>
          <li><a href="https://join.slack.com/t/dtprworkspace/shared_invite/zt-rjy2fvch-4JpFFwIgpasqJH7lTAl~dA" class="u-line border-dtpr-red-lighter">Join the DTPR Slack</a></li>
          <li><a href="https://github.com/Helpful-Places/dtpr" class="u-line border-dtpr-red-lighter">Contribute to the open-source resources</a></li>
          <li>Email us at <a href="mailto:dtpr@helpfulplaces.com" class="u-line border-dtpr-red-lighter">dtpr@helpfulplaces.com</a></li>
        </ul>
      </Card>  
      
      <Card class="bg-deployment md:w-[40%] min-h-[12rem]"></Card>
    </div>

    <div class="flex gap-8">
      <Card class="bg-dtpr-red-lighter w-[100%] md:mt-8">
        <NewsletterSignup />
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
  background-image: url('/images/tools_codesign.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

li {
  @apply text-xl font-bold leading-relaxed;
}
</style>