<template>
  <div class="app-container mt-12">
    <div class="md:flex gap-8">
      <Card class="md:w-[60%] bg-dtpr-red text-dtpr-red-100">
        <h2>Get Involved</h2>
        <h1>Join an emerging community of practice</h1>

        <p>
          We are always looking for new collaborators — from pilot opportunities and implementers, 
          to funders and service providers - to help us test, improve, and advance adoption of the
          open source standard.
        </p>

        <p>
          Do you want to test, pilot or implement DTPR? Access the resources in our <NuxtLink class="underline" to="https://github.com/Helpful-Places">GitHub Repostory</NuxtLink>, consult our <NuxtLink class="underline" to="https://helpful-places.gitbook.io/a-guide-to-dtpr">Guide to the DTPR Standard</NuxtLink>, and join the <NuxtLink class="underline" to="https://dtprworkspace.slack.com/join/shared_invite/zt-rjy2fvch-4JpFFwIgpasqJH7lTAl~dA#/shared-invite/email">DTPR Slack Channel</NuxtLink>
        </p>

        <p>
          You can also send us an email at <a href="mailto:dtpr@helpfulplaces.com">dtpr@helpfulplaces.com</a>
        </p>

        <!-- <ul>
          <li><a href="https://join.slack.com/t/dtprworkspace/shared_invite/zt-rjy2fvch-4JpFFwIgpasqJH7lTAl~dA" class="u-line border-dtpr-red-lighter">Join the DTPR Slack</a></li>
          <li><a href="https://github.com/Helpful-Places/dtpr" class="u-line border-dtpr-red-lighter">Contribute to the open-source resources</a></li>
          <li>Email us at <a href="mailto:dtpr@helpfulplaces.com" class="u-line border-dtpr-red-lighter">dtpr@helpfulplaces.com</a></li>
        </ul> -->
      </Card>  
      
      <Card class="bg-deployment md:w-[40%] min-h-[12rem]"></Card>
    </div>

    <div class="flex gap-8">
      <Card class="bg-dtpr-red-100 w-[100%] md:mt-8">
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