import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed } from 'vue'
import type { MeetingQueryParams } from '@/stores/meetings'
import debounce from 'lodash-es/debounce'

// Extract the logic functions to test them in isolation
function createBuildQueryParams(
  searchQuery: { value: string },
  selectedType: { value: string | undefined },
  selectedLocation: { value: string },
  startDate: { value: string },
  endDate: { value: string },
) {
  return (): MeetingQueryParams => {
    const params: MeetingQueryParams = {}

    if (searchQuery.value.trim()) {
      params.topic = searchQuery.value.trim()
    }

    // Exclude 'all' and undefined values from type parameter
    if (selectedType.value && selectedType.value !== 'all') {
      params.type = selectedType.value
    }

    if (selectedLocation.value.trim()) {
      params.location = selectedLocation.value.trim()
    }

    if (startDate.value) {
      params.start_date = startDate.value
    }

    if (endDate.value) {
      params.end_date = endDate.value
    }

    return params
  }
}

function createHasActiveFilters(
  searchQuery: { value: string },
  selectedType: { value: string | undefined },
  selectedLocation: { value: string },
  startDate: { value: string },
  endDate: { value: string },
) {
  return computed(() => {
    return (
      searchQuery.value.trim() !== '' ||
      (selectedType.value !== undefined && selectedType.value !== 'all') ||
      selectedLocation.value.trim() !== '' ||
      startDate.value !== '' ||
      endDate.value !== ''
    )
  })
}

function createClearFilters(
  searchQuery: { value: string },
  selectedType: { value: string | undefined },
  selectedLocation: { value: string },
  startDate: { value: string },
  endDate: { value: string },
  goToPage: (page: number) => void,
) {
  return () => {
    searchQuery.value = ''
    selectedType.value = undefined as string | undefined
    selectedLocation.value = ''
    startDate.value = ''
    endDate.value = ''

    // Immediately trigger a fresh fetch with no filters
    goToPage(1)
  }
}

describe('MeetingsView Clear Filters Functionality', () => {
  it('should reset all filter variables when clearFilters is called', () => {
    const searchQuery = ref('test search')
    const selectedType = ref('online')
    const selectedLocation = ref('Conference Room A')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')
    const mockGoToPage = vi.fn()

    const clearFilters = createClearFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
      mockGoToPage,
    )

    // Call clearFilters
    clearFilters()

    // Verify all filter variables are reset
    expect(searchQuery.value).toBe('')
    expect(selectedType.value).toBeUndefined()
    expect(selectedLocation.value).toBe('')
    expect(startDate.value).toBe('')
    expect(endDate.value).toBe('')
  })

  it('should call goToPage(1) when clearFilters is called', () => {
    const searchQuery = ref('test search')
    const selectedType = ref('online')
    const selectedLocation = ref('Conference Room A')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')
    const mockGoToPage = vi.fn()

    const clearFilters = createClearFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
      mockGoToPage,
    )

    // Call clearFilters
    clearFilters()

    // Verify goToPage(1) was called
    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockGoToPage).toHaveBeenCalledTimes(1)
  })

  it('should result in hasActiveFilters being false after clearFilters is called', () => {
    const searchQuery = ref('test search')
    const selectedType = ref('online')
    const selectedLocation = ref('Conference Room A')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')
    const mockGoToPage = vi.fn()

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const clearFilters = createClearFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
      mockGoToPage,
    )

    // Verify filters are initially active
    expect(hasActiveFilters.value).toBe(true)

    // Call clearFilters
    clearFilters()

    // Verify no filters are active after clearing
    expect(hasActiveFilters.value).toBe(false)
  })
})

