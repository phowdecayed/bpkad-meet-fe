<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useMeetingsStore, type UpdateMeetingPayload } from '@/stores/meetings'
import { useLocationsStore } from '@/stores/locations'
import { useUsersStore } from '@/stores/users'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'
import { updateMeetingSchema } from '@/lib/validation/meeting-schemas'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { AlertTriangle, Users, MapPin, Clock, Type } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  meeting: Meeting | null
}>()

const emit = defineEmits(['update:open'])

const meetingsStore = useMeetingsStore()
const locationsStore = useLocationsStore()
const usersStore = useUsersStore()

// Form fields
const topic = ref('')
const description = ref('')
const startTime = ref('')
const duration = ref(60)
const type = ref<'online' | 'offline' | 'hybrid'>('online')
const locationId = ref<number | undefined>(undefined)
const password = ref('')
const selectedParticipants = ref<number[]>([])

// State management
const isLoading = ref(false)
const hasUnsavedChanges = ref(false)
const validationErrors = ref<Record<string, string>>({})
const originalData = ref<any>(null)

// Computed properties
const isLocationRequired = computed(() => type.value === 'offline' || type.value === 'hybrid')
const isPasswordAllowed = computed(() => type.value === 'online' || type.value === 'hybrid')
const availableUsers = computed(() =>
  usersStore.users.filter((user) => user.id !== props.meeting?.organizer.id),
)

// Watch for changes to detect unsaved changes
watch(
  [topic, description, startTime, duration, type, locationId, password, selectedParticipants],
  () => {
    if (originalData.value) {
      hasUnsavedChanges.value = hasFormChanged()
    }
  },
  { deep: true },
)

// Watch for meeting type changes to handle dynamic field visibility
watch(type, (newType, oldType) => {
  if (oldType && newType !== oldType) {
    // Clear location when switching from offline/hybrid to online
    if (oldType !== 'online' && newType === 'online') {
      locationId.value = undefined
    }
    // Clear password when switching to offline
    if (newType === 'offline') {
      password.value = ''
    }
    validateForm()
  }
})

// Watch for meeting prop changes to populate form
watch(
  () => props.meeting,
  async (newMeeting) => {
    if (newMeeting) {
      await populateForm(newMeeting)
    } else {
      resetForm()
    }
  },
  { immediate: true },
)

// Watch for dialog open state
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.meeting) {
      await loadRequiredData()
      await populateForm(props.meeting)
    }
  },
)

onMounted(async () => {
  if (props.open && props.meeting) {
    await loadRequiredData()
  }
})

async function loadRequiredData() {
  try {
    await Promise.all([
      locationsStore.fetchLocations(),
      usersStore.fetchUsers(),
      props.meeting ? meetingsStore.fetchParticipants(props.meeting.id) : Promise.resolve(),
    ])
  } catch (error) {
    console.error('Failed to load required data:', error)
  }
}

async function populateForm(meeting: Meeting) {
  topic.value = meeting.topic
  description.value = meeting.description || ''
  startTime.value = new Date(meeting.start_time).toISOString().slice(0, 16)
  duration.value = meeting.duration
  type.value = meeting.type
  locationId.value = meeting.location?.id
  password.value = '' // Don't populate password for security

  // Load and set participants
  try {
    const participants = await meetingsStore.fetchParticipants(meeting.id)
    selectedParticipants.value = participants.map((p) => p.id)
  } catch (error) {
    console.error('Failed to load participants:', error)
    selectedParticipants.value = []
  }

  // Store original data for change detection
  originalData.value = {
    topic: meeting.topic,
    description: meeting.description || '',
    start_time: meeting.start_time,
    duration: meeting.duration,
    type: meeting.type,
    location_id: meeting.location?.id,
    participants: selectedParticipants.value.slice(),
  }

  hasUnsavedChanges.value = false
  validationErrors.value = {}
}

function resetForm() {
  topic.value = ''
  description.value = ''
  startTime.value = ''
  duration.value = 60
  type.value = 'online'
  locationId.value = undefined
  password.value = ''
  selectedParticipants.value = []
  originalData.value = null
  hasUnsavedChanges.value = false
  validationErrors.value = {}
}

