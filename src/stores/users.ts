import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
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
      const response = await axios.get('/api/users')
      users.value = response.data.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch users.'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRoles() {
    try {
      const response = await axios.get('/api/roles')
      roles.value = response.data
    } catch (err: any) {
      console.error('Failed to fetch roles:', err)
    }
  }

  async function fetchPermissions() {
    try {
      const response = await axios.get('/api/permissions')
      permissions.value = response.data.data
    } catch (err: any) {
      console.error('Failed to fetch permissions:', err)
    }
  }

  async function createUser(userData: UserCreationPayload) {
    const response = await axios.post('/api/register', userData)
    await fetchUsers()
    return response.data
  }

  async function updateUser(id: number, userData: UserUpdatePayload) {
    const response = await axios.patch(`/api/users/${id}`, userData)
    await fetchUsers()
    return response.data
  }

  async function deleteUser(id: number) {
    await axios.delete(`/api/users/${id}`)
    await fetchUsers()
  }

  async function sendPasswordReset(email: string) {
    return axios.post('/api/forgot-password', { email })
  }

  async function resendVerificationEmail(userId: number) {
    return axios.post(`/api/users/${userId}/resend-verification`)
  }

  async function createRole(roleData: { name: string; permissions: number[] }) {
    const response = await axios.post('/api/roles', { name: roleData.name })
    const newRole = response.data
    for (const permissionId of roleData.permissions) {
      const permission = permissions.value.find(p => p.id === permissionId)
      if (permission) {
        await axios.post(`/api/roles/${newRole.id}/permissions`, { permission: permission.name })
      }
    }
    await fetchRoles()
    return newRole
  }

  async function updateRole(id: number, roleData: { name: string; permissions: number[] }) {
    await axios.patch(`/api/roles/${id}`, { name: roleData.name })
    const currentRole = roles.value.find(r => r.id === id)
    const currentPermissionIds = currentRole?.permissions?.map(p => p.id) || []
    const permissionsToAdd = roleData.permissions.filter(id => !currentPermissionIds.includes(id))
    const permissionsToRemove = currentPermissionIds.filter(id => !roleData.permissions.includes(id))
    for (const permissionId of permissionsToAdd) {
      const permission = permissions.value.find(p => p.id === permissionId)
      if (permission) {
        await axios.post(`/api/roles/${id}/permissions`, { permission: permission.name })
      }
    }
    for (const permissionId of permissionsToRemove) {
      const permission = permissions.value.find(p => p.id === permissionId)
      if (permission) {
        await axios.delete(`/api/roles/${id}/permissions`, { data: { permission: permission.name } })
      }
    }
    await fetchRoles()
  }

  async function deleteRole(id: number) {
    await axios.delete(`/api/roles/${id}`)
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