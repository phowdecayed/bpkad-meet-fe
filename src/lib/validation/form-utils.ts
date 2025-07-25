import { z } from 'zod'

// Validation state interface
export interface ValidationState {
  isValid: boolean
  errors: Record<string, string[]>
  hasErrors: boolean
}

// Form field error interface
export interface FormFieldError {
  field: string
  message: string
}

// Validation result interface
export interface ValidationResult<T = unknown> {
  success: boolean
  data?: T
  errors?: FormFieldError[]
  fieldErrors?: Record<string, string>
}

/**
 * Validates data against a Zod schema and returns formatted validation result
 */
export function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      const errors: FormFieldError[] = []

      error.errors.forEach((err) => {
        const field = err.path.join('.')
        const message = err.message

        fieldErrors[field] = message
        errors.push({ field, message })
      })

      return {
        success: false,
        errors,
        fieldErrors,
      }
    }

    return {
      success: false,
      errors: [{ field: 'general', message: 'Validation failed' }],
    }
  }
}

/**
 * Converts Zod errors to vee-validate compatible format
 */
export function zodErrorsToVeeValidate(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {}

  error.errors.forEach((err) => {
    const field = err.path.join('.')
    fieldErrors[field] = err.message
  })

  return fieldErrors
}

/**
 * Creates a validation function for vee-validate from a Zod schema
 */
export function createVeeValidateValidator<T>(schema: z.ZodSchema<T>) {
  return (value: unknown) => {
    try {
      schema.parse(value)
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.errors[0]?.message || 'Validation failed'
      }
      return 'Validation failed'
    }
  }
}

/**
 * Validates a single field against a schema
 */
export function validateField<T>(
  schema: z.ZodSchema<T>,
  fieldName: string,
  value: unknown,
  data: Record<string, unknown> = {},
): string | true {
  try {
    // Create a partial schema for the specific field
    const fullData = { ...data, [fieldName]: value }
    schema.parse(fullData)
    return true
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldError = error.errors.find((err) => err.path.join('.') === fieldName)
      return fieldError?.message || 'Validation failed'
    }
    return 'Validation failed'
  }
}

/**
 * Validates form data and returns validation state
 */
export function getValidationState<T>(schema: z.ZodSchema<T>, data: unknown): ValidationState {
  const result = validateWithSchema(schema, data)

  return {
    isValid: result.success,
    errors: result.fieldErrors
      ? Object.entries(result.fieldErrors).reduce(
          (acc, [key, value]) => {
            acc[key] = [value]
            return acc
          },
          {} as Record<string, string[]>,
        )
      : {},
    hasErrors: !result.success,
  }
}

/**
 * Formats API validation errors to match our validation format
 */
export function formatApiValidationErrors(
  apiErrors: Record<string, string[]>,
): Record<string, string> {
  const formatted: Record<string, string> = {}

  Object.entries(apiErrors).forEach(([field, messages]) => {
    formatted[field] = messages[0] || 'Validation error'
  })

  return formatted
}

/**
 * Merges client-side and server-side validation errors
 */
export function mergeValidationErrors(
  clientErrors: Record<string, string>,
  serverErrors: Record<string, string>,
): Record<string, string> {
  return { ...clientErrors, ...serverErrors }
}

/**
 * Checks if a form has any validation errors
 */
export function hasValidationErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((error) => error !== undefined && error !== '')
}

/**
 * Gets the first validation error message from a field errors object
 */
export function getFirstError(errors: Record<string, string | undefined>): string | null {
  const firstError = Object.values(errors).find((error) => error !== undefined && error !== '')
  return firstError || null
}

/**
 * Clears empty string errors (useful for optional fields)
 */
export function cleanValidationErrors(
  errors: Record<string, string | undefined>,
): Record<string, string> {
  const cleaned: Record<string, string> = {}

  Object.entries(errors).forEach(([key, value]) => {
    if (value && value.trim() !== '') {
      cleaned[key] = value
    }
  })

  return cleaned
}
