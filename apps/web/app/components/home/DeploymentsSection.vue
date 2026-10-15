<script setup lang="ts">
    import SectionHeader from '../sectionHeader.vue';
    import DeploymentsExplorer from './DeploymentsExplorer.vue';

    const { data: home } = await useAsyncData('home', () =>
        queryCollection('home').first()
    );
    const { data: deployments } = await useAsyncData('home-deployments', () =>
        queryCollection('deployments').where('hidden', '=', false).order('name', 'ASC').all()
    );

    const copy = computed(() => home.value?.footprint)
</script>

<template>
    <UContainer v-if="copy" as="section" class="section-pad">
        <SectionHeader :heading="copy.heading" :sub-heading="copy.subHeading"/>
        <DeploymentStats class="mt-6"/>
        <DeploymentsExplorer class="mt-6" :deployments="deployments ?? []"/>
        <UButton
            v-if="copy.buttonText && copy.buttonLink"
            size="xl"
            class="mt-6 min-h-11"
            trailing-icon="i-lucide-arrow-right"
            :label="copy.buttonText"
            :to="copy.buttonLink"
        />
    </UContainer>
</template>
