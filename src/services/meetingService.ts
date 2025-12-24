import api from './api'
import type { Meeting } from '@/types/meeting'
import type {
  CreateMeetingPayload,
  UpdateMeetingPayload,
  MeetingsResponse,
  ParticipantsResponse,
} from '@/stores/meetings'

export const meetingService = {
  async fetchMeetings(queryParams: Record<string, string | number>, endpoint = '/api/meetings') {
    return api.get<MeetingsResponse>(endpoint, { params: queryParams })
  },

  async fetchMeeting(id: number) {
    return api.get<{ data: Meeting }>(`/api/meetings/${id}`)
  },

  async createMeeting(payload: CreateMeetingPayload) {
    return api.post<{ data: Meeting }>('/api/meetings', payload)
  },

  async updateMeeting(id: number, payload: UpdateMeetingPayload) {
    return api.patch<{ data: Meeting }>(`/api/meetings/${id}`, payload)
  },

  async deleteMeeting(id: number) {
    return api.delete(`/api/meetings/${id}`)
  },

  async fetchParticipants(meetingId: number) {
    return api.get<ParticipantsResponse>(`/api/meetings/${meetingId}/participants`)
  },

  async addParticipant(meetingId: number, userId: number) {
    return api.post(`/api/meetings/${meetingId}/participants`, { user_id: userId })
  },

  async removeParticipant(meetingId: number, userId: number) {
    return api.delete(`/api/meetings/${meetingId}/participants/${userId}`)
  },
}
