<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const navItems: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/',
  },
  {
    label: 'Elements',
    icon: 'i-lucide-box',
    to: '/elements',
  },
  {
    label: 'Categories',
    icon: 'i-lucide-folder',
    to: '/categories',
  },
  {
    label: 'Translations',
    icon: 'i-lucide-languages',
    to: '/translations',
  },
  {
    label: 'Icons',
    icon: 'i-lucide-image',
    to: '/icons',
  },
]

const activeItems = computed(() =>
  navItems.map((item) => ({
    ...item,
    active: item.to === '/' ? route.path === '/' : route.path.startsWith(item.to as string),
  })),
)
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar>
      <template #header>
        <div class="flex items-center gap-2 px-1">
          <UIcon name="i-lucide-shield-check" class="size-5 text-primary" />
          <span class="font-semibold text-sm">DTPR Studio</span>
        </div>
      </template>

      <UNavigationMenu :items="activeItems" orientation="vertical" />
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #body>
        <NuxtPage />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
