import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ZoomSettings from '../ZoomSettings.vue'
import { useSettingsStore } from '@/stores/settings'
import type { Setting } from '@/types/settings'

// Mock axios
vi.mock('axios')

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockZoomSettings: Setting[] = [
  {
    id: 1,
    name: 'Primary Zoom Account',
    group: 'zoom',
    payload: {
      client_id: 'test_client_id',
      client_secret: 'test_client_secret',
      account_id: 'test_account_id',
      host_key: 'test_host_key',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('ZoomSettings Integration', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  describe('SettingsGroupSection Integration', () => {
    it('should accept settings via props and not fetch its own data', async () => {
      const settingsStore = useSettingsStore()
      const fetchSpy = vi.spyOn(settingsStore, 'fetchSettingsByGroup')

      const wrapper = mount(ZoomSettings, {
        props: {
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      // Should not call fetchSettingsByGroup when settings are provided via props
      expect(fetchSpy).not.toHaveBeenCalled()

      // Should display the provided settings
      expect(wrapper.text()).toContain('Primary Zoom Account')
    })

    it('should fetch its own data when no props are provided (backward compatibility)', async () => {
      const settingsStore = useSettingsStore()
      const fetchSpy = vi.spyOn(settingsStore, 'fetchSettingsByGroup').mockResolvedValue()
      settingsStore.settings = mockZoomSettings

      mount(ZoomSettings, {
        global: {
          plugins: [pinia],
        },
      })

      // Should call fetchSettingsByGroup when no settings props provided
      expect(fetchSpy).toHaveBeenCalledWith('zoom')
    })

    it('should use provided settings over store settings when both are available', async () => {
      const settingsStore = useSettingsStore()
      vi.spyOn(settingsStore, 'fetchSettingsByGroup').mockResolvedValue()

      // Set different settings in store
      settingsStore.settings = [
        {
          id: 999,
          name: 'Store Setting',
          group: 'zoom',
          payload: {},
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      const wrapper = mount(ZoomSettings, {
        props: {
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      // Should display prop settings, not store settings
      expect(wrapper.text()).toContain('Primary Zoom Account')
      expect(wrapper.text()).not.toContain('Store Setting')
    })

    it('should handle empty settings array gracefully', async () => {
      const wrapper = mount(ZoomSettings, {
        props: {
          settings: [],
        },
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.text()).toContain('No Zoom Accounts')
    })

    it('should refresh all settings when using props and performing CRUD operations', async () => {
      const settingsStore = useSettingsStore()
      const fetchAllSpy = vi.spyOn(settingsStore, 'fetchAllSettings').mockResolvedValue()
      const updateSpy = vi
        .spyOn(settingsStore, 'updateSetting')
        .mockResolvedValue({ data: mockZoomSettings[0] } as any)

      const wrapper = mount(ZoomSettings, {
        props: {
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      // Access the component instance to call methods directly
      const component = wrapper.vm as any

      // Test update operation
      await component.handleUpdate(mockZoomSettings[0])

      expect(updateSpy).toHaveBeenCalledWith(1, mockZoomSettings[0].payload)
      expect(fetchAllSpy).toHaveBeenCalled()
    })

    it('should refresh group settings when not using props and performing CRUD operations', async () => {
      const settingsStore = useSettingsStore()
      const fetchGroupSpy = vi.spyOn(settingsStore, 'fetchSettingsByGroup').mockResolvedValue()
      const updateSpy = vi
        .spyOn(settingsStore, 'updateSetting')
        .mockResolvedValue({ data: mockZoomSettings[0] } as any)
      settingsStore.settings = mockZoomSettings

      const wrapper = mount(ZoomSettings, {
        global: {
          plugins: [pinia],
        },
      })

      // Clear the initial fetch call
      fetchGroupSpy.mockClear()

      // Access the component instance to call methods directly
      const component = wrapper.vm as any

      // Test update operation
      await component.handleUpdate(mockZoomSettings[0])

      expect(updateSpy).toHaveBeenCalledWith(1, mockZoomSettings[0].payload)
      expect(fetchGroupSpy).toHaveBeenCalledWith('zoom')
    })
  })
})
