import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GeneralSettings from '../GeneralSettings.vue'
import { useSettingsStore } from '@/stores/settings'
import type { Setting } from '@/types/settings'

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  LoaderCircle: {
    name: 'LoaderCircle',
    template: '<div data-testid="loader-circle"></div>',
  },
  Settings: {
    name: 'Settings',
    template: '<div data-testid="settings-icon"></div>',
  },
}))

// Mock Skeleton component
vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: {
    name: 'Skeleton',
    template: '<div data-testid="skeleton"></div>',
    props: ['class'],
  },
}))

describe('GeneralSettings', () => {
  let settingsStore: ReturnType<typeof useSettingsStore>

  const mockGeneralSetting: Setting = {
    id: 1,
    name: 'apps_name',
    group: 'General',
    payload: {
      apps_name: 'Test Application',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    settingsStore = useSettingsStore()

    // Mock store methods
    vi.spyOn(settingsStore, 'updateSetting').mockResolvedValue({})
    vi.spyOn(settingsStore, 'createSetting').mockResolvedValue({})
    vi.spyOn(settingsStore, 'fetchAllSettings').mockResolvedValue()
  })

  it('renders correctly with empty settings', () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [],
      },
    })

    expect(wrapper.find('h1').text()).toBe('General Settings')
    expect(wrapper.text()).toContain('Configure general application settings')
  })

  it('renders the component title', () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [],
      },
    })

    expect(wrapper.find('h1').text()).toBe('General Settings')
  })

  it('initializes form with existing setting data', async () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [mockGeneralSetting],
      },
    })

    // Wait for initialization
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    const input = wrapper.find('input[id="apps-name"]')
    expect(input.exists()).toBe(true)
  })

  it('renders form when initialized', async () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [mockGeneralSetting],
      },
    })

    // Wait for initialization
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[id="apps-name"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('button[type="button"]').exists()).toBe(true)
  })

  it('shows form when initialized with empty settings', async () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [],
      },
    })

    // Wait for initialization
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Should show the form even with empty settings
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[id="apps-name"]').exists()).toBe(true)
  })

  it('has proper form structure', async () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [],
      },
    })

    // Wait for initialization
    await wrapper.vm.$nextTick()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check form elements exist
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.find('input[id="apps-name"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('button[type="button"]').exists()).toBe(true)
  })
})
