<template>
  <div>
    <IntroHeader />

    <div class="app-container mt-12">
      <div class="md:flex gap-8">
        <div class="card md:w-[60%] bg-dtpr-blue text-dtpr-blue-lighter">
          <h2>The Problem</h2>
          <h1>Digital technology is increasingly present in the places and spaces in which we live. How might people learn about and give feedback on its use?</h1>
        </div>

        <div class="card md:w-[40%] bg-dtpr-blue-lighter text-dtpr-blue">
          <p class="text-lg font-bold leading-snug">
            How can we be confident the technology is achieving its goal? Whether seeking safety, sustainability,
            or accessibility, many are left asking: what are the benefits, the risks, and the trade-offs we're making?
          </p>
          <p>
            Digital technology is all around us, but often invisible. There's little transparency about what data these
            technologies are collecting, by whom, and for what purposes. We've also seen that much technology in the built
            environment lacks controls for people.
          </p>
          <p>
            We've drafted a standard that enables transparency, legibility, accountability, and control for people.
          </p>
        </div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card bg-deployment md:w-[40%] min-h-[12rem]"></div>
        
        <div class="card md:w-[60%] bg-dtpr-green text-dtpr-green-lighter">
          <h2>Our Proposal</h2>
          <h1>The DTPR Taxonomy, Design Patterns and Prototypes</h1>
          <p>The core of the DTPR communication standard is a taxonomy of concepts around digital tech and data practices, and a set of icons to quickly and clearly communicate those concepts. These components can then expressed in a number of ways - from physical signage to digital channels for communication – which together, help visualize and convey how a digital system works.</p>
          <NuxtLink to="/taxonomy" class="u-line border-dtpr-green-lighter">Explore the Taxonomy</NuxtLink>
        </div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card md:w-[60%] bg-dtpr-red text-dtpr-red-lighter">
          <h2>Our Mission</h2>
          <h1>Enable human agency in the world's shared spaces.</h1>
          <NuxtLink to="/get-involved" class="u-line border-dtpr-red-lighter">Get Involved</NuxtLink>
        </div>
        
        <div class="card bg-mission md:w-[40%] min-h-[12rem]"></div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card text-dtpr-blue">
          <h2>Partners</h2>
          
          <div class="flex items-center mt-8">
            <div class="hidden md:block min-w-[10rem]">
              <NuxtLink to="https://www.helpfulplaces.com/"><img class="max-w-[8rem]" src="~/assets/images/hp_logo.png" alt="Helpful Places logo" /></NuxtLink>
            </div>

            <div class="md:ml-2">
              <div class="text-2xl font-[500]">
                DTPR is stewarded by <NuxtLink to="https://www.helpfulplaces.com/" class="u-line border-dtpr-blue font-bold">Helpful Places</NuxtLink>
              </div>

              <p class="leading-tight mt-2">
                Helpful Places is a mission-driven company that helps organizations, and the communities they serve,
                harness the power of technology in ways that are transparent, inclusive, participatory, and in alignment
                with the community's goals. Supporting DTPR implementations is one of a variety of ways that we accomplish this.
              </p>
            </div>
          </div>

          <!-- <div class="flex items-center mt-8">
            <div class="min-w-[13rem]">
              <NuxtLink to="https://knightfoundation.org/"><img class="max-w-[12rem]" src="~/assets/images/knight_foundation.webp" alt="Knight Foundation logo" /></NuxtLink>
            </div>
            
            <div class="text-2xl ml-4 font-[500]">
              Significant financial support from the <NuxtLink to="https://knightfoundation.org/" class="u-line border-dtpr-blue font-bold">Knight Foundation</NuxtLink>
            </div>
          </div> -->
          
          <div class="mt-8">
            DTPR has received financial and in-kind support from a number of partners. We are always looking for new collaborators — 
            from pilot opportunities and implementers, to funders and service providers - to help us test, improve, and advance adoption
            of the open source standard. Have an idea on how to support the iteration and adoption of DTPR? Get in touch with the
            Helpful Places team at <a class="u-line border-dtpr-blue" href="mailto:hello@helpfulplaces.com">hello@helpfulplaces.com</a>.
          </div>

          <ul class="font-bold text-2xl mt-8 leading-relaxed">
            <li><NuxtLink class="u-line border-dtpr-blue" to="https://www.normative.com/">Normative</NuxtLink></li>
            <li><NuxtLink class="u-line border-dtpr-blue" to="https://www.weforum.org/">World Economic Forum</NuxtLink></li>
            <li><NuxtLink class="u-line border-dtpr-blue" to="https://www.digitalpublicsquare.org/">Digital Public Square</NuxtLink></li>
            <li><NuxtLink class="u-line border-dtpr-blue" to="https://www.glia.foundation/">GLIA Foundation</NuxtLink></li>
          </ul>
        </div>
      </div>

      <div class="mt-8">
        <div class="card text-dtpr-blue">
          <h2>Pilots</h2>

          <div class="grid md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-lg">
            <PartnerCard
              url="https://www.boston.gov/departments/new-urban-mechanics/digital-transparency-public-realm"
              imageFile="boston-logo.png"
              imageAlt="City of Boston logo"
            >
              Boston, Massachusetts
            </PartnerCard>

            <PartnerCard
              url="https://longbeach.gov/smartcity/projects/digital-rights-platform/"
              imageFile="long-beach-logo.png"
              imageAlt="City of Long Beach logo"
            >
              Long Beach, California
            </PartnerCard>

            <PartnerCard
              url="https://innisfil.ca/en/news/town-of-innisfil-wants-your-feedback-on-new-innovative-technology.aspx"
              imageFile="innisfil-logo.svg"
              imageAlt="City of Innisfil logo"
            >
              Innisfil, Canada
            </PartnerCard>

            <PartnerCard
              imageFile="dc-logo.svg"
              imageAlt="City of Washington, DC logo"
            >
              Washington, DC
            </PartnerCard>

            <PartnerCard
              imageFile="alm-logo.png"
              imageAlt="Angers Loire Metropole logo"
            >
              Angers Loire Métropole, France
            </PartnerCard>

            <PartnerCard
              imageFile="sydney-olympic-park-logo.png"
              imageAlt="Sydney Olympic Park logo"
            >
              Sydney Olympic Park, Australia
            </PartnerCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.bg-deployment {
  background-image: url('~/assets/images/boston-deployment.png');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}

.bg-mission {
  background-image: url('~/assets/images/intro_mission.svg');
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
}
</style>