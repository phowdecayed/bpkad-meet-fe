import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import EditMeetingDialog from '../EditMeetingDialog.vue'
import { useMeetingsStore } from '@/stores/meetings'
import { useLocationsStore } from '@/stores/locations'
import { useUsersStore } from '@/stores/users'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'
import type { MeetingLocation } from '@/types/meeting'

// Mock axios
vi.mock('axios')

// Mock stores
vi.mock('@/stores/meetings')
vi.mock('@/stores/locations')
vi.mock('@/stores/users')

// Mock UI components to avoid Reka UI issues in tests
vi.mock('@/components/ui/dialog', () => ({
  Dialog: { template: '<div data-testid="dialog"><slot /></div>' },
  DialogContent: { template: '<div data-testid="dialog-content"><slot /></div>' },
  DialogHeader: { template: '<div data-testid="dialog-header"><slot /></div>' },
  DialogTitle: { template: '<div data-testid="dialog-title"><slot /></div>' },
  DialogDescription: { template: '<div data-testid="dialog-description"><slot /></div>' },
  DialogFooter: { template: '<div data-testid="dialog-footer"><slot /></div>' },
}))

vi.mock('@/components/ui/button', () => ({
  Button: { template: '<button data-testid="button"><slot /></button>' },
}))

vi.mock('@/components/ui/input', () => ({
  Input: { template: '<input data-testid="input" />' },
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: { template: '<textarea data-testid="textarea"></textarea>' },
}))

vi.mock('@/components/ui/select', () => ({
  Select: { template: '<div data-testid="select"><slot /></div>' },
  SelectContent: { template: '<div data-testid="select-content"><slot /></div>' },
  SelectItem: { template: '<div data-testid="select-item"><slot /></div>' },
  SelectTrigger: { template: '<div data-testid="select-trigger"><slot /></div>' },
  SelectValue: { template: '<div data-testid="select-value"><slot /></div>' },
}))

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: { template: '<input type="checkbox" data-testid="checkbox" />' },
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: { template: '<div data-testid="alert"><slot /></div>' },
  AlertDescription: { template: '<div data-testid="alert-description"><slot /></div>' },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: { template: '<span data-testid="badge"><slot /></span>' },
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: { template: '<div data-testid="scroll-area"><slot /></div>' },
}))

vi.mock('@/components/ui/separator', () => ({
  Separator: { template: '<hr data-testid="separator" />' },
}))

vi.mock('@/components/ui/label', () => ({
  Label: { template: '<label data-testid="label"><slot /></label>' },
}))

