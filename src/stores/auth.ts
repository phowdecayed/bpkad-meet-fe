import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
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
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
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
    delete axios.defaults.headers.common['Authorization']
  }

  async function getCsrfCookie() {
    try {
      await axios.get('/sanctum/csrf-cookie')
    } catch (error) {
      console.error('Failed to get CSRF cookie:', error)
      throw error
    }
  }

  async function login(credentials: { email: string; password: string }) {
    try {
      await getCsrfCookie()
      const response = await axios.post('/api/login', credentials)
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
      const response = await axios.get('/api/user')
      setUser(response.data.data)
    } catch (error) {
      clearAuth()
      console.error('Failed to fetch user:', error)
    }
  }

  async function logout() {
    try {
      await axios.post('/api/logout')
    } catch (error) {
      console.error('Failed to logout on server:', error)
    } finally {
      clearAuth()
    }
  }

  async function changeName(name: string) {
    return axios.post('/api/user/change-name', { name })
  }

  async function changeEmail(email: string) {
    return axios.post('/api/user/change-email', { email })
  }

  async function changePassword(payload: ChangePasswordPayload) {
    return axios.post('/api/user/change-password', payload)
  }

  async function forgotPassword(email: string) {
    return axios.post('/api/forgot-password', { email })
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    return axios.post('/api/reset-password', payload)
  }

  async function verifyEmail(
    id: string,
    hash: string,
    query: { expires: string; signature: string },
  ) {
    const queryString = new URLSearchParams(query as Record<string, string>).toString()
    return axios.get(`/api/email/verify/${id}/${hash}?${queryString}`)
  }

  async function resendVerificationEmail() {
    return axios.post('/api/email/verification-notification')
  }

  const hasPermission = computed(() => {
    return (permission: string) => {
      if (!user.value || !user.value.roles) return false
      return user.value.roles.some((role: Role) =>
        role.permissions?.some((p: Permission) => p.name === permission),
      )
    }
  })

  // Set auth header on initial load if token exists
  if (token.value) axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

  return {
    token,
    user,
    isAuthenticated,
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
    hasPermission,
  }
})
