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
import { Check, ChevronsUpDown, Loader2 } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits(['update:open'])

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

// Form fields
const topic = ref('')
const description = ref('')
const startTime = ref('')
const duration = ref(60)
const type = ref<'online' | 'offline' | 'hybrid'>('online')
const locationId = ref<number | undefined>(undefined)
const password = ref('')
const participants = ref<number[]>([])

// Computed properties
const isLocationRequired = computed(() => type.value === 'offline' || type.value === 'hybrid')
const isPasswordVisible = computed(() => type.value === 'online' || type.value === 'hybrid')
const openParticipantsPopover = ref(false)

const selectedUsers = computed(() =>
  users.value.filter((user) => participants.value.includes(user.id)),
)

const canProceedToNextStep = computed(() => {
  return stepValidation.value[currentStep.value] === true
})

const canSubmit = computed(() => {
  return stepValidation.value[1] && stepValidation.value[2] && !isSubmitting.value
})

const showValidationErrors = computed(() => {
  return Object.keys(validationErrors.value).length > 0
})

// Form data computed property for validation
const formData = computed(() => ({
  topic: topic.value.trim(),
  description: description.value.trim() || undefined,
  start_time: startTime.value,
  duration: duration.value,
  type: type.value,
  location_id: locationId.value,
  password: password.value.trim() || undefined,
  participants: participants.value,
}))

// Validation functions
function validateStep(step: number): boolean {
  const stepFields = getStepFields(step)
  const newErrors = { ...validationErrors.value }

  // Clear previous errors for the current step's fields
  stepFields.forEach((field) => {
    delete newErrors[field]
  })

  // We validate the whole form, but only check for errors in the current step's fields.
  const result: ValidationResult = validateWithSchema(createMeetingSchema, formData.value)

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
  const result: ValidationResult = validateWithSchema(createMeetingSchema, formData.value)

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
      topic: topic.value.trim(),
      description: description.value.trim() || undefined,
      start_time: startTime.value,
      duration: duration.value,
      type: type.value,
      participants: participants.value, // Already array of user IDs
    }

    // Add location_id for offline/hybrid meetings
    if (isLocationRequired.value && locationId.value) {
      meetingData.location_id = locationId.value
    }

    // Add password for online/hybrid meetings
    if (isPasswordVisible.value && password.value.trim()) {
      meetingData.password = password.value.trim()
    }

    await meetingsStore.createMeeting(meetingData)

    toast.success('Meeting created successfully!')
    resetForm()
    emit('update:open', false)
  } catch {
    // Handle validation errors from server
    if (meetingsStore.error?.type === 'validation' && meetingsStore.error.details) {
      const serverErrors: Record<string, string> = {}
      Object.entries(meetingsStore.error.details).forEach(([field, messages]) => {
        serverErrors[field] = messages[0] || 'Validation error'
      })
      validationErrors.value = { ...validationErrors.value, ...serverErrors }

      if (serverErrors.zoom_api) {
        // The zoom_api error is not tied to a specific field, but it's related to time.
        // So, we navigate to the first step where time is set.
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
  topic.value = ''
  description.value = ''
  startTime.value = ''
  duration.value = 60
  type.value = 'online'
  locationId.value = undefined
  password.value = ''
  participants.value = []
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

// Watch for type changes to clear location when not required
watch(type, (newType) => {
  if (newType === 'online') {
    locationId.value = undefined
  }
  // Clear validation errors when type changes
  if (validationErrors.value.location_id) {
    delete validationErrors.value.location_id
  }
  if (validationErrors.value.password) {
    delete validationErrors.value.password
  }
  validateStep(2)
})

// Watch form fields for real-time validation
watch([topic, description, startTime, duration], () => {
  if (currentStep.value === 1) {
    validateStep(1)
  }
})

watch([type, locationId, password], () => {
  if (currentStep.value === 2) {
    validateStep(2)
  }
})

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
      <div v-if="isSubmitting" class="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
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
        <!-- Step 1: Basic Info -->
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
                placeholder="60"
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
                <SelectItem v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="validationErrors.location_id" class="text-sm text-red-500 mt-1">
              {{ validationErrors.location_id }}
            </p>
          </div>
          <div v-if="isPasswordVisible" class="grid gap-2">
            <Label for="password">Password</Label>
            <Input
              id="password"
              v-model="password"
              type="text"
              :class="{ 'border-red-500': validationErrors.password }"
              placeholder="Optional meeting password (max 10 chars)"
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
            <Label>Invite Participants</Label>
            <Popover v-model:open="openParticipantsPopover">
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  role="combobox"
                  :aria-expanded="openParticipantsPopover"
                  class="w-full justify-between"
                >
                  {{
                    selectedUsers.length > 0
                      ? selectedUsers.map((u) => u.name).join(', ')
                      : 'Select participants...'
                  }}
                  <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search users..." />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    <CommandList>
                      <CommandItem
                        v-for="user in users"
                        :key="user.id"
                        :value="user.name"
                        @select="
                          () => {
                            const index = participants.indexOf(user.id)
                            if (index > -1) {
                              participants.splice(index, 1)
                            } else {
                              participants.push(user.id)
                            }
                          }
                        "
                      >
                        <Check
                          :class="
                            cn(
                              'mr-2 h-4 w-4',
                              participants.includes(user.id) ? 'opacity-100' : 'opacity-0',
                            )
                          "
                        />
                        {{ user.name }}
                      </CommandItem>
                    </CommandList>
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <p class="text-sm text-muted-foreground">
              Select users to invite to the meeting. This step is optional.
            </p>
          </div>
        </div>
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
