<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from '@/stores/users'
import type { User } from '@/types/user'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import UserDialog from '@/components/users/UserDialog.vue'

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
import { PlusCircle, Trash2, Pencil, LoaderCircle, MailWarning } from 'lucide-vue-next'

const usersStore = useUsersStore()
const { users, roles, isLoading } = storeToRefs(usersStore)

const isDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const isResending = ref<Record<number, boolean>>({})
const selectedUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)

onMounted(() => {
  usersStore.fetchUsers()
  usersStore.fetchRoles()
})

function openCreateDialog() {
  selectedUser.value = null
  isDialogOpen.value = true
}

function openEditDialog(user: User) {
  selectedUser.value = user
  isDialogOpen.value = true
}

function handleSaved() {
  // Store handles refresh automatically
}

function handleDelete(user: User) {
  userToDelete.value = user
  isConfirmDialogOpen.value = true
}

async function onConfirmDelete() {
  if (!userToDelete.value) return
  try {
    await usersStore.deleteUser(userToDelete.value.id)
    toast.success('User Deleted', { description: `${userToDelete.value.name} has been deleted.` })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Delete Failed', { description: message })
  } finally {
    userToDelete.value = null
  }
}

async function handleResendVerification(user: User) {
  isResending.value[user.id] = true
  try {
    await usersStore.resendVerificationEmail(user.id)
    toast.success('Verification Email Sent', {
      description: `A new verification link has been sent to ${user.email}.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    toast.error('Failed to Send', { description: message })
  } finally {
    isResending.value[user.id] = false
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
              <Badge
                v-if="user.email_verified_at"
                variant="secondary"
                class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Verified
              </Badge>
              <Badge
                v-else
                variant="secondary"
                class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
              >
                Pending
              </Badge>
            </TableCell>
            <TableCell class="text-right">
              <Button
                v-if="!user.email_verified_at"
                variant="ghost"
                size="icon"
                :disabled="isResending[user.id]"
                @click="handleResendVerification(user)"
              >
                <LoaderCircle v-if="isResending[user.id]" class="h-4 w-4 animate-spin" />
                <MailWarning v-else class="h-4 w-4" />
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

    <UserDialog
      v-model:open="isDialogOpen"
      :user="selectedUser"
      :roles="roles"
      @saved="handleSaved"
    />

    <ConfirmationDialog
      v-if="userToDelete"
      v-model:open="isConfirmDialogOpen"
      title="Are you sure?"
      :description="`This will permanently delete the user '${userToDelete.name}'. This action cannot be undone.`"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
