<script setup lang="ts">
    import type { ContentNavigationItem } from '@nuxt/content'
    const route=useRoute()

     const {data : navigationTree}=await useAsyncData('navigation', ()=>{
        return queryCollectionNavigation('getStarted');
    });


    const navigation = computed(() => {
        const root = navigationTree.value?.[0]
        if (!root) return []

        const flattened = [
            ...(root.children ?? [])
        ]

        const dashboardItem = {
            title: 'Dashboard',
            path: '/get-started/dashboard'
        }
        flattened.splice(1, 0, dashboardItem)

        return flattened
    })
    
    const dashboard = computed(()=>route.params.slug=='dashboard'?true:false);
    
    const {data:page}=await useAsyncData('get-started/'+route.path, ()=>{
            return queryCollection('getStarted').path(route.path).first()
        });
        

    if(!page.value && !dashboard.value){ // .value: a ComputedRef is always truthy, so this guard never fired and missing pages 500'd on ContentRenderer
        throw createError({statusCode:404, statusMessage:'Page Not Found'});
    }


    function flattenNavigation(items: typeof navigation.value) {
        return items.flatMap((item) => {
            const { children, ...rest } = item

            // Always descend into children so nested real pages are still reachable
            const childResults = children ? flattenNavigation(children) : []

            // Only keep this node itself if it's backed by real content
            const isLinkable = rest.page !== false

            return isLinkable ? [rest, ...childResults] : childResults
        })
    }

    const flatNavigation = computed(() => flattenNavigation(navigation.value))

    const surround = computed(() => {
        const flat = flatNavigation.value
        const currentIndex = flat.findIndex((item) => item.path === route.path)

        if (currentIndex === -1) return [undefined, undefined] as const

        return [
            flat[currentIndex - 1],
            flat[currentIndex + 1]
        ] as const
        })

    

   


</script>

<template>
    <UContainer class="bg-default">
        <UPage class='py-10' :ui="{left: 'lg-col-span-6 col-span-6', center: 'lg-col-span-4 col-span-4'}">
            <template #left>
                <UPageAside>
                    <UContentNavigation class="prose" highlighthighlight-color="primary" color="primary" :navigation="navigation"></UContentNavigation>
                </UPageAside>
            </template>
            <UPageBody> 
                <ContentRenderer v-if="!dashboard" :value="page"></ContentRenderer>
                <p v-if="dashboard">Hi</p>
                <UContentSurround :surround="surround" />
            </UPageBody>

        </UPage>
    </UContainer>
    
</template>