import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SettingsGroupSection from '../SettingsGroupSection.vue'
import type { Setting } from '@/types/settings'

// Mock the actual child components to test integration behavior
vi.mock('../ZoomSettings.vue', () => ({
  default: {
    name: 'ZoomSettings',
    props: ['settings'],
    emits: ['updated', 'created', 'deleted'],
    template: `
      <div data-testid="zoom-settings-component">
        <h2>Zoom Settings</h2>
        <div class="zoom-accounts">
          <div v-for="setting in settings" :key="setting.id" class="zoom-account">
            <span>{{ setting.name }}</span>
            <button @click="$emit('updated', setting)" class="update-btn">Update</button>
            <button @click="$emit('deleted', setting.id)" class="delete-btn">Delete</button>
          </div>
        </div>
        <button @click="$emit('created', { name: 'New Account', payload: {} })" class="create-btn">
          Create New
        </button>
      </div>
    `,
  },
}))

vi.mock('../GeneralSettings.vue', () => ({
  default: {
    name: 'GeneralSettings',
    props: ['settings'],
    emits: ['updated'],
    template: `
      <div data-testid="general-settings-component">
        <h2>General Settings</h2>
        <div class="general-form">
          <div v-for="setting in settings" :key="setting.id" class="general-field">
            <label>{{ setting.name }}</label>
            <input :value="setting.payload.apps_name || ''" />
            <button @click="$emit('updated', setting)" class="save-btn">Save</button>
          </div>
        </div>
      </div>
    `,
  },
}))

vi.mock('../GenericSettings.vue', () => ({
  default: {
    name: 'GenericSettings',
    props: ['groupName', 'settings'],
    emits: ['updated'],
    template: `
      <div data-testid="generic-settings-component">
        <h2>{{ groupName }} Settings</h2>
        <div class="generic-warning">
          Unknown setting type: {{ groupName }}
        </div>
        <div class="generic-settings">
          <div v-for="setting in settings" :key="setting.id" class="generic-setting">
            <span>{{ setting.name }}</span>
            <pre>{{ JSON.stringify(setting.payload, null, 2) }}</pre>
            <button @click="$emit('updated', setting)" class="edit-btn">Edit</button>
          </div>
        </div>
      </div>
    `,
  },
}))

vi.mock('../SettingsErrorBoundary.vue', () => ({
  default: {
    name: 'SettingsErrorBoundary',
    props: ['fallbackTitle', 'fallbackMessage'],
    emits: ['retry'],
    template: `
      <div data-testid="error-boundary">
        <slot />
        <div v-if="showError" class="error-fallback">
          <h3>{{ fallbackTitle }}</h3>
          <p>{{ fallbackMessage }}</p>
          <button @click="$emit('retry')" class="error-retry-btn">Retry</button>
        </div>
      </div>
    `,
    data() {
      return { showError: false }
    },
  },
}))

