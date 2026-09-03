<script setup lang="ts">

    import {computed} from 'vue';
    import Hero from './hero.vue';
    import ContentCard from './contentCard.vue'
    import CardsNextToPic from './CardsNextToPic.vue';
    import twoColumns from './twoColumns.vue';
    import centeredContent from './centeredContent.vue'
    import marquee from './marquee.vue';
    import visionSection from './visionSection.vue';


    const componentMap: Record<string, Component> = {
        'Hero': Hero,
        'Two Columns': twoColumns,
        'Centered Content': centeredContent,
        'card': ContentCard,
        'Three Cards Stacked Next to a Picture': CardsNextToPic,
        'Marquee': marquee,
        'Vision Section': visionSection
        }

    type SectionType = keyof typeof componentMap

    const props = defineProps<{
        sections: Array<Record<string, any> & {type: SectionType}>
    }>()

    
 
    const resolvedSections = computed(() =>
    props.sections.map((section) => {
        const { type, ...rest } = section
        return {
        type,
        component: componentMap[type],
        props: rest,
        }
    })
    )

</script>

<template>
    <div class="grid grid-cols-1 gap-10 ">
        <template v-for="(section, index) in resolvedSections" :key="index">
            <component
                :is="section.component"
                :props="section.props"
                v-bind="section.props"
            ></component>
        
        </template>
    </div>
</template>