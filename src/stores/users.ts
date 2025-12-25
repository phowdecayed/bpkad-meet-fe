import { ref } from 'vue'
import { defineStore } from 'pinia'
import { isApiError } from '@/lib/error-handling'
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
      if (isApiError(err) && err.response) {
        error.value = err.response.data.message || 'Failed to fetch users.'
      } else if (err instanceof Error) {
        error.value = err.message
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
      if (isApiError(err) && err.response) {
        error.value = err.response.data.message || 'Failed to fetch roles.'
      } else {
        error.value = 'Failed to fetch roles.'
      }
    }
  }

  async function fetchPermissions() {
    try {
      const response = await userService.fetchPermissions()
      permissions.value = response.data.data
    } catch (err: unknown) {
      if (isApiError(err) && err.response) {
        error.value = err.response.data.message || 'Failed to fetch permissions.'
      } else {
        error.value = 'Failed to fetch permissions.'
      }
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

    // Process permission assignments in parallel
    const permissionPromises = roleData.permissions.map((permissionId) => {
      const permission = permissions.value.find((p) => p.id === permissionId)
      if (permission) {
        return userService.addPermissionToRole(newRole.id, permission.name)
      }
      return Promise.resolve()
    })
    await Promise.all(permissionPromises)

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

    const addPromises = permissionsToAdd.map((permissionId) => {
      const permission = permissions.value.find((p) => p.id === permissionId)
      if (permission) {
        return userService.addPermissionToRole(id, permission.name)
      }
      return Promise.resolve()
    })

    const removePromises = permissionsToRemove.map((permissionId) => {
      const permission = permissions.value.find((p) => p.id === permissionId)
      if (permission) {
        return userService.removePermissionFromRole(id, permission.name)
      }
      return Promise.resolve()
    })

    await Promise.all([...addPromises, ...removePromises])

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
