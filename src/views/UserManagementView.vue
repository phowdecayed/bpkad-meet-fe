<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import type { User } from '@/types/user'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import UserDialog from '@/components/users/UserDialog.vue'
import PaginationControls from '@/components/PaginationControls.vue'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { PlusCircle, Trash2, Pencil, LoaderCircle, MailWarning, Search } from 'lucide-vue-next'

const usersStore = useUsersStore()
const authStore = useAuthStore()
const { users, roles, isLoading, pagination, error } = storeToRefs(usersStore)

const isDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const isResending = ref<Record<number, boolean>>({})
const selectedUser = ref<User | null>(null)
const userToDelete = ref<User | null>(null)
const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout>

const totalPages = computed(() => pagination.value.lastPage)
const hasNextPage = computed(() => pagination.value.currentPage < pagination.value.lastPage)
const hasPrevPage = computed(() => pagination.value.currentPage > 1)

function handleSearch(event: Event) {
  const query = (event.target as HTMLInputElement).value
  searchQuery.value = query

  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    usersStore.setSearch(query)
  }, 300)
}

function handlePageChange(page: number) {
  usersStore.setPage(page)
}

function handleNextPage() {
  if (hasNextPage.value) handlePageChange(pagination.value.currentPage + 1)
}

function handlePrevPage() {
  if (hasPrevPage.value) handlePageChange(pagination.value.currentPage - 1)
}

function handleFirstPage() {
  handlePageChange(1)
}

function handleLastPage() {
  handlePageChange(totalPages.value)
}

function handleRetry() {
  usersStore.fetchUsers()
}

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

    <div class="flex items-center py-4">
      <div class="relative w-full max-w-sm items-center">
        <Input
          :model-value="searchQuery"
          @input="handleSearch"
          placeholder="Search users..."
          class="pl-10"
        />
        <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
          <Search class="size-4 text-muted-foreground" />
        </span>
      </div>
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
              <Button
                variant="ghost"
                size="icon"
                @click="handleDelete(user)"
                :disabled="user.id === authStore.user?.id"
                :title="
                  user.id === authStore.user?.id
                    ? 'You cannot delete your own account'
                    : 'Delete user'
                "
              >
                <Trash2 class="h-4 w-4" :class="{ 'opacity-50': user.id === authStore.user?.id }" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <PaginationControls
      :current-page="pagination.currentPage"
      :total-pages="totalPages"
      :total-items="pagination.total"
      :items-per-page="pagination.perPage"
      :has-next-page="hasNextPage"
      :has-prev-page="hasPrevPage"
      :is-loading="isLoading"
      :error="error ? { message: error, retryable: true } : null"
      @page-change="handlePageChange"
      @first-page="handleFirstPage"
      @last-page="handleLastPage"
      @next-page="handleNextPage"
      @prev-page="handlePrevPage"
      @retry="handleRetry"
      class="mt-4"
    />

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
