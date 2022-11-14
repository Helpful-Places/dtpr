<template>
  <div>
    <GuideHeader />

    <div class="app-container mt-12">
      <div class="md:flex gap-8">
        <Card class="md:w-1/2 text-dtpr-green">
          <h1>Resources</h1>

          <p>
            Resources to deploy DTPR in your community.
          </p>

          <ul>
            <li><a href="/documents/DTPR_Design_Guide.pdf" class="u-line border-dtpr-green-lighter">Design Guide <Icon class="inline" icon="fa6-solid:file-pdf" /></a></li>
            <li><a href="https://github.com/Helpful-Places/dtpr/tree/main/resources/icons" class="u-line border-dtpr-green-lighter">Icons</a></li>
            <li><NuxtLink to="/taxonomy" class="u-line border-dtpr-green-lighter">Taxonomy</NuxtLink></li>
            <li><a href="https://www.demo.dtpr.guide/sensors/bgLGhGqeHBlJfU2CL2rE" class="u-line border-dtpr-green-lighter">Helpful Places Guide App demo</a></li>
            
            <li><NuxtLink to="https://github.com/sidewalklabs/dtpr/tree/master/dtpr_codesignkit" class="u-line border-dtpr-green-lighter">2019 Co-design Kit</NuxtLink></li>
          </ul>
        </Card>

        <Card class="md:w-1/2 text-dtpr-green">
          <h1>Blog Posts</h1>

          <p>
            A non-exhaustive collection of blog posts about the development and use of DTPR.
          </p>

          <ul>
            <li><NuxtLink to="https://medium.com/code-for-canada/grit-toronto-test-4-digital-transparency-in-the-public-realm-da3f47eb1510" class="u-line border-dtpr-green-lighter">2019 User Research</NuxtLink></li>
          </ul>
        </Card>
      </div>

      <div class="md:flex gap-8">
        <Card class="md:w-2/3 text-dtpr-green">
          <h1>Design History</h1>

          <p>
            In 2019, experts came together in cities around the world in co-design sessions to collaborate
            and prototype an initial set of open communication standards for digital transparency in the public realm.
          </p>

          <p>
            In 2020, this initial draft was refined through several cycles of online expert charrettes and small meetings,
            iterative prototype development, and longitudinal inclusive usability and concept testing. Initiated by Sidewalk Labs,
            these draft standards, as well as all the co-design activities and materials that generated them, are publicly and
            freely available for others to adopt, use, and build upon.
          </p>

          <p class="font-bold">
            Further development of these draft standards are currently
            being stewarded by Helpful Places and an emerging coalition of partners and collaborators.
          </p>
        </Card>

        <Card class="md:w-1/3 text-dtpr-green">
          <h1>Related Projects</h1>

          <p>
            Projects providing inspiration.
          </p>

          <ul>
            <li><NuxtLink to="https://foundation.mozilla.org/en/privacynotincluded/" class="u-line border-dtpr-green-lighter">Privacy not included (Mozilla)</NuxtLink></li>
            <li><NuxtLink to="https://www.privacyassistant.org/" class="u-line border-dtpr-green-lighter">Privacy assistant (CMU)</NuxtLink></li>
            <li><NuxtLink to="https://ieeexplore.ieee.org/document/8553750" class="u-line border-dtpr-green-lighter">Personal AI (IEEE)</NuxtLink></li>
            <li><NuxtLink to="https://arrayofthings.github.io/" class="u-line border-dtpr-green-lighter">Array of things (Chicago)</NuxtLink></li>
            <li><NuxtLink to="https://ajuntament.barcelona.cat/digital/en/digital-transformation/urban-technology/sentilo" class="u-line border-dtpr-green-lighter">Sensillio (Barcelona)</NuxtLink></li>
            <li><NuxtLink to="https://www.seattle.gov/tech/initiatives/privacy/surveillance-technologies/about-surveillance-" class="u-line border-dtpr-green-lighter">Inventory of Surveillence Tech (Seattle)</NuxtLink></li>
          </ul>
        </Card>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
li {
  @apply text-lg leading-relaxed;
}

h1 {
  @apply text-3xl font-bold mb-4;
}
</style>

<script setup>
import { Icon } from '@iconify/vue';

useHead({
  title: 'Tools and Resources'
})
</script>