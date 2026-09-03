<script setup lang="ts">
    import pageAssembler from '~/components/pageAssembler.vue';
    const {data:page} = await useAsyncData('page-world', ()=>
        queryCollection('pages').path('/dtpr-in-the-world').first()
    );

    if(!page.value){
        throw createError({statusCode:404, statusMessage: 'Page Not Found'});
    }
</script>

<template>
    <UContainer>
        <div v-if="page">
            <pageAssembler :sections="page.sections"></pageAssembler>
        </div>
    </UContainer>
</template>