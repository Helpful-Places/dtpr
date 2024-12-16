<template>
    <div class="app-container mt-12">
        <awardsHeader></awardsHeader>
        <div class="grid mb-20 md:grid-cols-2 lg:grid-cols-3 mt-8 gap-10 text-center font-bold text-m">
            <PartnerCard class="font-normal mb-10"
                url="https://www.planning.org/planning/2022/fall/7-need-to-know-trends-for-planners-in-2023/#:~:text=That%27s%20why%20cities,smart%20city"
                imageFile="awards/apa.png"
                imageAlt="Cover of APA Award">
            
                “Making the public aware of nearby technology and its purpose is the first step to getting people involved, allowing them to provide feedback, and making them feel like they have the power to co-create the smart city.” 
            </PartnerCard>
            <PartnerCard class="font-normal mb-10"
                url="https://unhabitat.org/sites/default/files/2022/06/playbook_4_community.pdf"
                imageFile="awards/un.png"
                imageAlt="Cover of UN Report">
            
                UN-Habitat's Smart Cities playbook highlights DTPR as an open-source initiative advancing transparency in public spaces and underscores the critical role of open standards in smart cities. It features global examples like the EU’s bIoTope for IoT and Barcelona’s Ethical Digital Standards to promote interoperability and collaboration.

            </PartnerCard>
            <PartnerCard class="font-normal mb-10"
                url="https://www.smartcityexpo.com/world-smart-city-awards-2023/"
                imageFile="awards/wsc.png"
                imageAlt="Cover of WSC award">
            
                Proud finalists for the 2023 World Smart City Innovation Award at the Smart City Expo World Congress in Barcelona

            </PartnerCard>
            <PartnerCard class="font-normal mb-10"
                url="#"
                imageFile="awards/picasso.png"
                imageAlt="Cover of Picasso awards logo">
            
                2024 PICCASO Awards Canada: Helpful Places was a shortlisted nominee in the Most Impactful Privacy Product or Service category

            </PartnerCard>
            <PartnerCard class="font-normal mb-10"
                url="https://www.iothub.com.au/news/meet-the-trusted-iot-service-finalists-in-the-2024-australian-iot-awards-607317"
                imageFile="awards/iotAwards.png"
                imageAlt="IOT Awards Logo">
            
                Sydney Olympic Park’s DTPR pilot was a finalist in the Trusted IoT category

→ Check out IoTHub’s article on the DTPR and how the SOPA pilot embeds transparency, trust, and accessibility in IoT systems


            </PartnerCard>
            <PartnerCard class="font-normal mb-10"
                url="https://transparencyshowcase.ipc.on.ca/en/town-of-innisfil/"
                imageFile="awards/transparency.png"
                imageAlt="Transparency Showcase logo">
            
                The Town of Innisfil’s DTPR deployment has been recognized in the Information and Privacy Commissioner of Ontario's 2024 Transparency Showcase for its innovative approach to integrating technology in public spaces.

            </PartnerCard>
        </div>
    </div>
</template>
<script setup>
    useHead({
        title:'Awards'
    })
</script>