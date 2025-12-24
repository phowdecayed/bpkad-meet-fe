import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useMeetingFilters } from '../useMeetingFilters'
import { setActivePinia, createPinia } from 'pinia'
import type { Meeting } from '@/types/meeting'

describe('useMeetingFilters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // Mock meetings data
  const mockMeetings = ref<Meeting[]>([
    {
      id: 1,
      topic: 'Team Sync',
      type: 'online',
      description: 'Weekly sync',
      start_time: '2025-01-01T10:00:00',
      end_time: '2025-01-01T11:00:00',
      duration: 60,
      zoom_meeting: {
        id: '1',
        meeting_id: 1,
        join_url: 'http://zoom.us/j/123',
        start_url: 'http://zoom.us/s/123',
        password: '123',
      },
      organizer: { id: 1, name: 'John Doe', email: 'john@example.com' },
    } as unknown as Meeting,
    {
      id: 2,
      topic: 'Client Meeting',
      type: 'offline',
      description: 'Project discussion',
      start_time: '2025-01-02T14:00:00',
      end_time: '2025-01-02T15:00:00',
      duration: 60,
      location: { id: 1, name: 'Room A' },
      organizer: { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    } as unknown as Meeting,
  ])

  it('initializes with default values', () => {
    const fetchFn = vi.fn()
    const filters = useMeetingFilters(mockMeetings, fetchFn)

    expect(filters.searchQuery.value).toBe('')
    expect(filters.selectedType.value).toBeUndefined()
    expect(filters.selectedLocation.value).toBe('all')
    expect(filters.startDate.value).toBe('')
    expect(filters.endDate.value).toBe('')
    expect(filters.perPage.value).toBe('10')
    expect(filters.hasActiveFilters.value).toBe(false)
  })

  it('builds correct query parameters when sorting', () => {
    const fetchFn = vi.fn()
    const { buildQueryParams, searchQuery, selectedType } = useMeetingFilters(mockMeetings, fetchFn)

    searchQuery.value = 'sync'
    selectedType.value = 'online'

    const params = buildQueryParams()

    expect(params).toEqual(expect.objectContaining({
      topic: 'sync',
      type: 'online',
    }))
  })

  it('counts active filters correctly', () => {
    const fetchFn = vi.fn()
    const { getActiveFilterCount, searchQuery, selectedType, selectedLocation, startDate } = useMeetingFilters(mockMeetings, fetchFn)

    expect(getActiveFilterCount()).toBe(0)

    searchQuery.value = 'test'
    expect(getActiveFilterCount()).toBe(1)

    selectedType.value = 'online'
    expect(getActiveFilterCount()).toBe(2)

    selectedLocation.value = 'Room A'
    expect(getActiveFilterCount()).toBe(3)

    startDate.value = '2025-01-01'
    expect(getActiveFilterCount()).toBe(4)
  })

  it('clears all filters', () => {
    const fetchFn = vi.fn()
    const { clearFilters, searchQuery, selectedType, hasActiveFilters } = useMeetingFilters(mockMeetings, fetchFn)

    searchQuery.value = 'Search'
    selectedType.value = 'online'

    expect(hasActiveFilters.value).toBe(true)

    clearFilters()

    expect(searchQuery.value).toBe('')
    expect(selectedType.value).toBeUndefined()
    expect(hasActiveFilters.value).toBe(false)
    expect(fetchFn).toHaveBeenCalled()
  })
})