function hasFormChanged(): boolean {
  if (!originalData.value) return false

  const currentStartTime = new Date(startTime.value).toISOString()
  const originalStartTime = new Date(originalData.value.start_time).toISOString()

  return (
    topic.value !== originalData.value.topic ||
    description.value !== originalData.value.description ||
    currentStartTime !== originalStartTime ||
    duration.value !== originalData.value.duration ||
    type.value !== originalData.value.type ||
    locationId.value !== originalData.value.location_id ||
    !arraysEqual(selectedParticipants.value, originalData.value.participants)
  )
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((val) => b.includes(val))
}

function validateForm(): boolean {
  validationErrors.value = {}

  try {
    const formData = {
      topic: topic.value,
      description: description.value || undefined,
      start_time: startTime.value,
      duration: duration.value,
      type: type.value,
      location_id: locationId.value,
      password: password.value || undefined,
      participants: selectedParticipants.value,
    }

    updateMeetingSchema.parse(formData)
    return true
  } catch (error: any) {
    if (error.errors) {
      error.errors.forEach((err: any) => {
        validationErrors.value[err.path[0]] = err.message
      })
    }
    return false
  }
}

function toggleParticipant(userId: number) {
  const index = selectedParticipants.value.indexOf(userId)
  if (index > -1) {
    selectedParticipants.value.splice(index, 1)
  } else {
    selectedParticipants.value.push(userId)
  }
}

