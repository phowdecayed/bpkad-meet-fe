import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
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
      dashboardStats.value = response.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard statistics.'
    }
    finally {
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
