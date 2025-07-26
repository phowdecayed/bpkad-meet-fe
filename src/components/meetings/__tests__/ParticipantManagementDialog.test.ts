import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import ParticipantManagementDialog from '../ParticipantManagementDialog.vue'
import type { User } from '@/types/user'

// Mock vue-sonner
vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock stores
const mockMeetingsStore = {
  fetchParticipants: vi.fn(),
  addParticipant: vi.fn(),
  removeParticipant: vi.fn(),
  clearError: vi.fn(),
  error: null,
  isLoadingParticipants: false,
}

const mockUsersStore = {
  users: [] as User[],
  fetchUsers: vi.fn(),
}

const mockAuthStore = {
  user: { id: 1, name: 'Current User', email: 'current@example.com' },
  hasPermission: vi.fn(),
}

vi.mock('@/stores/meetings', () => ({
  useMeetingsStore: () => mockMeetingsStore,
}))

vi.mock('@/stores/users', () => ({
  useUsersStore: () => mockUsersStore,
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => mockAuthStore,
}))

// Mock UI components with minimal implementations
vi.mock('@/components/ui/dialog', () => ({
  Dialog: {
    name: 'Dialog',
    template: '<div v-if="open" data-testid="dialog"><slot /></div>',
    props: ['open'],
  },
  DialogContent: {
    name: 'DialogContent',
    template: '<div data-testid="dialog-content"><slot /></div>',
  },
  DialogHeader: {
    name: 'DialogHeader',
    template: '<div data-testid="dialog-header"><slot /></div>',
  },
  DialogTitle: {
    name: 'DialogTitle',
    template: '<div data-testid="dialog-title"><slot /></div>',
  },
  DialogDescription: {
    name: 'DialogDescription',
    template: '<div data-testid="dialog-description"><slot /></div>',
  },
  DialogFooter: {
    name: 'DialogFooter',
    template: '<div data-testid="dialog-footer"><slot /></div>',
  },
}))

vi.mock('@/components/ui/button', () => ({
  Button: {
    name: 'Button',
    template:
      '<button data-testid="button" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['disabled', 'variant', 'size'],
    emits: ['click'],
  },
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: {
    name: 'Alert',
    template: '<div data-testid="alert"><slot /></div>',
    props: ['variant'],
  },
  AlertDescription: {
    name: 'AlertDescription',
    template: '<div data-testid="alert-description"><slot /></div>',
  },
}))

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: {
    name: 'ScrollArea',
    template: '<div data-testid="scroll-area"><slot /></div>',
  },
}))

vi.mock('@/components/ui/popover', () => ({
  Popover: {
    name: 'Popover',
    template: '<div data-testid="popover"><slot /></div>',
    props: ['open'],
  },
  PopoverTrigger: {
    name: 'PopoverTrigger',
    template: '<div data-testid="popover-trigger"><slot /></div>',
  },
  PopoverContent: {
    name: 'PopoverContent',
    template: '<div data-testid="popover-content"><slot /></div>',
  },
}))

vi.mock('@/components/ui/command', () => ({
  Command: {
    name: 'Command',
    template: '<div data-testid="command"><slot /></div>',
  },
  CommandInput: {
    name: 'CommandInput',
    template: '<input data-testid="command-input" :placeholder="placeholder" />',
    props: ['placeholder'],
  },
  CommandEmpty: {
    name: 'CommandEmpty',
    template: '<div data-testid="command-empty"><slot /></div>',
  },
  CommandGroup: {
    name: 'CommandGroup',
    template: '<div data-testid="command-group"><slot /></div>',
  },
  CommandList: {
    name: 'CommandList',
    template: '<div data-testid="command-list"><slot /></div>',
  },
  CommandItem: {
    name: 'CommandItem',
    template: '<div data-testid="command-item" @click="$emit(\'select\')"><slot /></div>',
    emits: ['select'],
  },
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: {
    name: 'Avatar',
    template: '<div data-testid="avatar"><slot /></div>',
  },
  AvatarFallback: {
    name: 'AvatarFallback',
    template: '<div data-testid="avatar-fallback"><slot /></div>',
  },
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: {
    name: 'Badge',
    template: '<span data-testid="badge"><slot /></span>',
    props: ['variant'],
  },
}))

vi.mock('@/components/ui/label', () => ({
  Label: {
    name: 'Label',
    template: '<label data-testid="label"><slot /></label>',
  },
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: {
    name: 'Skeleton',
    template: '<div data-testid="skeleton" class="skeleton"></div>',
  },
}))

