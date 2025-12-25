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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Type, Loader2 } from 'lucide-vue-next'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { toast } from 'vue-sonner'
import MeetingForm from './MeetingForm.vue'

const props = defineProps<{
  open: boolean
  meeting: Meeting | null
}>()

const emit = defineEmits(['update:open', 'success'])

const meetingsStore = useMeetingsStore()
const locationsStore = useLocationsStore()
const usersStore = useUsersStore()

// State management
const isLoading = ref(false)
const hasUnsavedChanges = ref(false)
const validationErrors = ref<Record<string, string>>({})
const isConfirmDialogOpen = ref(false)

// Stepper state
const currentStep = ref(1)
const stepValidation = ref<Record<number, boolean>>({ 1: true, 2: true, 3: true })

const initialFormState = {
  topic: '',
  description: '',
  start_time: '',
  duration: 60,
  type: 'online' as 'online' | 'offline' | 'hybrid',
  location_id: undefined as number | undefined,
  password: '',
  participants: [] as number[],
}

const formData = ref({ ...initialFormState })

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
const isLocationRequired = computed(
  () => formData.value.type === 'offline' || formData.value.type === 'hybrid',
)
const isPasswordAllowed = computed(
  () => formData.value.type === 'online' || formData.value.type === 'hybrid',
)
// Filter out organizer from available users list
const availableUsers = computed(() =>
  usersStore.users.filter((user) => user.id !== props.meeting?.organizer.id),
)

const canProceedToNextStep = computed(() => {
  return stepValidation.value[currentStep.value] === true
})

const showValidationErrors = computed(() => {
  return Object.keys(validationErrors.value).length > 0
})

// Watchers
watch(
  formData,
  () => {
    if (originalData.value) {
      hasUnsavedChanges.value = hasFormChanged()
    }
    // Validation removed for UX improvement (Lazy validation)
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

  // Correctly format the UTC date from the server to a local datetime-local string
  const d = new Date(fullMeeting.start_time)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const formattedStartTime = `${year}-${month}-${day}T${hours}:${minutes}`

  let participantIds: number[] = []
  try {
    const participants = await meetingsStore.fetchParticipants(fullMeeting.id)
    participantIds = participants.map((p) => p.id)
  } catch (error) {
    console.error('Failed to load participants:', error)
  }

  formData.value = {
    topic: fullMeeting.topic,
    description: fullMeeting.description || '',
    start_time: formattedStartTime,
    duration: fullMeeting.duration,
    type: fullMeeting.type,
    location_id: fullMeeting.location?.id,
    password: '',
    participants: participantIds,
  }

  originalData.value = {
    topic: fullMeeting.topic,
    description: fullMeeting.description || '',
    start_time: formattedStartTime,
    duration: fullMeeting.duration,
    type: fullMeeting.type,
    location_id: fullMeeting.location?.id,
    participants: [...participantIds],
  }

  hasUnsavedChanges.value = false
  validationErrors.value = {}
  currentStep.value = 1
  validateAllSteps()
}

function resetForm() {
  formData.value = { ...initialFormState }
  originalData.value = null
  hasUnsavedChanges.value = false
  validationErrors.value = {}
  currentStep.value = 1
  stepValidation.value = { 1: true, 2: true, 3: true }
}

function hasFormChanged(): boolean {
  if (!originalData.value) return false

  return (
    formData.value.topic !== originalData.value.topic ||
    formData.value.description !== originalData.value.description ||
    formData.value.start_time !== originalData.value.start_time ||
    formData.value.duration !== originalData.value.duration ||
    formData.value.type !== originalData.value.type ||
    formData.value.location_id !== originalData.value.location_id ||
    !arraysEqual(formData.value.participants, originalData.value.participants)
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

  // Transform for validation
  const dataToValidate = {
    ...formData.value,
    topic: formData.value.topic.trim(),
    description: formData.value.description.trim() || undefined,
    password: formData.value.password?.trim() || undefined,
  }

  const result: ValidationResult = validateWithSchema(updateMeetingSchema, dataToValidate)

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
  const dataToValidate = {
    ...formData.value,
    topic: formData.value.topic.trim(),
    description: formData.value.description.trim() || undefined,
    password: formData.value.password?.trim() || undefined,
  }

  const result = validateWithSchema(updateMeetingSchema, dataToValidate)
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
      topic: formData.value.topic,
      description: formData.value.description || undefined,
      start_time: formData.value.start_time,
      duration: formData.value.duration,
      location_id: isLocationRequired.value ? formData.value.location_id : undefined,
      settings:
        isPasswordAllowed.value && formData.value.password
          ? { password: formData.value.password }
          : undefined,
    }

    await meetingsStore.updateMeeting(props.meeting.id, updateData)

    if (!arraysEqual(formData.value.participants, originalData.value?.participants || [])) {
      const originalParticipants = originalData.value?.participants || []
      const currentParticipants = formData.value.participants

      const toAdd = currentParticipants.filter((id) => !originalParticipants.includes(id))
      const toRemove = originalParticipants.filter((id) => !currentParticipants.includes(id))

      for (const userId of toAdd) {
        await meetingsStore.addParticipant(props.meeting.id, userId)
      }
      for (const userId of toRemove) {
        await meetingsStore.removeParticipant(props.meeting.id, userId)
      }
    }

    toast.success('Meeting updated successfully!')
    hasUnsavedChanges.value = false
    toast.success('Meeting updated successfully!')
    hasUnsavedChanges.value = false
    emit('update:open', false)
    emit('success', props.meeting.id)
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
  <Dialog :open="props.open" @update:open="handleClose" data-testid="edit-meeting-dialog">
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

      <div class="flex-grow overflow-y-auto -mx-6 px-6">
        <MeetingForm
          v-model="formData"
          :current-step="currentStep"
          :locations="locationsStore.locations"
          :users="availableUsers"
          :validation-errors="validationErrors"
          :is-edit-mode="true"
        />
      </div>

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
