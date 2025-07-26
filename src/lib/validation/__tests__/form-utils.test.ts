import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  validateWithSchema,
  zodErrorsToVeeValidate,
  createVeeValidateValidator,
  validateField,
  getValidationState,
  formatApiValidationErrors,
  mergeValidationErrors,
  hasValidationErrors,
  getFirstError,
  cleanValidationErrors,
} from '../form-utils'

describe('Form Validation Utils', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().min(18, 'Must be at least 18'),
  })

  describe('validateWithSchema', () => {
    it('should return success for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 25,
      }
      const result = validateWithSchema(testSchema, validData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(validData)
      expect(result.errors).toBeUndefined()
    })

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: 16,
      }
      const result = validateWithSchema(testSchema, invalidData)

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.errors).toBeDefined()
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors!['name']).toBe('Name is required')
      expect(result.fieldErrors!['email']).toBe('Invalid email')
      expect(result.fieldErrors!['age']).toBe('Must be at least 18')
    })

    it('should handle non-Zod errors', () => {
      const invalidSchema = {
        parse: () => {
          throw new Error('Generic error')
        },
      } as unknown as z.ZodType<unknown>

      const result = validateWithSchema(invalidSchema, {})

      expect(result.success).toBe(false)
      expect(result.errors).toEqual([{ field: 'general', message: 'Validation failed' }])
    })
  })

  describe('zodErrorsToVeeValidate', () => {
    it('should convert Zod errors to vee-validate format', () => {
      const invalidData = { name: '', email: 'invalid' }

      try {
        testSchema.parse(invalidData)
      } catch (error) {
        if (error instanceof z.ZodError) {
          const veeErrors = zodErrorsToVeeValidate(error)

          expect(veeErrors['name']).toBe('Name is required')
          expect(veeErrors['email']).toBe('Invalid email')
        }
      }
    })
  })

  describe('createVeeValidateValidator', () => {
    it('should create a validator function that returns true for valid data', () => {
      const validator = createVeeValidateValidator(testSchema)
      const validData = {
        name: 'John',
        email: 'john@example.com',
        age: 25,
      }

      const result = validator(validData)
      expect(result).toBe(true)
    })

    it('should create a validator function that returns error message for invalid data', () => {
      const validator = createVeeValidateValidator(testSchema)
      const invalidData = {
        name: '',
        email: 'john@example.com',
        age: 25,
      }

      const result = validator(invalidData)
      expect(typeof result).toBe('string')
      expect(result).toBe('Name is required')
    })
  })

  describe('validateField', () => {
    it('should return true for valid field', () => {
      const result = validateField(testSchema, 'name', 'John', {
        email: 'john@example.com',
        age: 25,
      })

      expect(result).toBe(true)
    })

    it('should return error message for invalid field', () => {
      const result = validateField(testSchema, 'name', '', {
        email: 'john@example.com',
        age: 25,
      })

      expect(result).toBe('Name is required')
    })
  })

  describe('getValidationState', () => {
    it('should return valid state for valid data', () => {
      const validData = {
        name: 'John',
        email: 'john@example.com',
        age: 25,
      }
      const state = getValidationState(testSchema, validData)

      expect(state.isValid).toBe(true)
      expect(state.hasErrors).toBe(false)
      expect(Object.keys(state.errors)).toHaveLength(0)
    })

    it('should return invalid state for invalid data', () => {
      const invalidData = {
        name: '',
        email: 'invalid',
        age: 16,
      }
      const state = getValidationState(testSchema, invalidData)

      expect(state.isValid).toBe(false)
      expect(state.hasErrors).toBe(true)
      expect(state.errors['name']).toEqual(['Name is required'])
      expect(state.errors['email']).toEqual(['Invalid email'])
      expect(state.errors['age']).toEqual(['Must be at least 18'])
    })
  })

  describe('formatApiValidationErrors', () => {
    it('should format API errors correctly', () => {
      const apiErrors = {
        name: ['Name is required', 'Name too short'],
        email: ['Invalid email format'],
      }

      const formatted = formatApiValidationErrors(apiErrors)

      expect(formatted['name']).toBe('Name is required')
      expect(formatted['email']).toBe('Invalid email format')
    })

    it('should handle empty error arrays', () => {
      const apiErrors = {
        name: [],
        email: ['Invalid email'],
      }

      const formatted = formatApiValidationErrors(apiErrors)

      expect(formatted['name']).toBe('Validation error')
      expect(formatted['email']).toBe('Invalid email')
    })
  })

  describe('mergeValidationErrors', () => {
    it('should merge client and server errors', () => {
      const clientErrors = {
        name: 'Client error',
        age: 'Too young',
      }
      const serverErrors = {
        name: 'Server error',
        email: 'Invalid email',
      }

      const merged = mergeValidationErrors(clientErrors, serverErrors)

      expect(merged['name']).toBe('Server error') // Server overrides client
      expect(merged['age']).toBe('Too young')
      expect(merged['email']).toBe('Invalid email')
    })
  })

  describe('hasValidationErrors', () => {
    it('should return true when errors exist', () => {
      const errors = {
        name: 'Name is required',
        email: undefined,
        age: '',
      }

      expect(hasValidationErrors(errors)).toBe(true)
    })

    it('should return false when no errors exist', () => {
      const errors = {
        name: undefined,
        email: '',
        age: undefined,
      }

      expect(hasValidationErrors(errors)).toBe(false)
    })
  })

  describe('getFirstError', () => {
    it('should return first error message', () => {
      const errors = {
        name: undefined,
        email: 'Invalid email',
        age: 'Too young',
      }

      const firstError = getFirstError(errors)
      expect(firstError).toBe('Invalid email')
    })

    it('should return null when no errors exist', () => {
      const errors = {
        name: undefined,
        email: '',
        age: undefined,
      }

      const firstError = getFirstError(errors)
      expect(firstError).toBeNull()
    })
  })

  describe('cleanValidationErrors', () => {
    it('should remove empty and undefined errors', () => {
      const errors = {
        name: 'Name is required',
        email: '',
        age: undefined,
        phone: '   ',
        address: 'Address required',
      }

      const cleaned = cleanValidationErrors(errors)

      expect(cleaned).toEqual({
        name: 'Name is required',
        address: 'Address required',
      })
    })
  })
})
