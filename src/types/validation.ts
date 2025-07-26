import type { z } from 'zod'
import type {
  createMeetingSchema,
  updateMeetingSchema,
  participantSchema,
  bulkParticipantSchema,
  meetingQuerySchema,
} from '@/lib/validation/meeting-schemas'

// Form payload types derived from schemas
export type CreateMeetingFormData = z.infer<typeof createMeetingSchema>
export type UpdateMeetingFormData = z.infer<typeof updateMeetingSchema>
export type ParticipantFormData = z.infer<typeof participantSchema>
export type BulkParticipantFormData = z.infer<typeof bulkParticipantSchema>
export type MeetingQueryFormData = z.infer<typeof meetingQuerySchema>

// Form validation state interfaces
export interface FormValidationState {
  isValid: boolean
  isValidating: boolean
  errors: Record<string, string>
  touched: Record<string, boolean>
  dirty: Record<string, boolean>
}

export interface FieldValidationState {
  value: unknown
  error: string | undefined
  touched: boolean
  dirty: boolean
  valid: boolean
}

// Step validation for multi-step forms
export interface StepValidationState {
  step: number
  isValid: boolean
  errors: Record<string, string>
  canProceed: boolean
}

// Meeting form step data interfaces
export interface BasicInfoStepData {
  topic: string
  description?: string
  type: 'online' | 'offline' | 'hybrid'
}

export interface DetailsStepData {
  start_time: string
  duration: number
  location_id?: number
  password?: string
}

export interface ParticipantsStepData {
  participants: number[]
}

// Complete meeting form data
export interface MeetingFormData extends BasicInfoStepData, DetailsStepData, ParticipantsStepData {}

// Form submission states
export interface FormSubmissionState {
  isSubmitting: boolean
  hasSubmitted: boolean
  submitError: string | null
  submitSuccess: boolean
}

// Validation error types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationErrorResponse {
  message: string
  errors: Record<string, string[]>
}

// Form configuration interfaces
export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'datetime-local' | 'number' | 'password'
  required: boolean
  placeholder?: string
  options?: Array<{ value: string | number; label: string }>
  validation?: {
    min?: number
    max?: number
    pattern?: RegExp
  }
}

export interface FormStepConfig {
  id: string
  title: string
  description?: string
  fields: FormFieldConfig[]
  validation: z.ZodSchema<unknown>
}

// Meeting type specific validation
export interface MeetingTypeValidation {
  type: 'online' | 'offline' | 'hybrid'
  requiredFields: string[]
  optionalFields: string[]
  conditionalRules: Array<{
    condition: (data: Record<string, unknown>) => boolean
    requiredFields: string[]
    message: string
  }>
}

// Form context interfaces for composition
export interface FormContext<T extends object = Record<string, unknown>> {
  formData: T
  validationState: FormValidationState
  submissionState: FormSubmissionState
  updateField: (field: string, value: unknown) => void
  validateField: (field: string) => Promise<boolean>
  validateForm: () => Promise<boolean>
  submitForm: () => Promise<void>
  resetForm: () => void
}

// Multi-step form context
export interface MultiStepFormContext<T extends object = Record<string, unknown>>
  extends FormContext<T> {
  currentStep: number
  totalSteps: number
  stepValidation: Record<number, StepValidationState>
  canProceedToStep: (step: number) => boolean
  goToStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

// API response validation
export interface ApiValidationResponse {
  success: boolean
  data?: Record<string, unknown>
  message?: string
  errors?: Record<string, string[]>
}

// Form field validation rules
export type ValidationRule = (value: unknown) => string | true
export type AsyncValidationRule = (value: unknown) => Promise<string | true>

export interface FieldValidationRules {
  [fieldName: string]: ValidationRule | ValidationRule[]
}

export interface AsyncFieldValidationRules {
  [fieldName: string]: AsyncValidationRule | AsyncValidationRule[]
}
