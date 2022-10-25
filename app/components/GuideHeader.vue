<template>
  <div class="guide-header md:pb-12 md:pt-[200px] py-5 mt-4">
    <div class="app-container">
      <div class="bg-white rounded-2xl p-8 max-w-2xl">
        <h2>Guide</h2>
        <div class="text-xl">
          We believe that creating a unified taxonomy and visual language is a critical starting point, 
          and that digital tools could help people to follow up and learn more.
        </div>
        <p class="my-4">
          In 2019, experts came together in cities around the world in co-design sessions to collaborate
          and prototype an initial set of open communication standards for digital transparency in the public realm.
          In 2020, this initial draft was refined through several cycles of online expert charrettes and small meetings,
          iterative prototype development, and longitudinal inclusive usability and concept testing. Initiated by Sidewalk Labs,
          these draft standards, as well as all the co-design activities and materials that generated them, are publicly and
          freely available for others to adopt, use, and build upon. Further development of these draft standards are currently
          being stewarded by Helpful Places and an emerging coalition of partners and collaborators.
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.guide-header {
  height: 30rem;
  background-image: url('~/images/guide_header.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

h2 {
  @apply text-2xl text-dtpr-green font-[700] pb-4;
}
</style>