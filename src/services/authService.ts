import api from './api'
import type { User } from '@/types/user'

interface ChangePasswordPayload {
  current_password?: string
  password?: string
  password_confirmation?: string
}

interface ResetPasswordPayload {
  token: string
  email: string
  password?: string
  password_confirmation?: string
}

export const authService = {
  async login(credentials: { email: string; password: string }) {
    await this.getCsrfToken()
    return api.post<{ access_token: string }>('/api/login', credentials)
  },

  async logout() {
    return api.post('/api/logout')
  },

  async fetchUser() {
    return api.get<{ data: User }>('/api/user')
  },

  async changeName(name: string) {
    await this.getCsrfToken()
    return api.post('/api/user/change-name', { name })
  },

  async changeEmail(email: string) {
    await this.getCsrfToken()
    return api.post('/api/user/change-email', { email })
  },

  async changePassword(payload: ChangePasswordPayload) {
    await this.getCsrfToken()
    return api.post('/api/user/change-password', payload)
  },

  async forgotPassword(email: string) {
    await this.getCsrfToken()
    return api.post('/api/forgot-password', { email })
  },

  async resetPassword(payload: ResetPasswordPayload) {
    await this.getCsrfToken()
    return api.post('/api/reset-password', payload)
  },

  async verifyEmail(id: string, hash: string, query: { expires: string; signature: string }) {
    const queryString = new URLSearchParams(query as Record<string, string>).toString()
    return api.get(`/api/email/verify/${id}/${hash}?${queryString}`)
  },

  async resendVerificationEmail() {
    await this.getCsrfToken()
    return api.post('/api/email/verification-notification')
  },

  async updateAvatar(file: File) {
    await this.getCsrfToken()
    const formData = new FormData()
    formData.append('avatar', file)

    return api.post<{ message: string; avatar_url: string }>('/api/user/change-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  async getCsrfToken() {
    return api.get('/sanctum/csrf-cookie')
  },
}
