import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import CreateMeetingDialog from '../CreateMeetingDialog.vue'
import { useMeetingsStore } from '@/stores/meetings'
import { useLocationsStore } from '@/stores/locations'
import { useUsersStore } from '@/stores/users'

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock stores
vi.mock('@/stores/meetings')
vi.mock('@/stores/locations')
vi.mock('@/stores/users')

const mockMeetingsStore = {
  createMeeting: vi.fn(),
  clearError: vi.fn(),
  error: null,
}

const mockLocationsStore = {
  fetchLocations: vi.fn(),
  locations: ref([
    { id: 1, name: 'Conference Room A' },
    { id: 2, name: 'Conference Room B' },
  ]),
}

const mockUsersStore = {
  fetchUsers: vi.fn(),
  users: ref([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ]),
}

describe('CreateMeetingDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())

    // Mock store implementations
    vi.mocked(useMeetingsStore).mockReturnValue(mockMeetingsStore as any)
    vi.mocked(useLocationsStore).mockReturnValue(mockLocationsStore as any)
    vi.mocked(useUsersStore).mockReturnValue(mockUsersStore as any)

    // Reset mocks
    vi.clearAllMocks()
  })

  const createWrapper = (props = { open: true }) => {
    return mount(CreateMeetingDialog, {
      props,
      global: {
        stubs: {
          Dialog: true,
          DialogContent: true,
          DialogHeader: true,
          DialogTitle: true,
          DialogDescription: true,
          DialogFooter: true,
          Stepper: true,
          StepperItem: true,
          StepperTrigger: true,
          StepperTitle: true,
          StepperDescription: true,
          StepperSeparator: true,
          Button: true,
          Input: true,
          Label: true,
          Textarea: true,
          Select: true,
          SelectTrigger: true,
          SelectValue: true,
          SelectContent: true,
          SelectItem: true,
          Command: true,
          CommandInput: true,
          CommandEmpty: true,
          CommandGroup: true,
          CommandList: true,
          CommandItem: true,
          Popover: true,
          PopoverTrigger: true,
          PopoverContent: true,
          Alert: true,
          AlertDescription: true,
        },
      },
    })
  }

  describe('Component Initialization', () => {
    it('should render when open prop is true', () => {
      const wrapper = createWrapper({ open: true })
      expect(wrapper.exists()).toBe(true)
    })

    it('should fetch locations and users on mount', () => {
      createWrapper()
      expect(mockLocationsStore.fetchLocations).toHaveBeenCalled()
      expect(mockUsersStore.fetchUsers).toHaveBeenCalled()
    })

    it('should start on step 1', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.currentStep).toBe(1)
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields in step 1', async () => {
      const wrapper = createWrapper()

      // Try to validate step 1 with empty fields
      const isValid = wrapper.vm.validateStep(1)
      expect(isValid).toBe(false)
      expect(wrapper.vm.validationErrors.topic).toBeDefined()
    })

    it('should validate topic field', async () => {
      const wrapper = createWrapper()

      // Set valid topic
      await wrapper.setData({ topic: 'Test Meeting' })
      await wrapper.setData({ startTime: '2025-12-01T10:00' })
      await wrapper.setData({ duration: 60 })

      const isValid = wrapper.vm.validateStep(1)
      expect(isValid).toBe(true)
    })

    it('should validate start time is in the future', async () => {
      const wrapper = createWrapper()

      // Set past date
      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2020-01-01T10:00',
        duration: 60,
      })

      const isValid = wrapper.vm.validateStep(1)
      expect(isValid).toBe(false)
      expect(wrapper.vm.validationErrors.start_time).toBeDefined()
    })

    it('should validate duration is within limits', async () => {
      const wrapper = createWrapper()

      // Set invalid duration
      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 2000, // Exceeds 24 hours
      })

      const isValid = wrapper.vm.validateStep(1)
      expect(isValid).toBe(false)
      expect(wrapper.vm.validationErrors.duration).toBeDefined()
    })

    it('should require location for offline meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'offline',
        locationId: undefined,
      })

      const isValid = wrapper.vm.validateStep(2)
      expect(isValid).toBe(false)
      expect(wrapper.vm.validationErrors.location_id).toBeDefined()
    })

    it('should require location for hybrid meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'hybrid',
        locationId: undefined,
      })

      const isValid = wrapper.vm.validateStep(2)
      expect(isValid).toBe(false)
      expect(wrapper.vm.validationErrors.location_id).toBeDefined()
    })

    it('should not require location for online meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
        locationId: undefined,
      })

      const isValid = wrapper.vm.validateStep(2)
      expect(isValid).toBe(true)
    })

    it('should validate password length', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
        password: 'verylongpassword', // Exceeds 10 characters
      })

      const isValid = wrapper.vm.validateStep(2)
      expect(isValid).toBe(false)
      expect(wrapper.vm.validationErrors.password).toBeDefined()
    })
  })

  describe('Step Navigation', () => {
    it('should not allow navigation to next step if current step is invalid', async () => {
      const wrapper = createWrapper()

      // Try to go to step 2 without valid step 1
      wrapper.vm.nextStep()
      expect(wrapper.vm.currentStep).toBe(1)
    })

    it('should allow navigation to next step if current step is valid', async () => {
      const wrapper = createWrapper()

      // Set valid step 1 data
      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
      })

      wrapper.vm.nextStep()
      expect(wrapper.vm.currentStep).toBe(2)
    })

    it('should allow navigation to previous step', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ currentStep: 2 })
      wrapper.vm.previousStep()
      expect(wrapper.vm.currentStep).toBe(1)
    })

    it('should validate all previous steps before allowing direct navigation', async () => {
      const wrapper = createWrapper()

      // Try to go directly to step 3 without valid previous steps
      wrapper.vm.goToStep(3)
      expect(wrapper.vm.currentStep).toBe(1) // Should stay on step 1
    })
  })

  describe('Form Submission', () => {
    it('should create meeting with correct payload', async () => {
      const wrapper = createWrapper()
      mockMeetingsStore.createMeeting.mockResolvedValue({ id: 1 })

      // Set valid form data
      await wrapper.setData({
        topic: 'Test Meeting',
        description: 'Test Description',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
        password: 'test123',
        participants: [1, 2],
      })

      await wrapper.vm.createMeeting()

      expect(mockMeetingsStore.createMeeting).toHaveBeenCalledWith({
        topic: 'Test Meeting',
        description: 'Test Description',
        start_time: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
        password: 'test123',
        participants: [1, 2],
      })
    })

    it('should include location_id for offline meetings', async () => {
      const wrapper = createWrapper()
      mockMeetingsStore.createMeeting.mockResolvedValue({ id: 1 })

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'offline',
        locationId: 1,
        participants: [],
      })

      await wrapper.vm.createMeeting()

      expect(mockMeetingsStore.createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          location_id: 1,
        }),
      )
    })

    it('should handle server validation errors', async () => {
      const wrapper = createWrapper()
      mockMeetingsStore.error = {
        type: 'validation',
        details: {
          topic: ['Topic is required'],
        },
      }
      mockMeetingsStore.createMeeting.mockRejectedValue(new Error('Validation failed'))

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
      })

      await wrapper.vm.createMeeting()

      expect(wrapper.vm.validationErrors.topic).toBe('Topic is required')
    })

    it('should reset form after successful submission', async () => {
      const wrapper = createWrapper()
      mockMeetingsStore.createMeeting.mockResolvedValue({ id: 1 })

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
      })

      await wrapper.vm.createMeeting()

      expect(wrapper.vm.topic).toBe('')
      expect(wrapper.vm.currentStep).toBe(1)
    })
  })

  describe('Participants Management', () => {
    it('should handle participant selection', async () => {
      const wrapper = createWrapper()

      // Add participants
      await wrapper.setData({ participants: [1, 2] })

      expect(wrapper.vm.selectedUsers).toHaveLength(2)
      expect(wrapper.vm.selectedUsers[0].name).toBe('John Doe')
      expect(wrapper.vm.selectedUsers[1].name).toBe('Jane Smith')
    })

    it('should send participant IDs in payload', async () => {
      const wrapper = createWrapper()
      mockMeetingsStore.createMeeting.mockResolvedValue({ id: 1 })

      await wrapper.setData({
        topic: 'Test Meeting',
        startTime: '2025-12-01T10:00',
        duration: 60,
        type: 'online',
        participants: [1, 2], // Should be user IDs, not User objects
      })

      await wrapper.vm.createMeeting()

      expect(mockMeetingsStore.createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({
          participants: [1, 2],
        }),
      )
    })
  })

  describe('Form Reset', () => {
    it('should reset form when dialog closes', async () => {
      const wrapper = createWrapper({ open: true })

      // Set some form data
      await wrapper.setData({
        topic: 'Test Meeting',
        currentStep: 2,
      })

      // Close dialog
      await wrapper.setProps({ open: false })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.topic).toBe('')
      expect(wrapper.vm.currentStep).toBe(1)
    })

    it('should clear validation errors on reset', async () => {
      const wrapper = createWrapper()

      // Set validation errors
      await wrapper.setData({
        validationErrors: { topic: 'Required' },
      })

      wrapper.vm.resetForm()

      expect(wrapper.vm.validationErrors).toEqual({})
    })
  })

  describe('Computed Properties', () => {
    it('should show location field for offline meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ type: 'offline' })
      expect(wrapper.vm.isLocationRequired).toBe(true)
    })

    it('should show location field for hybrid meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ type: 'hybrid' })
      expect(wrapper.vm.isLocationRequired).toBe(true)
    })

    it('should hide location field for online meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ type: 'online' })
      expect(wrapper.vm.isLocationRequired).toBe(false)
    })

    it('should show password field for online meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ type: 'online' })
      expect(wrapper.vm.isPasswordVisible).toBe(true)
    })

    it('should show password field for hybrid meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ type: 'hybrid' })
      expect(wrapper.vm.isPasswordVisible).toBe(true)
    })

    it('should hide password field for offline meetings', async () => {
      const wrapper = createWrapper()

      await wrapper.setData({ type: 'offline' })
      expect(wrapper.vm.isPasswordVisible).toBe(false)
    })
  })
})
