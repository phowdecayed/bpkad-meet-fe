<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useMeetingsStore, type UpdateMeetingPayload } from '@/stores/meetings'
import { useLocationsStore } from '@/stores/locations'
import { useUsersStore } from '@/stores/users'
import type { Meeting } from '@/types/meeting'
import { validateWithSchema, type ValidationResult } from '@/lib/validation/form-utils'
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
import { AlertTriangle, Type, Loader2 } from 'lucide-vue-next'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { toast } from 'vue-sonner'

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

// Stepper state
const currentStep = ref(1)
const stepValidation = ref<Record<number, boolean>>({ 1: true, 2: true, 3: true })

// State management
const isLoading = ref(false)
const hasUnsavedChanges = ref(false)
const validationErrors = ref<Record<string, string>>({})
const isConfirmDialogOpen = ref(false)
const originalData = ref<{
  topic: string
  description: string
  start_time: string
  duration: number
  type: 'online' | 'offline' | 'hybrid'
  location_id?: number
  participants: number[]
} | null>(null)

// Computed properties
const isLocationRequired = computed(() => type.value === 'offline' || type.value === 'hybrid')
const isPasswordAllowed = computed(() => type.value === 'online' || type.value === 'hybrid')
const availableUsers = computed(() =>
  usersStore.users.filter((user) => user.id !== props.meeting?.organizer.id),
)
const canProceedToNextStep = computed(() => {
  return stepValidation.value[currentStep.value] === true
})

const showValidationErrors = computed(() => {
  return Object.keys(validationErrors.value).length > 0
})

const formData = computed(() => ({
  topic: topic.value,
  description: description.value || undefined,
  start_time: startTime.value,
  duration: duration.value,
  type: type.value,
  location_id: locationId.value,
  password: password.value || undefined,
  participants: selectedParticipants.value,
}))

// Watchers
watch(
  [topic, description, startTime, duration, type, locationId, password, selectedParticipants],
  () => {
    if (originalData.value) {
      hasUnsavedChanges.value = hasFormChanged()
    }
    validateStep(currentStep.value)
  },
  { deep: true },
)

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

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.meeting) {
      await loadRequiredData()
      await populateForm(props.meeting)
    } else if (!isOpen) {
      resetForm()
    }
  },
)

watch(currentStep, (newStep) => {
  validateStep(newStep)
})

onMounted(async () => {
  if (props.open && props.meeting) {
    await loadRequiredData()
  }
})

// Functions
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
  const fullMeeting = await meetingsStore.fetchMeeting(meeting.id)

  topic.value = fullMeeting.topic
  description.value = fullMeeting.description || ''

  // Correctly format the UTC date from the server to a local datetime-local string
  const d = new Date(fullMeeting.start_time)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  startTime.value = `${year}-${month}-${day}T${hours}:${minutes}`

  duration.value = fullMeeting.duration
  type.value = fullMeeting.type
  locationId.value = fullMeeting.location?.id
  password.value = ''

  try {
    const participants = await meetingsStore.fetchParticipants(fullMeeting.id)
    selectedParticipants.value = participants.map((p) => p.id)
  } catch (error) {
    console.error('Failed to load participants:', error)
    selectedParticipants.value = []
  }

  originalData.value = {
    topic: fullMeeting.topic,
    description: fullMeeting.description || '',
    start_time: fullMeeting.start_time,
    duration: fullMeeting.duration,
    type: fullMeeting.type,
    location_id: fullMeeting.location?.id,
    participants: [...selectedParticipants.value],
  }

  hasUnsavedChanges.value = false
  validationErrors.value = {}
  currentStep.value = 1
  validateAllSteps()
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
  currentStep.value = 1
  stepValidation.value = { 1: true, 2: true, 3: true }
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
  if (a.length !== b.length) return false
  const sortedA = [...a].sort()
  const sortedB = [...b].sort()
  return sortedA.every((val, index) => val === sortedB[index])
}

