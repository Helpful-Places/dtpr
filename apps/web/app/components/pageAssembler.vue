<script setup lang="ts">

    import {computed} from 'vue';
    import Hero from './hero.vue';

    import twoColumns from './twoColumns.vue';
    import centeredContent from './centeredContent.vue'
    import marquee from './marquee.vue';
    import visionSection from './visionSection.vue';
    import DeploymentsSection from './home/DeploymentsSection.vue';
    import CommunityTracks from './home/CommunityTracks.vue';
    import WaysIn from './waysIn.vue';
    import Audiences from './audiences.vue';
    import Contact from './contact.vue';
    import Newsletter from './newsletter.vue';
    import SplitContent from './splitContent.vue';
    import MediaCards from './mediaCards.vue';
    import DatachainRows from './guide/DatachainRows.vue';
    import IconAnatomy from './guide/IconAnatomy.vue';
    import QuestionList from './guide/QuestionList.vue';


    const componentMap: Record<string, Component> = {
        'Hero': Hero,
        'Two Columns': twoColumns,
        'Centered Content': centeredContent,
        'Marquee': marquee,
        'Vision Section': visionSection,
        'Deployments Explorer': DeploymentsSection,
        'Community Tracks': CommunityTracks,
        'Ways In': WaysIn,
        'Audiences': Audiences,
        'Newsletter': Newsletter,
        'Split Content': SplitContent,
        'Media Cards': MediaCards,
        'Contact': Contact,
        'Datachain Rows': DatachainRows,
        'Icon Anatomy': IconAnatomy,
        'Question List': QuestionList
        }

    type SectionType = keyof typeof componentMap

    const props = defineProps<{
        sections: Array<Record<string, any> & {type: SectionType}>
    }>()

    
 
    const resolvedSections = computed(() =>
    props.sections.map((section) => {
        const { type, anchor, ...rest } = section
        return {
        type,
        anchor: anchor as string | undefined,
        component: componentMap[type],
        props: rest,
        }
    })
    )

</script>

<template>
    <div class="grid grid-cols-1">
        <template v-for="(section, index) in resolvedSections" :key="index">
            <component
                :is="section.component"
                :id="section.anchor"
                :class="section.anchor && 'scroll-mt-20'"
                v-bind="section.props"
            ></component>
        
        </template>
    </div>
</template>