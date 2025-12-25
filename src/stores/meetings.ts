import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios, { type AxiosError } from 'axios'
import { meetingService } from '@/services/meetingService'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'

// Enhanced TypeScript interfaces for payloads and responses
export interface CreateMeetingPayload {
  topic: string
  description?: string
  start_time: string
  duration: number
  type: 'online' | 'offline' | 'hybrid'
  location_id?: number
  password?: string
  participants?: number[]
  settings?: Record<string, unknown>
}

export interface UpdateMeetingPayload {
  topic?: string
  description?: string
  start_time?: string
  duration?: number
  location_id?: number
  settings?: Record<string, unknown>
}

export interface MeetingQueryParams {
  page?: number
  per_page?: number
  start_date?: string // For calendar endpoint only
  end_date?: string // For calendar endpoint only
  start_time?: string // For meetings endpoint date filtering
  type?: string // online, offline, hybrid
  topic?: string // For topic search
  location?: string // For location filtering
}

export interface PaginationState {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface MeetingsResponse {
  data: Meeting[]
  meta: {
    current_page: number
    last_page: number
    total: number
    per_page: number
    from: number
    to: number
  }
}

export interface ParticipantsResponse {
  data: User[]
}

// Error types for better error handling
export enum ErrorType {
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NETWORK = 'network',
  SERVER = 'server',
  NOT_FOUND = 'not_found',
}

export interface ErrorState {
  type: ErrorType
  message: string
  field?: string
  retryable: boolean
  details?: Record<string, string[]>
}

export const useMeetingsStore = defineStore('meetings', () => {
  // State
  const meetings = ref<Meeting[]>([])
  const currentMeeting = ref<Meeting | null>(null)
  const participants = ref<User[]>([])
  const isLoading = ref(false)
  const isLoadingParticipants = ref(false)
  const error = ref<ErrorState | null>(null)
  const pagination = ref<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  })

  // Helper function to create error state
  function createErrorState(err: unknown): ErrorState {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<{
        message?: string
        errors?: Record<string, string[]>
      }>
      const status = axiosError.response?.status
      const data = axiosError.response?.data

      switch (status) {
        case 422:
          return {
            type: ErrorType.VALIDATION,
            message: data?.message || 'Validation failed',
            retryable: false,
            details: data?.errors,
          }
        case 403:
          return {
            type: ErrorType.PERMISSION,
            message: data?.message || 'Access denied',
            retryable: false,
          }
        case 404:
          return {
            type: ErrorType.NOT_FOUND,
            message: data?.message || 'Resource not found',
            retryable: false,
          }
        case 500:
        case 502:
        case 503:
          return {
            type: ErrorType.SERVER,
            message: data?.message || 'Server error occurred',
            retryable: true,
          }
        default:
          if (!axiosError.response) {
            return {
              type: ErrorType.NETWORK,
              message: 'Network error. Please check your connection.',
              retryable: true,
            }
          }
          return {
            type: ErrorType.SERVER,
            message: data?.message || 'An unexpected error occurred',
            retryable: true,
          }
      }
    }