const mockMeeting: Meeting = {
  id: 1,
  organizer: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    email_verified_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  topic: 'Test Meeting',
  description: 'Test Description',
  start_time: '2024-12-25T10:00:00Z',
  duration: 60,
  type: 'online',
  host_key: null,
  location: null,
  zoom_meeting: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockUsers: User[] = [
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    email_verified_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob@example.com',
    email_verified_at: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const mockLocations: MeetingLocation[] = [
  {
    id: 1,
    name: 'Conference Room A',
    address: '123 Main St',
    room_name: 'Room A',
    capacity: 10,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('EditMeetingDialog', () => {
  let meetingsStore: any
  let locationsStore: any
  let usersStore: any

  beforeEach(() => {
    setActivePinia(createPinia())

    meetingsStore = {
      updateMeeting: vi.fn(),
      fetchParticipants: vi.fn().mockResolvedValue([]),
      addParticipant: vi.fn(),
      removeParticipant: vi.fn(),
      participants: [],
    }

    locationsStore = {
      locations: mockLocations,
      fetchLocations: vi.fn(),
    }

    usersStore = {
      users: mockUsers,
      fetchUsers: vi.fn(),
    }

    vi.mocked(useMeetingsStore).mockReturnValue(meetingsStore)
    vi.mocked(useLocationsStore).mockReturnValue(locationsStore)
    vi.mocked(useUsersStore).mockReturnValue(usersStore)
  })

  it('renders correctly when open', () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    expect(wrapper.find('[data-testid="edit-meeting-dialog"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Edit Meeting')
  })

  it('does not render when closed', () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: false,
        meeting: mockMeeting,
      },
    })

    expect(wrapper.find('[data-testid="edit-meeting-dialog"]').exists()).toBe(false)
  })

  it('populates form with meeting data', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    const topicInput = wrapper.find('#topic')
    const descriptionInput = wrapper.find('#description')

    expect((topicInput.element as HTMLInputElement).value).toBe('Test Meeting')
    expect((descriptionInput.element as HTMLTextAreaElement).value).toBe('Test Description')
  })

  it('shows location field for offline meetings', async () => {
    const offlineMeeting = {
      ...mockMeeting,
      type: 'offline' as const,
      location: mockLocations[0],
    }

    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: offlineMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('#location').exists()).toBe(true)
  })

  it('hides location field for online meetings', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('#location').exists()).toBe(false)
  })

  it('shows password field for online meetings', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('#password').exists()).toBe(true)
  })

  it('hides password field for offline meetings', async () => {
    const offlineMeeting = {
      ...mockMeeting,
      type: 'offline' as const,
    }

    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: offlineMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('#password').exists()).toBe(false)
  })

  it('shows both location and password fields for hybrid meetings', async () => {
    const hybridMeeting = {
      ...mockMeeting,
      type: 'hybrid' as const,
      location: mockLocations[0],
    }

    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: hybridMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find('#location').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
  })

  it('validates required fields', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Clear required field
    const topicInput = wrapper.find('#topic')
    await topicInput.setValue('')

    const updateButton = wrapper.find('button:last-child')
    await updateButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Topic is required')
  })

  it('validates future date for start time', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Set past date
    const startTimeInput = wrapper.find('#start_time')
    await startTimeInput.setValue('2020-01-01T10:00')

    const updateButton = wrapper.find('button:last-child')
    await updateButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Meeting must be scheduled for a future date and time')
  })

  it('validates location requirement for offline meetings', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Change to offline type
    const typeSelect = wrapper.find('[data-testid="meeting-type-select"]')
    await typeSelect.setValue('offline')

    const updateButton = wrapper.find('button:last-child')
    await updateButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Location is required for offline and hybrid meetings')
  })

  it('calls updateMeeting with correct data', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Modify form data
    const topicInput = wrapper.find('#topic')
    await topicInput.setValue('Updated Meeting')

    const updateButton = wrapper.find('button:last-child')
    await updateButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(meetingsStore.updateMeeting).toHaveBeenCalledWith(
      mockMeeting.id,
      expect.objectContaining({
        topic: 'Updated Meeting',
      }),
    )
  })

  it('shows unsaved changes warning', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Modify form data
    const topicInput = wrapper.find('#topic')
    await topicInput.setValue('Modified Topic')

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Unsaved Changes')
    expect(wrapper.text()).toContain('You have unsaved changes')
  })

  it('handles participant selection', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Select a participant
    const participantCheckbox = wrapper.find(`#user-${mockUsers[0].id}`)
    await participantCheckbox.setChecked(true)

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('1 selected')
  })

  it('emits close event when cancelled', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    const cancelButton = wrapper.find('button:first-child')
    await cancelButton.trigger('click')

    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')![0]).toEqual([false])
  })

  it('shows confirmation dialog when closing with unsaved changes', async () => {
    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Make changes
    const topicInput = wrapper.find('#topic')
    await topicInput.setValue('Modified Topic')

    // Try to close
    const cancelButton = wrapper.find('button:first-child')
    await cancelButton.trigger('click')

    expect(confirmSpy).toHaveBeenCalledWith(
      'You have unsaved changes. Are you sure you want to close?',
    )

    confirmSpy.mockRestore()
  })

  it('handles meeting type changes correctly', async () => {
    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    // Change from online to offline
    const typeSelect = wrapper.find('[data-testid="meeting-type-select"]')
    await typeSelect.setValue('offline')

    await wrapper.vm.$nextTick()

    // Location field should now be visible
    expect(wrapper.find('#location').exists()).toBe(true)
    // Password field should be hidden
    expect(wrapper.find('#password').exists()).toBe(false)
  })

  it('handles loading state correctly', async () => {
    meetingsStore.updateMeeting.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    )

    const wrapper = mount(EditMeetingDialog, {
      props: {
        open: true,
        meeting: mockMeeting,
      },
    })

    await wrapper.vm.$nextTick()

    const updateButton = wrapper.find('button:last-child')
    await updateButton.trigger('click')

    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Updating...')
    expect(updateButton.attributes('disabled')).toBeDefined()
  })
})
