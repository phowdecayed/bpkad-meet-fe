import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { isApiError } from '@/lib/error-handling'
import type { DashboardStatistics } from '@/types/statistics'

export const useStatisticsStore = defineStore('statistics', () => {
  const dashboardStats = ref<DashboardStatistics | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboardStats() {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/statistics/dashboard')
      dashboardStats.value = response.data.data
    } catch (err: unknown) {
      if (isApiError(err)) {
        error.value = err.response?.data?.message || 'Failed to fetch dashboard statistics.'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unknown error occurred.'
      }
      if (axios.isAxiosError(err)) {
        error.value = err.response?.data?.message || 'Failed to fetch dashboard statistics.'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unexpected error occurred.'
      }
    } finally {
      isLoading.value = false
    }
  }

  return {
    dashboardStats,
    isLoading,
    error,
    fetchDashboardStats,
  }
})
