<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from '@/stores/users'
import type { Role, Permission } from '@/types/user'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import axios from 'axios'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'vue-sonner'
import { PlusCircle, Trash2, Pencil, LoaderCircle } from 'lucide-vue-next'

const usersStore = useUsersStore()
const { roles, permissions, isLoading } = storeToRefs(usersStore)

const isDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const selectedRole = ref<Role | null>(null)
const roleToDelete = ref<Role | null>(null)
const selectedPermissions = ref<number[]>([])

const form = ref({
  name: '',
})

onMounted(() => {
  usersStore.fetchRoles()
  usersStore.fetchPermissions()
})

const groupedPermissions = computed(() => {
  if (!permissions.value) return {}
  return permissions.value.reduce((acc: Record<string, Permission[]>, permission: Permission) => {
    const group = permission.group_name || 'general'
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)
})

function openCreateDialog() {
  isEditing.value = false
  selectedRole.value = null
  form.value = { name: '' }
  selectedPermissions.value = []
  isDialogOpen.value = true
}

function openEditDialog(role: Role) {
  isEditing.value = true
  selectedRole.value = role
  form.value = { name: role.name }
  selectedPermissions.value = role.permissions?.map(p => p.id) || []
  isDialogOpen.value = true
}

async function handleSave() {
  isSaving.value = true
  try {
    const roleData = {
      name: form.value.name,
      permissions: selectedPermissions.value,
    }

    if (isEditing.value && selectedRole.value) {
      await usersStore.updateRole(selectedRole.value.id, roleData)
      toast.success('Role Updated', { description: `${roleData.name} has been updated successfully.` })
    }
    else {
      await usersStore.createRole(roleData)
      toast.success('Role Created', { description: `${roleData.name} has been created successfully.` })
    }
    isDialogOpen.value = false
  }
  catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      toast.error('Save Failed', { description: error.response.data.message })
    } else {
      toast.error('Save Failed', { description: 'An unexpected error occurred.' })
    }
  }
  finally {
    isSaving.value = false
  }
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
    if (axios.isAxiosError(error) && error.response) {
      toast.error('Delete Failed', { description: error.response.data.message })
    } else {
      toast.error('Delete Failed', { description: 'An unexpected error occurred.' })
    }
  } finally {
    roleToDelete.value = null
  }
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">
          Role Management
        </h1>
        <p class="text-sm text-muted-foreground">
          Define roles and assign permissions to them.
        </p>
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
            <TableHead class="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="role in roles" :key="role.id">
            <TableCell class="font-medium">
              {{ role.name }}
            </TableCell>
            <TableCell>
              <Badge v-for="permission in role.permissions" :key="permission.id" variant="outline" class="mr-1 mb-1">
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

    <Dialog v-model:open="isDialogOpen">
      <DialogContent class="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Edit Role' : 'Create Role' }}</DialogTitle>
          <DialogDescription>
            {{ isEditing ? 'Update the details for this role.' : 'Enter the details for the new role.' }}
          </DialogDescription>
        </DialogHeader>
        <form v-if="permissions" class="space-y-4" @submit.prevent="handleSave">
          <div class="grid gap-2">
            <Label for="name">Role Name</Label>
            <Input id="name" v-model="form.name" />
          </div>
          <div class="grid gap-2">
            <Label>Permissions</Label>
            <div class="space-y-4">
              <div v-for="(permissionGroup, groupName) in groupedPermissions" :key="groupName" class="rounded-md border p-4">
                <h4 class="mb-2 font-semibold capitalize">
                  {{ groupName }}
                </h4>
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="permission in permissionGroup" :key="permission.id" class="flex items-center space-x-2">
                    <Checkbox :id="`permission-${permission.id}`" :checked="selectedPermissions.includes(permission.id)" @update:checked="() => {
                      const index = selectedPermissions.indexOf(permission.id)
                      if (index > -1) {
                        selectedPermissions.splice(index, 1)
                      } else {
                        selectedPermissions.push(permission.id)
                      }
                    }" />
                    <Label :for="`permission-${permission.id}`" class="font-normal">{{ permission.name }}</Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose as-child>
              <Button type="button" variant="secondary" :disabled="isSaving">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" :disabled="isSaving">
              <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmationDialog
      v-if="roleToDelete"
      v-model:open="isConfirmDialogOpen"
      title="Are you sure?"
      :description="`This will permanently delete the role '${roleToDelete.name}'. This action cannot be undone.`"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
