<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from '@/stores/users'
import type { User, UserCreationPayload, UserUpdatePayload } from '@/types/user'

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
import { PlusCircle, Trash2, Pencil, Send, LoaderCircle, MailWarning } from 'lucide-vue-next'

const usersStore = useUsersStore()
const { users, roles, isLoading } = storeToRefs(usersStore)

const isDialogOpen = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const selectedUser = ref<User | null>(null)
const selectedRoles = ref<number[]>([])

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

onMounted(() => {
  usersStore.fetchUsers()
  usersStore.fetchRoles()
})

function openCreateDialog() {
  isEditing.value = false
  selectedUser.value = null
  form.value = { name: '', email: '', password: '', password_confirmation: '' }
  selectedRoles.value = []
  isDialogOpen.value = true
}

function openEditDialog(user: User) {
  isEditing.value = true
  selectedUser.value = user
  form.value = {
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
  }
  selectedRoles.value = user.roles?.map((role) => role.id) || []
  isDialogOpen.value = true
}

async function handleSave() {
  isSaving.value = true
  try {
    if (isEditing.value && selectedUser.value) {
      const userData: UserUpdatePayload = {
        name: form.value.name,
        email: form.value.email,
        roles: selectedRoles.value,
      }
      await usersStore.updateUser(selectedUser.value.id, userData)
      toast.success('User Updated', {
        description: `${userData.name} has been updated successfully.`,
      })
    } else {
      const roleName = roles.value.find(r => r.id === selectedRoles.value[0])?.name || 'user'
      const userData: UserCreationPayload = {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password,
        password_confirmation: form.value.password_confirmation,
        role: roleName,
      }
      await usersStore.createUser(userData)
      toast.success('User Created', {
        description: `${userData.name} has been created successfully.`,
      })
    }
    isDialogOpen.value = false
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Save Failed', { description: message })
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(user: User) {
  if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
    try {
      await usersStore.deleteUser(user.id)
      toast.success('User Deleted', { description: `${user.name} has been deleted.` })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
      toast.error('Delete Failed', { description: message })
    }
  }
}

async function handleSendPasswordReset() {
  if (!selectedUser.value) return

  try {
    await usersStore.sendPasswordReset(selectedUser.value.email)
    toast.success('Password Reset Sent', {
      description: `A password reset link has been sent to ${selectedUser.value.email}.`,
    })
    isDialogOpen.value = false
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Failed to Send', { description: message })
  }
}

async function handleResendVerification(user: User) {
  try {
    await usersStore.resendVerificationEmail(user.id)
    toast.success('Verification Email Sent', {
      description: `A new verification link has been sent to ${user.email}.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Failed to Send', { description: message })
  }
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">User Management</h1>
        <p class="text-sm text-muted-foreground">
          Create, edit, and manage users, roles, and permissions.
        </p>
      </div>
      <Button @click="openCreateDialog">
        <PlusCircle class="mr-2 h-4 w-4" />
        Create User
      </Button>
    </div>

    <div v-if="isLoading">
      <Skeleton class="h-48 w-full" />
    </div>
    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right"> Actions </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in users" :key="user.id">
            <TableCell>{{ user.name }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
            <TableCell>
              <Badge v-for="role in user.roles" :key="role.id" variant="outline" class="mr-1">
                {{ role.name }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(user.created_at) }}</TableCell>
            <TableCell>
              <Badge v-if="user.email_verified_at" variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Verified
              </Badge>
              <Badge v-else variant="secondary" class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Pending
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <Button v-if="!user.email_verified_at" variant="ghost" size="icon" @click="handleResendVerification(user)">
                <MailWarning class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="openEditDialog(user)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="handleDelete(user)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Edit User' : 'Create User' }}</DialogTitle>
          <DialogDescription>
            {{
              isEditing
                ? 'Update the details for this user.'
                : 'Enter the details for the new user.'
            }}
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleSave">
          <div class="grid gap-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="form.name" />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="form.email" type="email" />
          </div>
          <template v-if="!isEditing">
            <div class="grid gap-2">
              <Label for="password">Password</Label>
              <Input
                id="password"
                v-model="form.password"
                type="password"
                placeholder="Enter User Password"
              />
            </div>
            <div class="grid gap-2">
              <Label for="password_confirmation">Confirm Password</Label>
              <Input
                id="password_confirmation"
                v-model="form.password_confirmation"
                type="password"
                placeholder="Enter User Confirmation Password"
              />
            </div>
          </template>
          <div class="grid gap-2">
            <Label>Roles</Label>
            <div class="space-y-2 rounded-md border p-4">
              <div v-for="role in roles" :key="role.id" class="flex items-center space-x-2">
                <Checkbox
                  :id="`role-${role.id}`"
                  :checked="selectedRoles.includes(role.id)"
                  @update:checked="
                    () => {
                      const index = selectedRoles.indexOf(role.id)
                      if (index > -1) {
                        selectedRoles.splice(index, 1)
                      } else {
                        selectedRoles.push(role.id)
                      }
                    }
                  "
                />
                <Label :for="`role-${role.id}`" class="font-normal">{{ role.name }}</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              v-if="isEditing"
              type="button"
              variant="outline"
              class="mr-auto"
              @click="handleSendPasswordReset"
            >
              <Send class="mr-2 h-4 w-4" />
              Send Password Reset
            </Button>
            <DialogClose as-child>
              <Button type="button" variant="secondary" :disabled="isSaving"> Cancel </Button>
            </DialogClose>
            <Button type="submit" :disabled="isSaving">
              <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>