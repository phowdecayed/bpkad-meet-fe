import api from './api'
import type { DashboardStatistics } from '@/types/statistics'

export const statisticsService = {
  async fetchDashboardStats() {
    return api.get<{ data: DashboardStatistics }>('/api/statistics/dashboard')
  },
}