async function updateMeeting() {
  if (!props.meeting || !validateForm()) {
    return
  }

  isLoading.value = true

  try {
    const updateData: UpdateMeetingPayload = {
      topic: topic.value,
      description: description.value || undefined,
      start_time: startTime.value,
      duration: duration.value,
      location_id: isLocationRequired.value ? locationId.value : undefined,
      settings:
        isPasswordAllowed.value && password.value ? { password: password.value } : undefined,
    }

    await meetingsStore.updateMeeting(props.meeting.id, updateData)

    // Update participants if changed
    if (!arraysEqual(selectedParticipants.value, originalData.value?.participants || [])) {
      const currentParticipants = meetingsStore.participants.map((p) => p.id)
      const toAdd = selectedParticipants.value.filter((id) => !currentParticipants.includes(id))
      const toRemove = currentParticipants.filter((id) => !selectedParticipants.value.includes(id))

      for (const userId of toAdd) {
        await meetingsStore.addParticipant(props.meeting.id, userId)
      }

      for (const userId of toRemove) {
        await meetingsStore.removeParticipant(props.meeting.id, userId)
      }
    }

    hasUnsavedChanges.value = false
    emit('update:open', false)
  } catch (error: any) {
    console.error('Failed to update meeting:', error)
    if (error.response?.data?.errors) {
      validationErrors.value = error.response.data.errors
    }
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  if (hasUnsavedChanges.value) {
    if (confirm('You have unsaved changes. Are you sure you want to close?')) {
      emit('update:open', false)
    }
  } else {
    emit('update:open', false)
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="max-w-2xl max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Type class="h-5 w-5" />
          Edit Meeting
          <Badge v-if="hasUnsavedChanges" variant="secondary" class="ml-2"> Unsaved Changes </Badge>
        </DialogTitle>
        <DialogDescription>
          Update the meeting details below. Fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <!-- Unsaved Changes Warning -->
      <Alert v-if="hasUnsavedChanges" class="mb-4">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>
          You have unsaved changes that will be lost if you close this dialog.
        </AlertDescription>
      </Alert>

      <!-- Error Display -->
      <Alert v-if="Object.keys(validationErrors).length > 0" variant="destructive" class="mb-4">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>
          Please fix the following errors:
          <ul class="list-disc list-inside mt-2">
            <li v-for="(error, field) in validationErrors" :key="field">{{ error }}</li>
          </ul>
        </AlertDescription>
      </Alert>

      <ScrollArea class="max-h-[60vh] pr-4">
        <div class="grid gap-6 py-4">
          <!-- Basic Information -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium">Basic Information</h3>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="topic" class="text-right"> Topic * </Label>
              <div class="col-span-3">
                <Input
                  id="topic"
                  v-model="topic"
                  :class="{ 'border-red-500': validationErrors.topic }"
                  placeholder="Enter meeting topic"
                />
                <p v-if="validationErrors.topic" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.topic }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-4 items-start gap-4">
              <Label for="description" class="text-right pt-2"> Description </Label>
              <div class="col-span-3">
                <Textarea
                  id="description"
                  v-model="description"
                  :class="{ 'border-red-500': validationErrors.description }"
                  placeholder="Enter meeting description (optional)"
                  rows="3"
                />
                <p v-if="validationErrors.description" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.description }}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Meeting Type -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium flex items-center gap-2">
              <Type class="h-4 w-4" />
              Meeting Type
            </h3>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="type" class="text-right"> Type * </Label>
              <div class="col-span-3">
                <Select v-model="type">
                  <SelectTrigger :class="{ 'border-red-500': validationErrors.type }">
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online (Zoom)</SelectItem>
                    <SelectItem value="offline">Offline (In-person)</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Online + In-person)</SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="validationErrors.type" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.type }}
                </p>
              </div>
            </div>

            <!-- Location Selection (for offline/hybrid) -->
            <div v-if="isLocationRequired" class="grid grid-cols-4 items-center gap-4">
              <Label for="location" class="text-right">
                <MapPin class="h-4 w-4 inline mr-1" />
                Location *
              </Label>
              <div class="col-span-3">
                <Select v-model="locationId">
                  <SelectTrigger :class="{ 'border-red-500': validationErrors.location_id }">
                    <SelectValue placeholder="Select meeting location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="location in locationsStore.locations"
                      :key="location.id"
                      :value="location.id"
                    >
                      {{ location.name }} - {{ location.room_name || 'Main Room' }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p v-if="validationErrors.location_id" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.location_id }}
                </p>
              </div>
            </div>

            <!-- Password (for online/hybrid) -->
            <div v-if="isPasswordAllowed" class="grid grid-cols-4 items-center gap-4">
              <Label for="password" class="text-right"> Password </Label>
              <div class="col-span-3">
                <Input
                  id="password"
                  v-model="password"
                  type="password"
                  :class="{ 'border-red-500': validationErrors.password }"
                  placeholder="Optional meeting password"
                  maxlength="10"
                />
                <p v-if="validationErrors.password" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.password }}
                </p>
                <p class="text-sm text-gray-500 mt-1">
                  Leave empty to keep existing password unchanged
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Schedule -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium flex items-center gap-2">
              <Clock class="h-4 w-4" />
              Schedule
            </h3>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="start_time" class="text-right"> Start Time * </Label>
              <div class="col-span-3">
                <Input
                  id="start_time"
                  v-model="startTime"
                  type="datetime-local"
                  :class="{ 'border-red-500': validationErrors.start_time }"
                />
                <p v-if="validationErrors.start_time" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.start_time }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="duration" class="text-right"> Duration (minutes) * </Label>
              <div class="col-span-3">
                <Input
                  id="duration"
                  v-model.number="duration"
                  type="number"
                  min="1"
                  max="1440"
                  :class="{ 'border-red-500': validationErrors.duration }"
                />
                <p v-if="validationErrors.duration" class="text-sm text-red-500 mt-1">
                  {{ validationErrors.duration }}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Participants -->
          <div class="space-y-4">
            <h3 class="text-lg font-medium flex items-center gap-2">
              <Users class="h-4 w-4" />
              Participants
              <Badge variant="outline" class="ml-2">
                {{ selectedParticipants.length }} selected
              </Badge>
            </h3>

            <div class="grid grid-cols-4 items-start gap-4">
              <Label class="text-right pt-2"> Select Users </Label>
              <div class="col-span-3">
                <ScrollArea class="h-32 border rounded-md p-3">
                  <div class="space-y-2">
                    <div
                      v-for="user in availableUsers"
                      :key="user.id"
                      class="flex items-center space-x-2"
                    >
                      <Checkbox
                        :id="`user-${user.id}`"
                        :checked="selectedParticipants.includes(user.id)"
                        @update:checked="toggleParticipant(user.id)"
                      />
                      <Label
                        :for="`user-${user.id}`"
                        class="text-sm font-normal cursor-pointer flex-1"
                      >
                        {{ user.name }} ({{ user.email }})
                      </Label>
                    </div>
                    <div
                      v-if="availableUsers.length === 0"
                      class="text-sm text-gray-500 text-center py-4"
                    >
                      No users available
                    </div>
                  </div>
                </ScrollArea>
                <p class="text-sm text-gray-500 mt-1">Select users to invite to this meeting</p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter class="flex justify-between">
        <Button variant="outline" @click="handleClose" :disabled="isLoading"> Cancel </Button>
        <Button @click="updateMeeting" :disabled="isLoading">
          <span v-if="isLoading">Updating...</span>
          <span v-else>Update Meeting</span>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
