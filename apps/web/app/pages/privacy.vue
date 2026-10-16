<script setup lang="ts">
    const {data:page} = await useAsyncData('privacy', ()=>
        queryCollection('privacy').first()
    );

    if(!page.value){
        throw createError({statusCode:404, statusMessage: 'Page Not Found'})
    }

    usePageSeo(page)
</script>

<template>
    <UContainer class="py-10 sm:py-14">
        <ContentRenderer :value="page" class="prose mx-auto w-full max-w-3xl rounded-md bg-white p-6 shadow-sm ring ring-rule sm:p-10 prose-h1:text-3xl prose-h1:font-semibold sm:prose-h1:text-4xl [--tw-prose-links:var(--ui-primary)]"></ContentRenderer>
    </UContainer>
</template>