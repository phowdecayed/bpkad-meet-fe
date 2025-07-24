import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettingsByGroup(group: string) {
    isLoading.value = true
    error.value = null
    console.log(`[Settings Store] Fetching settings for group: ${group}`)
    try {
      const response = await axios.get('/api/settings', { params: { group } })
      console.log('[Settings Store] API Response Success:', response.data)
      settings.value = response.data
    } catch (err: any) {
      console.error('[Settings Store] API Response Error:', err)
      error.value = err.response?.data?.message || 'Failed to fetch settings.'
      settings.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function updateSetting(id: number, payload: any) {
    return axios.patch(`/api/settings/${id}`, { payload })
  }

  async function createSetting(payload: any) {
    return axios.post('/api/settings', payload)
  }

  async function deleteSetting(id: number) {
    await axios.delete(`/api/settings/${id}`)
    // Refresh the list after deleting
    const group = settings.value[0]?.group
    if (group) {
      await fetchSettingsByGroup(group)
    }
  }

  return {
    settings,
    isLoading,
    error,
    fetchSettingsByGroup,
    updateSetting,
    createSetting,
    deleteSetting,
  }
})