function getStepFields(step: number): string[] {
  switch (step) {
    case 1:
      return ['topic', 'description', 'start_time', 'duration']
    case 2:
      return ['type', 'location_id', 'password']
    case 3:
      return ['participants']
    default:
      return []
  }
}

function validateStep(step: number): boolean {
  const stepFields = getStepFields(step)
  const newErrors = { ...validationErrors.value }
  stepFields.forEach((field) => delete newErrors[field])

  const result: ValidationResult = validateWithSchema(updateMeetingSchema, formData.value)

  let isStepValid = true
  if (!result.success && result.fieldErrors) {
    Object.entries(result.fieldErrors).forEach(([field, message]) => {
      if (stepFields.includes(field)) {
        newErrors[field] = message
        isStepValid = false
      }
    })
  }

  validationErrors.value = newErrors
  stepValidation.value[step] = isStepValid
  return isStepValid
}

function validateAllSteps(): boolean {
  const result = validateWithSchema(updateMeetingSchema, formData.value)
  if (!result.success) {
    validationErrors.value = result.fieldErrors || {}
    return false
  }
  validationErrors.value = {}
  return true
}

function nextStep() {
  if (validateStep(currentStep.value) && currentStep.value < 3) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
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
  if (!props.meeting || !validateAllSteps()) {
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        currentStep.value = step
        break
      }
    }
    toast.error('Please fix the validation errors before submitting.')
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

    if (!arraysEqual(selectedParticipants.value, originalData.value?.participants || [])) {
      const originalParticipants = originalData.value?.participants || []
      const toAdd = selectedParticipants.value.filter((id) => !originalParticipants.includes(id))
      const toRemove = originalParticipants.filter((id) => !selectedParticipants.value.includes(id))

      for (const userId of toAdd) {
        await meetingsStore.addParticipant(props.meeting.id, userId)
      }
      for (const userId of toRemove) {
        await meetingsStore.removeParticipant(props.meeting.id, userId)
      }
    }

    toast.success('Meeting updated successfully!')
    hasUnsavedChanges.value = false
    emit('update:open', false)
  } catch (error: unknown) {
    const e = error as Error & { response?: { data?: { errors?: Record<string, string> } } }
    console.error('Failed to update meeting:', e)
    toast.error(e.message || 'An unexpected error occurred.')
    if (e.response?.data?.errors) {
      validationErrors.value = e.response.data.errors
    }
  } finally {
    isLoading.value = false
  }
}

function handleClose() {
  if (hasUnsavedChanges.value) {
    isConfirmDialogOpen.value = true
  } else {
    emit('update:open', false)
  }
}

