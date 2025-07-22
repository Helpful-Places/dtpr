<template>
  <div>
    <IntroHeader />

    <div class="app-container mt-12">
      <div class="md:flex gap-8">
        <div class="card md:w-[40%] bg-dtpr-blue-950 text-dtpr-blue-100">
          <h2>The Problem</h2>
          <h3>Our lives governed by invisible technologies, with little transparency about what data these systems are collecting, by whom, and for what purposes.</h3>
          <h1>How can we trust them?</h1>
        </div>

        <div class="card md:w-[60%] bg-dtpr-blue-100 text-dtpr-blue-950">
          <p class="text-lg font-bold leading-snug">
            How can we be confident the technology is achieving its goal?
          </p>
          <p>
            Our commutes to work are controlled by automated traffic lights. Our job applications are reviewed and filtered by AI decision makers. Our street lights use sensors and edge-computing to optimize electricity usage. Technology now has just as much an impact on how our public spaces function as roadways or parks.  It seems natural that people should have a right to learn about and give feedback on its use.
          </p>
          <p>
            If these systems are hidden from us, how can we be certain they’re achieving their goals? Whether seeking safety, sustainability, or accessibility, many are left asking: what are the benefits, the risks, and the trade-offs we're making? 
          </p>
          <p>
            We're building a communication standard that enables transparency, legibility, accountability, and control for people.
          </p>
        </div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card md:w-[60%] bg-dtpr-green-800 text-dtpr-green-100">
          <h2>Our Proposal</h2>
          <h1>The DTPR Taxonomy, Design Patterns and Prototypes</h1>
          <p>The core of the DTPR communication standard is a taxonomy of concepts around digital tech and data
            practices, and a set of icons to quickly and clearly communicate those concepts. These components can then
            expressed in a number of ways - from physical signage to digital channels for communication – which
            together, help visualize and convey how a digital system works.</p>
          <NuxtLinkLocale to="/taxonomy" class="u-line border-dtpr-green-100">Explore the Taxonomy</NuxtLinkLocale>
        </div>
        <div class="card bg-deployment md:w-[40%] min-h-[12rem]"></div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card md:w-[40%] bg-dtpr-red-100 text-dtpr-red-800">
          <h2>Our Mission</h2>
          <h1>Enable human agency in the world's shared physical and digital spaces.</h1>
          <NuxtLinkLocale to="/get-involved" class="u-line border-dtpr-red-800">Get Involved</NuxtLinkLocale>
        </div>

        <div class="card bg-mission md:w-[60%] min-h-[12rem]"></div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card text-dtpr-blue-950 partners">
          <div class="flex items-center mt-8">
            <div class="hidden md:block min-w-[10rem]">
              <NuxtLink to="https://www.helpfulplaces.com/"><img class="max-w-[8rem]" src="/images/hp_logo.png"
                  alt="Helpful Places logo" /></NuxtLink>
            </div>

            <div class="md:ml-2">
              <div class="text-2xl font-[500]">
                DTPR is stewarded by <NuxtLink to="https://www.helpfulplaces.com/"
                  class="u-line border-dtpr-blue font-bold">Helpful Places</NuxtLink>
              </div>

              <p class="leading-tight mt-2">
                Helpful Places is a mission-driven company that helps organizations, and the communities they serve,
                harness the power of technology in ways that are transparent, inclusive, participatory, and in alignment
                with the community's goals. Supporting DTPR implementations is one of a variety of ways that we
                accomplish this.
              </p>
            </div>
          </div>

          <div class="items-center mt-8">
            <div class="items-center mt-12">
              <h3 class="text-center text-2xl">Partners that have supported and enabled DTPR deployments in
                collaboration with Helpful Places</h3>
              <div class="grid mb-20 md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-m">
                <PartnerCard url="https://angers.dtpr.guide/" imageFile="alm-logo.png" imageAlt="Angers Loire Metropole logo">
                  Angers Loire Metropolitan
                </PartnerCard>
                <PartnerCard url="https://p2ac.univ-angers.fr/" image-file="angers-university-logo.svg" image-alt="Angers University Logo">
                  Angers University Userlab
                </PartnerCard>
                <PartnerCard url="https://civiteo.fr/" image-file="civiteo-logo.jpg" image-alt="Civiteo Logo">
                  CIVITEO
                </PartnerCard>
                <PartnerCard
                  url="https://www.boston.gov/departments/new-urban-mechanics/digital-transparency-public-realm"
                  imageFile="boston-logo.png" imageAlt="City of Boston logo">
                  City of Boston
                </PartnerCard>
                <PartnerCard image-file="city-of-calgary.png" image-alt="Calgary City Logo">
                  City of Calgary
                </PartnerCard>
                <PartnerCard url="https://longbeach.gov/smartcity/projects/digital-rights-platform/"
                  imageFile="long-beach-logo.png" imageAlt="City of Long Beach logo">
                  City of Long Beach
                </PartnerCard>
                <PartnerCard url="https://dc.dtpr.guide/" imageFile="dc-logo.svg" imageAlt="City of Washington, DC logo">
                  City of Washington D.C
                </PartnerCard>
                <PartnerCard url="https://wpb.dtpr.guide/" image-file="wpb-logo.png" image-alt="West Palm Beach City Logo">
                  City of West Palm Beach
                </PartnerCard>
                <PartnerCard url="https://bristol-siz.dtpr.guide/" image-file="cpc-logo.jpg" image-alt="Connected Places Catapult Logos">
                  Connected Places Catapult
                </PartnerCard>
                <PartnerCard image-file="fau.png" image-alt="Florida Atlantic University Logo">
                  Florida Atlantic University
                </PartnerCard>
                <PartnerCard url="https://medium.com/@helpfulplaces/us-dtpr-pilot-implementations-planned-in-miami-charlotte-and-west-palm-beach-in-2023-as-part-of-69f9efba65e4" image-file="knight-logo.png" image-alt="Knight Foundation Logo">
                  Knight Foundation
                </PartnerCard>
                <PartnerCard url="https://michigancentral.com/innovation/" image-file="mc-logo.png" image-alt="Michigan Central Logo">
                  Michigan Central
                </PartnerCard>
                <PartnerCard url="https://mairie17.paris.fr/pages/open-batignolles-un-quartier-intelligent-en-evolution-26383" image-file="paris-17-logo.png" image-alt="Paris 17 Logo">
                  Paris 17
                </PartnerCard>
                <PartnerCard url="https://transparenciadigital.porto.digital/" image-file="porto-digital-logo.png" image-alt="Porto Digtal logo">Porto Digital
                </PartnerCard>
                <PartnerCard url="https://sopa.dtpr.guide/" imageFile="sydney-olympic-park-logo.png" imageAlt="Sydney Olympic Park logo">
                  Sydney Olympic Park
                </PartnerCard>
                <PartnerCard
                  url="https://innisfil.ca/en/news/town-of-innisfil-wants-your-feedback-on-new-innovative-technology.aspx"
                  imageFile="innisfil-logo.svg" imageAlt="City of Innisfil logo">
                  Town of Innisfil
                </PartnerCard>
                <PartnerCard url="https://clt.dtpr.guide/" image-file="clt.jpg" image-alt="City of Charlotte Logo">
                  City of Charlotte
                </PartnerCard>
                <PartnerCard url="https://theunderline.dtpr.guide/" image-file="underline.jpeg" image-alt="The Underline | Miami Logo">
                  The Underline | Miami
                </PartnerCard>
              </div>
            </div>
            <div class="items-center mt-12">
              <h3 class="text-center text-2xl">Initiatives and partners supporting the evolution of the DTPR
                standard</h3>
              <div class="grid mb-20 md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-lg">
                <PartnerCard url="https://www.us-ignite.org/blogs/ca-smart-city-signage-working-group-the-origin-story/" image-file="cscwg-logo.jpg" image-alt="picture of workshop activity">
                  California Smart City Signage Working Group
                </PartnerCard>
                <PartnerCard url="https://codefor.ca/" image-file="code-for-canada.jpg" image-alt="Code for Canada logo">
                  Code for Canada
                </PartnerCard>
                <PartnerCard url="https://www.digitalpublicsquare.org/" image-file="digital-public-square.png" image-alt="Digital Public Square Logo">
                  Digital Public Square
                </PartnerCard>
                <PartnerCard 
                  url="https://www.globalsmartcitiesalliance.org/" 
                  image-file="g20.png"
                  image-alt="G20 smart cities alliance logo">
                    G20 Smart Cities Alliance
                </PartnerCard>
                <PartnerCard url="https://www.glia.net/" image-file="glia-logo.jpg" image-alt="Glia Foundation Logo">
                  GLIA Foundation
                </PartnerCard>
                <PartnerCard url="https://superbloom.design/" image-file="superbloom-logo.png" image-alt="Superbloom logo">
                  Superbloom Design
                </PartnerCard>
                <PartnerCard url="https://urbanai.fr/" image-file="urbanAI-logo.jpg" image-alt="Urban AI Logo">
                  Urban AI
                </PartnerCard>
                <PartnerCard url="https://www.us-ignite.org/" image-file="US-Ignite-logo.png" image-alt="US Ignite Logo">
                  US Ignite
                </PartnerCard>
                <PartnerCard url="https://www.weforum.org/connectedworld/initiatives/" image-file="wef.svg" image-alt="World Economic Forum logo">
                  World Economic Forum Future of the Connected World initiative
                </PartnerCard>
              </div>
            </div>

            <div class="items-center mt-12">
              <h3 class="text-center text-2xl">Collaborators and partners involved in the original co-design of
                DTPR</h3>
              <div class="grid md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-lg">
                <PartnerCard url="https://www.normative.com/" image-file="normative-logo.jpg"
                  image-alt="Normative logo">
                  Normative
                </PartnerCard>
                <PartnerCard url="https://www.projectsbyif.com/" image-file="projects-by-if-logo.png"
                  image-alt="Projects by IF logo">
                  Projects By IF
                </PartnerCard>
                <PartnerCard url="https://puncture.co/" image-file="puncturedesign_logo.jpeg"
                  image-alt="Puncture Design logo">
                  Puncture
                </PartnerCard>
                <PartnerCard image-file="sidewalk-logo.png" image-alt="Sidwalk Labs Logo">
                  Sidewalk Labs
                </PartnerCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.bg-deployment {
  background-image: url('/images/sopaDeploymentExample.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.bg-mission {
  background-image: url('/images/intro_mission.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.partners a,
.pilots a {
  @apply border-dtpr-blue-950;
}

.card {
  @apply py-6 px-8 rounded-2xl mb-8 md:mb-0;

  p:not(:last-child) {
    @apply mb-4;
  }

  h1 {
    @apply md:text-[3rem] text-[2rem] font-[700] leading-tight mb-4
  }

  h2 {
    @apply text-xl font-bold mb-4;
  }

  h3 {
    @apply text-lg mb-4;
  }
}
</style>