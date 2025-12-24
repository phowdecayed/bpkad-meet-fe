import axios from 'axios'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore()
      // Directly call internal logout logic if needed, but here we just redirect
      // to avoid circular dependency loop if logout calls API.
      // But authStore.logout calls API.
      // We should just clear state and redirect.
      authStore.clearAuth()
      router.push({ name: 'login' })
    }
    return Promise.reject(error)
  },
)

export default api
