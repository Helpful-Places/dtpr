<script setup lang="ts">
    import type { NavigationMenuItem } from '@nuxt/ui'

    const {data:nav}= await useAsyncData('nav', ()=>
        queryCollection('navElements').first()
    );

    

</script>

<template>



<header v-if="nav" class="flex flex-col gap-10 sm:px-5 md:px-30 pt-10">
    <div class="flex justify-between ">
        <div class="flex justify-items-start gap-10">
            <NuxtLink to="/" class="flex items-center" prefetch-on="interaction">
                <img alt="Logo" :src="nav.dtprLogo"/>
            </NuxtLink>
        
        </div> 
        
        <NuxtLink prefetch-on="interaction" href="https://www.helpfulplaces.com">
            <img src="/images/HP_logo.png"/>
        </NuxtLink>
    </div>

    <div class="flex flex-col md:flex-row justify-start gap-4">
        <NuxtLink v-for="link in nav.links"
        :key="link.url"
        :to="link.url"
        prefetch-on="interaction">

            <div class="sm:w-100% md:w-55 px-5 py-2.5 bg-elevated border border-default rounded-md">
                <p class="font-code text-primary text-xs"> {{link.label}}</p>
                <p class="font-sans text-default text-xs">{{link.addText}}</p>
            </div>
        </NuxtLink>
    </div>
    <nav>
    </nav>
</header> 
</template>