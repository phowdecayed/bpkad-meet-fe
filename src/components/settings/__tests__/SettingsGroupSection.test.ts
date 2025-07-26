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

  it('renders GeneralSettings component for General group', () => {
    vi.mock('../GeneralSettings.vue', () => ({
      default: {
        name: 'GeneralSettings',
        props: ['settings'],
        template: '<div data-testid="general-settings">General Settings Component</div>',
      },
    }))

    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'General',
        settings: mockSettings,
      },
    })

    expect(wrapper.find('[data-testid="general-settings"]').exists()).toBe(true)
  })

  it('passes correct props to GeneralSettings component', () => {
    vi.mock('../GeneralSettings.vue', () => ({
      default: {
        name: 'GeneralSettings',
        props: ['settings'],
        template: '<div data-testid="general-settings">General Settings Component</div>',
      },
    }))

    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'General',
        settings: mockSettings,
      },
    })

    const generalComponent = wrapper.findComponent({ name: 'GeneralSettings' })
    expect(generalComponent.props('settings')).toEqual(mockSettings)
    expect(generalComponent.props('groupName')).toBeUndefined()
  })

  it('wraps components in SettingsErrorBoundary', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'zoom',
        settings: mockSettings,
      },
      global: {
        stubs: {
          SettingsErrorBoundary: {
            template: '<div data-testid="error-boundary"><slot /></div>',
            props: ['fallbackTitle', 'fallbackMessage'],
          },
        },
      },
    })

    expect(wrapper.find('[data-testid="error-boundary"]').exists()).toBe(true)
  })

  it('emits retry event when error boundary retries', async () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'test',
        settings: mockSettings,
      },
      global: {
        stubs: {
          SettingsErrorBoundary: {
            template: '<div><button @click="$emit(\'retry\')">Retry</button><slot /></div>',
            props: ['fallbackTitle', 'fallbackMessage'],
            emits: ['retry'],
          },
        },
      },
    })

    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')

    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')?.[0]).toEqual(['test'])
  })

  it('handles empty settings array', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'empty',
        settings: [],
      },
    })

    const genericComponent = wrapper.findComponent({ name: 'GenericSettings' })
    expect(genericComponent.props('settings')).toEqual([])
    expect(genericComponent.props('groupName')).toBe('empty')
  })

  it('handles case-sensitive group names', () => {
    const wrapper = mount(SettingsGroupSection, {
      props: {
        groupName: 'ZOOM', // Different case
        settings: mockSettings,
      },
    })

    // Should fall back to GenericSettings for case-sensitive mismatch
    expect(wrapper.find('[data-testid="generic-settings"]').exists()).toBe(true)
  })
})
