import api from './api'
import type { MeetingLocation } from '@/types/meeting'

export const locationService = {
  async fetchLocations() {
    return api.get<{ data: MeetingLocation[] }>('/api/meeting-locations')
  },

  async createLocation(
    locationData: Omit<MeetingLocation, 'id' | 'created_at' | 'updated_at'>,
  ) {
    return api.post<MeetingLocation>('/api/meeting-locations', locationData)
  },

  async updateLocation(id: number, locationData: Partial<MeetingLocation>) {
    return api.patch<MeetingLocation>(`/api/meeting-locations/${id}`, locationData)
  },

  async deleteLocation(id: number) {
    return api.delete(`/api/meeting-locations/${id}`)
  },
}
