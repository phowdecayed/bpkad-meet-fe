import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useSettingsStore } from '../settings'
import type { Setting, SettingCreationPayload, SettingUpdatePayload } from '@/types/settings'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('Settings Store Integration Tests', () => {
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

  describe('Fetch Operations Integration', () => {
    it('should fetch all settings and group them correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      const settingsStore = useSettingsStore()
      await settingsStore.fetchAllSettings()

      // Verify API call
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings')

      // Verify store state
      expect(settingsStore.settings).toEqual(allMockSettings)
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.error).toBe(null)

      // Verify grouped settings
      expect(Object.keys(settingsStore.groupedSettings)).toEqual(['zoom', 'General', 'Custom'])
      expect(settingsStore.groupedSettings.zoom).toEqual(mockZoomSettings)
      expect(settingsStore.groupedSettings.General).toEqual(mockGeneralSettings)
      expect(settingsStore.groupedSettings.Custom).toEqual(mockCustomSettings)
    })

    it('should fetch settings by group correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: mockZoomSettings,
      })

      const settingsStore = useSettingsStore()
      await settingsStore.fetchSettingsByGroup('zoom')

      // Verify API call with group parameter
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings', { params: { group: 'zoom' } })

      // Verify store state
      expect(settingsStore.settings).toEqual(mockZoomSettings)
      expect(settingsStore.groupedSettings.zoom).toEqual(mockZoomSettings)
    })

    it('should handle empty API responses correctly', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [],
      })

      const settingsStore = useSettingsStore()
      await settingsStore.fetchAllSettings()

      expect(settingsStore.settings).toEqual([])
      expect(settingsStore.groupedSettings).toEqual({})
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.error).toBe(null)
    })

    it('should handle settings without group property', async () => {
      const settingsWithoutGroup = [
        {
          id: 1,
          name: 'Ungrouped Setting',
          // No group property
          payload: { key: 'value' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        } as Setting,
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: settingsWithoutGroup,
      })

      const settingsStore = useSettingsStore()
      await settingsStore.fetchAllSettings()

      // Should group under 'Other'
      expect(settingsStore.groupedSettings.Other).toEqual(settingsWithoutGroup)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle network errors appropriately', async () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
      }

      mockedAxios.get.mockRejectedValueOnce(networkError)

      const settingsStore = useSettingsStore()

      await expect(settingsStore.fetchAllSettings()).rejects.toThrow()

      expect(settingsStore.error).toContain('Network error')
      expect(settingsStore.settings).toEqual([])
      expect(settingsStore.isLoading).toBe(false)
    })

    it('should handle different HTTP error codes correctly', async () => {
      const errorCases = [
        {
          status: 401,
          expectedMessage: 'You are not authorized to access settings',
        },
        {
          status: 403,
          expectedMessage: 'You do not have permission to view settings',
        },
        {
          status: 404,
          expectedMessage: 'Settings endpoint not found',
        },
        {
          status: 500,
          expectedMessage: 'Server error',
        },
      ]

      for (const errorCase of errorCases) {
        const settingsStore = useSettingsStore()

        mockedAxios.get.mockRejectedValueOnce({
          response: {
            status: errorCase.status,
            data: { message: 'Test error' },
          },
        })

        await expect(settingsStore.fetchAllSettings()).rejects.toThrow()

        expect(settingsStore.error).toContain(errorCase.expectedMessage)
        expect(settingsStore.settings).toEqual([])

        // Reset for next iteration
        vi.clearAllMocks()
      }
    })

    it('should handle group-specific error messages', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Access denied' },
        },
      })

      const settingsStore = useSettingsStore()

      await expect(settingsStore.fetchSettingsByGroup('zoom')).rejects.toThrow()

      expect(settingsStore.error).toContain('You do not have permission to view zoom settings')
    })
  })

  describe('CRUD Operations Integration', () => {
    beforeEach(() => {
      // Setup initial state
      mockedAxios.get.mockResolvedValue({
        data: allMockSettings,
      })
    })

    it('should create new settings correctly', async () => {
      const newSettingPayload: SettingCreationPayload = {
        name: 'New Zoom Account',
        group: 'zoom',
        payload: {
          client_id: 'new_client_id',
          client_secret: 'new_client_secret',
          account_id: 'new_account_id',
        },
      }

      const createdSetting: Setting = {
        id: 5,
        ...newSettingPayload,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValueOnce({
        data: createdSetting,
      })

      const settingsStore = useSettingsStore()
      const result = await settingsStore.createSetting(newSettingPayload)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/settings', newSettingPayload)
      expect(result.data).toEqual(createdSetting)
    })

    it('should update existing settings correctly', async () => {
      const updatePayload: SettingUpdatePayload = {
        client_id: 'updated_client_id',
        client_secret: 'updated_client_secret',
        account_id: 'updated_account_id',
      }

      const updatedSetting: Setting = {
        ...mockZoomSettings[0],
        payload: updatePayload,
        updated_at: '2024-01-02T00:00:00Z',
      }

      mockedAxios.patch.mockResolvedValueOnce({
        data: updatedSetting,
      })

      const settingsStore = useSettingsStore()
      const result = await settingsStore.updateSetting(1, updatePayload)

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/settings/1', updatePayload)
      expect(result.data).toEqual(updatedSetting)
    })

    it('should delete settings and refresh list correctly', async () => {
      mockedAxios.delete.mockResolvedValueOnce({})

      const settingsStore = useSettingsStore()

      // Set initial settings
      await settingsStore.fetchAllSettings()

      // Clear the fetch call from setup
      mockedAxios.get.mockClear()

      // Mock the refresh call after delete
      mockedAxios.get.mockResolvedValueOnce({
        data: mockZoomSettings.slice(1), // Remove first setting
      })

      await settingsStore.deleteSetting(1)

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/settings/1')
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings', { params: { group: 'zoom' } })
    })

    it('should handle CRUD operation errors gracefully', async () => {
      const settingsStore = useSettingsStore()

      // Test create error
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: { message: 'Validation error' },
        },
      })

      await expect(
        settingsStore.createSetting({
          name: 'Invalid Setting',
          group: 'test',
          payload: {},
        }),
      ).rejects.toThrow()

      // Test update error
      mockedAxios.patch.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Setting not found' },
        },
      })

      await expect(settingsStore.updateSetting(999, {})).rejects.toThrow()

      // Test delete error
      mockedAxios.delete.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { message: 'Permission denied' },
        },
      })

      await expect(settingsStore.deleteSetting(999)).rejects.toThrow()
    })
  })

  describe('State Management Integration', () => {
    it('should maintain consistent state during multiple operations', async () => {
      const settingsStore = useSettingsStore()

      // Initial fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      await settingsStore.fetchAllSettings()

      expect(settingsStore.settings).toHaveLength(4)
      expect(Object.keys(settingsStore.groupedSettings)).toHaveLength(3)

      // Update a setting
      const updatePayload = { client_id: 'updated_id' }
      mockedAxios.patch.mockResolvedValueOnce({
        data: { ...mockZoomSettings[0], payload: updatePayload },
      })

      await settingsStore.updateSetting(1, updatePayload)

      // State should remain consistent
      expect(settingsStore.settings).toHaveLength(4)
      expect(settingsStore.groupedSettings.zoom).toHaveLength(2)

      // Create a new setting
      const newSetting = {
        id: 6,
        name: 'New Setting',
        group: 'zoom',
        payload: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      mockedAxios.post.mockResolvedValueOnce({
        data: newSetting,
      })

      await settingsStore.createSetting({
        name: 'New Setting',
        group: 'zoom',
        payload: {},
      })

      // State should still be consistent
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.error).toBe(null)
    })

    it('should handle concurrent operations correctly', async () => {
      const settingsStore = useSettingsStore()

      // Mock multiple concurrent API calls
      mockedAxios.get.mockImplementation((url, config) => {
        if (config?.params?.group === 'zoom') {
          return Promise.resolve({ data: mockZoomSettings })
        }
        return Promise.resolve({ data: allMockSettings })
      })

      // Start multiple operations concurrently
      const promises = [
        settingsStore.fetchAllSettings(),
        settingsStore.fetchSettingsByGroup('zoom'),
        settingsStore.fetchAllSettings(),
      ]

      await Promise.all(promises)

      // Should handle gracefully without race conditions
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.error).toBe(null)
      expect(settingsStore.settings).toBeDefined()
    })

    it('should reset state correctly on errors', async () => {
      const settingsStore = useSettingsStore()

      // Initial successful fetch
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      await settingsStore.fetchAllSettings()

      expect(settingsStore.settings).toHaveLength(4)
      expect(settingsStore.error).toBe(null)

      // Subsequent error
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      })

      await expect(settingsStore.fetchAllSettings()).rejects.toThrow()

      // State should be reset
      expect(settingsStore.settings).toEqual([])
      expect(settingsStore.error).toContain('Server error')
      expect(settingsStore.isLoading).toBe(false)
    })
  })

  describe('Computed Properties Integration', () => {
    it('should update groupedSettings reactively when settings change', async () => {
      const settingsStore = useSettingsStore()

      // Initial empty state
      expect(settingsStore.groupedSettings).toEqual({})

      // Add settings
      mockedAxios.get.mockResolvedValueOnce({
        data: mockZoomSettings,
      })

      await settingsStore.fetchAllSettings()

      expect(settingsStore.groupedSettings.zoom).toEqual(mockZoomSettings)
      expect(Object.keys(settingsStore.groupedSettings)).toEqual(['zoom'])

      // Add more settings
      mockedAxios.get.mockResolvedValueOnce({
        data: allMockSettings,
      })

      await settingsStore.fetchAllSettings()

      expect(Object.keys(settingsStore.groupedSettings)).toEqual(['zoom', 'General', 'Custom'])
      expect(settingsStore.groupedSettings.zoom).toHaveLength(2)
      expect(settingsStore.groupedSettings.General).toHaveLength(1)
      expect(settingsStore.groupedSettings.Custom).toHaveLength(1)
    })

    it('should handle complex grouping scenarios', async () => {
      const complexSettings: Setting[] = [
        ...mockZoomSettings,
        ...mockGeneralSettings,
        {
          id: 5,
          name: 'Another Zoom Setting',
          group: 'zoom',
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 6,
          name: 'Ungrouped Setting',
          group: '', // Empty group
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 7,
          name: 'Null Group Setting',
          group: null as any, // Null group
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      mockedAxios.get.mockResolvedValueOnce({
        data: complexSettings,
      })

      const settingsStore = useSettingsStore()
      await settingsStore.fetchAllSettings()

      // Verify grouping
      expect(settingsStore.groupedSettings.zoom).toHaveLength(3)
      expect(settingsStore.groupedSettings.General).toHaveLength(1)
      expect(settingsStore.groupedSettings.Other).toHaveLength(2) // Empty and null groups
    })
  })

  describe('Loading State Integration', () => {
    it('should manage loading state correctly during operations', async () => {
      const settingsStore = useSettingsStore()

      // Create a controllable promise
      let resolvePromise: (value: any) => void
      const controllablePromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      mockedAxios.get.mockReturnValueOnce(controllablePromise)

      // Start fetch operation
      const fetchPromise = settingsStore.fetchAllSettings()

      // Should be loading
      expect(settingsStore.isLoading).toBe(true)
      expect(settingsStore.error).toBe(null)

      // Resolve the promise
      resolvePromise!({ data: allMockSettings })
      await fetchPromise

      // Should no longer be loading
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.settings).toEqual(allMockSettings)
    })

    it('should handle loading state during errors', async () => {
      const settingsStore = useSettingsStore()

      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      })

      await expect(settingsStore.fetchAllSettings()).rejects.toThrow()

      // Loading should be false even after error
      expect(settingsStore.isLoading).toBe(false)
      expect(settingsStore.error).toContain('Server error')
    })
  })
})
