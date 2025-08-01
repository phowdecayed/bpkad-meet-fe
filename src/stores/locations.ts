import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import { isApiError } from '@/lib/error-handling'
import type { MeetingLocation } from '@/types/meeting'

export const useLocationsStore = defineStore('locations', () => {
  const locations = ref<MeetingLocation[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchLocations() {
    isLoading.value = true
    error.value = null
    try {
      const response = await axios.get('/api/meeting-locations')
      locations.value = response.data.data
    } catch (err: unknown) {
      if (isApiError(err)) {
        error.value = err.response?.data?.message || 'Failed to fetch locations.'
      } else if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unknown error occurred.'
      }
    } finally {
      isLoading.value = false
    }
  }

  async function createLocation(
    locationData: Omit<MeetingLocation, 'id' | 'created_at' | 'updated_at'>,
  ) {
    const response = await axios.post('/api/meeting-locations', locationData)
    await fetchLocations()
    return response.data
  }

  async function updateLocation(id: number, locationData: Partial<MeetingLocation>) {
    const response = await axios.patch(`/api/meeting-locations/${id}`, locationData)
    await fetchLocations()
    return response.data
  }

  async function deleteLocation(id: number) {
    await axios.delete(`/api/meeting-locations/${id}`)
    await fetchLocations()
  }

  return {
    locations,
    isLoading,
    error,
    fetchLocations,
    createLocation,
    updateLocation,
    deleteLocation,
  }
})
