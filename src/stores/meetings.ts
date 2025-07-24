import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import type { Meeting } from '@/types/meeting'

export const useMeetingsStore = defineStore('meetings', () => {
  const meetings = ref<Meeting[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMeetings(startDate?: string, endDate?: string) {
    isLoading.value = true
    error.value = null
    try {
      const params: Record<string, string> = {}
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const endpoint = (startDate && endDate) ? '/api/calendar' : '/api/meetings'
      const response = await axios.get(endpoint, { params })
      meetings.value = response.data.data
    }
    catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch meetings.'
    }
    finally {
      isLoading.value = false
    }
  }

  async function createMeeting(meetingData: Partial<Meeting>) {
    const response = await axios.post('/api/meetings', meetingData)
    await fetchMeetings() // Refresh the list
    return response.data
  }

  async function updateMeeting(id: number, meetingData: Partial<Meeting>) {
    const response = await axios.patch(`/api/meetings/${id}`, meetingData)
    await fetchMeetings() // Refresh the list
    return response.data
  }

  async function deleteMeeting(id: number) {
    await axios.delete(`/api/meetings/${id}`)
    await fetchMeetings() // Refresh the list
  }

  return {
    meetings,
    isLoading,
    error,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  }
})