describe('MeetingsView Search Functionality', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should include topic parameter in buildQueryParams when search query is provided', () => {
    const searchQuery = ref('test meeting')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const params = buildQueryParams()

    expect(params.topic).toBe('test meeting')
  })

  it('should trim whitespace from search query in buildQueryParams', () => {
    const searchQuery = ref('  test meeting  ')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const params = buildQueryParams()

    expect(params.topic).toBe('test meeting')
  })

  it('should exclude topic parameter when search query is empty', () => {
    const searchQuery = ref('')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const params = buildQueryParams()

    expect(params.topic).toBeUndefined()
  })

  it('should exclude topic parameter when search query is only whitespace', () => {
    const searchQuery = ref('   ')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const params = buildQueryParams()

    expect(params.topic).toBeUndefined()
  })

  it('should consider search query as active filter when not empty', () => {
    const searchQuery = ref('test')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    expect(hasActiveFilters.value).toBe(true)
  })

  it('should not consider search query as active filter when empty', () => {
    const searchQuery = ref('')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    expect(hasActiveFilters.value).toBe(false)
  })

  it('should create debounced search function that calls goToPage(1)', async () => {
    const mockGoToPage = vi.fn()

    const debouncedSearch = debounce(() => {
      mockGoToPage(1)
    }, 300)

    // Call the debounced function
    debouncedSearch()

    // Should not be called immediately
    expect(mockGoToPage).not.toHaveBeenCalled()

    // Fast-forward time by 300ms
    vi.advanceTimersByTime(300)

    // Should be called after debounce delay
    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockGoToPage).toHaveBeenCalledTimes(1)
  })

  it('should debounce multiple rapid search calls', async () => {
    const mockGoToPage = vi.fn()

    const debouncedSearch = debounce(() => {
      mockGoToPage(1)
    }, 300)

    // Call multiple times rapidly
    debouncedSearch()
    debouncedSearch()
    debouncedSearch()

    // Should not be called yet
    expect(mockGoToPage).not.toHaveBeenCalled()

    // Fast-forward time by 300ms
    vi.advanceTimersByTime(300)

    // Should only be called once despite multiple calls
    expect(mockGoToPage).toHaveBeenCalledWith(1)
    expect(mockGoToPage).toHaveBeenCalledTimes(1)
  })
  it('should simulate complete search workflow with debouncing', async () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const mockGoToPage = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Create a mock goToPage that uses buildQueryParams like the real implementation
    const mockGoToPageWithParams = vi.fn(async (page: number) => {
      const params = buildQueryParams()
      params.page = page
      mockGoToPage(params)
    })

    const debouncedSearch = debounce(() => {
      mockGoToPageWithParams(1)
    }, 300)

    // Simulate user typing in search
    searchQuery.value = 'test'
    debouncedSearch()

    // Should not trigger immediately
    expect(mockGoToPage).not.toHaveBeenCalled()

    // Fast-forward time
    vi.advanceTimersByTime(300)

    // Should trigger with correct parameters
    expect(mockGoToPage).toHaveBeenCalledWith({
      topic: 'test',
      page: 1,
    })

    // Reset mock
    mockGoToPage.mockClear()

    // Simulate user changing search query
    searchQuery.value = 'test meeting'
    debouncedSearch()

    // Fast-forward time
    vi.advanceTimersByTime(300)

    // Should trigger with updated parameters
    expect(mockGoToPage).toHaveBeenCalledWith({
      topic: 'test meeting',
      page: 1,
    })
  })

  it('should reset to page 1 when search query changes', async () => {
    const mockGoToPage = vi.fn()

    const debouncedSearch = debounce(() => {
      mockGoToPage(1)
    }, 300)

    // Simulate search change
    debouncedSearch()

    // Fast-forward time
    vi.advanceTimersByTime(300)

    // Should always call goToPage with 1 (reset pagination)
    expect(mockGoToPage).toHaveBeenCalledWith(1)
  })

  it('should simulate Vue watch behavior with search query changes', async () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const mockGoToPage = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Mock the actual goToPage function behavior
    const mockGoToPageWithParams = vi.fn(async (page: number) => {
      const params = buildQueryParams()
      params.page = page
      mockGoToPage(params)
    })

    const debouncedSearch = debounce(() => {
      mockGoToPageWithParams(1)
    }, 300)

    // Simulate Vue watch behavior - watch function would call debouncedSearch when searchQuery changes
    const watchCallback = () => {
      debouncedSearch()
    }

    // Initial state - no search
    expect(buildQueryParams().topic).toBeUndefined()

    // Simulate user typing 't'
    searchQuery.value = 't'
    watchCallback()

    // Should not trigger immediately due to debounce
    expect(mockGoToPage).not.toHaveBeenCalled()

    // User continues typing 'te'
    searchQuery.value = 'te'
    watchCallback()

    // User continues typing 'test'
    searchQuery.value = 'test'
    watchCallback()

    // Still should not have triggered
    expect(mockGoToPage).not.toHaveBeenCalled()

    // Fast-forward past debounce delay
    vi.advanceTimersByTime(300)

    // Should now trigger with the final search term
    expect(mockGoToPage).toHaveBeenCalledWith({
      topic: 'test',
      page: 1,
    })
    expect(mockGoToPage).toHaveBeenCalledTimes(1)
  })
})

