import api from './api'
import type { Setting, SettingCreationPayload, SettingUpdatePayload } from '@/types/settings'

export const settingsService = {
  async fetchAllSettings() {
    return api.get<Setting[]>('/api/settings')
  },

  async fetchSettingsByGroup(group: string) {
    return api.get<Setting[]>('/api/settings', { params: { group } })
  },

  async updateSetting(id: number, payload: SettingUpdatePayload) {
    return api.patch<Setting>(`/api/settings/${id}`, payload)
  },

  async createSetting(payload: SettingCreationPayload) {
    return api.post<Setting>('/api/settings', payload)
  },

  async deleteSetting(id: number) {
    return api.delete(`/api/settings/${id}`)
  },
}
