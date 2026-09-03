<script setup lang="ts">
    const props = defineProps<{
        heading:string,
        body:string
    }>();
</script>

<template>
    <div class="p-10 flex flex-col gap-5 bg-elevated border-default bg-elevated w-full shadow-lg h-50">
        <h4 class="text-2xl">{{ heading }}</h4>
        <p class="text-base">{{ body }}</p>
    </div>
</template>