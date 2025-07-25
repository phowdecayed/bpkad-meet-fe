<script setup lang="ts">
import { computed } from 'vue'
import type { SidebarProps } from '@/components/ui/sidebar'
import { useAuthStore } from '@/stores/auth'

import { GalleryVerticalEnd, PieChart, Settings2, Users, Shield, MapPin, CalendarDays } from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavAdmin from '@/components/NavAdmin.vue'
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
const canManageUsers = computed(() => authStore.hasPermission('manage users'))
const canManageRoles = computed(() => authStore.hasPermission('manage roles'))
const canEditMeetings = computed(() => authStore.hasPermission('edit meetings'))

const canViewMeetings = computed(() => authStore.hasPermission('view meetings'))

// This is sample data.
const data = {
  teams: [
    {
      name: 'BPKAD Meeting',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
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

  if (canViewMeetings.value) {
    menu.push({
      title: 'Meetings',
      url: '/app/meetings',
      icon: CalendarDays,
    })
  }

  return menu
})

const navAdmin = computed(() => {
  const menu = []

  if (canManageSettings.value) {
    menu.push({
      title: 'Settings',
      url: '/app/settings',
      icon: Settings2,
    })
  }

  if (canManageUsers.value) {
    menu.push({
      title: 'User Management',
      url: '/app/users',
      icon: Users,
    })
  }

  if (canManageRoles.value) {
    menu.push({
      title: 'Role Management',
      url: '/app/roles',
      icon: Shield,
    })
  }

  if (canEditMeetings.value) {
    menu.push({
      title: 'Meeting Locations',
      url: '/app/locations',
      icon: MapPin,
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
      <NavAdmin v-if="navAdmin.length > 0" :items="navAdmin" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser v-if="authStore.user" :user="authStore.user" />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
