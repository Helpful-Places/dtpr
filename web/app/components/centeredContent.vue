<script setup lang="ts">
    import type {ButtonProps} from '@nuxt/ui'
    import MarkdownIt from 'markdown-it'


    const md = new MarkdownIt()

    const props=defineProps<{
        type:"Centered Content"
        heading?: string,
        body?: string,
        image?: string,
        isDark: boolean,
        hasButton: boolean,
        buttonText?:string,
        buttonLink?:string,
        cards?:Array<{
            type: 'card',
            heading:string,
            body: string,
            link?: string
        }>

    }>();

    const renderedBody = computed(() => {
        return props.body ? md.render(props.body) : ''
})

    const link=ref<ButtonProps[]>([
        {   
            label: props.buttonText ? props.buttonText : null,
            to: props.buttonLink ? props.buttonLink : null,
            color: 'primary'
        }   
    ]);

</script>

<template>
    <UPageSection :title="props.heading ? props.heading : ''" orientation="vertical" :links="props.hasButton?link:null">
        <div class="prose prose dark:prose-invert max-w-none lg:py-1" v-html="renderedBody"></div>
        

        <img v-if="props.image" :src="props.image"/>


        <UPageGrid v-if="props.cards" :ui="{base: 'grid lg:grid-cols-2 '}">
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
                :description="card.body ? card.body : ''"/>
        </UPageGrid>
    </UPageSection>
</template>
