<script setup lang="ts">
    import ContentCard from './contentCard.vue';

    const props=defineProps<{
        cards: Array<{
            type:'card',
            heading:string,
            body:string
        }>,
        image:string

    }>()
</script>

<template>
    <section class="grid grid-cols-2 px-30 gap-16 py-10">
        <div>
            <contentCard class="mb-10" v-for="card in props.cards" :heading="card.heading" :body="card.body"></contentCard>
        </div>
        <img class="w-fill m-auto" :src="props.image"/>
    </section>
</template>