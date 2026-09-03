<script setup lang="ts">
    import PageAssembler from '~/components/pageAssembler.vue';

    import AlgorithmHeader from '~/components/vision-components/AlgorithmHeader.vue';
    import CanvasCard from '~/components/vision-components/CanvasCard.vue';
    import ChatFooter from '~/components/vision-components/ChatFooter.vue';
    import ContextFlow from '~/components/vision-components/ContextFlow.vue';
    import DecisionLetter from '~/components/vision-components/DecisionLetter.vue';
    import DocumentMark from '~/components/vision-components/DocumentMark.vue';
import DtprCanvas from '~/components/vision-components/DtprCanvas.vue';
import HiringNotice from '~/components/vision-components/HiringNotice.vue';

    const { data: page } = await useAsyncData('page-home', () =>
        queryCollection('pages').path('/').first()
    );


    if (!page.value) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
    }
    
</script>

<template>
        <div v-if="page">
            <PageAssembler  :sections="page.sections"></PageAssembler>
        </div>

        <!-- <AlgorithmHeader src="/data/cbsa-tci.datachain.json" :highlight-category-id="$clicks >= 1 ? 'functional_modes' : null"/>
        <CanvasCard/>
        <ChatFooter :expanded="$clicks >= 1" />
        <DecisionLetter/>
        <DocumentMark/>
        <DtprCanvas/>
        <HiringNotice/> -->

        
     

   



</template>