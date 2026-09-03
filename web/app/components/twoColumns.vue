<script setup lang="ts">
    import type { ButtonProps } from '@nuxt/ui'
    const props = defineProps<{
        headingLeft: string,
        bodyLeft?:string,
        headingRight?:string,
        bodyRight?: string,
        colorVariant:{
            type:string, 
            default: "Light"
        },
        image?: string,
        hasButton: boolean,
        buttonText?:string,
        buttonLink?:string,
        cards?:Array<{
            type:'card',
            heading:string,
            body: string,
            link?:string
        }>
    }>()

    const link=ref<ButtonProps[]>([
        {   
            label: props.buttonText ? props.buttonText : null,
            to: props.buttonLink ? props.buttonLink : null,
            color: 'primary'
        }   
    ]);
</script>

<template>
    <UPageGrid class="w-fill lg:px-30 py-16 sm:py-24 lg:py-32" :ui="{base: 'grid lg:grid-cols-2'}">
        <UPageGrid v-if="props.cards" :ui="{base: 'grid lg:grid-cols-1'}">
            <UPageCard
                v-for="(card, index) in props.cards"
                :key="index"
                :title="card.heading ? card.heading : ''"
                highlight
                highlight-color="bg-border"
                :to="card.link"
                spotlight
                spotlight-color="primary"
                class="[--spotlight-size:100px]"
                :description="card.body ? card.body : ''"
            />
        </UPageGrid>

        <UPageCard 
            v-if="props.headingLeft || props.bodyLeft" 
            :title="props.headingLeft ? props.headingLeft : ''" 
            :description="props.bodyLeft ? props.bodyLeft : ''"
            
        >
                
                <UButton size="xl" class="self-start justify-self-center w-fit" v-if="props.hasButton" :label="props.buttonText" :to="props.buttonLink"></UButton>
      
        </UPageCard>

        <UPageCard 
            v-if="props.headingRight || props.bodyRight" 
            :title="props.headingRight? props.headingRight : ''" 
            :description="props.bodyRight ? props.bodyRight : ''"
        >
        </UPageCard>

        <img class="self-center" v-if="props.image" :src="props.image"/>

    </UPageGrid>

    <!-- <UPageSection
    orientation="horizontal" :class="props.colorVariant=='Dark' ? 'bg-inverted' : 'bg-default'"  :title="props.headingRight? '' : props.headingLeft" :description="props.bodyRight ? '' : props.bodyRight" :links="props.hasButton?link:null">
        <UPageGrid v-if="props.cards" :ui="{base: 'grid lg:grid-cols-1'}">
            <UPageCard
                v-for="(card, index) in props.cards"
                :key="index"
                :title="card.heading ? card.heading : ''"
                highlight
                highlight-color="bg-border"
                :to="card.link"
                spotlight
                spotlight-color="primary"
                class="[--spotlight-size:100px]"
                :description="card.body ? card.body : ''"
            />
        </UPageGrid>
        <div v-if="props.headingRight!=null &&props.bodyRight!=null" class="h-full" >
               <h3 class="text-center font-sans h-20 text-3xl font-semibold" :class="props.colorVariant=='Dark' ? 'text-inverted' : 'text-default' ">{{ props.headingLeft }}</h3>
            <p :class="props.colorVariant=='Dark' ? 'text-inverted' : 'text-default' " v-if="props.bodyLeft" class="font-sans text-base mt-6">{{ props.bodyLeft }}</p>
        </div>
     
        <div class="h-full" v-if="props.bodyRight || props.headingRight">
               <h3 :class="props.colorVariant=='Dark' ? 'text-inverted' : 'text-default' " class="text-center font-sans h-20 text-3xl font-semibold">{{ props.headingRight }}</h3>
            <p :class="props.colorVariant=='Dark' ? 'text-inverted' : 'text-default' " class="font-sans text-base mt-6">{{ props.bodyRight }}</p>
        </div>
        
        <img v-if="props.image" :src="props.image"/>
        
    </UPageSection> -->
    

</template>