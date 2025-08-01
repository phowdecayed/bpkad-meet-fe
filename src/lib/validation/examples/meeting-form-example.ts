/**
 * Example usage of meeting validation schemas and utilities
 * This demonstrates how to integrate the validation system with Vue components
 */

import { ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  createMeetingSchema,
  validateWithSchema,
  getFieldVisibilityForType,
  getFieldRequirementsForType,
  createMeetingTypeSchema,
} from '@/lib/validation'
import type { CreateMeetingFormData } from '@/types/validation'

/**
 * Example composable for meeting form validation
 */
export function useMeetingFormValidation() {
  // Form data
  const formData = ref<Partial<CreateMeetingFormData>>({
    topic: '',
    description: '',
    start_time: '',
    duration: 60,
    type: 'online',
    location_id: undefined,
    password: '',
    participants: [],
  })

  // Dynamic schema based on meeting type
  const validationSchema = computed(() => {
    return createMeetingTypeSchema(formData.value.type || 'online')
  })

  // Use vee-validate with dynamic schema
  const { handleSubmit, errors, values, setFieldValue, resetForm } = useForm({
    validationSchema: toTypedSchema(validationSchema.value),
    initialValues: formData.value,
  })

  // Field visibility based on meeting type
  const fieldVisibility = computed(() => {
    return getFieldVisibilityForType(formData.value.type || 'online')
  })

  // Field requirements based on meeting type
  const fieldRequirements = computed(() => {
    return getFieldRequirementsForType(formData.value.type || 'online')
  })

  // Handle meeting type change
  const handleTypeChange = (newType: 'online' | 'offline' | 'hybrid') => {
    setFieldValue('type', newType)

    // Clear fields that are not applicable to the new type
    if (newType === 'offline') {
      setFieldValue('password', '')
    }
    if (newType === 'online') {
      setFieldValue('location_id', undefined)
    }
  }

  // Validate form manually
  const validateForm = () => {
    return validateWithSchema(createMeetingSchema, values)
  }

  // Submit handler
  const onSubmit = handleSubmit((values) => {
    console.log('Form submitted with values:', values)
    // Handle form submission here
  })

  return {
    formData,
    errors,
    values,
    fieldVisibility,
    fieldRequirements,
    handleTypeChange,
    validateForm,
    onSubmit,
    resetForm,
    setFieldValue,
  }
}

/**
 * Example of step-by-step validation for multi-step forms
 */
export function useMultiStepMeetingValidation() {
  const currentStep = ref(1)
  const totalSteps = 3

  // Step-specific validation schemas
  const stepSchemas = {
    1: createMeetingSchema._def.schema._def.schema.pick({
      topic: true,
      description: true,
      type: true,
    }),
    2: createMeetingSchema._def.schema._def.schema.pick({
      start_time: true,
      duration: true,
      location_id: true,
      password: true,
    }),
    3: createMeetingSchema._def.schema._def.schema.pick({ participants: true }),
  }

  // Validate current step
  const validateCurrentStep = (data: Partial<CreateMeetingFormData>) => {
    switch (currentStep.value) {
      case 1:
        return validateWithSchema(stepSchemas[1], data)
      case 2:
        return validateWithSchema(stepSchemas[2], data)
      case 3:
        return validateWithSchema(stepSchemas[3], data)
      default:
        return { success: false, errors: { formErrors: ['Invalid step'], fieldErrors: {} } }
    }
  }

  // Check if can proceed to next step
  const canProceedToNextStep = (data: Partial<CreateMeetingFormData>) => {
    const validation = validateCurrentStep(data)
    return validation.success
  }

  // Navigate between steps
  const nextStep = () => {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }

  const previousStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      currentStep.value = step
    }
  }

  return {
    currentStep,
    totalSteps,
    validateCurrentStep,
    canProceedToNextStep,
    nextStep,
    previousStep,
    goToStep,
  }
}

interface ApiError {
  response?: {
    status: number
    data?: {
      errors: Record<string, string[]>
    }
  }
}

/**
 * Example of handling API validation errors
 */
export function useApiValidationErrorHandling() {
  const apiErrors = ref<Record<string, string>>({})

  // Handle API validation response
  const handleApiValidationError = (error: ApiError) => {
    if (error.response?.status === 422 && error.response?.data?.errors) {
      // Convert API errors to our format
      const formattedErrors: Record<string, string> = {}

      Object.entries(error.response.data.errors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          formattedErrors[field] = messages[0]
        }
      })

      apiErrors.value = formattedErrors
    } else {
      // Generic error
      apiErrors.value = { general: 'An error occurred while saving the meeting' }
    }
  }

  // Clear API errors
  const clearApiErrors = () => {
    apiErrors.value = {}
  }

  // Check if field has API error
  const hasApiError = (field: string) => {
    return !!apiErrors.value[field]
  }

  // Get API error for field
  const getApiError = (field: string) => {
    return apiErrors.value[field]
  }

  return {
    apiErrors,
    handleApiValidationError,
    clearApiErrors,
    hasApiError,
    getApiError,
  }
}
