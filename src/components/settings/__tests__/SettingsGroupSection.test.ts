import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsGroupSection from '../SettingsGroupSection.vue'
import type { Setting } from '@/types/settings'

// Mock the child components
vi.mock('../ZoomSettings.vue', () => ({
  default: {
    name: 'ZoomSettings',
    props: ['settings'],
    template: '<div data-testid="zoom-settings">Zoom Settings Component</div>',
  },
}))

vi.mock('../GenericSettings.vue', () => ({
  default: {
    name: 'GenericSettings',
    props: ['groupName', 'settings'],
    template: '<div data-testid="generic-settings">Generic Settings for {{ groupName }}</div>',
  },
}))

describe('SettingsGroupSection', () => {
  const mockSettings: Setting[] = [
    {
      id: 1,
      name: 'Test Setting',
      group: 'test',
      payload: { key: 'value' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  it('renders ZoomSettings component for zoom group', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'zoom',
        settings: mockSettings,
      },
    })

    expect(wrapper.find('[data-testid="zoom-settings"]').exists()).toBe(true)
  })

  it('renders GenericSettings component for unknown group types', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'unknown',
        settings: mockSettings,
      },
    })

    expect(wrapper.find('[data-testid="generic-settings"]').exists()).toBe(true)
  })

  it('passes correct props to GenericSettings for unknown groups', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'custom',
        settings: mockSettings,
      },
    })

    const genericComponent = wrapper.findComponent({ name: 'GenericSettings' })
    expect(genericComponent.props('groupName')).toBe('custom')
    expect(genericComponent.props('settings')).toEqual(mockSettings)
  })

  it('passes settings prop to ZoomSettings component', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'zoom',
        settings: mockSettings,
      },
    })

    const zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
    // ZoomSettings should receive settings prop but not groupName
    expect(zoomComponent.props('settings')).toEqual(mockSettings)
    expect(zoomComponent.props('groupName')).toBeUndefined()
  })
})
