<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from '@/stores/users'
import type { Role } from '@/types/user'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import RoleDialog from '@/components/users/RoleDialog.vue'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'vue-sonner'
import { PlusCircle, Trash2, Pencil } from 'lucide-vue-next'

const usersStore = useUsersStore()
const { roles, permissions, isLoading } = storeToRefs(usersStore)

const isDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const selectedRole = ref<Role | null>(null)
const roleToDelete = ref<Role | null>(null)

onMounted(() => {
  usersStore.fetchRoles()
  usersStore.fetchPermissions()
})

function openCreateDialog() {
  selectedRole.value = null
  isDialogOpen.value = true
}

function openEditDialog(role: Role) {
  selectedRole.value = role
  isDialogOpen.value = true
}

function handleSaved() {
  usersStore.fetchRoles()
}

function handleDelete(role: Role) {
  roleToDelete.value = role
  isConfirmDialogOpen.value = true
}

async function onConfirmDelete() {
  if (!roleToDelete.value) return
  try {
    await usersStore.deleteRole(roleToDelete.value.id)
    toast.success('Role Deleted', { description: `${roleToDelete.value.name} has been deleted.` })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Delete Failed', { description: message })
  } finally {
    roleToDelete.value = null
  }
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">Role Management</h1>
        <p class="text-sm text-muted-foreground">Define roles and assign permissions to them.</p>
      </div>
      <Button @click="openCreateDialog">
        <PlusCircle class="mr-2 h-4 w-4" />
        Create Role
      </Button>
    </div>

    <div v-if="isLoading">
      <Skeleton class="h-48 w-full" />
    </div>
    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead class="text-right"> Actions </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="role in roles" :key="role.id">
            <TableCell>
              {{ role.name }}
            </TableCell>
            <TableCell>
              <Badge
                v-for="permission in role.permissions"
                :key="permission.id"
                variant="outline"
                class="mr-1"
              >
                {{ permission.name }}
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="icon" @click="openEditDialog(role)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="handleDelete(role)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <RoleDialog
      v-model:open="isDialogOpen"
      :role="selectedRole"
      :permissions="permissions"
      @saved="handleSaved"
    />

    <ConfirmationDialog
      v-if="roleToDelete"
      v-model:open="isConfirmDialogOpen"
      title="Are you sure?"
      :description="`This will permanently delete the role '${roleToDelete.name}'. This action cannot be undone.`"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