    // Handle non-axios errors
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
    return {
      type: ErrorType.SERVER,
      message: errorMessage,
      retryable: false,
    }
  }

  // Helper function to update pagination state
  function updatePaginationState(meta: MeetingsResponse['meta']) {
    pagination.value = {
      currentPage: meta.current_page,
      totalPages: meta.last_page,
      totalItems: meta.total,
      itemsPerPage: meta.per_page,
      hasNextPage: meta.current_page < meta.last_page,
      hasPrevPage: meta.current_page > 1,
    }
  }

  // Enhanced fetchMeetings with pagination and query parameters
  async function fetchMeetings(params: MeetingQueryParams = {}) {
    isLoading.value = true
    error.value = null

    try {
      // Determine endpoint based on date parameters
      const useCalendarEndpoint = params.start_date && params.end_date
      const endpoint = useCalendarEndpoint ? '/api/calendar' : '/api/meetings'

      const queryParams: Record<string, string | number> = {}

      if (useCalendarEndpoint) {
        // Calendar endpoint parameters (no pagination)
        queryParams.start_date = params.start_date!
        queryParams.end_date = params.end_date!
      } else {
        // Meetings endpoint parameters (with pagination and filters)
        queryParams.page = params.page || pagination.value.currentPage
        queryParams.per_page = params.per_page || pagination.value.itemsPerPage

        if (params.start_time) queryParams.start_time = params.start_time
        if (params.type) queryParams.type = params.type
        if (params.topic) queryParams.topic = params.topic
        if (params.location) queryParams.location = params.location
      }

      const response = await meetingService.fetchMeetings(queryParams, endpoint)

      meetings.value = response.data.data

      // Only update pagination for meetings endpoint (calendar endpoint doesn't have pagination)
      if (!useCalendarEndpoint && response.data.meta) {
        updatePaginationState(response.data.meta)
      }
    } catch (err: unknown) {
      error.value = createErrorState(err)
      meetings.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Enhanced fetchMeeting for single meeting retrieval
  async function fetchMeeting(id: number): Promise<Meeting> {
    isLoading.value = true
    error.value = null

    try {
      const response = await meetingService.fetchMeeting(id)
      currentMeeting.value = response.data.data
      return response.data.data
    } catch (err: unknown) {
      error.value = createErrorState(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Enhanced createMeeting with proper payload typing
  async function createMeeting(meetingData: CreateMeetingPayload): Promise<Meeting> {
    isLoading.value = true
    error.value = null

    try {
      const response = await meetingService.createMeeting(meetingData)
      const newMeeting = response.data.data

      // Note: We don't verify if it fits current filters here.
      // The component is responsible for refreshing the list if needed.

      return newMeeting
    } catch (err: unknown) {
      error.value = createErrorState(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Enhanced updateMeeting with proper payload typing
  async function updateMeeting(id: number, meetingData: UpdateMeetingPayload): Promise<Meeting> {
    isLoading.value = true
    error.value = null

    try {
      const response = await meetingService.updateMeeting(id, meetingData)
      const updatedMeeting = response.data.data

      // Note: We no longer optimistic update the list here to ensure filter consistency.
      // The component will trigger a refresh.

      // Update current meeting if it's the same (for detail view consistency)
      if (currentMeeting.value?.id === id) {
        currentMeeting.value = updatedMeeting
      }

      return updatedMeeting
    } catch (err: unknown) {
      error.value = createErrorState(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Enhanced deleteMeeting
  async function deleteMeeting(id: number): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await meetingService.deleteMeeting(id)

      // Note: We no longer optimistic delete from the list here.

      // Clear current meeting if it's the deleted one
      if (currentMeeting.value?.id === id) {
        currentMeeting.value = null
      }

      // Update pagination if needed
      pagination.value.totalItems = Math.max(0, pagination.value.totalItems - 1)
    } catch (err: unknown) {
      error.value = createErrorState(err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Participant management methods
  async function fetchParticipants(meetingId: number): Promise<User[]> {
    isLoadingParticipants.value = true
    error.value = null

    try {
      const response = await meetingService.fetchParticipants(meetingId)
      participants.value = response.data.data
      return response.data.data
    } catch (err: unknown) {
      error.value = createErrorState(err)
      participants.value = []
      throw err
    } finally {
      isLoadingParticipants.value = false
    }
  }

  async function addParticipant(meetingId: number, userId: number): Promise<void> {
    isLoadingParticipants.value = true
    error.value = null

    try {
      await meetingService.addParticipant(meetingId, userId)

      // Refresh participants list
      await fetchParticipants(meetingId)
    } catch (err: unknown) {
      error.value = createErrorState(err)
      throw err
    } finally {
      isLoadingParticipants.value = false
    }
  }

  async function removeParticipant(meetingId: number, userId: number): Promise<void> {
    isLoadingParticipants.value = true
    error.value = null

    try {
      await meetingService.removeParticipant(meetingId, userId)

      // Remove from current participants list
      participants.value = participants.value.filter((p) => p.id !== userId)
    } catch (err: unknown) {
      error.value = createErrorState(err)
      throw err
    } finally {
      isLoadingParticipants.value = false
    }
  }

  // Utility methods
  function clearError() {
    error.value = null
  }

  function resetState() {
    meetings.value = []
    currentMeeting.value = null
    participants.value = []
    error.value = null
    pagination.value = {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false,
    }
  }

  // Pagination helpers
  async function nextPage() {
    if (pagination.value.hasNextPage) {
      await fetchMeetings({
        page: pagination.value.currentPage + 1,
        per_page: pagination.value.itemsPerPage,
      })
    }
  }

  async function prevPage() {
    if (pagination.value.hasPrevPage) {
      await fetchMeetings({
        page: pagination.value.currentPage - 1,
        per_page: pagination.value.itemsPerPage,
      })
    }
  }

  async function goToPage(page: number) {
    if (page >= 1 && page <= pagination.value.totalPages) {
      await fetchMeetings({ page, per_page: pagination.value.itemsPerPage })
    }
  }

  return {
    // State
    meetings,
    currentMeeting,
    participants,
    isLoading,
    isLoadingParticipants,
    error,
    pagination,

    // Actions
    fetchMeetings,
    fetchMeeting,
    createMeeting,
    updateMeeting,
    deleteMeeting,

    // Participant Management
    fetchParticipants,
    addParticipant,
    removeParticipant,

    // Utility
    clearError,
    resetState,

    // Pagination
    nextPage,
    prevPage,
    goToPage,
  }
})