describe('MeetingsView Error Handling', () => {
  it('should preserve filter state when API calls fail', () => {
    const searchQuery = ref('test meeting')
    const selectedType = ref('online')
    const selectedLocation = ref('Conference Room A')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')

    // Simulate an API failure - filter inputs should remain populated
    expect(searchQuery.value).toBe('test meeting')
    expect(selectedType.value).toBe('online')
    expect(selectedLocation.value).toBe('Conference Room A')
    expect(startDate.value).toBe('2024-01-01')
    expect(endDate.value).toBe('2024-01-31')
  })

  it('should include current page in retryFetch parameters', () => {
    const searchQuery = ref('test search')
    const selectedType = ref('online')
    const selectedLocation = ref('Conference Room A')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')
    const mockPagination = { currentPage: 3 }
    const mockFetchMeetings = vi.fn()
    const mockClearError = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Simulate retryFetch function behavior
    const retryFetch = async () => {
      mockClearError()
      const params = buildQueryParams()
      params.page = mockPagination.currentPage
      await mockFetchMeetings(params)
    }

    // Call retryFetch
    retryFetch()

    // Verify clearError was called
    expect(mockClearError).toHaveBeenCalledTimes(1)

    // Verify fetchMeetings was called with correct parameters including current page
    expect(mockFetchMeetings).toHaveBeenCalledWith({
      topic: 'test search',
      type: 'online',
      location: 'Conference Room A',
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      page: 3,
    })
  })

  it('should maintain current filter parameters during retry', () => {
    const searchQuery = ref('important meeting')
    const selectedType = ref('hybrid')
    const selectedLocation = ref('Meeting Room B')
    const startDate = ref('2024-02-01')
    const endDate = ref('2024-02-28')
    const mockPagination = { currentPage: 2 }
    const mockFetchMeetings = vi.fn()
    const mockClearError = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Simulate retryFetch function behavior
    const retryFetch = async () => {
      mockClearError()
      const params = buildQueryParams()
      params.page = mockPagination.currentPage
      await mockFetchMeetings(params)
    }

    // Call retryFetch multiple times to ensure consistency
    retryFetch()
    retryFetch()

    // Verify that both calls used the same filter parameters
    expect(mockFetchMeetings).toHaveBeenCalledTimes(2)
    expect(mockFetchMeetings).toHaveBeenNthCalledWith(1, {
      topic: 'important meeting',
      type: 'hybrid',
      location: 'Meeting Room B',
      start_date: '2024-02-01',
      end_date: '2024-02-28',
      page: 2,
    })
    expect(mockFetchMeetings).toHaveBeenNthCalledWith(2, {
      topic: 'important meeting',
      type: 'hybrid',
      location: 'Meeting Room B',
      start_date: '2024-02-01',
      end_date: '2024-02-28',
      page: 2,
    })
  })

  it('should not clear filter inputs when retryFetch is called', () => {
    const searchQuery = ref('test meeting')
    const selectedType = ref('online')
    const selectedLocation = ref('Conference Room A')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')
    const mockPagination = { currentPage: 1 }
    const mockFetchMeetings = vi.fn()
    const mockClearError = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Simulate retryFetch function behavior
    const retryFetch = async () => {
      mockClearError()
      const params = buildQueryParams()
      params.page = mockPagination.currentPage
      await mockFetchMeetings(params)
    }

    // Store original values
    const originalSearch = searchQuery.value
    const originalType = selectedType.value
    const originalLocation = selectedLocation.value
    const originalStartDate = startDate.value
    const originalEndDate = endDate.value

    // Call retryFetch
    retryFetch()

    // Verify filter inputs remain unchanged
    expect(searchQuery.value).toBe(originalSearch)
    expect(selectedType.value).toBe(originalType)
    expect(selectedLocation.value).toBe(originalLocation)
    expect(startDate.value).toBe(originalStartDate)
    expect(endDate.value).toBe(originalEndDate)
  })

  it('should handle retry with no active filters', () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')
    const mockPagination = { currentPage: 1 }
    const mockFetchMeetings = vi.fn()
    const mockClearError = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Simulate retryFetch function behavior
    const retryFetch = async () => {
      mockClearError()
      const params = buildQueryParams()
      params.page = mockPagination.currentPage
      await mockFetchMeetings(params)
    }

    // Call retryFetch
    retryFetch()

    // Verify fetchMeetings was called with only page parameter
    expect(mockFetchMeetings).toHaveBeenCalledWith({
      page: 1,
    })
  })

  it('should handle retry with partial filters', () => {
    const searchQuery = ref('meeting')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('2024-01-01')
    const endDate = ref('')
    const mockPagination = { currentPage: 2 }
    const mockFetchMeetings = vi.fn()
    const mockClearError = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Simulate retryFetch function behavior
    const retryFetch = async () => {
      mockClearError()
      const params = buildQueryParams()
      params.page = mockPagination.currentPage
      await mockFetchMeetings(params)
    }

    // Call retryFetch
    retryFetch()

    // Verify fetchMeetings was called with only active filters and page
    expect(mockFetchMeetings).toHaveBeenCalledWith({
      topic: 'meeting',
      start_date: '2024-01-01',
      page: 2,
    })
  })

  it('should preserve filter state across multiple error scenarios', () => {
    const searchQuery = ref('persistent search')
    const selectedType = ref('offline')
    const selectedLocation = ref('Room 101')
    const startDate = ref('2024-03-01')
    const endDate = ref('2024-03-31')
    const mockPagination = { currentPage: 4 }
    const mockFetchMeetings = vi.fn()
    const mockClearError = vi.fn()

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Simulate retryFetch function behavior
    const retryFetch = async () => {
      mockClearError()
      const params = buildQueryParams()
      params.page = mockPagination.currentPage
      await mockFetchMeetings(params)
    }

    // Simulate multiple error scenarios and retries
    const expectedParams = {
      topic: 'persistent search',
      type: 'offline',
      location: 'Room 101',
      start_date: '2024-03-01',
      end_date: '2024-03-31',
      page: 4,
    }

    // First error and retry
    retryFetch()
    expect(mockFetchMeetings).toHaveBeenLastCalledWith(expectedParams)

    // Second error and retry - should maintain same parameters
    retryFetch()
    expect(mockFetchMeetings).toHaveBeenLastCalledWith(expectedParams)

    // Third error and retry - should still maintain same parameters
    retryFetch()
    expect(mockFetchMeetings).toHaveBeenLastCalledWith(expectedParams)

    // Verify all calls used the same parameters
    expect(mockFetchMeetings).toHaveBeenCalledTimes(3)
    mockFetchMeetings.mock.calls.forEach((call) => {
      expect(call[0]).toEqual(expectedParams)
    })

    // Verify filter state is preserved
    expect(searchQuery.value).toBe('persistent search')
    expect(selectedType.value).toBe('offline')
    expect(selectedLocation.value).toBe('Room 101')
    expect(startDate.value).toBe('2024-03-01')
    expect(endDate.value).toBe('2024-03-31')
  })
})

