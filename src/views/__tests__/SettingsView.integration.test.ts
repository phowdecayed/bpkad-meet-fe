import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import axios from 'axios'
import SettingsView from '../SettingsView.vue'
import { useSettingsStore } from '@/stores/settings'
import type { Setting } from '@/types/settings'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock child components for focused integration testing
vi.mock('@/components/settings/SettingsGroupSection.vue', () => ({
  default: {
    name: 'SettingsGroupSection',
    props: ['groupName', 'settings'],
    emits: ['retry'],
    template: `
      <div
        class="settings-group-section"
        :data-testid="'group-' + groupName"
        :data-group="groupName"
      >
        <h3>{{ groupName }} Settings</h3>
        <div class="settings-count">{{ settings.length }} settings</div>
        <button @click="$emit('retry', groupName)" class="retry-btn">Retry {{ groupName }}</button>
      </div>
    `,
  },
}))

describe('SettingsView Integration Tests', () => {
  let pinia: ReturnType<typeof createPinia>

  const mockZoomSettings: Setting[] = [
    {
      id: 1,
      name: 'Primary Zoom Account',
      group: 'zoom',
      payload: {
        client_id: 'test_client_id',
        client_secret: 'test_client_secret',
        account_id: 'test_account_id',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Secondary Zoom Account',
      group: 'zoom',
      payload: {
        client_id: 'test_client_id_2',
        client_secret: 'test_client_secret_2',
        account_id: 'test_account_id_2',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockGeneralSettings: Setting[] = [
    {
      id: 3,
      name: 'Application Name',
      group: 'General',
      payload: {
        apps_name: 'BPKAD Meeting Management',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockCustomSettings: Setting[] = [
    {
      id: 4,
      name: 'Custom Feature Toggle',
      group: 'Custom',
      payload: {
        feature_enabled: true,
        max_participants: 100,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const allMockSettings = [...mockZoomSettings, ...mockGeneralSettings, ...mockCustomSettings]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Settings Flow - API Fetch to Component Rendering', () => {
    it('should fetch all settings and render appropriate components for each group', async () => {
      // Mock successful API response
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      // Wait for API call and component updates
      await flushPromises()

      // Verify API was called correctly
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings')

      // Verify all setting groups are rendered
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-General"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-Custom"]').exists()).toBe(true)

      // Verify correct number of settings passed to each group
      const zoomGroup = wrapper.find('[data-testid="group-zoom"]')
      const generalGroup = wrapper.find('[data-testid="group-General"]')
      const customGroup = wrapper.find('[data-testid="group-Custom"]')

      expect(zoomGroup.find('.settings-count').text()).toBe('2 settings')
      expect(generalGroup.find('.settings-count').text()).toBe('1 settings')
      expect(customGroup.find('.settings-count').text()).toBe('1 settings')
    })

    it('should handle API errors gracefully and show retry functionality', async () => {
      // Mock API error
      const errorMessage = 'Network error occurred'
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: errorMessage },
        },
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify error state is shown
      expect(wrapper.text()).toContain('Failed to load settings')
      expect(wrapper.text()).toContain('Server error')
      expect(wrapper.find('button').text()).toContain('Try Again')

      // Test retry functionality
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')
      await flushPromises()

      // Verify settings are now loaded
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-General"]').exists()).toBe(true)
    })

    it('should show loading state during API fetch', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void
      const apiPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })
      mockedAxios.get.mockReturnValueOnce(apiPromise)

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Skeleton: {
              template: '<div class="skeleton-loader"></div>',
            },
          },
        },
      })

      // Wait for component to mount and check store state
      await wrapper.vm.$nextTick()
      const settingsStore = useSettingsStore()
      expect(settingsStore.isLoading).toBe(true)

      // Resolve the promise
      resolvePromise!({ data: allMockSettings })
      await flushPromises()

      // Loading should be done, settings should be visible
      expect(settingsStore.isLoading).toBe(false)
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
    })

    it('should show empty state when no settings are returned', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [],
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('No settings configured')
      expect(wrapper.text()).toContain('Contact your administrator')
    })
  })

  describe('Settings Group Component Rendering', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({
        data: allMockSettings,
      })
    })

    it('should render zoom group with ZoomSettings component', async () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const zoomGroup = wrapper.find('[data-testid="group-zoom"]')
      expect(zoomGroup.exists()).toBe(true)
      expect(zoomGroup.text()).toContain('zoom Settings')

      // Verify correct props are passed
      const groupComponent = wrapper.findComponent({ name: 'SettingsGroupSection' })
      const zoomComponent = wrapper
        .findAllComponents({ name: 'SettingsGroupSection' })
        .find((comp) => comp.props('groupName') === 'zoom')

      expect(zoomComponent?.props('groupName')).toBe('zoom')
      expect(zoomComponent?.props('settings')).toEqual(mockZoomSettings)
    })

    it('should render General group with GeneralSettings component', async () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const generalGroup = wrapper.find('[data-testid="group-General"]')
      expect(generalGroup.exists()).toBe(true)
      expect(generalGroup.text()).toContain('General Settings')

      const generalComponent = wrapper
        .findAllComponents({ name: 'SettingsGroupSection' })
        .find((comp) => comp.props('groupName') === 'General')

      expect(generalComponent?.props('groupName')).toBe('General')
      expect(generalComponent?.props('settings')).toEqual(mockGeneralSettings)
    })

    it('should render unknown groups with GenericSettings component', async () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const customGroup = wrapper.find('[data-testid="group-Custom"]')
      expect(customGroup.exists()).toBe(true)
      expect(customGroup.text()).toContain('Custom Settings')

      const customComponent = wrapper
        .findAllComponents({ name: 'SettingsGroupSection' })
        .find((comp) => comp.props('groupName') === 'Custom')

      expect(customComponent?.props('groupName')).toBe('Custom')
      expect(customComponent?.props('settings')).toEqual(mockCustomSettings)
    })

    it('should handle mixed setting groups correctly', async () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // All groups should be rendered
      const allGroups = wrapper.findAll('.settings-group-section')
      expect(allGroups).toHaveLength(3)

      // Verify each group has correct data
      const groupNames = allGroups.map((group) => group.attributes('data-group'))
      expect(groupNames).toContain('zoom')
      expect(groupNames).toContain('General')
      expect(groupNames).toContain('Custom')
    })
  })

  describe('CRUD Operations Integration', () => {
    beforeEach(async () => {
      mockedAxios.get.mockResolvedValue({
        data: allMockSettings,
      })
    })

    it('should handle group retry and refresh all settings', async () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Clear the initial API call
      mockedAxios.get.mockClear()

      // Mock the retry API call
      const updatedSettings = [
        ...allMockSettings,
        {
          id: 5,
          name: 'New Setting',
          group: 'zoom',
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]
      mockedAxios.get.mockResolvedValueOnce({
        data: updatedSettings,
      })

      // Trigger retry from zoom group
      const zoomRetryButton = wrapper.find('[data-testid="group-zoom"] .retry-btn')
      await zoomRetryButton.trigger('click')
      await flushPromises()

      // Verify API was called again
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings')

      // Verify settings were updated (zoom group should now have 3 settings)
      const zoomGroup = wrapper.find('[data-testid="group-zoom"]')
      expect(zoomGroup.find('.settings-count').text()).toBe('3 settings')
    })

    it('should maintain store state consistency during operations', async () => {
      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const settingsStore = useSettingsStore()

      // Verify store has correct initial state
      expect(settingsStore.settings).toEqual(allMockSettings)
      expect(Object.keys(settingsStore.groupedSettings)).toEqual(['zoom', 'General', 'Custom'])
      expect(settingsStore.groupedSettings.zoom).toEqual(mockZoomSettings)
      expect(settingsStore.groupedSettings.General).toEqual(mockGeneralSettings)
      expect(settingsStore.groupedSettings.Custom).toEqual(mockCustomSettings)

      // Verify loading and error states are correct
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.error).toBe(null)
    })
  })

  describe('Backward Compatibility with ZoomSettings', () => {
    it('should maintain existing ZoomSettings functionality when accessed directly', async () => {
      // Test that zoom settings still work when only zoom settings are returned
      const onlyZoomSettings = mockZoomSettings
      mockedAxios.get.mockResolvedValueOnce({
        data: onlyZoomSettings,
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Should render only zoom group
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-General"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="group-Custom"]').exists()).toBe(false)

      // Zoom group should have correct settings
      const zoomGroup = wrapper.find('[data-testid="group-zoom"]')
      expect(zoomGroup.find('.settings-count').text()).toBe('2 settings')
    })

    it('should handle legacy API responses that only return zoom settings', async () => {
      // Simulate legacy API that might return settings without proper grouping
      const legacyZoomSettings = mockZoomSettings.map((setting) => ({
        ...setting,
        group: 'zoom', // Ensure group is set
      }))

      mockedAxios.get.mockResolvedValueOnce({
        data: legacyZoomSettings,
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const settingsStore = useSettingsStore()
      expect(settingsStore.groupedSettings.zoom).toEqual(legacyZoomSettings)
      expect(Object.keys(settingsStore.groupedSettings)).toEqual(['zoom'])
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle different types of API errors appropriately', async () => {
      const testCases = [
        {
          error: { response: { status: 401 } },
          expectedMessage: 'You are not authorized to access settings',
        },
        {
          error: { response: { status: 403 } },
          expectedMessage: 'You do not have permission to view settings',
        },
        {
          error: { response: { status: 404 } },
          expectedMessage: 'Settings endpoint not found',
        },
        {
          error: { response: { status: 500 } },
          expectedMessage: 'Server error',
        },
        {
          error: { code: 'NETWORK_ERROR' },
          expectedMessage: 'Network error',
        },
      ]

      for (const testCase of testCases) {
        mockedAxios.get.mockRejectedValueOnce(testCase.error)

        const wrapper = mount(SettingsView, {
          global: {
            plugins: [pinia],
          },
        })

        await flushPromises()

        expect(wrapper.text()).toContain('Failed to load settings')
        expect(wrapper.text()).toContain(testCase.expectedMessage)

        // Clean up for next iteration
        wrapper.unmount()
        vi.clearAllMocks()
      }
    })

    it('should recover from errors when retry succeeds', async () => {
      // First call fails
      mockedAxios.get.mockRejectedValueOnce({
        response: { status: 500 },
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify error state
      expect(wrapper.text()).toContain('Failed to load settings')

      // Second call succeeds
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')
      await flushPromises()

      // Verify recovery
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-General"]').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Failed to load settings')
    })
  })

  describe('Performance and User Experience', () => {
    it('should show loading state immediately on mount', async () => {
      // Don't resolve the promise immediately
      mockedAxios.get.mockReturnValue(new Promise(() => {}))

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Skeleton: {
              template: '<div class="skeleton-loader"></div>',
            },
          },
        },
      })

      // Wait for component to mount and check store state
      await wrapper.vm.$nextTick()
      const settingsStore = useSettingsStore()
      expect(settingsStore.isLoading).toBe(true)
      expect(wrapper.text()).not.toContain('Failed to load settings')
      expect(wrapper.text()).not.toContain('No settings configured')
    })

    it('should handle rapid retry clicks gracefully', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 500 },
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Mock successful retry
      mockedAxios.get.mockResolvedValue({
        data: allMockSettings,
      })

      const retryButton = wrapper.find('button')

      // Click retry multiple times rapidly
      await retryButton.trigger('click')
      await retryButton.trigger('click')
      await retryButton.trigger('click')

      await flushPromises()

      // Should handle gracefully and show settings
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
    })

    it('should maintain consistent UI state during operations', async () => {
      mockedAxios.get.mockResolvedValue({
        data: allMockSettings,
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify consistent layout
      const groups = wrapper.findAll('.settings-group-section')
      expect(groups).toHaveLength(3)

      // Each group should have consistent structure
      groups.forEach((group) => {
        expect(group.find('h3').exists()).toBe(true)
        expect(group.find('.settings-count').exists()).toBe(true)
        expect(group.find('.retry-btn').exists()).toBe(true)
      })
    })
  })

  describe('Data Integrity and Validation', () => {
    it('should handle malformed API responses gracefully', async () => {
      // Test with malformed settings data
      const malformedSettings = [
        {
          id: 1,
          name: 'Valid Setting',
          group: 'zoom',
          payload: { key: 'value' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          // Missing name
          group: 'General',
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 3,
          name: 'No Group Setting',
          // Missing group - should default to 'Other'
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: malformedSettings,
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Should still render without crashing
      expect(wrapper.find('[data-testid="group-zoom"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-General"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-Other"]').exists()).toBe(true)
    })

    it('should handle empty payload data correctly', async () => {
      const settingsWithEmptyPayload = [
        {
          id: 1,
          name: 'Empty Payload Setting',
          group: 'test',
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          name: 'Null Payload Setting',
          group: 'test',
          payload: null as unknown,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: settingsWithEmptyPayload,
      })

      const wrapper = mount(SettingsView, {
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Should render without errors
      expect(wrapper.find('[data-testid="group-test"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="group-test"] .settings-count').text()).toBe('2 settings')
    })
  })
})
