<script setup lang="ts">
    const {data:page} = await useAsyncData('privacy', ()=>
        queryCollection('privacy').first()
    );

    if(!page.value){
        throw createError({statusCode:404, statusMessage: 'Page Not Found'})
    }
</script>

<template>
    <ContentRenderer :value="page"></ContentRenderer>
</template>