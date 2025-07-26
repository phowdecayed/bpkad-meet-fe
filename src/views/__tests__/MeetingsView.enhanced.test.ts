import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MeetingsView from '../MeetingsView.vue'
import { useMeetingsStore } from '@/stores/meetings'
import { useAuthStore } from '@/stores/auth'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'

// Mock lodash-es
vi.mock('lodash-es', () => ({
  debounce: vi.fn((fn) => fn),
}))

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock components that might not be available in test environment
vi.mock('@/components/meetings/CreateMeetingDialog.vue', () => ({
  default: {
    name: 'CreateMeetingDialog',
    template: '<div data-testid="create-meeting-dialog"></div>',
  },
}))

vi.mock('@/components/meetings/EditMeetingDialog.vue', () => ({
  default: {
    name: 'EditMeetingDialog',
    template: '<div data-testid="edit-meeting-dialog"></div>',
  },
}))

vi.mock('@/components/ConfirmationDialog.vue', () => ({
  default: {
    name: 'ConfirmationDialog',
    template: '<div data-testid="confirmation-dialog"></div>',
  },
}))

const mockUser: User = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  roles: [
    {
      id: 1,
      name: 'admin',
      permissions: [
        { id: 1, name: 'create meetings', group_name: 'meetings' },
        { id: 2, name: 'edit meetings', group_name: 'meetings' },
        { id: 3, name: 'delete meetings', group_name: 'meetings' },
        { id: 4, name: 'view meetings', group_name: 'meetings' },
      ],
    },
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockMeeting: Meeting = {
  id: 1,
  organizer: mockUser,
  topic: 'Test Meeting',
  description: 'Test Description',
  start_time: '2024-12-01T10:00:00Z',
  duration: 60,
  type: 'online',
  join_url: 'https://zoom.us/j/1234567890',
  password: 'password',
  host_key: 'test-key',
  location: null,
  zoom_meeting: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('MeetingsView Enhanced', () => {
  let pinia: ReturnType<typeof createPinia>
  let meetingsStore: ReturnType<typeof useMeetingsStore>
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    meetingsStore = useMeetingsStore()
    authStore = useAuthStore()

    // Setup auth store
    authStore.user = mockUser
    authStore.token = 'test-token'

    // Setup meetings store
    meetingsStore.meetings = [mockMeeting]
    meetingsStore.pagination = {
      currentPage: 1,
      totalPages: 1,
      totalItems: 1,
      itemsPerPage: 10,
      hasNextPage: false,
      hasPrevPage: false,
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('renders the meetings view with header', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('h2').text()).toBe('Meetings')
      expect(wrapper.text()).toContain('Manage all meetings in your organization.')
    })

    it('shows create meeting button when user has permission', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const createButton = wrapper.find('[data-testid="create-meeting-button"]')
      expect(createButton.exists()).toBe(true)
      expect(createButton.text()).toContain('Create Meeting')
    })

    it('hides create meeting button when user lacks permission', () => {
      authStore.user = {
        ...mockUser,
        roles: [
          {
            id: 1,
            name: 'user',
            permissions: [], // No permissions
          },
        ],
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const createButton = wrapper.find('[data-testid="create-meeting-button"]')
      expect(createButton.exists()).toBe(false)
    })
  })

  describe('Search and Filtering', () => {
    it('renders search input and filter controls', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('input[placeholder*="Search"]').exists()).toBe(true)
      expect(wrapper.find('select').exists()).toBe(true)
      expect(wrapper.find('input[type="date"]').exists()).toBe(true)
    })

    it('calls fetchMeetings with search parameters when search input changes', async () => {
      const fetchMeetingsSpy = vi.spyOn(meetingsStore, 'fetchMeetings')

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const searchInput = wrapper.find('input[placeholder*="Search"]')
      await searchInput.setValue('test query')

      // Due to debouncing, we need to wait
      await new Promise((resolve) => setTimeout(resolve, 350))

      expect(fetchMeetingsSpy).toHaveBeenCalledWith({
        search: 'test query',
      })
    })

    it('clears filters when clear button is clicked', async () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      // Set some filter values
      const searchInput = wrapper.find('input[placeholder*="Search"]')
      await searchInput.setValue('test')

      const clearButton = wrapper.findAll('button').find((b) => b.text() === 'Clear')
      await clearButton!.trigger('click')

      expect((searchInput.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when loading and no meetings', () => {
      meetingsStore.isLoading = true
      meetingsStore.meetings = []

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
    })

    it('shows loading overlay on table when loading with existing meetings', () => {
      meetingsStore.isLoading = true

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const tableRows = wrapper.findAll('tbody tr')
      expect(tableRows[0].classes()).toContain('opacity-50')
    })
  })

  describe('Error Handling', () => {
    it('displays error message when there is an error', () => {
      meetingsStore.error = {
        type: 'server' as const,
        message: 'Network error occurred',
        retryable: true,
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.text()).toContain('Network error occurred')
      expect(wrapper.find('button:contains("Retry")').exists()).toBe(true)
    })

    it('calls retryFetch when retry button is clicked', async () => {
      meetingsStore.error = {
        type: 'server' as const,
        message: 'Network error occurred',
        retryable: true,
      }

      const clearErrorSpy = vi.spyOn(meetingsStore, 'clearError')
      const fetchMeetingsSpy = vi.spyOn(meetingsStore, 'fetchMeetings')

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const retryButton = wrapper.findAll('button').find((b) => b.text() === 'Retry')
      if (retryButton) {
        await retryButton.trigger('click')
      }

      expect(clearErrorSpy).toHaveBeenCalled()
      expect(fetchMeetingsSpy).toHaveBeenCalled()
    })
  })

  describe('Meetings Table', () => {
    it('displays meetings in table format', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.text()).toContain('Test Meeting')
      expect(wrapper.text()).toContain('Test Description')
      expect(wrapper.text()).toContain('online')
    })

    it('shows empty state when no meetings found', () => {
      meetingsStore.meetings = []

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.text()).toContain('No meetings found.')
    })

    it('shows filtered empty state when search has no results', async () => {
      meetingsStore.meetings = []

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const searchInput = wrapper.find('input[placeholder*="Search"]')
      await searchInput.setValue('nonexistent')

      expect(wrapper.text()).toContain('No meetings found matching your criteria.')
    })
  })

  describe('Permission-based Actions', () => {
    it('shows edit and delete actions for meeting organizer', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const actionsButton = wrapper.find('[data-testid="meeting-actions-1"]')
      expect(actionsButton.exists()).toBe(true)
    })

    it('hides edit action when user cannot edit meeting', () => {
      authStore.user = {
        ...mockUser,
        id: 999, // Different user ID
        roles: [
          {
            id: 1,
            name: 'user',
            permissions: [], // No edit permissions
          },
        ],
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      // Actions dropdown should not show edit option
      const actionsButton = wrapper.find('button[data-testid="meeting-actions"]')
      expect(actionsButton.exists()).toBe(false)
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      meetingsStore.pagination = {
        currentPage: 2,
        totalPages: 5,
        totalItems: 50,
        itemsPerPage: 10,
        hasNextPage: true,
        hasPrevPage: true,
      }
    })

    it('shows pagination when there are multiple pages', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.text()).toContain('Showing 11 to 20 of 50 meetings')
      expect(wrapper.find('[data-testid="pagination-previous"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="pagination-next"]').exists()).toBe(true)
    })

    it('calls goToPage when pagination is used', async () => {
      const fetchMeetingsSpy = vi.spyOn(meetingsStore, 'fetchMeetings')

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const nextButton = wrapper.find('[data-testid="pagination-next"]')
      await nextButton.trigger('click')

      expect(fetchMeetingsSpy).toHaveBeenCalledWith({ page: 3 })
    })

    it('hides pagination when there is only one page', () => {
      meetingsStore.pagination = {
        currentPage: 1,
        totalPages: 1,
        totalItems: 5,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false,
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(false)
    })
  })

  describe('Dialog Management', () => {
    it('opens create dialog when create button is clicked', async () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const createButton = wrapper.findAll('button').find((b) => b.text() === 'Create Meeting')
      if (createButton) {
        await createButton.trigger('click')
      }

      expect(wrapper.find('[data-testid="create-meeting-dialog"]').exists()).toBe(true)
    })

    it('opens edit dialog when edit action is clicked', async () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      // Simulate clicking edit from dropdown
      const vm = wrapper.vm as any
      vm.openEditDialog(mockMeeting)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="edit-meeting-dialog"]').exists()).toBe(true)
    })

    it('opens delete confirmation when delete action is clicked', async () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      // Simulate clicking delete from dropdown
      const vm = wrapper.vm as any
      vm.openDeleteDialog(mockMeeting)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="confirmation-dialog"]').exists()).toBe(true)
    })
  })

  describe('Meeting Deletion', () => {
    it('calls deleteMeeting when deletion is confirmed', async () => {
      const deleteMeetingSpy = vi.spyOn(meetingsStore, 'deleteMeeting').mockResolvedValue()

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const vm = wrapper.vm as any
      vm.selectedMeeting = mockMeeting
      await vm.handleDeleteMeeting()

      expect(deleteMeetingSpy).toHaveBeenCalledWith(mockMeeting.id)
    })

    it('shows success toast when meeting is deleted successfully', async () => {
      const { toast } = await import('vue-sonner')
      vi.spyOn(meetingsStore, 'deleteMeeting').mockResolvedValue()

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const vm = wrapper.vm as any
      vm.selectedMeeting = mockMeeting
      await vm.handleDeleteMeeting()

      expect(toast.success).toHaveBeenCalledWith('Meeting deleted successfully!')
    })

    it('shows error toast when meeting deletion fails', async () => {
      const { toast } = await import('vue-sonner')
      vi.spyOn(meetingsStore, 'deleteMeeting').mockRejectedValue(new Error('Delete failed'))
      meetingsStore.error = {
        type: 'server' as const,
        message: 'Failed to delete meeting',
        retryable: false,
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      const vm = wrapper.vm as any
      vm.selectedMeeting = mockMeeting
      await vm.handleDeleteMeeting()

      expect(toast.error).toHaveBeenCalledWith('Failed to delete meeting')
    })
  })

  describe('Initialization', () => {
    it('fetches meetings on component mount', () => {
      const fetchMeetingsSpy = vi.spyOn(meetingsStore, 'fetchMeetings')

      mount(MeetingsView, {
        global: {
          plugins: [pinia],
        },
      })

      expect(fetchMeetingsSpy).toHaveBeenCalled()
    })
  })
})