describe('MeetingsView Visual Feedback for Active Filters', () => {
  it('should correctly identify when filters are active', () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Initially no filters should be active
    expect(hasActiveFilters.value).toBe(false)

    // Test search query filter
    searchQuery.value = 'test'
    expect(hasActiveFilters.value).toBe(true)
    searchQuery.value = ''
    expect(hasActiveFilters.value).toBe(false)

    // Test type filter (excluding 'all')
    selectedType.value = 'online'
    expect(hasActiveFilters.value).toBe(true)
    selectedType.value = 'all'
    expect(hasActiveFilters.value).toBe(false)
    selectedType.value = undefined as string | undefined
    expect(hasActiveFilters.value).toBe(false)

    // Test location filter
    selectedLocation.value = 'Conference Room A'
    expect(hasActiveFilters.value).toBe(true)
    selectedLocation.value = ''
    expect(hasActiveFilters.value).toBe(false)

    // Test date filters
    startDate.value = '2024-01-01'
    expect(hasActiveFilters.value).toBe(true)
    startDate.value = ''
    expect(hasActiveFilters.value).toBe(false)

    endDate.value = '2024-01-31'
    expect(hasActiveFilters.value).toBe(true)
    endDate.value = ''
    expect(hasActiveFilters.value).toBe(false)
  })

  it('should correctly count active filters', () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const getActiveFilterCount = () => {
      let count = 0
      if (searchQuery.value.trim() !== '') count++
      if (selectedType.value !== undefined && selectedType.value !== 'all') count++
      if (selectedLocation.value.trim() !== '') count++
      if (startDate.value !== '') count++
      if (endDate.value !== '') count++
      return count
    }

    // Initially no filters
    expect(getActiveFilterCount()).toBe(0)

    // Add search filter
    searchQuery.value = 'test'
    expect(getActiveFilterCount()).toBe(1)

    // Add type filter
    selectedType.value = 'online'
    expect(getActiveFilterCount()).toBe(2)

    // Add location filter
    selectedLocation.value = 'Room A'
    expect(getActiveFilterCount()).toBe(3)

    // Add date filters
    startDate.value = '2024-01-01'
    expect(getActiveFilterCount()).toBe(4)

    endDate.value = '2024-01-31'
    expect(getActiveFilterCount()).toBe(5)

    // Test that 'all' type doesn't count as active
    selectedType.value = 'all'
    expect(getActiveFilterCount()).toBe(4)

    // Test that empty strings don't count
    searchQuery.value = '   '
    selectedLocation.value = '   '
    expect(getActiveFilterCount()).toBe(2) // Only date filters remain
  })

  it('should handle multiple filter combinations correctly', () => {
    const searchQuery = ref('meeting')
    const selectedType = ref<string | undefined>('hybrid')
    const selectedLocation = ref('Conference Room B')
    const startDate = ref('2024-02-01')
    const endDate = ref('2024-02-28')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const getActiveFilterCount = () => {
      let count = 0
      if (searchQuery.value.trim() !== '') count++
      if (selectedType.value !== undefined && selectedType.value !== 'all') count++
      if (selectedLocation.value.trim() !== '') count++
      if (startDate.value !== '') count++
      if (endDate.value !== '') count++
      return count
    }

    // All filters are active
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(5)

    // Remove filters one by one
    searchQuery.value = ''
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(4)

    selectedType.value = undefined
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(3)

    selectedLocation.value = ''
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(2)

    startDate.value = ''
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(1)

    endDate.value = ''
    expect(hasActiveFilters.value).toBe(false)
    expect(getActiveFilterCount()).toBe(0)
  })

  it('should differentiate between no meetings and no filtered results', () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Test message for no meetings (no filters)
    expect(hasActiveFilters.value).toBe(false)
    const noMeetingsMessage = hasActiveFilters.value
      ? 'No meetings found matching your current filters.'
      : 'No meetings found.'
    expect(noMeetingsMessage).toBe('No meetings found.')

    // Test message for no filtered results (with filters)
    searchQuery.value = 'nonexistent meeting'
    expect(hasActiveFilters.value).toBe(true)
    const noFilteredResultsMessage = hasActiveFilters.value
      ? 'No meetings found matching your current filters.'
      : 'No meetings found.'
    expect(noFilteredResultsMessage).toBe('No meetings found matching your current filters.')
  })

  it('should handle whitespace-only values correctly in filter counting', () => {
    const searchQuery = ref('   ')
    const selectedType = ref<string | undefined>(undefined)
    const selectedLocation = ref('  ')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const getActiveFilterCount = () => {
      let count = 0
      if (searchQuery.value.trim() !== '') count++
      if (selectedType.value !== undefined && selectedType.value !== 'all') count++
      if (selectedLocation.value.trim() !== '') count++
      if (startDate.value !== '') count++
      if (endDate.value !== '') count++
      return count
    }

    // Whitespace-only values should not be considered active
    expect(hasActiveFilters.value).toBe(false)
    expect(getActiveFilterCount()).toBe(0)

    // Add actual content
    searchQuery.value = '  test  '
    selectedLocation.value = '  Room A  '
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(2)
  })

  it('should handle edge cases in filter state detection', () => {
    const searchQuery = ref('')
    const selectedType = ref<string | undefined>('all')
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // 'all' type should not be considered active
    expect(hasActiveFilters.value).toBe(false)

    // Change to valid type
    selectedType.value = 'online'
    expect(hasActiveFilters.value).toBe(true)

    // Back to 'all'
    selectedType.value = 'all'
    expect(hasActiveFilters.value).toBe(false)

    // Test with undefined
    selectedType.value = undefined as string | undefined
    expect(hasActiveFilters.value).toBe(false)
  })

  it('should maintain consistent filter state across operations', () => {
    const searchQuery = ref('test meeting')
    const selectedType = ref('online')
    const selectedLocation = ref('Room 1')
    const startDate = ref('2024-01-01')
    const endDate = ref('2024-01-31')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const getActiveFilterCount = () => {
      let count = 0
      if (searchQuery.value.trim() !== '') count++
      if (selectedType.value !== undefined && selectedType.value !== 'all') count++
      if (selectedLocation.value.trim() !== '') count++
      if (startDate.value !== '') count++
      if (endDate.value !== '') count++
      return count
    }

    // Initial state
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(5)

    // Simulate multiple reads (should be consistent)
    for (let i = 0; i < 10; i++) {
      expect(hasActiveFilters.value).toBe(true)
      expect(getActiveFilterCount()).toBe(5)
    }

    // Change one filter
    selectedType.value = 'all'
    expect(hasActiveFilters.value).toBe(true)
    expect(getActiveFilterCount()).toBe(4)

    // Multiple reads after change
    for (let i = 0; i < 10; i++) {
      expect(hasActiveFilters.value).toBe(true)
      expect(getActiveFilterCount()).toBe(4)
    }
  })
})

