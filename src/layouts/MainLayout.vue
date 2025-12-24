<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterView } from 'vue-router'
import AppSidebar from '@/components/AppSidebar.vue'
import CreateMeetingDialog from '@/components/meetings/CreateMeetingDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { PERMISSIONS } from '@/constants/permissions'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { Plus } from 'lucide-vue-next'

const authStore = useAuthStore()
const canCreateMeetings = computed(() => authStore.hasPermission(PERMISSIONS.MEETINGS.EDIT))
const isCreateMeetingDialogOpen = ref(false)
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#"> BPKAD </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{{
                $route.name
                  ? $route.name.toString().charAt(0).toUpperCase() + $route.name.toString().slice(1)
                  : ''
              }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div class="ml-auto">
          <Button v-if="canCreateMeetings" size="sm" @click="isCreateMeetingDialogOpen = true">
            <Plus class="mr-2 h-4 w-4" />
            Create Meeting
          </Button>
        </div>
      </header>
      <main class="flex-1 overflow-y-auto">
        <RouterView />
      </main>
    </SidebarInset>
    <CreateMeetingDialog v-model:open="isCreateMeetingDialogOpen" />
  </SidebarProvider>
</template>
