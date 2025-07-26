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

// Mock all complex UI components
vi.mock('@/components/meetings/CreateMeetingDialog.vue', () => ({
  default: {
    name: 'CreateMeetingDialog',
    props: ['open'],
    emits: ['update:open'],
    template: '<div data-testid="create-meeting-dialog" v-if="open">Create Dialog</div>',
  },
}))

vi.mock('@/components/meetings/EditMeetingDialog.vue', () => ({
  default: {
    name: 'EditMeetingDialog',
    props: ['open', 'meeting'],
    emits: ['update:open'],
    template: '<div data-testid="edit-meeting-dialog" v-if="open">Edit Dialog</div>',
  },
}))

vi.mock('@/components/ConfirmationDialog.vue', () => ({
  default: {
    name: 'ConfirmationDialog',
    props: ['open', 'title', 'description'],
    emits: ['update:open', 'confirm'],
    template: '<div data-testid="confirmation-dialog" v-if="open">Confirmation Dialog</div>',
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
        { id: 1, name: 'create meetings' },
        { id: 2, name: 'edit meetings' },
        { id: 3, name: 'delete meetings' },
        { id: 4, name: 'view meetings' },
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
  host_key: 'test-key',
  location: null,
  zoom_meeting: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('MeetingsView Simple Tests', () => {
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

  describe('Basic Rendering', () => {
    it('renders the meetings view with header', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            // Stub complex components
            Select: { template: '<div><slot /></div>' },
            SelectTrigger: { template: '<div><slot /></div>' },
            SelectValue: { template: '<div><slot /></div>' },
            SelectContent: { template: '<div><slot /></div>' },
            SelectItem: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Button: { template: '<button><slot /></button>' },
            Alert: { template: '<div><slot /></div>' },
            AlertDescription: { template: '<div><slot /></div>' },
            Skeleton: { template: '<div class="skeleton"></div>' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            DropdownMenu: { template: '<div><slot /></div>' },
            DropdownMenuTrigger: { template: '<div><slot /></div>' },
            DropdownMenuContent: { template: '<div><slot /></div>' },
            DropdownMenuItem: { template: '<div><slot /></div>' },
            Pagination: { template: '<div><slot /></div>' },
            PaginationContent: { template: '<div><slot /></div>' },
            PaginationItem: { template: '<div><slot /></div>' },
            PaginationPrevious: { template: '<button>Previous</button>' },
            PaginationNext: { template: '<button>Next</button>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      expect(wrapper.find('h2').text()).toBe('Meetings')
      expect(wrapper.text()).toContain('Manage all meetings in your organization.')
    })

    it('shows create meeting button when user has permission', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: {
              template: '<button :data-testid="$attrs[\'data-testid\']"><slot /></button>',
              inheritAttrs: false,
            },
            // Stub other components
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
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
          stubs: {
            Button: {
              template: '<button :data-testid="$attrs[\'data-testid\']"><slot /></button>',
              inheritAttrs: false,
            },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      const createButton = wrapper.find('[data-testid="create-meeting-button"]')
      expect(createButton.exists()).toBe(false)
    })
  })

  describe('Loading States', () => {
    it('shows loading skeleton when loading and no meetings', () => {
      meetingsStore.isLoading = true
      meetingsStore.meetings = []

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Skeleton: {
              template: '<div class="skeleton" data-testid="loading-skeleton"></div>',
            },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      expect(wrapper.find('[data-testid="loading-skeleton"]').exists()).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('displays error message when there is an error', () => {
      meetingsStore.error = {
        type: 'network' as const,
        message: 'Network error occurred',
        retryable: true,
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Alert: { template: '<div><slot /></div>' },
            AlertDescription: { template: '<div><slot /></div>' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      expect(wrapper.text()).toContain('Network error occurred')
    })
  })

  describe('Meetings Display', () => {
    it('displays meetings in table format', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            DropdownMenu: { template: '<div><slot /></div>' },
            DropdownMenuTrigger: { template: '<div><slot /></div>' },
            DropdownMenuContent: { template: '<div><slot /></div>' },
            DropdownMenuItem: { template: '<div><slot /></div>' },
            Label: { template: '<label><slot /></label>' },
          },
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
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      expect(wrapper.text()).toContain('No meetings found.')
    })
  })

  describe('Permission-based Actions', () => {
    it('shows actions dropdown for meeting organizer', () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: {
              template: '<button :data-testid="$attrs[\'data-testid\']"><slot /></button>',
              inheritAttrs: false,
            },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            DropdownMenu: { template: '<div><slot /></div>' },
            DropdownMenuTrigger: { template: '<div><slot /></div>' },
            DropdownMenuContent: { template: '<div><slot /></div>' },
            DropdownMenuItem: { template: '<div><slot /></div>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      const actionsButton = wrapper.find('[data-testid="meeting-actions-1"]')
      expect(actionsButton.exists()).toBe(true)
    })

    it('hides actions dropdown when user cannot edit or delete meeting', () => {
      authStore.user = {
        ...mockUser,
        id: 999, // Different user ID
        roles: [
          {
            id: 1,
            name: 'user',
            permissions: [], // No edit/delete permissions
          },
        ],
      }

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: {
              template: '<button :data-testid="$attrs[\'data-testid\']"><slot /></button>',
              inheritAttrs: false,
            },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            DropdownMenu: { template: '<div><slot /></div>' },
            DropdownMenuTrigger: { template: '<div><slot /></div>' },
            DropdownMenuContent: { template: '<div><slot /></div>' },
            DropdownMenuItem: { template: '<div><slot /></div>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      const actionsButton = wrapper.find('[data-testid="meeting-actions-1"]')
      expect(actionsButton.exists()).toBe(false)
    })
  })

  describe('Initialization', () => {
    it('fetches meetings on component mount', () => {
      const fetchMeetingsSpy = vi.spyOn(meetingsStore, 'fetchMeetings')

      mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      expect(fetchMeetingsSpy).toHaveBeenCalled()
    })
  })

  describe('Dialog Management', () => {
    it('opens create dialog when create button is clicked', async () => {
      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: {
              template:
                '<button :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')"><slot /></button>',
              inheritAttrs: false,
              emits: ['click'],
            },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      const createButton = wrapper.find('[data-testid="create-meeting-button"]')
      await createButton.trigger('click')

      expect(wrapper.find('[data-testid="create-meeting-dialog"]').exists()).toBe(true)
    })
  })

  describe('Meeting Deletion', () => {
    it('calls deleteMeeting when deletion is confirmed', async () => {
      const deleteMeetingSpy = vi.spyOn(meetingsStore, 'deleteMeeting').mockResolvedValue()

      const wrapper = mount(MeetingsView, {
        global: {
          plugins: [pinia],
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      const vm = wrapper.vm as InstanceType<typeof MeetingsView>
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
          stubs: {
            Button: { template: '<button><slot /></button>' },
            Select: { template: '<div><slot /></div>' },
            Input: { template: '<input />' },
            Table: { template: '<table><slot /></table>' },
            TableHeader: { template: '<thead><slot /></thead>' },
            TableBody: { template: '<tbody><slot /></tbody>' },
            TableRow: { template: '<tr><slot /></tr>' },
            TableHead: { template: '<th><slot /></th>' },
            TableCell: { template: '<td><slot /></td>' },
            TableEmpty: { template: '<tr><td><slot /></td></tr>' },
            Badge: { template: '<span><slot /></span>' },
            Label: { template: '<label><slot /></label>' },
          },
        },
      })

      const vm = wrapper.vm as InstanceType<typeof MeetingsView>
      vm.selectedMeeting = mockMeeting
      await vm.handleDeleteMeeting()

      expect(toast.success).toHaveBeenCalledWith('Meeting deleted successfully!')
    })
  })
})
