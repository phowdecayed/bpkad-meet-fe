import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { settingsService } from '@/services/settingsService'
import { type AxiosResponse } from 'axios'
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

    try {
      const response = await settingsService.fetchSettingsByGroup(group)

      settings.value = response.data
    } catch (err: unknown) {
      const errorObj = err as {
        code?: string
        response?: { status: number; data?: { message?: string } }
      }

      // Provide more specific error messages based on error type
      if (errorObj && errorObj.code === 'NETWORK_ERROR') {
        error.value = `Network error while fetching ${group} settings. Please check your connection.`
      } else if (errorObj && errorObj.response && errorObj.response.status === 401) {
        error.value = `You are not authorized to access ${group} settings. Please log in again.`
      } else if (errorObj && errorObj.response && errorObj.response.status === 403) {
        error.value = `You do not have permission to view ${group} settings.`
      } else if (errorObj && errorObj.response && errorObj.response.status >= 500) {
        error.value = `Server error while fetching ${group} settings. Please try again later.`
      } else {
        error.value = errorObj.response?.data?.message || `Failed to fetch ${group} settings.`
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

    try {
      const response = await settingsService.fetchAllSettings()

      settings.value = response.data
    } catch (err: unknown) {
      const errorObj = err as {
        code?: string
        response?: { status: number; data?: { message?: string } }
      }

      // Provide more specific error messages based on error type
      if (errorObj && errorObj.code === 'NETWORK_ERROR') {
        error.value = 'Network error. Please check your internet connection and try again.'
      } else if (errorObj && errorObj.response && errorObj.response.status === 401) {
        error.value = 'You are not authorized to access settings. Please log in again.'
      } else if (errorObj && errorObj.response && errorObj.response.status === 403) {
        error.value = 'You do not have permission to view settings. Contact your administrator.'
      } else if (errorObj && errorObj.response && errorObj.response.status === 404) {
        error.value = 'Settings endpoint not found. Please contact your administrator.'
      } else if (errorObj && errorObj.response && errorObj.response.status >= 500) {
        error.value = 'Server error. Please try again later or contact your administrator.'
      } else {
        error.value =
          errorObj.response?.data?.message || 'Failed to fetch settings. Please try again.'
      }

      settings.value = []
      throw err // Re-throw to allow components to handle it
    } finally {
      isLoading.value = false
    }
  }

  async function updateSetting(
    id: number,
    payload: SettingUpdatePayload,
  ): Promise<AxiosResponse<Setting>> {
    return settingsService.updateSetting(id, payload)
  }

  async function createSetting(payload: SettingCreationPayload): Promise<AxiosResponse<Setting>> {
    return settingsService.createSetting(payload)
  }

  async function deleteSetting(id: number): Promise<void> {
    await settingsService.deleteSetting(id)
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
