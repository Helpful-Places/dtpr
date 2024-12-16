<template>
    <div class="app-container mt-12">
        <div class="md:flex gap-8">
            <Card class="md:w-[60%] bg-dtpr-blue-100">
                <h2>How Did We Get Here?</h2>
                <p>
                    In 2019, experts came together in cities around the world in co-design sessions to collaborate and prototype an initial set of open communication standards for digital transparency in the public realm.
                </p>
                <p>
                    In 2020, this initial draft was refined through several cycles of online expert charrettes and small meetings, iterative prototype development, and longitudinal inclusive usability and concept testing. Initiated by Sidewalk Labs, the <NuxtLink class="underline" to="https://github.com/Helpful-Places/dtpr/blob/main/resources/DTPR_Design_Guide.pdf">original prototype draft standard</NuxtLink> as well as all the <NuxtLink class="underline" to="https://github.com/Helpful-Places/dtpr/tree/main/resources/codesignkit">co-design activities and materials</NuxtLink> used to generate it, are publicly and freely available as valuable artifacts enabling users to understand DTPR’s origins and introduce principles of transparency within their own organizations and use cases. This original version was named Digital Transparency in the Public Realm (DTPR). 

                </p>
                <p>
                    Today, under the stewardship of Helpful Places—the standard was renamed to Digital Trust for Places and Routines (DTPR) and continues to evolve into a more comprehensive framework for digital transparency in public spaces. The standard, its taxonomy and design language continues to evolve and grow and this evolution is transparently represented in DTPR’s Github Repository.  
                </p>
                <p>
                    The Guide to the Standard now serves as the official resource for understanding and deploying DTPR across various contexts. This guide combines the conceptual foundations of DTPR with practical insights gained from real-world implementations, providing critical insights into navigating common challenges, and deploying DTPR effectively across diverse contexts.
                </p>
                <p>
                    Helpful Places continues to develop and expand DTPR in collaboration with a growing coalition of partners, ensuring it remains an evolving resource for fostering transparency in the public realm.
                </p>
            </Card>
            <Card class="bg-deployment md:w-[40%] min-h-[12rem]"></Card>
        </div>

    </div>
</template>
<script setup>
    useHead({
        title: 'How We Got Here'
    })
</script>
<style lang="postcss" scoped>
.bg-deployment {
    background-image: url('/images/tools_codesign.png');
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;
}
</style>