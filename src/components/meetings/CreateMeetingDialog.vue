<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useMeetingsStore, type CreateMeetingPayload } from '@/stores/meetings'
import { useLocationsStore } from '@/stores/locations'
import { useUsersStore } from '@/stores/users'
import { storeToRefs } from 'pinia'
import { createMeetingSchema } from '@/lib/validation/meeting-schemas'
import { validateWithSchema, type ValidationResult } from '@/lib/validation/form-utils'
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
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import MeetingForm from './MeetingForm.vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open', 'success'])

const meetingsStore = useMeetingsStore()
const locationsStore = useLocationsStore()
const usersStore = useUsersStore()

const { locations } = storeToRefs(locationsStore)
const { users } = storeToRefs(usersStore)

// Form state
const currentStep = ref(1)
const isSubmitting = ref(false)
const validationErrors = ref<Record<string, string>>({})
const stepValidation = ref<Record<number, boolean>>({
  1: false,
  2: false,
  3: true, // Participants step is optional
})

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

// Computed properties
const canProceedToNextStep = computed(() => {
  return stepValidation.value[currentStep.value] === true
})

const canSubmit = computed(() => {
  return stepValidation.value[1] && stepValidation.value[2] && !isSubmitting.value
})

const showValidationErrors = computed(() => {
  return Object.keys(validationErrors.value).length > 0
})

