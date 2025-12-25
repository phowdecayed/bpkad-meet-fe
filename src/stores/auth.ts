import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/authService'
import type { User, Role, Permission } from '@/types/user'

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

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUser(newUser: User) {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function clearAuth() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function login(credentials: { email: string; password: string }) {
    try {
      // Service handles CSRF internally if needed, but we can call it here too.
      // The service.login calls getCsrfToken().

      const response = await authService.login(credentials)
      const { access_token } = response.data
      setToken(access_token)
      await fetchUser()
    } catch (error) {
      clearAuth()
      throw error
    }
  }

  async function fetchUser() {
    if (!token.value) return

    try {
      const response = await authService.fetchUser()
      setUser(response.data.data)
    } catch {
      clearAuth()
    }
  }

  async function logout() {
    try {
      await authService.logout()
    } finally {
      clearAuth()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
  }

  async function changeName(name: string) {
    return authService.changeName(name)
  }

  async function changeEmail(email: string) {
    return authService.changeEmail(email)
  }

  async function changePassword(payload: ChangePasswordPayload) {
    return authService.changePassword(payload)
  }

  async function forgotPassword(email: string) {
    return authService.forgotPassword(email)
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    return authService.resetPassword(payload)
  }

  async function verifyEmail(
    id: string,
    hash: string,
    query: { expires: string; signature: string },
  ) {
    return authService.verifyEmail(id, hash, query)
  }

  async function resendVerificationEmail() {
    return authService.resendVerificationEmail()
  }

  async function uploadAvatar(file: File) {
    const response = await authService.updateAvatar(file)
    if (user.value && response.data.avatar_url) {
      user.value.avatar_url = response.data.avatar_url
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    await fetchUser()
    return response
  }

  async function getCsrfToken() {
    return authService.getCsrfToken()
  }

  const hasPermission = computed(() => {
    return (permission: string) => {
      if (!user.value || !user.value.roles) return false
      return user.value.roles.some((role: Role) =>
        role.permissions?.some((p: Permission) => p.name === permission),
      )
    }
  })

  return {
    token,
    user,
    isAuthenticated,
    setToken,
    clearAuth,
    login,
    logout,
    fetchUser,
    changeName,
    changeEmail,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    uploadAvatar,
    getCsrfToken,
    hasPermission,
  }
})
