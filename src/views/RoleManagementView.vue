<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from '@/stores/users'
import type { Role, Permission } from '@/types/user'

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
import { PlusCircle, Trash2, Pencil } from 'lucide-vue-next'

const usersStore = useUsersStore()
const { roles, permissions, isLoading } = storeToRefs(usersStore)

const isDialogOpen = ref(false)
const isEditing = ref(false)
const selectedRole = ref<Role | null>(null)
const selectedPermissions = ref<number[]>([])

const form = ref({
  name: '',
})

onMounted(() => {
  usersStore.fetchRoles()
  usersStore.fetchPermissions()
})

const groupedPermissions = computed(() => {
  return permissions.value.reduce((acc, permission) => {
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
  // This is a placeholder for the actual save logic.
  // You would typically call a store action here to create or update a role.
  toast.info('Save functionality not yet implemented.')
  isDialogOpen.value = false
}

async function handleDelete(role: Role) {
  // This is a placeholder for the actual delete logic.
  toast.info('Delete functionality not yet implemented.')
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
        <form class="space-y-4" @submit.prevent="handleSave">
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
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>