// Validation functions
function validateStep(step: number): boolean {
  const stepFields = getStepFields(step)
  const newErrors = { ...validationErrors.value }

  // Clear previous errors for the current step's fields
  stepFields.forEach((field) => {
    delete newErrors[field]
  })

  // We validate the whole form, but only check for errors in the current step's fields.
  // Transform formData to match schema expectations (trim strings etc)
  const dataToValidate = {
    ...formData.value,
    topic: formData.value.topic.trim(),
    description: formData.value.description.trim() || undefined,
    password: formData.value.password?.trim() || undefined,
  }

  const result: ValidationResult = validateWithSchema(createMeetingSchema, dataToValidate)

  let isStepValid = true
  if (!result.success && result.fieldErrors) {
    Object.entries(result.fieldErrors).forEach(([field, message]) => {
      // If an error field is in the current step, the step is invalid.
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

function validateCurrentStep(): boolean {
  return validateStep(currentStep.value)
}

function validateAllSteps(): boolean {
  const dataToValidate = {
    ...formData.value,
    topic: formData.value.topic.trim(),
    description: formData.value.description.trim() || undefined,
    password: formData.value.password?.trim() || undefined,
  }

  const result: ValidationResult = validateWithSchema(createMeetingSchema, dataToValidate)

  if (!result.success && result.fieldErrors) {
    validationErrors.value = result.fieldErrors
    return false
  }

  validationErrors.value = {}
  return true
}

// Step navigation
function nextStep() {
  if (validateCurrentStep() && currentStep.value < 3) {
    currentStep.value++
  }
}

function previousStep() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Form submission
async function createMeeting() {
  if (!validateAllSteps()) {
    // Find the first step with errors and navigate to it
    for (let step = 1; step <= 3; step++) {
      if (!validateStep(step)) {
        currentStep.value = step
        break
      }
    }
    return
  }

  isSubmitting.value = true
  meetingsStore.clearError()

  try {
    const meetingData: CreateMeetingPayload = {
      topic: formData.value.topic.trim(),
      description: formData.value.description.trim() || undefined,
      start_time: formData.value.start_time,
      duration: formData.value.duration,
      type: formData.value.type,
      participants: formData.value.participants,
    }

    const type = formData.value.type
    // Add location_id for offline/hybrid meetings
    if ((type === 'offline' || type === 'hybrid') && formData.value.location_id) {
      meetingData.location_id = formData.value.location_id
    }

    // Add password for online/hybrid meetings
    if ((type === 'online' || type === 'hybrid') && formData.value.password?.trim()) {
      meetingData.password = formData.value.password.trim()
    }

    const newMeeting = await meetingsStore.createMeeting(meetingData)

    toast.success('Meeting created successfully!')
    resetForm()
    emit('update:open', false)
    emit('success', newMeeting)
  } catch {
    // Handle validation errors from server
    if (meetingsStore.error?.type === 'validation' && meetingsStore.error.details) {
      const serverErrors: Record<string, string> = {}
      Object.entries(meetingsStore.error.details).forEach(([field, messages]) => {
        serverErrors[field] = messages[0] || 'Validation error'
      })
      validationErrors.value = { ...validationErrors.value, ...serverErrors }

      if (serverErrors.zoom_api) {
        currentStep.value = 1
      } else {
        // Navigate to the step with other errors
        for (let step = 1; step <= 3; step++) {
          const stepFields = getStepFields(step)
          if (stepFields.some((field) => serverErrors[field])) {
            currentStep.value = step
            break
          }
        }
      }
    }

    const errorMessage =
      meetingsStore.error?.details?.zoom_api?.[0] ||
      meetingsStore.error?.message ||
      'Failed to create meeting'
    toast.error(errorMessage)
  } finally {
    isSubmitting.value = false
  }
}

// Form reset
function resetForm() {
  formData.value = { ...initialFormState }
  currentStep.value = 1
  validationErrors.value = {}
  stepValidation.value = { 1: false, 2: false, 3: true }
  isSubmitting.value = false
  meetingsStore.clearError()
}

// Watch for dialog close to reset form
watch(
  () => props.open,
  (newValue) => {
    if (!newValue) {
      // Reset form when dialog closes
      nextTick(() => {
        resetForm()
      })
    } else {
      // Validate current step when dialog opens
      nextTick(() => {
        validateStep(currentStep.value)
      })
    }
  },
)

// Watch for type changes to clear location/password when not required
watch(
  () => formData.value.type,
  (newType) => {
    if (newType === 'online') {
      formData.value.location_id = undefined
    }
    // Clear validation errors when type changes
    if (validationErrors.value.location_id) delete validationErrors.value.location_id
    if (validationErrors.value.password) delete validationErrors.value.password
    validateStep(2)
  },
)

// Watch form fields for real-time validation REMOVED to prevent aggressive validation
// Validation happens on Step Change or Submit attempt.

// Watch for step changes to validate current step
watch(currentStep, (newStep) => {
  validateStep(newStep)
})

onMounted(() => {
  locationsStore.fetchLocations()
  usersStore.fetchUsers()
  validateStep(1)
})
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-[650px] flex flex-col">
      <div
        v-if="isSubmitting"
        class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg"
      >
        <div class="flex flex-col items-center gap-2">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-lg font-semibold">Creating Meeting...</p>
          <p class="text-sm text-muted-foreground">Communicating with Zoom API.</p>
        </div>
      </div>
      <DialogHeader>
        <DialogTitle>Create a New Meeting</DialogTitle>
        <DialogDescription> Follow the steps to schedule your meeting. </DialogDescription>
      </DialogHeader>

      <div class="flex items-center justify-center space-x-4 py-4">
        <!-- Step 1 -->
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
            <div class="text-xs text-muted-foreground">Topic & Time</div>
          </div>
        </div>
        <div :class="['h-px w-16', currentStep > 1 ? 'bg-primary' : 'bg-muted']"></div>
        <!-- Step 2 -->
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
            <div class="text-xs text-muted-foreground">Type & Security</div>
          </div>
        </div>
        <div :class="['h-px w-16', currentStep > 2 ? 'bg-primary' : 'bg-muted']"></div>
        <!-- Step 3 -->
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
            <div class="text-xs text-muted-foreground">Invite Users</div>
          </div>
        </div>
      </div>

      <!-- Global validation errors -->
      <Alert v-if="showValidationErrors" variant="destructive">
        <AlertDescription>
          <ul class="list-disc list-inside">
            <li v-for="(error, field) in validationErrors" :key="field">
              {{ error }}
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <div class="flex-grow overflow-y-auto -mx-6 px-6">
        <MeetingForm
          v-model="formData"
          :current-step="currentStep"
          :locations="locations"
          :users="users"
          :validation-errors="validationErrors"
          :is-edit-mode="false"
        />
      </div>

      <DialogFooter class="flex justify-between border-t pt-4">
        <div>
          <Button
            v-if="currentStep > 1"
            variant="outline"
            @click="previousStep"
            :disabled="isSubmitting"
          >
            Previous
          </Button>
        </div>
        <div>
          <Button
            v-if="currentStep < 3"
            @click="nextStep"
            :disabled="!canProceedToNextStep || isSubmitting"
          >
            Next
          </Button>
          <Button
            v-if="currentStep === 3"
            @click="createMeeting"
            :disabled="!canSubmit || isSubmitting"
          >
            <Loader2 v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
            {{ isSubmitting ? 'Creating...' : 'Create Meeting' }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
