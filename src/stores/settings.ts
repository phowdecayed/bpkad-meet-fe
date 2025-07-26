import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import type {
  Setting,
  GroupedSettings,
  SettingCreationPayload,
  SettingUpdatePayload,
} from '../types/settings'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<Setting[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettingsByGroup(group: string): Promise<void> {
    isLoading.value = true
    error.value = null
    console.log(`[Settings Store] Fetching settings for group: ${group}`)
    try {
      const response = await axios.get('/api/settings', { params: { group } })
      console.log('[Settings Store] API Response Success:', response.data)
      settings.value = response.data
    } catch (err: any) {
      console.error('[Settings Store] API Response Error:', err)

      // Provide more specific error messages based on error type
      if (err.code === 'NETWORK_ERROR' || !err.response) {
        error.value = `Network error while fetching ${group} settings. Please check your connection.`
      } else if (err.response?.status === 401) {
        error.value = `You are not authorized to access ${group} settings. Please log in again.`
      } else if (err.response?.status === 403) {
        error.value = `You do not have permission to view ${group} settings.`
      } else if (err.response?.status >= 500) {
        error.value = `Server error while fetching ${group} settings. Please try again later.`
      } else {
        error.value = err.response?.data?.message || `Failed to fetch ${group} settings.`
      }

      settings.value = []
      throw err // Re-throw to allow components to handle it
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAllSettings(): Promise<void> {
    isLoading.value = true
    error.value = null
    console.log('[Settings Store] Fetching all settings')
    try {
      const response = await axios.get('/api/settings')
      console.log('[Settings Store] API Response Success:', response.data)
      settings.value = response.data
    } catch (err: any) {
      console.error('[Settings Store] API Response Error:', err)

      // Provide more specific error messages based on error type
      if (err.code === 'NETWORK_ERROR' || !err.response) {
        error.value = 'Network error. Please check your internet connection and try again.'
      } else if (err.response?.status === 401) {
        error.value = 'You are not authorized to access settings. Please log in again.'
      } else if (err.response?.status === 403) {
        error.value = 'You do not have permission to view settings. Contact your administrator.'
      } else if (err.response?.status === 404) {
        error.value = 'Settings endpoint not found. Please contact your administrator.'
      } else if (err.response?.status >= 500) {
        error.value = 'Server error. Please try again later or contact your administrator.'
      } else {
        error.value = err.response?.data?.message || 'Failed to fetch settings. Please try again.'
      }

      settings.value = []
      throw err // Re-throw to allow components to handle it
    } finally {
      isLoading.value = false
    }
  }

  async function updateSetting(id: number, payload: SettingUpdatePayload): Promise<any> {
    return axios.patch(`/api/settings/${id}`, payload)
  }

  async function createSetting(payload: SettingCreationPayload): Promise<any> {
    return axios.post('/api/settings', payload)
  }

  async function deleteSetting(id: number): Promise<void> {
    await axios.delete(`/api/settings/${id}`)
    // Refresh the list after deleting
    const group = settings.value[0]?.group
    if (group) {
      await fetchSettingsByGroup(group)
    }
  }

  // Computed property for grouping settings by their group property
  const groupedSettings = computed<GroupedSettings>(() => {
    return settings.value.reduce((groups, setting) => {
      const group = setting.group || 'Other'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(setting)
      return groups
    }, {} as GroupedSettings)
  })

  return {
    settings,
    isLoading,
    error,
    groupedSettings,
    fetchSettingsByGroup,
    fetchAllSettings,
    updateSetting,
    createSetting,
    deleteSetting,
  }
})