vi.mock('@/components/ConfirmationDialog.vue', () => ({
  default: {
    name: 'ConfirmationDialog',
    template: '<div data-testid="confirmation-dialog" v-if="open"></div>',
    props: ['open', 'title', 'description'],
    emits: ['confirm'],
  },
}))

describe('ParticipantManagementDialog', () => {
  let wrapper: VueWrapper
  let pinia: ReturnType<typeof createPinia>

  const mockUsers: User[] = [
    {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
      created_at: '',
      updated_at: '',
      email_verified_at: null,
    },
    {
      id: 3,
      name: 'Jane Smith',
      email: 'jane@example.com',
      created_at: '',
      updated_at: '',
      email_verified_at: null,
    },
    {
      id: 4,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      created_at: '',
      updated_at: '',
      email_verified_at: null,
    },
  ]

  const mockParticipants: User[] = [
    {
      id: 2,
      name: 'John Doe',
      email: 'john@example.com',
      created_at: '',
      updated_at: '',
      email_verified_at: null,
    },
  ]

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)

    // Reset mocks
    vi.clearAllMocks()

    // Setup default mock returns
    mockMeetingsStore.fetchParticipants.mockResolvedValue([...mockParticipants])
    mockMeetingsStore.addParticipant.mockResolvedValue(undefined)
    mockMeetingsStore.removeParticipant.mockResolvedValue(undefined)
    mockUsersStore.fetchUsers.mockResolvedValue(undefined)
    mockUsersStore.users = [...mockUsers]
    mockAuthStore.hasPermission.mockReturnValue(true)
    mockMeetingsStore.error = null
    mockMeetingsStore.isLoadingParticipants = false
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount()
    }
  })

  const createWrapper = (props = {}) => {
    return mount(ParticipantManagementDialog, {
      props: {
        open: true,
        meetingId: 1,
        ...props,
      },
      global: {
        plugins: [pinia],
      },
    })
  }

  describe('Basic Rendering', () => {
    it('renders when open', () => {
      wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true)
    })

    it('does not render when closed', () => {
      wrapper = createWrapper({ open: false })
      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false)
    })

    it('displays correct title', () => {
      wrapper = createWrapper()
      expect(wrapper.find('[data-testid="dialog-title"]').text()).toContain('Manage Participants')
    })
  })

  describe('Permission Handling', () => {
    it('shows permission denied when user cannot view participants', async () => {
      mockAuthStore.hasPermission.mockReturnValue(false)

      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.find('[data-testid="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain("You don't have permission to view meeting participants")
    })

    it('allows viewing when user has permissions', async () => {
      mockAuthStore.hasPermission.mockImplementation((permission: string) => {
        return permission === 'view participants' || permission === 'view meetings'
      })

      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.text()).not.toContain("You don't have permission")
      expect(wrapper.text()).toContain('You have view-only access')
    })

    it('shows management interface when user can manage participants', async () => {
      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.text()).toContain('Add Participant')
    })
  })

  describe('Data Loading', () => {
    it('calls fetchParticipants when dialog opens', async () => {
      wrapper = createWrapper()
      await nextTick()

      expect(mockMeetingsStore.fetchParticipants).toHaveBeenCalledWith(1)
    })

    it('does not load data when meetingId is null', () => {
      wrapper = createWrapper({ meetingId: null })

      expect(mockMeetingsStore.fetchParticipants).not.toHaveBeenCalled()
    })

    it('shows loading skeletons when loading', async () => {
      mockMeetingsStore.isLoadingParticipants = true
      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.findAll('[data-testid="skeleton"]').length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('displays error from store', async () => {
      mockMeetingsStore.error = {
        type: 'network' as const,
        message: 'Network error occurred',
        retryable: true,
      }

      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.text()).toContain('Network error occurred')
    })

    it('shows retry button for retryable errors', async () => {
      mockMeetingsStore.error = {
        type: 'network' as const,
        message: 'Network error occurred',
        retryable: true,
      }

      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.text()).toContain('Retry')
    })

    it('does not show retry button for non-retryable errors', async () => {
      mockMeetingsStore.error = {
        type: 'permission' as const,
        message: 'Access denied',
        retryable: false,
      }

      wrapper = createWrapper()
      await nextTick()

      expect(wrapper.text()).not.toContain('Retry')
    })
  })

  describe('Component Methods', () => {
    it('has correct available users computation', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick() // Wait for participants to load

      // Available users should exclude current user (id: 1) and existing participants (id: 2)
      const expectedAvailableIds = [3, 4] // Jane Smith and Bob Johnson
      expect(wrapper.vm.availableUsers.map((u: User) => u.id)).toEqual(expectedAvailableIds)
    })

    it('filters users correctly by name', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      wrapper.vm.searchQuery = 'Jane'
      await nextTick()

      expect(wrapper.vm.filteredUsers).toHaveLength(1)
      expect(wrapper.vm.filteredUsers[0].name).toBe('Jane Smith')
    })

    it('filters users correctly by email', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      wrapper.vm.searchQuery = 'bob@'
      await nextTick()

      expect(wrapper.vm.filteredUsers).toHaveLength(1)
      expect(wrapper.vm.filteredUsers[0].email).toBe('bob@example.com')
    })

    it('generates correct initials', () => {
      wrapper = createWrapper()

      expect(wrapper.vm.getInitials('John Doe')).toBe('JD')
      expect(wrapper.vm.getInitials('Jane')).toBe('J')
      expect(wrapper.vm.getInitials('Mary Jane Watson')).toBe('MJ')
    })

    it('clears errors correctly', () => {
      wrapper = createWrapper()
      wrapper.vm.error = 'test error'
      mockMeetingsStore.error = {
        type: 'server' as const,
        message: 'store error',
        retryable: false,
      }

      wrapper.vm.clearError()

      expect(wrapper.vm.error).toBeNull()
      expect(mockMeetingsStore.clearError).toHaveBeenCalled()
    })
  })

  describe('Participant Management', () => {
    it('calls addParticipant with correct parameters', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      // Select a user
      const userToAdd = mockUsers.find((u) => u.id === 3)!
      wrapper.vm.selectedUserId = userToAdd.id

      await wrapper.vm.addParticipant()

      expect(mockMeetingsStore.addParticipant).toHaveBeenCalledWith(1, 3)
    })

    it('calls removeParticipant with correct parameters', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      const userToRemove = mockParticipants[0]
      wrapper.vm.userToRemove = userToRemove

      await wrapper.vm.removeParticipant()

      expect(mockMeetingsStore.removeParticipant).toHaveBeenCalledWith(1, 2)
    })

    it('sets confirmation dialog state correctly', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      const userToRemove = mockParticipants[0]
      wrapper.vm.confirmRemoveParticipant(userToRemove)

      expect(wrapper.vm.confirmRemoveDialog).toBe(true)
      expect(wrapper.vm.userToRemove).toEqual(userToRemove)
    })

    it('updates local participants list after successful add', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      const initialCount = wrapper.vm.participants.length
      const userToAdd = mockUsers.find((u) => u.id === 3)!
      wrapper.vm.selectedUserId = userToAdd.id

      await wrapper.vm.addParticipant()

      expect(wrapper.vm.participants).toHaveLength(initialCount + 1)
      expect(wrapper.vm.participants.some((p: User) => p.id === 3)).toBe(true)
    })

    it('resets selection after successful add', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      const userToAdd = mockUsers.find((u) => u.id === 3)!
      wrapper.vm.selectedUserId = userToAdd.id

      await wrapper.vm.addParticipant()

      expect(wrapper.vm.selectedUserId).toBeNull()
      expect(wrapper.vm.searchQuery).toBe('')
    })

    it('updates local participants list after successful removal', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      const initialCount = wrapper.vm.participants.length
      wrapper.vm.userToRemove = mockParticipants[0]

      await wrapper.vm.removeParticipant()

      expect(wrapper.vm.participants).toHaveLength(initialCount - 1)
      expect(wrapper.vm.participants.some((p: User) => p.id === 2)).toBe(false)
    })
  })

  describe('State Management', () => {
    it('resets state when dialog closes', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      // Set some state
      wrapper.vm.selectedUserId = 3
      wrapper.vm.searchQuery = 'test'
      wrapper.vm.error = 'some error'

      // Close dialog
      await wrapper.setProps({ open: false })
      await nextTick()

      expect(wrapper.vm.participants).toEqual([])
      expect(wrapper.vm.selectedUserId).toBeNull()
      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.vm.error).toBeNull()
    })

    it('loads data when meetingId changes', async () => {
      wrapper = createWrapper()
      await nextTick()

      vi.clearAllMocks()

      await wrapper.setProps({ meetingId: 2 })
      await nextTick()

      expect(mockMeetingsStore.fetchParticipants).toHaveBeenCalledWith(2)
    })
  })

  describe('Participant Display', () => {
    it('shows empty state when no participants', async () => {
      mockMeetingsStore.fetchParticipants.mockResolvedValue([])
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.text()).toContain('No participants added yet')
    })

    it('displays participant information', async () => {
      wrapper = createWrapper()
      await nextTick()
      await nextTick()

      expect(wrapper.text()).toContain('John Doe')
      expect(wrapper.text()).toContain('john@example.com')
    })
  })
})
