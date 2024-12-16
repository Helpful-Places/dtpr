<template>
  <div>
    <IntroHeader />

    <div class="app-container mt-12">
      <div class="md:flex gap-8">
        <div class="card md:w-[60%] bg-dtpr-blue-950 text-dtpr-blue-100">
          <h2>The Problem</h2>
          <h1>Digital technology is increasingly present in the places and spaces in which we live. How might people learn about and give feedback on its use?</h1>
        </div>

        <div class="card md:w-[40%] bg-dtpr-blue-100 text-dtpr-blue-950">
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
        
        <div class="card md:w-[60%] bg-dtpr-green-800 text-dtpr-green-100">
          <h2>Our Proposal</h2>
          <h1>The DTPR Taxonomy, Design Patterns and Prototypes</h1>
          <p>The core of the DTPR communication standard is a taxonomy of concepts around digital tech and data practices, and a set of icons to quickly and clearly communicate those concepts. These components can then expressed in a number of ways - from physical signage to digital channels for communication – which together, help visualize and convey how a digital system works.</p>
          <NuxtLinkLocale to="/taxonomy" class="u-line border-dtpr-green-100">Explore the Taxonomy</NuxtLinkLocale>
        </div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card md:w-[60%] bg-dtpr-red-100 text-dtpr-red-800">
          <h2>Our Mission</h2>
          <h1>Enable human agency in the world's shared spaces.</h1>
          <NuxtLinkLocale to="/get-involved" class="u-line border-dtpr-red-800">Get Involved</NuxtLinkLocale>
        </div>
        
        <div class="card bg-mission md:w-[40%] min-h-[12rem]"></div>
      </div>

      <div class="md:flex gap-8 mt-8">
        <div class="card text-dtpr-blue-950 partners">
          <h2>Partners</h2>
          
          <div class="flex items-center mt-8">
            <div class="hidden md:block min-w-[10rem]">
              <NuxtLink to="https://www.helpfulplaces.com/"><img class="max-w-[8rem]" src="/images/hp_logo.png" alt="Helpful Places logo" /></NuxtLink>
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

          <div class ="items-center mt-8">
            DTPR has had a variety of supporters and champions since its inception:
            <div class="items-center mt-8">
              <h3 class="text-center text-lg font-bold"> Partners that have supported and enabled DTPR deployments in collaboration with Helpful Places:</h3>
              <div class="grid mb-20 md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-m">
                <PartnerCard url="#" 
                  imageFile="alm-logo.png"
                  imageAlt="Angers Loire Metropole logo">
                    Angers Loire Metropolitan
                </PartnerCard>
                <PartnerCard url="#" 
                  image-file="angers-university-logo.svg" 
                  image-alt="Angers University Logo">
                    Angers University Research Lab
                </PartnerCard>
                <PartnerCard 
                  image-file="civiteo-logo.jpg" 
                  image-alt="Civiteo Logo">
                    CIVITEO
                </PartnerCard>
                <PartnerCard 
                  url="https://www.boston.gov/departments/new-urban-mechanics/digital-transparency-public-realm"
                  imageFile="boston-logo.png"
                  imageAlt="City of Boston logo">
                    City of Boston
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="city-of-calgary.png" 
                  image-alt="Calgary City Logo">
                    City of Calgary
                </PartnerCard>
                <PartnerCard 
                  url="https://longbeach.gov/smartcity/projects/digital-rights-platform/"
                  imageFile="long-beach-logo.png"
                  imageAlt="City of Long Beach logo">
                    City of Long Beach
                </PartnerCard>
                <PartnerCard url="#" 
                  imageFile="dc-logo.svg"
                  imageAlt="City of Washington, DC logo">
                    City of Washington D.C
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="wpb-logo.png" 
                  image-alt="West Palm Beach City Logo">
                    City of West Palm Beach
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="cpc-logo.jpg" 
                  image-alt="Connected Places Catapult Logos">
                    Connected Places Catapult
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="fau-logo.png" 
                  image-alt="Florida Atlantic University Logo">
                    Florida Atlantic University
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="knight-logo.png" 
                  image-alt="Knight Foundation Logo">
                    Knight Foundation
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="mc-logo.png" 
                  image-alt="Michigan Central Logo">
                    Michigan Central
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="nsf-logo.jpg" 
                  image-alt="National Science Foundation Logo">
                    National Science Foundation
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="network-rail-logo.jpg" 
                  image-alt="Network Rail Logo">
                    Network Rail
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="paris-17-logo.png" 
                  image-alt="Paris 17 Logo">
                    Paris 17
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="porto-digital-logo.png" 
                  image-alt="Porto Digtal Logo">Porto Digital</PartnerCard>
                <PartnerCard url="#" 
                  imageFile="sydney-olympic-park-logo.png"
                  imageAlt="Sydney Olympic Park logo">
                    Sydney Olympic Park
                </PartnerCard>
                <PartnerCard 
                  url="https://innisfil.ca/en/news/town-of-innisfil-wants-your-feedback-on-new-innovative-technology.aspx"
                  imageFile="innisfil-logo.svg"
                  imageAlt="City of Innisfil logo">
                    Town of Innisfil
                </PartnerCard>

                
              </div>
            </div>
            <div class="items-center mt-8">
              <h3 class="text-center text-lg font-bold">Initiatives and partners supporting the evolution of the DTPR standard:</h3>
              <div class="grid mb-20 md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-lg">
                <PartnerCard 
                  url="#" 
                  image-file="cscwg-logo.jpg" 
                  image-alt="picture of workshop activity">
                    California Smart City Signage Working Group
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="code-for-canada.jpg" 
                  image-alt="Code for Canada logo">
                    Code for Canada
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="digital-public-square.png" 
                  image-alt="Digital Public Square Logo">
                    Digital Public Square
                </PartnerCard>
                <!-- <PartnerCard 
                  url="#" 
                  image-file="g20.png" 
                  image-alt="G20 smart cities alliance logo">
                    G20 Smart Cities Alliance
                </PartnerCard> -->
                <PartnerCard 
                  url="#" 
                  image-file="glia-logo.jpg" 
                  image-alt="Glia Foundation Logo">
                    GLIA Foundation
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="superbloom-logo.png" 
                  image-alt="Superbloom logo">
                    SuperbBloom Design
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="urban-AI-logo.jpg" 
                  image-alt="Urban AI Logo">
                    Urban AI
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="US-Ignite-logo.png" 
                  image-alt="US Ignite Logo">
                    US Ignite
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="" 
                  image-alt=""
                >
                    World Economic Forum Future of the Connected World initiative
                </PartnerCard>

              </div>
            </div>

            <div class="items-center mt-8">
              <h3 class="text-center text-lg font-bold">Collaborators and partners involved in the original co-design of DTPR: </h3>
              <div class="grid md:grid-cols-3 lg:grid-cols-4 mt-8 gap-10 text-center font-bold text-lg">
                <PartnerCard 
                  url="#" 
                  image-file="normative-logo.jpg" 
                  image-alt="Normative Logo">
                    Normative
                </PartnerCard>
                <PartnerCard 
                  url="#" 
                  image-file="projects-by-if-logo.png" 
                  image-alt="">
                    Projects By IF
                </PartnerCard>
                <PartnerCard 
                url="#" image-file="" image-alt="">Puncture</PartnerCard>
                <PartnerCard url="#" 
                  image-file="sidewalk-logo.png" 
                  image-alt="Sidwalk Labs Logo">
                    Sidewalk Labs
                </PartnerCard>

              </div>
            </div>  

          </div>

          <!-- <div class="flex items-center mt-8">
            <div class="min-w-[13rem]">
              <NuxtLink to="https://knightfoundation.org/"><img class="max-w-[12rem]" src="/images/knight_foundation.webp" alt="Knight Foundation logo" /></NuxtLink>
            </div>
            
            <div class="text-2xl ml-4 font-[500]">
              Significant financial support from the <NuxtLink to="https://knightfoundation.org/" class="u-line border-dtpr-blue font-bold">Knight Foundation</NuxtLink>
            </div>
          </div> -->
          
          <!-- <div class="mt-8">
            DTPR has received financial and in-kind support from a number of partners. We are always looking for new collaborators — 
            from pilot opportunities and implementers, to funders and service providers - to help us test, improve, and advance adoption
            of the open source standard. Have an idea on how to support the iteration and adoption of DTPR? Get in touch with the
            Helpful Places team at <a class="u-line" href="mailto:hello@helpfulplaces.com">hello@helpfulplaces.com</a>.
          </div> -->

          <!-- <ul class="font-bold text-2xl mt-8 leading-relaxed">
            <li><NuxtLink class="u-line" to="https://www.normative.com/">Normative</NuxtLink></li>
            <li><NuxtLink class="u-line" to="https://www.weforum.org/">World Economic Forum</NuxtLink></li>
            <li><NuxtLink class="u-line" to="https://www.digitalpublicsquare.org/">Digital Public Square</NuxtLink></li>
            <li><NuxtLink class="u-line" to="https://www.glia.foundation/">GLIA Foundation</NuxtLink></li>
          </ul> -->
        </div>
      </div>

      <!-- <div class="mt-8">
        <div class="card pilots text-dtpr-blue-950">
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
      </div> -->
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
</style>