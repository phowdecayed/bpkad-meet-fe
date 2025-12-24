import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { userService } from '@/services/userService'
import type { User, Role, Permission, UserCreationPayload, UserUpdatePayload } from '@/types/user'

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const roles = ref<Role[]>([])
  const permissions = ref<Permission[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    try {
      const response = await userService.fetchUsers()
      users.value = response.data.data
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        error.value = err.response.data.message || 'Failed to fetch users.'
      } else {
        error.value = 'An unexpected error occurred.'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRoles() {
    try {
      const response = await userService.fetchRoles()
      roles.value = response.data
    } catch (err: unknown) {
      console.error('Failed to fetch roles:', err)
    }
  }

  async function fetchPermissions() {
    try {
      const response = await userService.fetchPermissions()
      permissions.value = response.data.data
    } catch (err: unknown) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  async function createUser(userData: UserCreationPayload) {
    const response = await userService.createUser(userData)
    await fetchUsers()
    return response.data
  }

  async function updateUser(id: number, userData: UserUpdatePayload) {
    const response = await userService.updateUser(id, userData)
    await fetchUsers()
    return response.data
  }

  async function deleteUser(id: number) {
    await userService.deleteUser(id)
    await fetchUsers()
  }

  async function sendPasswordReset(email: string) {
    return userService.sendPasswordReset(email)
  }

  async function resendVerificationEmail(userId: number) {
    return userService.resendVerificationEmail(userId)
  }

  async function createRole(roleData: { name: string; permissions: number[] }) {
    const response = await userService.createRole({ name: roleData.name })
    const newRole = response.data

    // Process permission assignments sequentially
    for (const permissionId of roleData.permissions) {
      const permission = permissions.value.find((p) => p.id === permissionId)
      if (permission) {
        await userService.addPermissionToRole(newRole.id, permission.name)
      }
    }
    await fetchRoles()
    return newRole
  }

  async function updateRole(id: number, roleData: { name: string; permissions: number[] }) {
    await userService.updateRoleName(id, roleData.name)

    const currentRole = roles.value.find((r) => r.id === id)
    const currentPermissionIds = currentRole?.permissions?.map((p) => p.id) || []

    const permissionsToAdd = roleData.permissions.filter((id) => !currentPermissionIds.includes(id))
    const permissionsToRemove = currentPermissionIds.filter(
      (id) => !roleData.permissions.includes(id),
    )

    for (const permissionId of permissionsToAdd) {
      const permission = permissions.value.find((p) => p.id === permissionId)
      if (permission) {
        await userService.addPermissionToRole(id, permission.name)
      }
    }

    for (const permissionId of permissionsToRemove) {
      const permission = permissions.value.find((p) => p.id === permissionId)
      if (permission) {
        await userService.removePermissionFromRole(id, permission.name)
      }
    }

    await fetchRoles()
  }

  async function deleteRole(id: number) {
    await userService.deleteRole(id)
    await fetchRoles()
  }

  return {
    users,
    roles,
    permissions,
    isLoading,
    error,
    fetchUsers,
    fetchRoles,
    fetchPermissions,
    createUser,
    updateUser,
    deleteUser,
    sendPasswordReset,
    resendVerificationEmail,
    createRole,
    updateRole,
    deleteRole,
  }
})
