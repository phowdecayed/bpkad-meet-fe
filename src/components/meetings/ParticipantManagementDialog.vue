<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMeetingsStore } from '@/stores/meetings'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { PERMISSIONS } from '@/constants/permissions'
import type { User } from '@/types/user'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  UserPlus,
  UserMinus,
  Check,
  ChevronsUpDown,
  Loader2,
  AlertTriangle,
  Mail,
  Shield,
} from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { toast } from 'vue-sonner'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

const props = defineProps<{
  open: boolean
  meetingId: number | null
}>()

const emit = defineEmits(['update:open'])

const meetingsStore = useMeetingsStore()
const usersStore = useUsersStore()
const authStore = useAuthStore()

// State
const isLoadingParticipants = ref(false)
const isAddingParticipant = ref(false)
const isRemovingParticipant = ref(false)
const searchQuery = ref('')
const selectedUserId = ref<number | null>(null)
const openAddPopover = ref(false)
const confirmRemoveDialog = ref(false)
const userToRemove = ref<User | null>(null)
const participants = ref<User[]>([])
const error = ref<string | null>(null)

// Computed properties
const canManageParticipants = computed(() => {
  return (
    authStore.hasPermission(PERMISSIONS.PARTICIPANTS.MANAGE) ||
    authStore.hasPermission(PERMISSIONS.MEETINGS.EDIT)
  )
})

const canViewParticipants = computed(() => {
  return (
    authStore.hasPermission(PERMISSIONS.PARTICIPANTS.VIEW) ||
    authStore.hasPermission(PERMISSIONS.MEETINGS.VIEW)
  )
})

const availableUsers = computed(() => {
  if (!usersStore.users.length) return []

  const participantIds = participants.value.map((p) => p.id)
  const currentUserId = authStore.user?.id

  return usersStore.users.filter(
    (user) =>
      user.id !== currentUserId && // Exclude current user
      !participantIds.includes(user.id), // Exclude already added participants
  )
})

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return availableUsers.value

  const query = searchQuery.value.toLowerCase()
  return availableUsers.value.filter(
    (user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
  )
})

const selectedUser = computed(() => {
  if (!selectedUserId.value) return null
  return availableUsers.value.find((user) => user.id === selectedUserId.value) || null
})

const hasError = computed(() => !!error.value || !!meetingsStore.error)

const errorMessage = computed(() => {
  if (error.value) return error.value
  if (meetingsStore.error) return meetingsStore.error.message
  return null
})

const isRetryable = computed(() => {
  return meetingsStore.error?.retryable ?? false
})

// Functions
async function loadParticipants() {
  if (!props.meetingId || !canViewParticipants.value) return

  isLoadingParticipants.value = true
  error.value = null

  try {
    const loadedParticipants = await meetingsStore.fetchParticipants(props.meetingId)
    participants.value = loadedParticipants
  } catch {
    error.value = 'Failed to load participants'
  } finally {
    isLoadingParticipants.value = false
  }
}

async function loadUsers() {
  if (!usersStore.users.length) {
    try {
      await usersStore.fetchUsers()
    } catch {
      console.error('Failed to load users:')
    }
  }
}

async function addParticipant() {
  if (!props.meetingId || !selectedUser.value || !canManageParticipants.value) return

  isAddingParticipant.value = true
  error.value = null

  try {
    await meetingsStore.addParticipant(props.meetingId, selectedUser.value.id)

    // Add to local participants list
    participants.value.push(selectedUser.value)

    // Reset selection
    selectedUserId.value = null
    searchQuery.value = ''
    openAddPopover.value = false

    toast.success(`${selectedUser.value.name} has been added to the meeting`)
  } catch {
    const errorMsg = meetingsStore.error?.message || 'Failed to add participant'
    error.value = errorMsg
    toast.error(errorMsg)
  } finally {
    isAddingParticipant.value = false
  }
}

function confirmRemoveParticipant(user: User) {
  if (!canManageParticipants.value) return

  userToRemove.value = user
  confirmRemoveDialog.value = true
}

async function removeParticipant() {
  if (!props.meetingId || !userToRemove.value || !canManageParticipants.value) return

  isRemovingParticipant.value = true
  error.value = null

  try {
    await meetingsStore.removeParticipant(props.meetingId, userToRemove.value.id)

    // Remove from local participants list
    participants.value = participants.value.filter((p) => p.id !== userToRemove.value!.id)

    toast.success(`${userToRemove.value.name} has been removed from the meeting`)
  } catch {
    const errorMsg = meetingsStore.error?.message || 'Failed to remove participant'
    error.value = errorMsg
    toast.error(errorMsg)
  } finally {
    isRemovingParticipant.value = false
    userToRemove.value = null
    confirmRemoveDialog.value = false
  }
}

function selectUser(user: User) {
  selectedUserId.value = user.id
  searchQuery.value = user.name
}

function clearError() {
  error.value = null
  meetingsStore.clearError()
}

async function retryLoad() {
  clearError()
  await loadParticipants()
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function handleClose() {
  emit('update:open', false)
}

// Watchers
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.meetingId) {
      await Promise.all([loadParticipants(), loadUsers()])
    } else if (!isOpen) {
      // Reset state when dialog closes
      participants.value = []
      selectedUserId.value = null
      searchQuery.value = ''
      error.value = null
      openAddPopover.value = false
      confirmRemoveDialog.value = false
      userToRemove.value = null
      meetingsStore.clearError()
    }
  },
)

watch(
  () => props.meetingId,
  async (newMeetingId) => {
    if (newMeetingId && props.open) {
      await loadParticipants()
    }
  },
)

