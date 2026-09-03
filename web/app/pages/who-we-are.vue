<script setup lang="ts">
    import PageAssembler from '~/components/pageAssembler.vue'

    const {data: page} = await useAsyncData('page-who-we-are', ()=>
        queryCollection('pages').path('/who-we-are').first()
    );

    if(!page.value){
        throw createError({statusCode: 404, statusMessage: 'Page Not Found'});
    }
</script>

<template>
    <UContainer>
        <div v-if="page">
            <PageAssembler :sections="page.sections"></PageAssembler>
        </div>
    </UContainer>
</template>