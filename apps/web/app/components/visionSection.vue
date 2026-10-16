<script setup lang="ts">
     import AlgorithmHeader from '~/components/vision-components/AlgorithmHeader.vue';
    import CanvasCard from '~/components/vision-components/CanvasCard.vue';
    import ChatFooter from '~/components/vision-components/ChatFooter.vue';
    import DecisionLetter from '~/components/vision-components/DecisionLetter.vue';
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
        type?: 'Vision Section',
        heading: string,
        subHeading?: string,
        src?:string,
        visionComponent:
            | 'Algorithm Header'
            | 'Canvas Card'
            | 'Chat Footer'
            | 'Decision Letter'
            | 'Document Mark'
            | 'DTPR Canvas'
            | 'Hiring Notice'
    }>()

    const resolvedComponent = computed(() => componentMap[props.visionComponent] ?? null)
</script>

<template>
    <UContainer class="grid grid-cols-1 items-center gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12 lg:py-12">
        <div>
            <h3 class="font-sans text-2xl font-semibold text-balance sm:text-3xl">{{ props.heading }}</h3>
            <p v-if="props.subHeading" class="mt-3 text-pretty text-muted">{{ props.subHeading }}</p>
        </div>

        <figure v-if="resolvedComponent" class="flex min-w-0 flex-col items-center gap-4">
            <component :is="resolvedComponent" v-bind="props.src ? { src: props.src } : {}"/>
            <figcaption class="font-sans text-sm text-muted">Illustration of a fictional service, showing how DTPR could appear.</figcaption>
        </figure>
    </UContainer>
</template>
