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
      mockedAxios.get.mockResolvedValueOnce({ data: mockSettings })

      await store.fetchAllSettings()

      expect(mockedAxios.get).toHaveBeenCalledWith('/api/settings')
      expect(store.settings).toEqual(mockSettings)
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(null)
    })

    it('should handle fetch errors', async () => {
      const store = useSettingsStore()
      const errorMessage = 'Network error'
      mockedAxios.get.mockRejectedValueOnce({
        response: { data: { message: errorMessage } },
      })

      await store.fetchAllSettings()

      expect(store.settings).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBe(errorMessage)
    })
  })

  describe('groupedSettings computed property', () => {
    it('should group settings by their group property', async () => {
      const store = useSettingsStore()
      mockedAxios.get.mockResolvedValueOnce({ data: mockSettings })

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
})
