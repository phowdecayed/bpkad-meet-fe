import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  function setUser(newUser: any) {
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

  async function login(credentials: { email: any; password: any }) {
    try {
      const response = await axios.post('/api/login', credentials)
      const { access_token } = response.data
      setToken(access_token)
      await fetchUser()
    }
    catch (error) {
      clearAuth()
      throw error
    }
  }

  async function fetchUser() {
    if (!token.value)
      return

    try {
      const response = await axios.get('/api/user')
      setUser(response.data.data)
    }
    catch (error) {
      clearAuth()
      console.error('Failed to fetch user:', error)
    }
  }

  async function logout() {
    try {
      await axios.post('/api/logout')
    }
    catch (error) {
      console.error('Failed to logout on server:', error)
    }
    finally {
      clearAuth()
    }
  }

  // Set auth header on initial load if token exists
  if (token.value)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    fetchUser,
  }
})
