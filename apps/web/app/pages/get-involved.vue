<script setup lang="ts">
    import pageAssembler from '~/components/pageAssembler.vue';
    const {data:page} = await useAsyncData('page', ()=>
        queryCollection('pages').path('/get-involved').first()
    )
    if(!page.value){
        throw createError({statusCode:404, statusMessage:'Page Not Found'})
    }

    usePageSeo(page)
</script>

<template>
    <div v-if="page" class="sections-compact">
        <!-- This page's sections are short, so they sit closer together. -->
        <pageAssembler :sections="page.sections"></pageAssembler>
    </div>
</template>>