describe('SettingsGroupSection Integration Tests', () => {
  let pinia: ReturnType<typeof createPinia>

  const mockZoomSettings: Setting[] = [
    {
      id: 1,
      name: 'Primary Zoom Account',
      group: 'zoom',
      payload: {
        client_id: 'test_client_id',
        client_secret: 'test_client_secret',
        account_id: 'test_account_id',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Secondary Zoom Account',
      group: 'zoom',
      payload: {
        client_id: 'test_client_id_2',
        client_secret: 'test_client_secret_2',
        account_id: 'test_account_id_2',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockGeneralSettings: Setting[] = [
    {
      id: 3,
      name: 'Application Name',
      group: 'General',
      payload: {
        apps_name: 'BPKAD Meeting Management',
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  const mockCustomSettings: Setting[] = [
    {
      id: 4,
      name: 'Custom Feature Toggle',
      group: 'Custom',
      payload: {
        feature_enabled: true,
        max_participants: 100,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    vi.clearAllMocks()
  })

  describe('Component Mapping and Rendering', () => {
    it('should render ZoomSettings component for zoom group with correct props', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify ZoomSettings component is rendered
      const zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
      expect(zoomComponent.exists()).toBe(true)
      expect(wrapper.find('[data-testid="zoom-settings-component"]').exists()).toBe(true)

      // Verify correct props are passed
      expect(zoomComponent.props('settings')).toEqual(mockZoomSettings)
      expect(zoomComponent.props('groupName')).toBeUndefined() // ZoomSettings doesn't need groupName

      // Verify content is rendered correctly
      expect(wrapper.text()).toContain('Zoom Settings')
      expect(wrapper.text()).toContain('Primary Zoom Account')
      expect(wrapper.text()).toContain('Secondary Zoom Account')
    })

    it('should render GeneralSettings component for General group with correct props', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'General',
          settings: mockGeneralSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify GeneralSettings component is rendered
      const generalComponent = wrapper.findComponent({ name: 'GeneralSettings' })
      expect(generalComponent.exists()).toBe(true)
      expect(wrapper.find('[data-testid="general-settings-component"]').exists()).toBe(true)

      // Verify correct props are passed
      expect(generalComponent.props('settings')).toEqual(mockGeneralSettings)
      expect(generalComponent.props('groupName')).toBeUndefined() // GeneralSettings doesn't need groupName

      // Verify content is rendered correctly
      expect(wrapper.text()).toContain('General Settings')
      expect(wrapper.text()).toContain('Application Name')
    })

    it('should render GenericSettings component for unknown groups with correct props', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'Custom',
          settings: mockCustomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify GenericSettings component is rendered
      const genericComponent = wrapper.findComponent({ name: 'GenericSettings' })
      expect(genericComponent.exists()).toBe(true)
      expect(wrapper.find('[data-testid="generic-settings-component"]').exists()).toBe(true)

      // Verify correct props are passed
      expect(genericComponent.props('groupName')).toBe('Custom')
      expect(genericComponent.props('settings')).toEqual(mockCustomSettings)

      // Verify content is rendered correctly
      expect(wrapper.text()).toContain('Custom Settings')
      expect(wrapper.text()).toContain('Unknown setting type: Custom')
      expect(wrapper.text()).toContain('Custom Feature Toggle')
    })

    it('should handle case-sensitive group names correctly', async () => {
      const testCases = [
        { groupName: 'zoom', expectedComponent: 'ZoomSettings' },
        { groupName: 'ZOOM', expectedComponent: 'GenericSettings' },
        { groupName: 'Zoom', expectedComponent: 'GenericSettings' },
        { groupName: 'General', expectedComponent: 'GeneralSettings' },
        { groupName: 'general', expectedComponent: 'GenericSettings' },
        { groupName: 'GENERAL', expectedComponent: 'GenericSettings' },
      ]

      for (const testCase of testCases) {
        const wrapper = mount(SettingsGroupSection, {
          props: {
            groupName: testCase.groupName,
            settings: mockCustomSettings,
          },
          global: {
            plugins: [pinia],
          },
        })

        await flushPromises()

        const expectedComponent = wrapper.findComponent({ name: testCase.expectedComponent })
        expect(expectedComponent.exists()).toBe(true)

        wrapper.unmount()
      }
    })
  })

  describe('Error Boundary Integration', () => {
    it('should wrap all components in SettingsErrorBoundary', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Verify error boundary is present
      const errorBoundary = wrapper.findComponent({ name: 'SettingsErrorBoundary' })
      expect(errorBoundary.exists()).toBe(true)
      expect(wrapper.find('[data-testid="error-boundary"]').exists()).toBe(true)

      // Verify error boundary has correct props
      expect(errorBoundary.props('fallbackTitle')).toBe('Error loading zoom settings')
      expect(errorBoundary.props('fallbackMessage')).toBe(
        'There was a problem loading the zoom settings. Please try again.',
      )
    })

    it('should emit retry event when error boundary retries', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'test',
          settings: mockCustomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Trigger retry from error boundary
      const errorBoundary = wrapper.findComponent({ name: 'SettingsErrorBoundary' })
      await errorBoundary.vm.$emit('retry')

      // Verify retry event is emitted with correct group name
      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')?.[0]).toEqual(['test'])
    })

    it('should provide appropriate error messages for different groups', async () => {
      const testCases = [
        {
          groupName: 'zoom',
          expectedTitle: 'Error loading zoom settings',
          expectedMessage: 'There was a problem loading the zoom settings. Please try again.',
        },
        {
          groupName: 'General',
          expectedTitle: 'Error loading General settings',
          expectedMessage: 'There was a problem loading the general settings. Please try again.',
        },
        {
          groupName: 'CustomGroup',
          expectedTitle: 'Error loading CustomGroup settings',
          expectedMessage:
            'There was a problem loading the customgroup settings. Please try again.',
        },
      ]

      for (const testCase of testCases) {
        const wrapper = mount(SettingsGroupSection, {
          props: {
            groupName: testCase.groupName,
            settings: [],
          },
          global: {
            plugins: [pinia],
          },
        })

        await flushPromises()

        const errorBoundary = wrapper.findComponent({ name: 'SettingsErrorBoundary' })
        expect(errorBoundary.props('fallbackTitle')).toBe(testCase.expectedTitle)
        expect(errorBoundary.props('fallbackMessage')).toBe(testCase.expectedMessage)

        wrapper.unmount()
      }
    })
  })

  describe('Event Handling and Communication', () => {
    it('should handle CRUD events from ZoomSettings component', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })

      // Test update event
      await zoomComponent.vm.$emit('updated', mockZoomSettings[0])
      expect(zoomComponent.emitted('updated')).toBeTruthy()

      // Test create event
      await zoomComponent.vm.$emit('created', { name: 'New Account', payload: {} })
      expect(zoomComponent.emitted('created')).toBeTruthy()

      // Test delete event
      await zoomComponent.vm.$emit('deleted', 1)
      expect(zoomComponent.emitted('deleted')).toBeTruthy()
    })

    it('should handle events from GeneralSettings component', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'General',
          settings: mockGeneralSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const generalComponent = wrapper.findComponent({ name: 'GeneralSettings' })

      // Test update event
      await generalComponent.vm.$emit('updated', mockGeneralSettings[0])
      expect(generalComponent.emitted('updated')).toBeTruthy()
    })

    it('should handle events from GenericSettings component', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'Custom',
          settings: mockCustomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const genericComponent = wrapper.findComponent({ name: 'GenericSettings' })

      // Test update event
      await genericComponent.vm.$emit('updated', mockCustomSettings[0])
      expect(genericComponent.emitted('updated')).toBeTruthy()
    })
  })

  describe('Props Validation and Edge Cases', () => {
    it('should handle empty settings array gracefully', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: [],
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      const zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
      expect(zoomComponent.exists()).toBe(true)
      expect(zoomComponent.props('settings')).toEqual([])
    })

    it('should handle null or undefined settings gracefully', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: null as any,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Should still render without crashing
      const zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
      expect(zoomComponent.exists()).toBe(true)
    })

    it('should handle malformed settings data', async () => {
      const malformedSettings = [
        {
          id: 1,
          name: 'Valid Setting',
          group: 'zoom',
          payload: { key: 'value' },
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          // Missing required fields
          payload: {},
        } as any,
      ]

      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: malformedSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Should render without crashing
      const zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
      expect(zoomComponent.exists()).toBe(true)
      expect(zoomComponent.props('settings')).toEqual(malformedSettings)
    })

    it('should handle very long group names', async () => {
      const longGroupName = 'A'.repeat(100)

      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: longGroupName,
          settings: mockCustomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Should fall back to GenericSettings
      const genericComponent = wrapper.findComponent({ name: 'GenericSettings' })
      expect(genericComponent.exists()).toBe(true)
      expect(genericComponent.props('groupName')).toBe(longGroupName)
    })

    it('should handle special characters in group names', async () => {
      const specialGroupNames = [
        'group-with-dashes',
        'group_with_underscores',
        'group.with.dots',
        'group with spaces',
        'group@with#special$chars',
      ]

      for (const groupName of specialGroupNames) {
        const wrapper = mount(SettingsGroupSection, {
          props: {
            groupName,
            settings: mockCustomSettings,
          },
          global: {
            plugins: [pinia],
          },
        })

        await flushPromises()

        // Should render GenericSettings for all special group names
        const genericComponent = wrapper.findComponent({ name: 'GenericSettings' })
        expect(genericComponent.exists()).toBe(true)
        expect(genericComponent.props('groupName')).toBe(groupName)

        wrapper.unmount()
      }
    })
  })

  describe('Component Lifecycle and State Management', () => {
    it('should maintain component state during prop updates', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: [mockZoomSettings[0]],
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Initial state
      let zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
      expect(zoomComponent.props('settings')).toHaveLength(1)

      // Update props
      await wrapper.setProps({
        settings: mockZoomSettings,
      })

      // Component should update with new props
      zoomComponent = wrapper.findComponent({ name: 'ZoomSettings' })
      expect(zoomComponent.props('settings')).toHaveLength(2)
    })

    it('should switch components when group name changes', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Initially should render ZoomSettings
      expect(wrapper.findComponent({ name: 'ZoomSettings' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'GeneralSettings' }).exists()).toBe(false)

      // Change group name
      await wrapper.setProps({
        groupName: 'General',
        settings: mockGeneralSettings,
      })

      // Should now render GeneralSettings
      expect(wrapper.findComponent({ name: 'ZoomSettings' }).exists()).toBe(false)
      expect(wrapper.findComponent({ name: 'GeneralSettings' }).exists()).toBe(true)
    })

    it('should handle rapid prop changes gracefully', async () => {
      const wrapper = mount(SettingsGroupSection, {
        props: {
          groupName: 'zoom',
          settings: mockZoomSettings,
        },
        global: {
          plugins: [pinia],
        },
      })

      await flushPromises()

      // Rapidly change props
      await wrapper.setProps({ groupName: 'General', settings: mockGeneralSettings })
      await wrapper.setProps({ groupName: 'Custom', settings: mockCustomSettings })
      await wrapper.setProps({ groupName: 'zoom', settings: mockZoomSettings })

      // Should end up with ZoomSettings
      expect(wrapper.findComponent({ name: 'ZoomSettings' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'ZoomSettings' }).props('settings')).toEqual(
        mockZoomSettings,
      )
    })
  })
})
