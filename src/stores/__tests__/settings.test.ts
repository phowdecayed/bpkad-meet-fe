import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import axios from 'axios'
import { useSettingsStore } from '../settings'
import type { Setting } from '../../types/settings'

// Mock axios
vi.mock('axios')
const mockedAxios = vi.mocked(axios)

describe('useSettingsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockSettings: Setting[] = [
    {
      id: 1,
      name: 'zoom_api_key',
      group: 'zoom',
      payload: { api_key: 'test-key' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'app_name',
      group: 'General',
      payload: { apps_name: 'Test App' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 3,
      name: 'zoom_secret',
      group: 'zoom',
      payload: { secret: 'test-secret' },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    },
  ]

  describe('fetchAllSettings', () => {
    it('should fetch all settings successfully', async () => {
      const store = useSettingsStore()
      vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: mockSettings })

      await store.fetchAllSettings()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings')
      expect(store.settings).toEqual(mockSettings)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle fetch errors', async () => {
      const store = useSettingsStore()
      const errorMessage = 'Network error'
      vi.spyOn(axios, 'get').mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      })

      try {
        await store.fetchAllSettings()
      } catch {
        // Expected to throw
      }

      expect(store.settings).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(errorMessage)
    })
  })

  describe('groupedSettings computed property', () => {
    it('should group settings by their group property', async () => {
      const store = useSettingsStore()
      vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: mockSettings })

      await store.fetchAllSettings()

      const grouped = store.groupedSettings
      expect(grouped).toEqual({
        zoom: [mockSettings[0], mockSettings[2]],
        General: [mockSettings[1]],
      })
    })

    it('should handle settings without group (fallback to "Other")', async () => {
      const store = useSettingsStore()
      const settingsWithoutGroup = [
        {
          id: 1,
          name: 'test_setting',
          group: '',
          payload: { value: 'test' },
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      ]
      mockedAxios.get.mockResolvedValueOnce({ data: settingsWithoutGroup })

      await store.fetchAllSettings()

      const grouped = store.groupedSettings
      expect(grouped).toEqual({
        Other: [settingsWithoutGroup[0]],
      })
    })

    it('should return empty object when no settings', () => {
      const store = useSettingsStore()

      const grouped = store.groupedSettings
      expect(grouped).toEqual({})
    })
  })

  describe('updateSetting', () => {
    it('should call PATCH endpoint with correct parameters', async () => {
      const store = useSettingsStore()
      const updatePayload = { payload: { key: 'updated_value' } }

      vi.spyOn(axios, 'patch').mockResolvedValueOnce({ data: {} })

      await store.updateSetting(1, updatePayload)

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/settings/1', updatePayload)
    })

    it('should handle update errors', async () => {
      const store = useSettingsStore()
      const updatePayload = { payload: { key: 'value' } }

      vi.spyOn(axios, 'patch').mockRejectedValueOnce(new Error('Update failed'))

      await expect(store.updateSetting(1, updatePayload)).rejects.toThrow('Update failed')
    })
  })

  describe('createSetting', () => {
    it('should call POST endpoint with correct parameters', async () => {
      const store = useSettingsStore()
      const createPayload = {
        name: 'new_setting',
        group: 'test',
        payload: { key: 'value' },
      }

      vi.spyOn(axios, 'post').mockResolvedValueOnce({ data: {} })

      await store.createSetting(createPayload)

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/settings', createPayload)
    })

    it('should handle create errors', async () => {
      const store = useSettingsStore()
      const createPayload = {
        name: 'new_setting',
        group: 'test',
        payload: { key: 'value' },
      }

      vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('Create failed'))

      await expect(store.createSetting(createPayload)).rejects.toThrow('Create failed')
    })
  })

  describe('deleteSetting', () => {
    it('should call DELETE endpoint and refresh settings', async () => {
      const store = useSettingsStore()

      // Set up initial settings
      store.settings = mockSettings

      vi.spyOn(axios, 'delete').mockResolvedValueOnce({})
      vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: mockSettings.slice(1) }) // Return settings without deleted one

      await store.deleteSetting(1)

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/settings/1')
      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings', { params: { group: 'zoom' } })
    })

    it('should handle delete errors', async () => {
      const store = useSettingsStore()

      vi.spyOn(axios, 'delete').mockRejectedValueOnce(new Error('Delete failed'))

      await expect(store.deleteSetting(1)).rejects.toThrow('Delete failed')
    })
  })

  describe('fetchSettingsByGroup', () => {
    it('should fetch settings for specific group', async () => {
      const store = useSettingsStore()
      const zoomSettings = [mockSettings[0], mockSettings[2]]

      vi.spyOn(axios, 'get').mockResolvedValueOnce({ data: zoomSettings })

      await store.fetchSettingsByGroup('zoom')

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings', { params: { group: 'zoom' } })
      expect(store.settings).toEqual(zoomSettings)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle different error types for group fetch', async () => {
      const store = useSettingsStore()

      const errorCases = [
        {
          error: { code: 'NETWORK_ERROR' },
          expectedMessage:
            'Network error while fetching zoom settings. Please check your connection.',
        },
        {
          error: { response: { status: 401 } },
          expectedMessage: 'You are not authorized to access zoom settings. Please log in again.',
        },
        {
          error: { response: { status: 403 } },
          expectedMessage: 'You do not have permission to view zoom settings.',
        },
        {
          error: { response: { status: 500 } },
          expectedMessage: 'Server error while fetching zoom settings. Please try again later.',
        },
        {
          error: { response: { data: { message: 'Custom error' } } },
          expectedMessage: 'Custom error',
        },
      ]

      for (const errorCase of errorCases) {
        mockedAxios.get.mockRejectedValueOnce(errorCase.error)

        try {
          await store.fetchSettingsByGroup('zoom')
        } catch {
          // Expected to throw
        }

        expect(store.error).toBe(errorCase.expectedMessage)
        expect(store.settings).toEqual([])
        expect(store.isLoading).toBe(false)
      }
    })
  })

  describe('error handling for fetchAllSettings', () => {
    it('should handle different error types', async () => {
      const store = useSettingsStore()

      const errorCases = [
        {
          error: { code: 'NETWORK_ERROR' },
          expectedMessage: 'Network error. Please check your internet connection and try again.',
        },
        {
          error: { response: { status: 401 } },
          expectedMessage: 'You are not authorized to access settings. Please log in again.',
        },
        {
          error: { response: { status: 403 } },
          expectedMessage:
            'You do not have permission to view settings. Contact your administrator.',
        },
        {
          error: { response: { status: 404 } },
          expectedMessage: 'Settings endpoint not found. Please contact your administrator.',
        },
        {
          error: { response: { status: 500 } },
          expectedMessage: 'Server error. Please try again later or contact your administrator.',
        },
        {
          error: { response: { data: { message: 'Custom error message' } } },
          expectedMessage: 'Custom error message',
        },
      ]

      for (const errorCase of errorCases) {
        mockedAxios.get.mockRejectedValueOnce(errorCase.error)

        try {
          await store.fetchAllSettings()
        } catch {
          // Expected to throw
        }

        expect(store.error).toBe(errorCase.expectedMessage)
        expect(store.settings).toEqual([])
        expect(store.isLoading).toBe(false)
      }
    })
  })

  describe('loading states', () => {
    it('should set loading state during fetchAllSettings', async () => {
      const store = useSettingsStore()

      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.spyOn(axios, 'get').mockReturnValueOnce(promise as any)

      const fetchPromise = store.fetchAllSettings()

      // Should be loading
      expect(store.isLoading).toBe(true)

      resolvePromise!({ data: mockSettings })
      await fetchPromise

      // Should not be loading anymore
      expect(store.isLoading).toBe(false)
    })

    it('should set loading state during fetchSettingsByGroup', async () => {
      const store = useSettingsStore()

      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.spyOn(axios, 'get').mockReturnValueOnce(promise as any)

      const fetchPromise = store.fetchSettingsByGroup('zoom')

      // Should be loading
      expect(store.isLoading).toBe(true)

      resolvePromise!({ data: [mockSettings[0]] })
      await fetchPromise

      // Should not be loading anymore
      expect(store.isLoading).toBe(false)
    })
  })
})
