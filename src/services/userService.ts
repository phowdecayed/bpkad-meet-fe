import api from './api'
import type { User, Role, Permission, UserCreationPayload, UserUpdatePayload } from '@/types/user'

export const userService = {
  async fetchUsers(params?: { page?: number; per_page?: number; search?: string }) {
    return api.get<{
      data: User[]
      meta: {
        current_page: number
        last_page: number
        total: number
        per_page: number
        from: number
        to: number
      }
    }>('/api/users', { params })
  },

  async fetchRoles() {
    return api.get<Role[]>('/api/roles')
  },

  async fetchPermissions() {
    return api.get<{ data: Permission[] }>('/api/permissions')
  },

  async createUser(userData: UserCreationPayload) {
    return api.post<User>('/api/register', userData)
  },

  async updateUser(id: number, userData: UserUpdatePayload) {
    return api.patch<User>(`/api/users/${id}`, userData)
  },

  async deleteUser(id: number) {
    return api.delete(`/api/users/${id}`)
  },

  async sendPasswordReset(email: string) {
    return api.post('/api/forgot-password', { email })
  },

  async resendVerificationEmail(userId: number) {
    return api.post(`/api/users/${userId}/resend-verification`)
  },

  // Role Management
  async createRole(roleData: { name: string }) {
    return api.post<Role>('/api/roles', roleData)
  },

  async updateRoleName(id: number, name: string) {
    return api.patch<Role>(`/api/roles/${id}`, { name })
  },

  async deleteRole(id: number) {
    return api.delete(`/api/roles/${id}`)
  },

  // Role Permissions
  async addPermissionToRole(roleId: number, permissionName: string) {
    return api.post(`/api/roles/${roleId}/permissions`, { permission: permissionName })
  },

  async removePermissionFromRole(roleId: number, permissionName: string) {
    return api.delete(`/api/roles/${roleId}/permissions`, {
      data: { permission: permissionName },
    })
  },
}
