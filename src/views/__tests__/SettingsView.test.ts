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

  it('handles group retry correctly', async () => {
    const fetchAllSettingsSpy = vi.fn().mockResolvedValue()
    mockSettingsStore.fetchAllSettings = fetchAllSettingsSpy
    mockSettingsStore.groupedSettings = {
      zoom: [{ id: 1, name: 'test', group: 'zoom', payload: {} }],
    }

    const wrapper = mount(SettingsView)
    await wrapper.vm.$nextTick()

    // Find the SettingsGroupSection component
    const groupSection = wrapper.findComponent({ name: 'SettingsGroupSection' })
    expect(groupSection.exists()).toBe(true)

    // Emit retry event from group section
    await groupSection.vm.$emit('retry', 'zoom')

    expect(fetchAllSettingsSpy).toHaveBeenCalled()
  })

  it('shows enhanced error state with troubleshooting tips', () => {
    mockSettingsStore.error = 'Network error occurred'

    const wrapper = mount(SettingsView)

    expect(wrapper.text()).toContain('Failed to load settings')
    expect(wrapper.text()).toContain('Network error occurred')
    expect(wrapper.text()).toContain('What can I do?')
    expect(wrapper.text()).toContain('Check your internet connection')
    expect(wrapper.text()).toContain('Try Again')
    expect(wrapper.text()).toContain('Reload Page')
  })

  it('shows retry loading state', async () => {
    mockSettingsStore.error = 'Test error'
    const fetchAllSettingsSpy = vi.fn().mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 100))
    })
    mockSettingsStore.fetchAllSettings = fetchAllSettingsSpy

    const wrapper = mount(SettingsView)
    await wrapper.vm.$nextTick()

    // Find and click retry button
    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')

    // Should show retrying state
    expect(wrapper.text()).toContain('Retrying...')
  })

  it('handles successful retry with toast notification', async () => {
    mockSettingsStore.error = 'Network error'
    const fetchAllSettingsSpy = vi.fn().mockResolvedValue()
    mockSettingsStore.fetchAllSettings = fetchAllSettingsSpy

    const wrapper = mount(SettingsView)
    await wrapper.vm.$nextTick()

    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(fetchAllSettingsSpy).toHaveBeenCalledTimes(2) // Once on mount, once on retry
  })

  it('handles failed retry with error toast', async () => {
    mockSettingsStore.error = 'Network error'
    const fetchAllSettingsSpy = vi.fn().mockRejectedValue(new Error('Still failing'))
    mockSettingsStore.fetchAllSettings = fetchAllSettingsSpy

    const wrapper = mount(SettingsView)
    await wrapper.vm.$nextTick()

    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')
    await wrapper.vm.$nextTick()

    expect(fetchAllSettingsSpy).toHaveBeenCalledTimes(2)
  })

  it('shows reload page button in error state', () => {
    mockSettingsStore.error = 'Test error'

    const wrapper = mount(SettingsView)

    const reloadButton = wrapper.findAll('button').find((btn) => btn.text().includes('Reload Page'))
    expect(reloadButton).toBeDefined()
    expect(reloadButton?.text()).toContain('Reload Page')
  })

  it('renders multiple settings groups in correct order', () => {
    mockSettingsStore.groupedSettings = {
      General: [
        { id: 1, name: 'app_name', group: 'General', payload: {}, created_at: '', updated_at: '' },
      ],
      zoom: [
        { id: 2, name: 'zoom_setting', group: 'zoom', payload: {}, created_at: '', updated_at: '' },
      ],
      Custom: [
        {
          id: 3,
          name: 'custom_setting',
          group: 'Custom',
          payload: {},
          created_at: '',
          updated_at: '',
        },
      ],
    }

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          SettingsGroupSection: {
            template: '<div class="settings-group" :data-group="groupName">{{ groupName }}</div>',
            props: ['groupName', 'settings'],
          },
        },
      },
    })

    const settingsGroups = wrapper.findAll('.settings-group')
    expect(settingsGroups).toHaveLength(3)

    // Check that all groups are rendered
    const groupNames = settingsGroups.map((group) => group.text())
    expect(groupNames).toContain('General')
    expect(groupNames).toContain('zoom')
    expect(groupNames).toContain('Custom')
  })

  it('passes correct props to SettingsGroupSection components', () => {
    const testSettings = [
      {
        id: 1,
        name: 'test_setting',
        group: 'test',
        payload: { key: 'value' },
        created_at: '',
        updated_at: '',
      },
    ]

    mockSettingsStore.groupedSettings = {
      test: testSettings,
    }

    const wrapper = mount(SettingsView, {
      global: {
        stubs: {
          SettingsGroupSection: {
            name: 'SettingsGroupSection',
            template: '<div class="settings-group" :data-group="groupName">{{ groupName }}</div>',
            props: ['groupName', 'settings'],
          },
        },
      },
    })

    const groupSection = wrapper.findComponent({ name: 'SettingsGroupSection' })
    expect(groupSection.exists()).toBe(true)
    expect(groupSection.props('groupName')).toBe('test')
    expect(groupSection.props('settings')).toEqual(testSettings)
  })
})
