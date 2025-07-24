import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

export const useMeetingsStore = defineStore('meetings', () => {
  const meetings = ref<any[]>([])
  const pagination = ref<any>({})
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMeetings(page = 1) {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/meetings', { params: { page } })
      meetings.value = response.data.data
      pagination.value = response.data.meta
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch meetings.'
      meetings.value = []
    }
    finally {
      isLoading.value = false
    }
  }

  return {
    meetings,
    pagination,
    isLoading,
    error,
    fetchMeetings,
  }
})
