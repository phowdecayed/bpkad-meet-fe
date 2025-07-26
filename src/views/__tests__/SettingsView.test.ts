import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsView from '../SettingsView.vue'
import { useSettingsStore } from '@/stores/settings'

// Mock the settings store
vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(),
}))

describe('SettingsView', () => {
  let mockSettingsStore: unknown

  beforeEach(() => {
    setActivePinia(createPinia())

    mockSettingsStore = {
      isLoading: false,
      error: null,
      groupedSettings: {},
      fetchAllSettings: vi.fn(),
    }

    vi.mocked(useSettingsStore).mockReturnValue(mockSettingsStore)
  })

  it('renders loading state correctly', () => {
    mockSettingsStore.isLoading = true

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          Skeleton: {
            template: '<div class="skeleton-loader"></div>',
          },
        },
      },
    })

    // Should show skeleton loaders
    expect(wrapper.find('.skeleton-loader').exists()).toBe(true)
  })

  it('renders error state correctly', () => {
    mockSettingsStore.error = 'Failed to fetch settings'

    const wrapper = mount(SettingsView)

    // Should show error message and retry button
    expect(wrapper.text()).toContain('Failed to load settings')
    expect(wrapper.text()).toContain('Failed to fetch settings')
    expect(wrapper.find('button').text()).toContain('Try Again')
  })

  it('renders empty state when no settings are available', () => {
    mockSettingsStore.groupedSettings = {}

    const wrapper = mount(SettingsView)

    // Should show empty state message
    expect(wrapper.text()).toContain('No settings configured')
    expect(wrapper.text()).toContain('Contact your administrator')
  })

  it('renders settings groups when data is available', () => {
    mockSettingsStore.groupedSettings = {
      zoom: [
        { id: 1, name: 'zoom_setting', group: 'zoom', payload: {}, created_at: '', updated_at: '' },
      ],
      General: [
        { id: 2, name: 'app_name', group: 'General', payload: {}, created_at: '', updated_at: '' },
      ],
    }

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          SettingsGroupSection: {
            template: '<div class="settings-group">{{ groupName }}</div>',
            props: ['groupName', 'settings'],
          },
        },
      },
    })

    // Should render settings groups
    const settingsGroups = wrapper.findAll('.settings-group')
    expect(settingsGroups).toHaveLength(2)
  })

  it('calls fetchAllSettings on mount', () => {
    mount(SettingsView)

    expect(mockSettingsStore.fetchAllSettings).toHaveBeenCalledOnce()
  })

  it('calls fetchAllSettings when retry button is clicked', async () => {
    mockSettingsStore.error = 'Network error'

    const wrapper = mount(SettingsView)

    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')

    expect(mockSettingsStore.fetchAllSettings).toHaveBeenCalledTimes(2) // Once on mount, once on retry
  })
})