// Initialize on mount if dialog is already open
onMounted(async () => {
  if (props.open && props.meetingId) {
    await Promise.all([loadParticipants(), loadUsers()])
  }
})
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[600px] flex flex-col max-h-[80vh]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Users class="h-5 w-5" />
          Manage Participants
          <Badge v-if="participants.length > 0" variant="secondary" class="ml-2">
            {{ participants.length }} participant{{ participants.length !== 1 ? 's' : '' }}
          </Badge>
        </DialogTitle>
        <DialogDescription>
          View and manage meeting participants.
          <span v-if="!canManageParticipants" class="text-amber-600">
            You have view-only access.
          </span>
        </DialogDescription>
      </DialogHeader>

      <!-- Permission Check -->
      <Alert v-if="!canViewParticipants" variant="destructive">
        <Shield class="h-4 w-4" />
        <AlertDescription>
          You don't have permission to view meeting participants.
        </AlertDescription>
      </Alert>

      <!-- Error Display -->
      <Alert v-else-if="hasError" variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription class="flex items-center justify-between">
          <span>{{ errorMessage }}</span>
          <Button
            v-if="isRetryable"
            variant="outline"
            size="sm"
            @click="retryLoad"
            :disabled="isLoadingParticipants"
          >
            <Loader2 v-if="isLoadingParticipants" class="mr-2 h-4 w-4 animate-spin" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>

      <!-- Add Participant Section -->
      <div v-else-if="canManageParticipants" class="space-y-4">
        <div class="flex items-center gap-2">
          <Label class="text-sm font-medium">Add Participant</Label>
          <Popover v-model:open="openAddPopover">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="openAddPopover"
                class="flex-1 justify-between"
                :disabled="isAddingParticipant || availableUsers.length === 0"
              >
                <span class="flex items-center gap-2">
                  <UserPlus class="h-4 w-4" />
                  {{ selectedUser ? selectedUser.name : 'Select user to add...' }}
                </span>
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search users..." v-model="searchQuery" />
                <CommandEmpty>
                  {{ availableUsers.length === 0 ? 'No users available to add' : 'No users found' }}
                </CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    <CommandItem
                      v-for="user in filteredUsers"
                      :key="user.id"
                      :value="user.name"
                      @select="selectUser(user)"
                    >
                      <Check
                        :class="
                          cn(
                            'mr-2 h-4 w-4',
                            selectedUserId === user.id ? 'opacity-100' : 'opacity-0',
                          )
                        "
                      />
                      <div class="flex items-center gap-2 flex-1">
                        <Avatar class="h-6 w-6">
                          <AvatarFallback class="text-xs">
                            {{ getInitials(user.name) }}
                          </AvatarFallback>
                        </Avatar>
                        <div class="flex flex-col">
                          <span class="text-sm">{{ user.name }}</span>
                          <span class="text-xs text-muted-foreground">{{ user.email }}</span>
                        </div>
                      </div>
                    </CommandItem>
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button
            @click="addParticipant"
            :disabled="!selectedUser || isAddingParticipant"
            size="sm"
          >
            <Loader2 v-if="isAddingParticipant" class="mr-2 h-4 w-4 animate-spin" />
            <UserPlus v-else class="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      <!-- Participants List -->
      <div v-if="canViewParticipants" class="flex-1 min-h-0">
        <Label class="text-sm font-medium mb-3 block"> Current Participants </Label>

        <!-- Loading State -->
        <div v-if="isLoadingParticipants" class="space-y-3">
          <div v-for="i in 3" :key="i" class="flex items-center gap-3 p-3 border rounded-lg">
            <Skeleton class="h-10 w-10 rounded-full" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-3 w-48" />
            </div>
            <Skeleton class="h-8 w-16" />
          </div>
        </div>

        <!-- Participants List -->
        <ScrollArea v-else class="h-64 border rounded-lg">
          <div class="p-3 space-y-2">
            <div
              v-for="participant in participants"
              :key="participant.id"
              class="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
            >
              <Avatar class="h-10 w-10">
                <AvatarFallback>
                  {{ getInitials(participant.name) }}
                </AvatarFallback>
              </Avatar>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium truncate">{{ participant.name }}</p>
                  <Badge
                    v-if="participant.id === authStore.user?.id"
                    variant="outline"
                    class="text-xs"
                  >
                    You
                  </Badge>
                </div>
                <div class="flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail class="h-3 w-3" />
                  <span class="truncate">{{ participant.email }}</span>
                </div>
              </div>

              <Button
                v-if="canManageParticipants && participant.id !== authStore.user?.id"
                variant="outline"
                size="sm"
                @click="confirmRemoveParticipant(participant)"
                :disabled="isRemovingParticipant"
                class="text-destructive hover:text-destructive"
              >
                <UserMinus class="h-4 w-4" />
              </Button>
            </div>

            <!-- Empty State -->
            <div
              v-if="participants.length === 0 && !isLoadingParticipants"
              class="text-center py-8 text-muted-foreground"
            >
              <Users class="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p class="text-sm">No participants added yet</p>
              <p v-if="canManageParticipants" class="text-xs mt-1">
                Use the form above to add participants
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleClose"> Close </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- Remove Confirmation Dialog -->
  <ConfirmationDialog
    v-model:open="confirmRemoveDialog"
    title="Remove Participant"
    :description="`Are you sure you want to remove ${userToRemove?.name} from this meeting?`"
    @confirm="removeParticipant"
  />
</template>