function handleConfirmClose() {
  isConfirmDialogOpen.value = false
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-[650px] flex flex-col">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Type class="h-5 w-5" />
          Edit Meeting
          <Badge v-if="hasUnsavedChanges" variant="secondary" class="ml-2"> Unsaved Changes </Badge>
        </DialogTitle>
        <DialogDescription>
          Update the meeting details in steps. Fields marked with * are required.
        </DialogDescription>
      </DialogHeader>

      <!-- Stepper -->
      <div class="flex items-center justify-center space-x-4 py-4">
        <div class="flex items-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              currentStep >= 1
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            ]"
          >
            1
          </div>
          <div class="ml-3">
            <div class="text-sm font-medium">Basic Info</div>
          </div>
        </div>
        <div :class="['h-px w-16', currentStep > 1 ? 'bg-primary' : 'bg-muted']"></div>
        <div class="flex items-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              currentStep >= 2
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            ]"
          >
            2
          </div>
          <div class="ml-3">
            <div class="text-sm font-medium">Details</div>
          </div>
        </div>
        <div :class="['h-px w-16', currentStep > 2 ? 'bg-primary' : 'bg-muted']"></div>
        <div class="flex items-center">
          <div
            :class="[
              'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
              currentStep >= 3
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
            ]"
          >
            3
          </div>
          <div class="ml-3">
            <div class="text-sm font-medium">Participants</div>
          </div>
        </div>
      </div>

      <Alert v-if="showValidationErrors" variant="destructive">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription> Please fix the validation errors before proceeding. </AlertDescription>
      </Alert>

      <ScrollArea class="flex-grow -mx-6 px-6">
        <!-- Step 1: Basic Info & Schedule -->
        <div v-if="currentStep === 1" class="space-y-4 py-4">
          <div class="grid gap-2">
            <Label for="topic">Topic *</Label>
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
          <div class="grid gap-2">
            <Label for="description">Description</Label>
            <Textarea
              id="description"
              v-model="description"
              :class="{ 'border-red-500': validationErrors.description }"
              placeholder="Optional meeting description"
              rows="3"
            />
            <p v-if="validationErrors.description" class="text-sm text-red-500 mt-1">
              {{ validationErrors.description }}
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label for="start_time">Start Time *</Label>
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
            <div class="grid gap-2">
              <Label for="duration">Duration (minutes) *</Label>
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

        <!-- Step 2: Details -->
        <div v-if="currentStep === 2" class="space-y-4 py-4">
          <div class="grid gap-2">
            <Label for="type">Type *</Label>
            <Select v-model="type">
              <SelectTrigger :class="{ 'border-red-500': validationErrors.type }">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="validationErrors.type" class="text-sm text-red-500 mt-1">
              {{ validationErrors.type }}
            </p>
          </div>
          <div v-if="isLocationRequired" class="grid gap-2">
            <Label for="location">Location *</Label>
            <Select v-model="locationId">
              <SelectTrigger :class="{ 'border-red-500': validationErrors.location_id }">
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="loc in locationsStore.locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="validationErrors.location_id" class="text-sm text-red-500 mt-1">
              {{ validationErrors.location_id }}
            </p>
          </div>
          <div v-if="isPasswordAllowed" class="grid gap-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              :class="{ 'border-red-500': validationErrors.password }"
              placeholder="Optional: Leave empty to keep unchanged"
              maxlength="10"
            />
            <p v-if="validationErrors.password" class="text-sm text-red-500 mt-1">
              {{ validationErrors.password }}
            </p>
          </div>
        </div>

        <!-- Step 3: Participants -->
        <div v-if="currentStep === 3" class="space-y-4 py-4">
          <div class="grid gap-2">
            <Label>
              Participants
              <Badge variant="outline" class="ml-2">
                {{ selectedParticipants.length }} selected
              </Badge>
            </Label>
            <ScrollArea class="h-48 border rounded-md p-3">
              <div class="space-y-2">
                <div
                  v-for="user in availableUsers"
                  :key="user.id"
                  class="flex items-center space-x-2"
                >
                  <Checkbox
                    :id="`user-edit-${user.id}`"
                    :checked="selectedParticipants.includes(user.id)"
                    @update:checked="toggleParticipant(user.id)"
                  />
                  <Label
                    :for="`user-edit-${user.id}`"
                    class="text-sm font-normal cursor-pointer flex-1"
                  >
                    {{ user.name }} ({{ user.email }})
                  </Label>
                </div>
                <div
                  v-if="availableUsers.length === 0"
                  class="text-sm text-muted-foreground text-center py-4"
                >
                  No other users available
                </div>
              </div>
            </ScrollArea>
            <p class="text-sm text-muted-foreground">Select users to invite to this meeting.</p>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter class="flex justify-between border-t pt-4">
        <div>
          <Button
            v-if="currentStep > 1"
            variant="outline"
            @click="previousStep"
            :disabled="isLoading"
          >
            Previous
          </Button>
        </div>
        <div>
          <Button
            v-if="currentStep < 3"
            @click="nextStep"
            :disabled="!canProceedToNextStep || isLoading"
          >
            Next
          </Button>
          <Button
            v-if="currentStep === 3"
            @click="updateMeeting"
            :disabled="isLoading || !hasUnsavedChanges"
          >
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isLoading ? 'Updating...' : 'Update Meeting' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <ConfirmationDialog
    v-model:open="isConfirmDialogOpen"
    title="Unsaved Changes"
    description="You have unsaved changes. Are you sure you want to close?"
    @confirm="handleConfirmClose"
  />
</template>
