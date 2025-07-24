<script setup lang="ts">
import { computed } from 'vue'
import type { SidebarProps } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth'

import { Frame, GalleryVerticalEnd, Map, PieChart, Settings2 } from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavProjects from '@/components/NavProjects.vue'
import NavUser from '@/components/NavUser.vue'
import TeamSwitcher from '@/components/TeamSwitcher.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: 'icon',
})

const authStore = useAuthStore()

const canManageSettings = computed(() => authStore.hasPermission('manage settings'))

// This is sample data.
const data = {
  teams: [
    {
      name: 'BPKAD Meeting',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
}

const navMain = computed(() => {
  const menu = [
    {
      title: 'Dashboard',
      url: '/app/dashboard',
      icon: PieChart,
    },
  ]

  if (canManageSettings.value) {
    menu.push({
      title: 'Settings',
      url: '/app/settings',
      icon: Settings2,
    })
  }

  return menu
})
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :teams="data.teams" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
      <NavProjects :projects="data.projects" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser v-if="authStore.user" :user="authStore.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
