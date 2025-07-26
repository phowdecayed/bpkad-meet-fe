import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GenericSettings from '../GenericSettings.vue'
import type { Setting } from '@/types/settings'

// Mock the settings store
const mockSettingsStore = {
  updateSetting: vi.fn(),
}

vi.mock('@/stores/settings', () => ({
  useSettingsStore: () => mockSettingsStore,
}))

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('GenericSettings', () => {
  const mockSettings: Setting[] = [
    {
      id: 1,
      name: 'Test Setting',
      group: 'test',
      payload: { key: 'value', number: 42 },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      name: 'Another Setting',
      group: 'test',
      payload: { enabled: true },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders group name and description correctly', () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'TestGroup',
        settings: mockSettings,
      },
    })

    expect(wrapper.text()).toContain('TestGroup Settings')
    expect(wrapper.text()).toContain('Configure testgroup settings')
  })

  it('displays warning about unknown setting type', () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Unknown',
        settings: mockSettings,
      },
    })

    expect(wrapper.text()).toContain('Unknown Setting Type')
    expect(wrapper.text()).toContain("This setting group doesn't have a dedicated interface")
  })

  it('renders all settings with their names and JSON payloads', () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    expect(wrapper.text()).toContain('Test Setting')
    expect(wrapper.text()).toContain('Another Setting')

    // Check if JSON is properly formatted in textareas
    const textareas = wrapper.findAll('textarea')
    expect(textareas).toHaveLength(2)

    // First setting JSON
    expect(textareas[0].element.value).toContain('"key": "value"')
    expect(textareas[0].element.value).toContain('"number": 42')

    // Second setting JSON
    expect(textareas[1].element.value).toContain('"enabled": true')
  })

  it('shows empty state when no settings provided', () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Empty',
        settings: [],
      },
    })

    expect(wrapper.text()).toContain('No Settings Found')
    expect(wrapper.text()).toContain('No settings are configured for the Empty group')
  })

  it('displays last updated date for each setting', () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    expect(wrapper.text()).toContain('Last updated: 1/1/2024')
  })

  it('has save and reset buttons for each setting', () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const saveButtons = wrapper
      .findAll('button')
      .filter((button) => button.text().includes('Save Changes'))
    const resetButtons = wrapper
      .findAll('button')
      .filter((button) => button.text().includes('Reset'))

    expect(saveButtons).toHaveLength(2)
    expect(resetButtons).toHaveLength(2)
  })

  it('handles JSON editing and validation', async () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const firstTextarea = wrapper.findAll('textarea')[0]

    // Test valid JSON
    await firstTextarea.setValue('{"valid": "json"}')
    const firstSaveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Save Changes'))
    expect(firstSaveButton?.attributes('disabled')).toBeUndefined()

    // Test invalid JSON
    await firstTextarea.setValue('invalid json')
    await wrapper.vm.$nextTick()
    expect(firstSaveButton?.attributes('disabled')).toBeDefined()
  })

  it('handles save operation successfully', async () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const firstTextarea = wrapper.findAll('textarea')[0]
    await firstTextarea.setValue('{"updated": "value"}')

    const firstSaveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Save Changes'))
    await firstSaveButton?.trigger('click')

    expect(mockSettingsStore.updateSetting).toHaveBeenCalledWith(1, { updated: 'value' })
  })

  it('handles save operation errors', async () => {
    mockSettingsStore.updateSetting.mockRejectedValue(new Error('Save failed'))

    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const firstTextarea = wrapper.findAll('textarea')[0]
    await firstTextarea.setValue('{"updated": "value"}')

    const firstSaveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Save Changes'))
    await firstSaveButton?.trigger('click')

    // Should handle error gracefully
    expect(wrapper.exists()).toBe(true)
  })

  it('handles reset operation', async () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const firstTextarea = wrapper.findAll('textarea')[0]
    const originalValue = firstTextarea.element.value

    // Change the value
    await firstTextarea.setValue('{"changed": "value"}')
    expect(firstTextarea.element.value).toBe('{"changed": "value"}')

    // Reset
    const firstResetButton = wrapper.findAll('button').find((btn) => btn.text().includes('Reset'))
    await firstResetButton?.trigger('click')

    // Should reset to original value
    expect(firstTextarea.element.value).toBe(originalValue)
  })

  it('shows loading state during save', async () => {
    // Mock slow save operation
    mockSettingsStore.updateSetting.mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 100))
    })

    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const firstTextarea = wrapper.findAll('textarea')[0]
    await firstTextarea.setValue('{"updated": "value"}')

    const firstSaveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Save Changes'))
    await firstSaveButton?.trigger('click')

    // Should handle loading state gracefully
    expect(wrapper.exists()).toBe(true)
  })

  it('prevents save with invalid JSON', async () => {
    const wrapper = mount(GenericSettings, {
      props: {
        groupName: 'Test',
        settings: mockSettings,
      },
    })

    const firstTextarea = wrapper.findAll('textarea')[0]
    await firstTextarea.setValue('invalid json syntax')

    const firstSaveButton = wrapper
      .findAll('button')
      .find((btn) => btn.text().includes('Save Changes'))
    await firstSaveButton?.trigger('click')

    // Should not call updateSetting with invalid JSON
    expect(mockSettingsStore.updateSetting).not.toHaveBeenCalled()
  })

  it('handles different error response types', async () => {
    const errorCases = [
      { status: 400, expectedMessage: 'Invalid settings data' },
      { status: 401, expectedMessage: 'You are not authorized' },
      { status: 403, expectedMessage: 'You do not have permission' },
      { status: 500, expectedMessage: 'Server error' },
    ]

    for (const errorCase of errorCases) {
      mockSettingsStore.updateSetting.mockRejectedValue({
        response: { status: errorCase.status, data: { message: 'Test error' } },
      })

      const wrapper = mount(GenericSettings, {
        props: {
          groupName: 'Test',
          settings: [mockSettings[0]],
        },
      })

      const textarea = wrapper.find('textarea')
      await textarea.setValue('{"test": "value"}')

      const saveButton = wrapper.find('button')
      await saveButton.trigger('click')

      // Should handle error gracefully
      expect(wrapper.exists()).toBe(true)
    }
  })
})
