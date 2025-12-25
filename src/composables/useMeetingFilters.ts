import { ref, computed, watch } from 'vue'
import debounce from 'lodash-es/debounce'
import type { Meeting } from '@/types/meeting'
import type { MeetingQueryParams } from '@/stores/meetings'

import type { MeetingLocation } from '@/types/meeting'

export function useMeetingFilters(
  meetings: { value: Meeting[] },
  fetchMeetingsCallback: (params: MeetingQueryParams) => Promise<void>,
  locations?: { value: MeetingLocation[] },
) {
  // Search and filter states
  const searchQuery = ref('')
  const selectedType = ref<string | undefined>(undefined)
  const selectedLocation = ref('all')
  const startDate = ref('')
  const endDate = ref('')
  const perPage = ref('10')

  // Derived state
  const hasActiveFilters = computed(() => {
    return (
      searchQuery.value.trim() !== '' ||
      (selectedType.value !== undefined && selectedType.value !== 'all') ||
      selectedLocation.value !== 'all' ||
      startDate.value !== '' ||
      endDate.value !== ''
    )
  })

  const getActiveFilterCount = () => {
    let count = 0
    if (searchQuery.value.trim() !== '') count++
    if (selectedType.value !== undefined && selectedType.value !== 'all') count++
    if (selectedLocation.value !== 'all') count++
    if (startDate.value !== '') count++
    if (endDate.value !== '') count++
    return count
  }

  // Extract unique locations
  const availableLocations = computed(() => {
    if (locations && locations.value.length > 0) {
      return locations.value.map((loc) => loc.name).sort()
    }

    const locationSet = new Set<string>()
    meetings.value.forEach((meeting) => {
      if (meeting.location?.name) {
        locationSet.add(meeting.location.name)
      }
    })
    return Array.from(locationSet).sort()
  })

  const locationsCount = computed(() => availableLocations.value.length)

  // Build query params
  const buildQueryParams = (): MeetingQueryParams => {
    const params: MeetingQueryParams = {
      per_page: parseInt(perPage.value, 10),
    }

    if (searchQuery.value.trim()) {
      params.topic = searchQuery.value.trim()
    }

    if (selectedType.value && selectedType.value !== 'all') {
      params.type = selectedType.value
    }

    if (selectedLocation.value && selectedLocation.value !== 'all') {
      params.location = selectedLocation.value
    }

    if (startDate.value) {
      params.start_date = startDate.value
    }

    if (endDate.value) {
      params.end_date = endDate.value
    }

    return params
  }

  // Watchers and Debounce
  const debouncedSearch = debounce(() => {
    // Always reset to page 1 when filters change
    fetchMeetingsCallback({ ...buildQueryParams(), page: 1 })
  }, 300)

  watch(
    () => [
      searchQuery.value,
      selectedType.value,
      selectedLocation.value,
      startDate.value,
      endDate.value,
      perPage.value,
    ],
    debouncedSearch,
  )

  function clearFilters() {
    searchQuery.value = ''
    selectedType.value = undefined
    selectedLocation.value = 'all'
    startDate.value = ''
    endDate.value = ''
    perPage.value = '10'

    fetchMeetingsCallback({ ...buildQueryParams(), page: 1 })
  }

  return {
    searchQuery,
    selectedType,
    selectedLocation,
    startDate,
    endDate,
    perPage,
    hasActiveFilters,
    getActiveFilterCount,
    availableLocations,
    locationsCount,
    buildQueryParams,
    clearFilters,
  }
}
