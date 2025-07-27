import { describe, it, expect } from 'vitest'
import { ref, computed } from 'vue'
import type { MeetingQueryParams } from '@/stores/meetings'

// Extract the logic functions to test them in isolation
function createBuildQueryParams(
  searchQuery: any,
  selectedType: any,
  selectedLocation: any,
  startDate: any,
  endDate: any,
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
  searchQuery: any,
  selectedType: any,
  selectedLocation: any,
  startDate: any,
  endDate: any,
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
