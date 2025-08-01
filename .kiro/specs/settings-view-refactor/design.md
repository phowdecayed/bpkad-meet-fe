# Design Document

## Overview

The SettingsView.vue refactor will transform the current hardcoded single-component view into a dynamic, multi-group settings management interface. The design leverages the existing settings store and API structure while introducing a flexible component mapping system that can handle different setting group types (zoom, General, etc.) and gracefully scale to accommodate new setting types in the future.

## Architecture

### Component Hierarchy

```
SettingsView.vue (Main Container)
├── SettingsGroupSection.vue (Reusable Group Container)
│   ├── ZoomSettings.vue (Existing - for "zoom" group)
│   ├── GeneralSettings.vue (New - for "General" group)
│   └── GenericSettings.vue (Fallback - for unknown groups)
└── LoadingState / ErrorState Components
```

### Data Flow

1. SettingsView fetches all settings from `/api/settings` endpoint
2. Settings are grouped by their `group` property
3. Each group is rendered using appropriate component based on group type
4. Individual setting components handle their own CRUD operations via the settings store

## Components and Interfaces

### 1. SettingsView.vue (Refactored)

**Purpose:** Main container that orchestrates the display of multiple settings groups

**Key Features:**

- Fetches all settings on mount using the settings store
- Groups settings by their `group` property
- Renders each group using the appropriate component
- Handles loading and error states
- Provides consistent layout and spacing

**Template Structure:**

```vue
<template>
  <div class="flex-1 space-y-8 p-4 pt-6 md:p-8">
    <!-- Loading State -->
    <div v-if="isLoading" class="space-y-6">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-32 w-full" />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center py-8">
      <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 class="text-lg font-semibold">Failed to load settings</h3>
      <p class="text-muted-foreground">{{ error }}</p>
      <Button @click="retryFetch" class="mt-4">Try Again</Button>
    </div>

    <!-- Settings Groups -->
    <div v-else class="space-y-8">
      <SettingsGroupSection
        v-for="(groupSettings, groupName) in groupedSettings"
        :key="groupName"
        :group-name="groupName"
        :settings="groupSettings"
      />
    </div>

    <!-- Empty State -->
    <div
      v-if="!isLoading && !error && Object.keys(groupedSettings).length === 0"
      class="text-center py-12"
    >
      <Settings class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-semibold">No settings configured</h3>
      <p class="text-muted-foreground">
        Contact your administrator to configure application settings.
      </p>
    </div>
  </div>
</template>
```

### 2. SettingsGroupSection.vue (New Component)

**Purpose:** Wrapper component that determines which specific settings component to render for each group

**Props:**

- `groupName: string` - The name of the settings group
- `settings: Setting[]` - Array of settings for this group

**Component Mapping Logic:**

```typescript
const componentMap: Record<string, Component> = {
  zoom: ZoomSettings,
  General: GeneralSettings,
  // Add more mappings as needed
}

const componentToRender = computed(() => {
  return componentMap[props.groupName] || GenericSettings
})
```

### 3. GeneralSettings.vue (New Component)

**Purpose:** Handles "General" group settings like application name

**Features:**

- Form-based interface for general application settings
- Validation for required fields
- Save/cancel functionality
- Consistent UI with other settings components

**Template Structure:**

```vue
<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">General Settings</h1>
      <p class="text-sm text-muted-foreground">Configure general application settings.</p>
    </div>

    <div class="p-6 border rounded-lg">
      <form @submit.prevent="handleSave" class="space-y-4">
        <div class="grid gap-2">
          <Label for="app-name">Application Name</Label>
          <Input id="app-name" v-model="formData.apps_name" placeholder="Enter application name" />
        </div>

        <div class="flex justify-end space-x-2">
          <Button type="button" variant="secondary" @click="handleReset"> Reset </Button>
          <Button type="submit" :disabled="isSaving">
            <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  </div>
</template>
```

### 4. GenericSettings.vue (New Component)

**Purpose:** Fallback component for unknown setting group types

**Features:**

- Displays settings in a generic key-value format
- Allows basic editing of JSON payload
- Provides warning about unknown setting type
- Maintains functionality for unsupported groups

## Data Models

### Setting Interface

```typescript
interface Setting {
  id: number
  name: string
  group: string
  payload: Record<string, any>
  created_at: string
  updated_at: string
}

interface GroupedSettings {
  [groupName: string]: Setting[]
}
```

### Settings Store Updates

The existing settings store will be enhanced with:

```typescript
// New method to fetch all settings (not filtered by group)
async function fetchAllSettings() {
  isLoading.value = true
  error.value = null
  try {
    const response = await axios.get('/api/settings')
    settings.value = response.data
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch settings.'
    settings.value = []
  } finally {
    isLoading.value = false
  }
}

// Computed property for grouped settings
const groupedSettings = computed(() => {
  return settings.value.reduce((groups, setting) => {
    const group = setting.group || 'Other'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(setting)
    return groups
  }, {} as GroupedSettings)
})
```

## Error Handling

### API Error Handling

- Network errors: Display retry button with error message
- Authentication errors: Redirect to login
- Permission errors: Display appropriate access denied message
- Validation errors: Show field-specific error messages

### Component Error Handling

- Unknown setting groups: Render GenericSettings component
- Missing setting data: Display placeholder with option to refresh
- Component rendering errors: Use error boundaries to prevent app crash

### User Feedback

- Loading states: Skeleton loaders for better UX
- Success messages: Toast notifications for successful operations
- Error messages: Clear, actionable error descriptions
- Empty states: Helpful messages when no settings exist

## Testing Strategy

### Unit Tests

1. **SettingsView.vue Tests:**

   - Renders loading state correctly
   - Handles API errors gracefully
   - Groups settings correctly by group property
   - Renders appropriate components for each group

2. **SettingsGroupSection.vue Tests:**

   - Maps group names to correct components
   - Falls back to GenericSettings for unknown groups
   - Passes props correctly to child components

3. **GeneralSettings.vue Tests:**

   - Renders form fields correctly
   - Validates input data
   - Handles save/reset operations
   - Shows loading states during operations

4. **GenericSettings.vue Tests:**
   - Displays unknown settings in readable format
   - Allows basic editing of JSON data
   - Shows appropriate warnings

### Integration Tests

1. **Settings Store Integration:**

   - Fetches all settings correctly
   - Groups settings properly
   - Handles CRUD operations for different group types

2. **Component Communication:**
   - Parent-child prop passing
   - Event handling between components
   - Store state updates reflected in UI

### E2E Tests

1. **Full Settings Flow:**
   - Load settings page
   - Navigate between different setting groups
   - Modify and save settings
   - Verify changes persist after page refresh

## Performance Considerations

### Lazy Loading

- Consider lazy loading of setting components for better initial page load
- Implement dynamic imports for setting group components

### Caching

- Cache settings data in the store to avoid unnecessary API calls
- Implement optimistic updates for better user experience

### Bundle Size

- Use dynamic imports to split setting components into separate chunks
- Only load components that are actually needed

## Accessibility

### Keyboard Navigation

- Ensure all interactive elements are keyboard accessible
- Implement proper tab order for form fields
- Add keyboard shortcuts for common actions

### Screen Reader Support

- Proper ARIA labels for form fields
- Descriptive headings for each settings group
- Status announcements for loading/error states

### Visual Design

- Maintain consistent spacing and typography
- Ensure sufficient color contrast
- Support for reduced motion preferences
