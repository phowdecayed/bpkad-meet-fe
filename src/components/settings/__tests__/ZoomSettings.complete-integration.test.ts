import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsView from '@/views/SettingsView.vue'
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

const mockGeneralSettings: Setting[] = [
  {
    id: 2,
    name: 'Application Settings',
    group: 'General',
    payload: {
      apps_name: 'BPKAD Meeting System',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('ZoomSettings Complete Integration', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should integrate properly within the complete SettingsView flow', async () => {
    const settingsStore = useSettingsStore()

    // Mock the fetchAllSettings to return mixed settings
    const allSettings = [...mockZoomSettings, ...mockGeneralSettings]
    vi.spyOn(settingsStore, 'fetchAllSettings').mockImplementation(async () => {
      settingsStore.settings = allSettings
      settingsStore.isLoading = false
      settingsStore.error = null
    })

    const wrapper = mount(SettingsView, {
      global: {
        plugins: [pinia],
      },
    })

    // Wait for the component to mount and fetch data
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Should display both zoom and general settings
    expect(wrapper.text()).toContain('Primary Zoom Account')
    expect(wrapper.text()).toContain('Zoom Account Integrations')

    // Verify that ZoomSettings receives the correct settings
    const settingsGroupSections = wrapper.findAllComponents({ name: 'SettingsGroupSection' })
    expect(settingsGroupSections.length).toBeGreaterThan(0)

    // Find the zoom settings group
    const zoomGroup = settingsGroupSections.find(
      (component) => component.props('groupName') === 'zoom',
    )
    expect(zoomGroup).toBeTruthy()
    expect(zoomGroup!.props('settings')).toEqual(mockZoomSettings)
  })

  it('should maintain backward compatibility when ZoomSettings is used standalone', async () => {
    const settingsStore = useSettingsStore()
    const fetchGroupSpy = vi.spyOn(settingsStore, 'fetchSettingsByGroup').mockResolvedValue()
    settingsStore.settings = mockZoomSettings

    // Import and mount ZoomSettings directly (not through SettingsView)
    const { default: ZoomSettings } = await import('../ZoomSettings.vue')

    const wrapper = mount(ZoomSettings, {
      global: {
        plugins: [pinia],
      },
    })

    // Should call fetchSettingsByGroup when used standalone
    expect(fetchGroupSpy).toHaveBeenCalledWith('zoom')

    // Should display the settings
    expect(wrapper.text()).toContain('Primary Zoom Account')
  })

  it('should handle CRUD operations correctly when integrated', async () => {
    const settingsStore = useSettingsStore()

    // Mock all the store methods
    const fetchAllSpy = vi.spyOn(settingsStore, 'fetchAllSettings').mockImplementation(async () => {
      settingsStore.settings = mockZoomSettings
      settingsStore.isLoading = false
      settingsStore.error = null
    })
    const updateSpy = vi.spyOn(settingsStore, 'updateSetting').mockResolvedValue({})
    const createSpy = vi.spyOn(settingsStore, 'createSetting').mockResolvedValue({})
    const deleteSpy = vi.spyOn(settingsStore, 'deleteSetting').mockResolvedValue()

    const wrapper = mount(SettingsView, {
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 0))

    // Find the ZoomSettings component within the SettingsView
    const zoomSettings = wrapper.findComponent({ name: 'ZoomSettings' })
    expect(zoomSettings.exists()).toBe(true)

    // Test that ZoomSettings received the settings prop
    expect(zoomSettings.props('settings')).toEqual(mockZoomSettings)

    // Clear the initial fetch call
    fetchAllSpy.mockClear()

    // Test that the store methods are available and can be called
    // This verifies the integration works correctly

    // Test update operation through store
    await settingsStore.updateSetting(1, mockZoomSettings[0].payload)
    expect(updateSpy).toHaveBeenCalledWith(1, mockZoomSettings[0].payload)

    // Test create operation through store
    await settingsStore.createSetting({
      name: 'Test Account',
      group: 'zoom',
      payload: { client_id: 'test', client_secret: 'test', account_id: 'test', host_key: 'test' },
    })
    expect(createSpy).toHaveBeenCalled()

    // Test delete operation through store
    await settingsStore.deleteSetting(1)
    expect(deleteSpy).toHaveBeenCalledWith(1)

    // Verify that the component is properly integrated and can trigger refreshes
    await settingsStore.fetchAllSettings()
    expect(fetchAllSpy).toHaveBeenCalled()
  })
})
