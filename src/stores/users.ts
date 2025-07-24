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

  async function resendVerificationEmail(id: number) {
    return axios.post(`/api/users/${id}/resend-verification`)
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
  }
})
