import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GeneralSettings from '../GeneralSettings.vue'
import type { Setting } from '@/types/settings'

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('GeneralSettings Integration', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
  })

  it('should render the apps_name value from API response correctly', async () => {
    // This matches the actual API response format you provided
    const mockSettings: Setting[] = [
      {
        id: 2,
        name: 'Application Name',
        group: 'General',
        payload: {
          apps_name: 'BPKAD Meeting',
        },
        created_at: '2025-07-25T23:59:39.000000Z',
        updated_at: '2025-07-25T23:59:39.000000Z',
      },
    ]

    const wrapper = mount(GeneralSettings, {
      props: {
        settings: mockSettings,
      },
      global: {
        plugins: [pinia],
      },
    })

    // Wait for component to initialize
    await wrapper.vm.$nextTick()

    // The input should be populated with the value from the API
    const input = wrapper.find('input[id="apps-name"]')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('BPKAD Meeting')
  })

  it('should handle settings with apps_name in payload regardless of name field', async () => {
    const mockSettings: Setting[] = [
      {
        id: 1,
        name: 'Some Other Name', // Different name field
        group: 'General',
        payload: {
          apps_name: 'Test Application Name',
        },
        created_at: '2025-07-25T23:59:39.000000Z',
        updated_at: '2025-07-25T23:59:39.000000Z',
      },
    ]

    const wrapper = mount(GeneralSettings, {
      props: {
        settings: mockSettings,
      },
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.vm.$nextTick()

    // Should still find and use the setting with apps_name in payload
    const input = wrapper.find('input[id="apps-name"]')
    expect((input.element as HTMLInputElement).value).toBe('Test Application Name')
  })

  it('should show empty state when no setting with apps_name exists', async () => {
    const mockSettings: Setting[] = [
      {
        id: 1,
        name: 'Other Setting',
        group: 'General',
        payload: {
          other_field: 'some value',
        },
        created_at: '2025-07-25T23:59:39.000000Z',
        updated_at: '2025-07-25T23:59:39.000000Z',
      },
    ]

    const wrapper = mount(GeneralSettings, {
      props: {
        settings: mockSettings,
      },
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.vm.$nextTick()

    // Should show empty state
    expect(wrapper.text()).toContain('No General Settings')
    expect(wrapper.text()).toContain('Configure your first general setting above')
  })

  it('should handle empty settings array', async () => {
    const wrapper = mount(GeneralSettings, {
      props: {
        settings: [],
      },
      global: {
        plugins: [pinia],
      },
    })

    await wrapper.vm.$nextTick()

    // Should show empty state
    expect(wrapper.text()).toContain('No General Settings')
  })
})
