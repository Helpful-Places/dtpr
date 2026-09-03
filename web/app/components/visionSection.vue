<script setup lang="ts">
     import AlgorithmHeader from '~/components/vision-components/AlgorithmHeader.vue';
    import CanvasCard from '~/components/vision-components/CanvasCard.vue';
    import ChatFooter from '~/components/vision-components/ChatFooter.vue';
    import ContextFlow from '~/components/vision-components/ContextFlow.vue';
    import DecisionLetter from '~/components/vision-components/DecisionLetter.vue';
    import DocumentMark from '~/components/vision-components/DocumentMark.vue';
    import DtprCanvas from '~/components/vision-components/DtprCanvas.vue';
    import HiringNotice from '~/components/vision-components/HiringNotice.vue';

    const componentMap: Record<string, Component>={
        'Algorithm Header':AlgorithmHeader,
        'Canvas Card':CanvasCard,
        'Chat Footer':ChatFooter,
        'Decision Letter':DecisionLetter,
        'DTPR Canvas':DtprCanvas,
        'Hiring Notice':HiringNotice
    }


    const props = defineProps<{
        type: 'Vision Section',
        heading: string,
        body?: string,
        src?:string,
        component:
            | 'Algorithm Header'
            | 'Canvas Card'
            | 'Chat Footer'
            | 'Decision Letter'
            | 'Document Mark'
            | 'DTPR Canvas'
            | 'Hiring Notice'
    }>()

    const resolvedComponent = computed(() => componentMap[props.component] ?? null)
</script>

<template class="py-0">
    <UPageGrid class="w-fill lg:px-30 py-16 sm:py-24 lg:py-32" :ui="{base:'grid lg:grid-cols-2 items-center justify-items-center'}">
        <UPageCard
            :title="props.heading"
            :description="props.body? props.body: ''"
            spotlight
            spotlight-color="primary"
            class="[--spotlight-size:100px]"
            highlight
            highlight-color="bg-border"
        />
        <component :is="resolvedComponent" :v-if="resolvedComponent" :src="props.src ? props.src : ''"/>
    </UPageGrid>
</template>

