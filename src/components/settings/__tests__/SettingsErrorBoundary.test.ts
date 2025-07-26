import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SettingsErrorBoundary from '../SettingsErrorBoundary.vue'

// Mock lucide-vue-next icons
vi.mock('lucide-vue-next', () => ({
  AlertTriangle: { template: '<div data-testid="alert-triangle" />' },
  RefreshCw: { template: '<div data-testid="refresh-cw" />' },
}))

describe('SettingsErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    const wrapper = mount(SettingsErrorBoundary, {
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    expect(wrapper.find('[data-testid="child-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="alert-triangle"]').exists()).toBe(false)
  })

  it('renders error state with default props', async () => {
    const wrapper = mount(SettingsErrorBoundary, {
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    // Simulate error by directly setting the error state
    await wrapper.vm.$nextTick()
    const component = wrapper.vm as InstanceType<typeof SettingsErrorBoundary>
    component.hasError = true
    component.errorMessage = 'Test error message'
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="child-content"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="alert-triangle"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Something went wrong')
    expect(wrapper.text()).toContain('An error occurred while loading this settings section.')
  })

  it('renders error state with custom props', async () => {
    const wrapper = mount(SettingsErrorBoundary, {
      props: {
        fallbackTitle: 'Custom Error Title',
        fallbackMessage: 'Custom error message',
      },
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    // Simulate error
    const component = wrapper.vm as InstanceType<typeof SettingsErrorBoundary>
    component.hasError = true
    component.errorMessage = 'Test error message'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Custom Error Title')
    expect(wrapper.text()).toContain('Custom error message')
  })

  it('shows error details in collapsible section', async () => {
    const wrapper = mount(SettingsErrorBoundary, {
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    // Simulate error with details
    const component = wrapper.vm as InstanceType<typeof SettingsErrorBoundary>
    component.hasError = true
    component.errorMessage = 'Test error message'
    component.errorDetails = 'Error context details'
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Technical Details')
    expect(wrapper.text()).toContain('Test error message')
    expect(wrapper.text()).toContain('Error context details')
  })

  it('emits retry event when retry button is clicked', async () => {
    const wrapper = mount(SettingsErrorBoundary, {
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    // Simulate error
    const component = wrapper.vm as InstanceType<typeof SettingsErrorBoundary>
    component.hasError = true
    await wrapper.vm.$nextTick()

    // Find and click retry button
    const retryButton = wrapper.find('button')
    await retryButton.trigger('click')

    expect(wrapper.emitted('retry')).toBeTruthy()
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('resets error state when resetError is called', async () => {
    const wrapper = mount(SettingsErrorBoundary, {
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    // Simulate error
    const component = wrapper.vm as InstanceType<typeof SettingsErrorBoundary>
    component.hasError = true
    component.errorMessage = 'Test error'
    component.errorDetails = 'Test details'
    await wrapper.vm.$nextTick()

    // Verify error state
    expect(wrapper.find('[data-testid="alert-triangle"]').exists()).toBe(true)

    // Reset error
    component.resetError()
    await wrapper.vm.$nextTick()

    // Verify error is cleared
    expect(component.hasError).toBe(false)
    expect(component.errorMessage).toBe('')
    expect(component.errorDetails).toBe('')
    expect(wrapper.find('[data-testid="child-content"]').exists()).toBe(true)
  })

  it('provides reportError function to child components', () => {
    const wrapper = mount(SettingsErrorBoundary, {
      slots: {
        default: '<div data-testid="child-content">Child Content</div>',
      },
    })

    const component = wrapper.vm as InstanceType<typeof SettingsErrorBoundary>
    expect(typeof component.reportError).toBe('function')

    // Test reportError function
    const testError = new Error('Test error')
    component.reportError(testError, 'Test context')

    expect(component.hasError).toBe(true)
    expect(component.errorMessage).toBe('Test error')
    expect(component.errorDetails).toBe('Test context')
  })
})
