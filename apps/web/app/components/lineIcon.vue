<script setup lang="ts">
    // One inline Lucide line icon from the lineIcons set. Size and colour come
    // from the class the parent passes, as with any svg.
    const props = defineProps<{ name: string }>()
    const body = computed(() => lineIcons[props.name])
</script>

<template>
    <svg
        v-if="body"
        viewBox="0 0 24 24"
        class="fill-none stroke-current"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        v-html="body"
    />
</template>
