import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import {
  useMeetingsStore,
  ErrorType,
  type CreateMeetingPayload,
  type UpdateMeetingPayload,
} from '../meetings'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

// Mock data
const mockUser: User = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  email_verified_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockMeeting: Meeting = {
  id: 1,
  organizer: mockUser,
  topic: 'Test Meeting',
  description: 'Test Description',
  start_time: '2024-01-01T10:00:00Z',
  duration: 60,
  type: 'online',
  host_key: 'test-key',
  location: null,
  zoom_meeting: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockMeetingsResponse = {
  data: {
    data: [mockMeeting],
    meta: {
      current_page: 1,
      last_page: 1,
      total: 1,
      per_page: 10,
      from: 1,
      to: 1,
    },
  },
}

const mockParticipantsResponse = {
  data: {
    data: [mockUser],
  },
}

describe('useMeetingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchMeetings', () => {
    it('should fetch meetings successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockMeetingsResponse)

      const store = useMeetingsStore()
      await store.fetchMeetings()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings', {
        params: { page: 1, per_page: 10 },
      })
      expect(store.meetings).toEqual([mockMeeting])
      expect(store.pagination.totalItems).toBe(1)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle query parameters correctly', async () => {
      mockedAxios.get.mockResolvedValue(mockMeetingsResponse)

      const store = useMeetingsStore()
      await store.fetchMeetings({
        page: 2,
        per_page: 20,
        start_date: '2024-01-01',
        end_date: '2024-01-31',
        type: 'online',
        search: 'test',
      })

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/calendar', {
        params: {
          page: 2,
          per_page: 20,
          start_date: '2024-01-01',
          end_date: '2024-01-31',
          type: 'online',
          search: 'test',
        },
      })
    })

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error')
      mockedAxios.get.mockRejectedValue(networkError)
      mockedAxios.isAxiosError.mockReturnValue(false)

      const store = useMeetingsStore()
      await store.fetchMeetings()

      expect(store.error).toEqual({
        type: ErrorType.SERVER,
        message: 'Network Error',
        retryable: false,
      })
      expect(store.meetings).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('should handle validation errors (422)', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              topic: ['Topic is required'],
            },
          },
        },
      }
      mockedAxios.get.mockRejectedValue(validationError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const store = useMeetingsStore()
      await store.fetchMeetings()

      expect(store.error).toEqual({
        type: ErrorType.VALIDATION,
        message: 'Validation failed',
        retryable: false,
        details: { topic: ['Topic is required'] },
      })
    })

    it('should handle permission errors (403)', async () => {
      const permissionError = {
        response: {
          status: 403,
          data: { message: 'Access denied' },
        },
      }
      mockedAxios.get.mockRejectedValue(permissionError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const store = useMeetingsStore()
      await store.fetchMeetings()

      expect(store.error).toEqual({
        type: ErrorType.PERMISSION,
        message: 'Access denied',
        retryable: false,
      })
    })

    it('should handle server errors (500)', async () => {
      const serverError = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
      }
      mockedAxios.get.mockRejectedValue(serverError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const store = useMeetingsStore()
      await store.fetchMeetings()

      expect(store.error).toEqual({
        type: ErrorType.SERVER,
        message: 'Internal server error',
        retryable: true,
      })
    })
  })

  describe('fetchMeeting', () => {
    it('should fetch single meeting successfully', async () => {
      mockedAxios.get.mockResolvedValue({ data: { data: mockMeeting } })

      const store = useMeetingsStore()
      const result = await store.fetchMeeting(1)

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings/1')
      expect(result).toEqual(mockMeeting)
      expect(store.currentMeeting).toEqual(mockMeeting)
    })

    it('should handle not found errors (404)', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Meeting not found' },
        },
      }
      mockedAxios.get.mockRejectedValue(notFoundError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const store = useMeetingsStore()

      await expect(store.fetchMeeting(999)).rejects.toThrow()
      expect(store.error).toEqual({
        type: ErrorType.NOT_FOUND,
        message: 'Meeting not found',
        retryable: false,
      })
    })
  })

  describe('createMeeting', () => {
    it('should create meeting successfully', async () => {
      const createPayload: CreateMeetingPayload = {
        topic: 'New Meeting',
        description: 'New Description',
        start_time: '2024-01-01T10:00:00Z',
        duration: 60,
        type: 'online',
      }

      mockedAxios.post.mockResolvedValue({ data: { data: mockMeeting } })

      const store = useMeetingsStore()
      const result = await store.createMeeting(createPayload)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/meetings', createPayload)
      expect(result).toEqual(mockMeeting)
      expect(store.meetings[0]).toEqual(mockMeeting)
    })

    it('should handle creation errors', async () => {
      const createPayload: CreateMeetingPayload = {
        topic: '',
        start_time: '2024-01-01T10:00:00Z',
        duration: 60,
        type: 'online',
      }

      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: { topic: ['Topic is required'] },
          },
        },
      }
      mockedAxios.post.mockRejectedValue(validationError)
      mockedAxios.isAxiosError.mockReturnValue(true)

      const store = useMeetingsStore()

      await expect(store.createMeeting(createPayload)).rejects.toThrow()
      expect(store.error?.type).toBe(ErrorType.VALIDATION)
    })
  })

  describe('updateMeeting', () => {
    it('should update meeting successfully', async () => {
      const updatePayload: UpdateMeetingPayload = {
        topic: 'Updated Meeting',
      }

      const updatedMeeting = { ...mockMeeting, topic: 'Updated Meeting' }
      mockedAxios.patch.mockResolvedValue({ data: { data: updatedMeeting } })

      const store = useMeetingsStore()
      store.meetings = [mockMeeting]

      const result = await store.updateMeeting(1, updatePayload)

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/meetings/1', updatePayload)
      expect(result).toEqual(updatedMeeting)
      expect(store.meetings[0]).toEqual(updatedMeeting)
    })

    it('should update currentMeeting if it matches', async () => {
      const updatePayload: UpdateMeetingPayload = {
        topic: 'Updated Meeting',
      }

      const updatedMeeting = { ...mockMeeting, topic: 'Updated Meeting' }
      mockedAxios.patch.mockResolvedValue({ data: { data: updatedMeeting } })

      const store = useMeetingsStore()
      store.currentMeeting = mockMeeting

      await store.updateMeeting(1, updatePayload)

      expect(store.currentMeeting).toEqual(updatedMeeting)
    })
  })

  describe('deleteMeeting', () => {
    it('should delete meeting successfully', async () => {
      mockedAxios.delete.mockResolvedValue({})

      const store = useMeetingsStore()
      store.meetings = [mockMeeting]
      store.pagination.totalItems = 1

      await store.deleteMeeting(1)

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/meetings/1')
      expect(store.meetings).toEqual([])
      expect(store.pagination.totalItems).toBe(0)
    })

    it('should clear currentMeeting if it matches deleted meeting', async () => {
      mockedAxios.delete.mockResolvedValue({})

      const store = useMeetingsStore()
      store.currentMeeting = mockMeeting

      await store.deleteMeeting(1)

      expect(store.currentMeeting).toBeNull()
    })
  })

  describe('participant management', () => {
    it('should fetch participants successfully', async () => {
      mockedAxios.get.mockResolvedValue(mockParticipantsResponse)

      const store = useMeetingsStore()
      const result = await store.fetchParticipants(1)

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings/1/participants')
      expect(result).toEqual([mockUser])
      expect(store.participants).toEqual([mockUser])
    })

    it('should add participant successfully', async () => {
      mockedAxios.post.mockResolvedValue({})
      mockedAxios.get.mockResolvedValue(mockParticipantsResponse)

      const store = useMeetingsStore()
      await store.addParticipant(1, 2)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/meetings/1/participants', { user_id: 2 })
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings/1/participants')
    })

    it('should remove participant successfully', async () => {
      mockedAxios.delete.mockResolvedValue({})

      const store = useMeetingsStore()
      store.participants = [mockUser]

      await store.removeParticipant(1, 1)

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/meetings/1/participants/1')
      expect(store.participants).toEqual([])
    })
  })

  describe('pagination', () => {
    it('should handle nextPage correctly', async () => {
      mockedAxios.get.mockResolvedValue(mockMeetingsResponse)

      const store = useMeetingsStore()
      store.pagination.hasNextPage = true
      store.pagination.currentPage = 1

      await store.nextPage()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings', {
        params: { page: 2, per_page: 10 },
      })
    })

    it('should handle prevPage correctly', async () => {
      mockedAxios.get.mockResolvedValue(mockMeetingsResponse)

      const store = useMeetingsStore()
      store.pagination.hasPrevPage = true
      store.pagination.currentPage = 2

      await store.prevPage()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings', {
        params: { page: 1, per_page: 10 },
      })
    })

    it('should handle goToPage correctly', async () => {
      mockedAxios.get.mockResolvedValue(mockMeetingsResponse)

      const store = useMeetingsStore()
      store.pagination.totalPages = 5

      await store.goToPage(3)

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/meetings', {
        params: { page: 3, per_page: 10 },
      })
    })

    it('should not navigate to invalid pages', async () => {
      const store = useMeetingsStore()
      store.pagination.totalPages = 5

      await store.goToPage(0)
      await store.goToPage(6)

      expect(mockedAxios.get).not.toHaveBeenCalled()
    })
  })

  describe('utility methods', () => {
    it('should clear error', () => {
      const store = useMeetingsStore()
      store.error = {
        type: ErrorType.SERVER,
        message: 'Test error',
        retryable: false,
      }

      store.clearError()

      expect(store.error).toBeNull()
    })

    it('should reset state', () => {
      const store = useMeetingsStore()
      store.meetings = [mockMeeting]
      store.currentMeeting = mockMeeting
      store.participants = [mockUser]
      store.error = {
        type: ErrorType.SERVER,
        message: 'Test error',
        retryable: false,
      }
      store.pagination.totalItems = 10

      store.resetState()

      expect(store.meetings).toEqual([])
      expect(store.currentMeeting).toBeNull()
      expect(store.participants).toEqual([])
      expect(store.error).toBeNull()
      expect(store.pagination.totalItems).toBe(0)
    })
  })
})