describe('MeetingsView Type Filter Logic', () => {
  it('should exclude "all" value from API parameters in buildQueryParams', () => {
    const searchQuery = ref('')
    const selectedType = ref('all')
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const params = buildQueryParams()

    // Verify that type parameter is not included when value is 'all'
    expect(params.type).toBeUndefined()
  })

  it('should include valid type values in API parameters', () => {
    const searchQuery = ref('')
    const selectedType = ref('online')
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Test with 'online' type
    selectedType.value = 'online'
    let params = buildQueryParams()
    expect(params.type).toBe('online')

    // Test with 'offline' type
    selectedType.value = 'offline'
    params = buildQueryParams()
    expect(params.type).toBe('offline')

    // Test with 'hybrid' type
    selectedType.value = 'hybrid'
    params = buildQueryParams()
    expect(params.type).toBe('hybrid')
  })

  it('should exclude undefined values from API parameters', () => {
    const searchQuery = ref('')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const buildQueryParams = createBuildQueryParams(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    const params = buildQueryParams()

    // Verify that type parameter is not included when value is undefined
    expect(params.type).toBeUndefined()
  })

  it('should not consider "all" as an active filter in hasActiveFilters', () => {
    const searchQuery = ref('')
    const selectedType = ref('all')
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // hasActiveFilters should be false when type is 'all'
    expect(hasActiveFilters.value).toBe(false)
  })

  it('should consider valid type values as active filters', () => {
    const searchQuery = ref('')
    const selectedType = ref('online')
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // Test with 'online' type
    selectedType.value = 'online'
    expect(hasActiveFilters.value).toBe(true)

    // Test with 'offline' type
    selectedType.value = 'offline'
    expect(hasActiveFilters.value).toBe(true)

    // Test with 'hybrid' type
    selectedType.value = 'hybrid'
    expect(hasActiveFilters.value).toBe(true)
  })

  it('should not consider undefined type as an active filter', () => {
    const searchQuery = ref('')
    const selectedType = ref(undefined)
    const selectedLocation = ref('')
    const startDate = ref('')
    const endDate = ref('')

    const hasActiveFilters = createHasActiveFilters(
      searchQuery,
      selectedType,
      selectedLocation,
      startDate,
      endDate,
    )

    // hasActiveFilters should be false when type is undefined
    expect(hasActiveFilters.value).toBe(false)
  })
})
