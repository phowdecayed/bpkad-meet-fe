# Design Document

## Overview

This design addresses the non-functional search and filter functionality in the MeetingsView component. The current implementation has UI elements and partial logic but lacks proper integration between the frontend filters and the backend API calls. The solution involves fixing the filter parameter handling, ensuring proper API integration, and improving the user experience with better state management.

## Architecture

### Current State Analysis

The MeetingsView component already has:

- UI elements for search, type filter, and date range filters
- `buildQueryParams()` function that constructs query parameters
- Debounced search functionality with `debouncedSearch`
- Watch functionality that triggers on filter changes
- `clearFilters()` function for resetting filters

### Issues Identified

1. **Type Filter Logic**: The type filter has an "all" option that may not be handled correctly by the API
2. **Filter State Management**: The `selectedType` reactive variable may not be properly synchronized
3. **API Parameter Passing**: The `buildQueryParams()` function may not be constructing parameters correctly
4. **Clear Filters Logic**: The clear function may not be properly resetting all filter states

## Components and Interfaces

### MeetingsView Component Updates

#### Filter State Management

```typescript
// Current filter states (already exist)
const searchQuery = ref('')
const selectedType = ref<string | undefined>(undefined)
const selectedLocation = ref('')
const startDate = ref('')
const endDate = ref('')

// Enhanced hasActiveFilters computed property
const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    (selectedType.value !== undefined && selectedType.value !== 'all') ||
    selectedLocation.value.trim() !== '' ||
    startDate.value !== '' ||
    endDate.value !== ''
  )
})
```

#### Enhanced buildQueryParams Function

```typescript
const buildQueryParams = (): MeetingQueryParams => {
  const params: MeetingQueryParams = {}

  // Topic search parameter
  if (searchQuery.value.trim()) {
    params.topic = searchQuery.value.trim()
  }

  // Type parameter - exclude 'all' and undefined values
  if (selectedType.value && selectedType.value !== 'all') {
    params.type = selectedType.value
  }

  // Location parameter
  if (selectedLocation.value && selectedLocation.value.trim()) {
    params.location = selectedLocation.value.trim()
  }

  // Date filtering logic
  if (startDate.value && endDate.value) {
    // Use calendar endpoint for date range
    params.start_date = startDate.value
    params.end_date = endDate.value
  } else if (startDate.value) {
    // Use meetings endpoint for single date
    params.start_time = startDate.value
  } else if (endDate.value) {
    // Use meetings endpoint for single date
    params.start_time = endDate.value
  }

  return params
}
```

#### Enhanced clearFilters Function

```typescript
function clearFilters() {
  searchQuery.value = ''
  selectedType.value = undefined
  selectedLocation.value = ''
  startDate.value = ''
  endDate.value = ''

  // Immediately trigger a fresh fetch with no filters
  goToPage(1)
}
```

### Store Integration

The `useMeetingsStore` needs to be updated to handle the correct API parameters and endpoint selection:

- Update `MeetingQueryParams` interface to use `topic` instead of `search` and add `location` parameter
- Implement logic to choose between `/api/meetings` and `/api/calendar` endpoints based on date parameters
- Use `/api/calendar` when both `start_date` and `end_date` are provided
- Use `/api/meetings` for all other filtering scenarios
- Update parameter mapping to use correct API parameter names

## Data Models

### MeetingQueryParams Interface

The interface needs to be updated to match the API documentation:

```typescript
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
```

### Filter State Types

```typescript
type MeetingType = 'online' | 'offline' | 'hybrid' | 'all' | undefined
```

## Error Handling

### Filter-Specific Error Handling

- Maintain existing error handling from the store
- Ensure filter state is preserved when API calls fail
- Provide retry functionality that maintains current filter parameters
- Show appropriate error messages for filter-related failures

### Enhanced retryFetch Function

```typescript
async function retryFetch() {
  meetingsStore.clearError()
  const params = buildQueryParams()
  params.page = pagination.value.currentPage
  await meetingsStore.fetchMeetings(params)
}
```

## Testing Strategy

### Unit Tests

1. **Filter State Management**

   - Test `hasActiveFilters` computed property with various filter combinations
   - Test `buildQueryParams` function with different filter states
   - Test `clearFilters` function resets all filter states

2. **Search Functionality**

   - Test debounced search triggers API calls
   - Test search parameter is correctly passed to store
   - Test search results update the meetings list

3. **Type Filter**

   - Test type filter excludes 'all' value from API parameters
   - Test type filter correctly filters meetings
   - Test type filter state management

4. **Date Range Filter**
   - Test start date filter functionality
   - Test end date filter functionality
   - Test combined date range filtering

### Integration Tests

1. **API Integration**

   - Test filter parameters are correctly sent to API
   - Test API responses update the UI correctly
   - Test pagination works with active filters

2. **User Interaction**
   - Test filter changes trigger appropriate API calls
   - Test clear filters resets view to unfiltered state
   - Test filter state persists during pagination

### Component Tests

1. **UI Behavior**
   - Test filter inputs update reactive state
   - Test clear button functionality
   - Test loading states during filter operations
   - Test error states and retry functionality

## Implementation Notes

### Key Changes Required

1. **Fix Type Filter Logic**: Ensure 'all' value is treated as no filter
2. **Enhance Clear Filters**: Make sure it triggers immediate refresh
3. **Improve Error Handling**: Preserve filter state during errors
4. **Optimize Debouncing**: Ensure proper cleanup and timing

### Backward Compatibility

- All changes maintain existing API contracts
- No breaking changes to component props or events
- Existing functionality remains intact

### Performance Considerations

- Debounced search prevents excessive API calls
- Filter state is managed efficiently with Vue reactivity
- Pagination state is preserved during filter operations

## User Experience Improvements

### Visual Feedback

- Active filter indicators in the UI
- Appropriate empty state messages when filters return no results
- Loading states during filter operations
- Clear visual distinction between filtered and unfiltered states

### Accessibility

- Proper labeling for all filter controls
- Keyboard navigation support
- Screen reader announcements for filter state changes
- Focus management during filter operations
