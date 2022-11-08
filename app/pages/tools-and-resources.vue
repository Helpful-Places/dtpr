<template>
  <div>
    <GuideHeader />

    <div class="app-container mt-12">
      <div class="md:flex gap-8">
        <Card class="md:w-1/3 text-dtpr-green">
          <h1>Resources</h1>

          <p>
            Resources to deploy DTPR in your community.
          </p>

          <ul>
            <li><a href="/documents/DTPR_Design_Guide.pdf" class="u-line border-dtpr-green-lighter"><Icon class="inline" icon="fa6-solid:file-pdf" /> Design Guide</a></li>
            <li><a href="https://github.com/Helpful-Places/dtpr/tree/main/resources/icons" class="u-line border-dtpr-green-lighter">Icons</a></li>
            <li><NuxtLink to="/taxonomy" class="u-line border-dtpr-green-lighter">Taxonomy</NuxtLink></li>
            <li><a href="https://www.demo.dtpr.guide/sensors/bgLGhGqeHBlJfU2CL2rE" class="u-line border-dtpr-green-lighter">Helpful Places Guide App demo</a></li>
            <li><NuxtLink to="https://medium.com/code-for-canada/grit-toronto-test-4-digital-transparency-in-the-public-realm-da3f47eb1510" class="u-line border-dtpr-green-lighter">2019 User Research</NuxtLink></li>
            <li><NuxtLink to="https://github.com/sidewalklabs/dtpr/tree/master/dtpr_codesignkit" class="u-line border-dtpr-green-lighter">2019 Co-design Kit</NuxtLink></li>
          </ul>
        </Card>

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
            freely available for others to adopt, use, and build upon. Further development of these draft standards are currently
            being stewarded by Helpful Places and an emerging coalition of partners and collaborators.
          </p>
        </Card>
      </div>

      <div class="md:flex gap-8">
        <Card class="md:w-1/2 text-dtpr-green">
          <h1>Pilots</h1>

          <p>
            DTPR deployments around the world.
          </p>

          <ul>
            <li><a href="https://medium.com/@helpfulplaces/announcing-the-launch-of-the-2022-dtpr-city-cohort-b2cb55699925" class="u-line border-dtpr-green-lighter">2022 DTPR Cohort (Boston, DC, Innisfil, Angers)</a></li>
            <li><a href="https://longbeach.gov/smartcity/projects/digital-rights-platform/" class="u-line border-dtpr-green-lighter">Long Beach, California</a></li>
            <li><a href="https://www.linkedin.com/posts/helpful-places_dtpr-activity-6945457869731377152-nKXX?utm_source=share&utm_medium=member_desktop" class="u-line border-dtpr-green-lighter">World Economic Forum Global Technology Governance Retreat</a></li>
            <li><a href="https://www.boston.gov/departments/new-urban-mechanics/digital-transparency-public-realm" class="u-line border-dtpr-green-lighter">City of Boston, New Urban Mechanics</a></li>
          </ul>
        </Card>

        <Card class="md:w-1/2 text-dtpr-green">
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