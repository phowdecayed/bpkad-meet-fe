import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  validateWithSchema,
  zodErrorsToVeeValidate,
  getValidationState,
  formatApiValidationErrors,
  hasValidationErrors,
  getFirstError,
  cleanValidationErrors,
} from '../form-utils'

describe('form-utils validation helpers', () => {
  const testSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    age: z.number().positive('Age must be positive').optional(),
  })

  describe('validateWithSchema', () => {
    it('returns success with data for valid input', () => {
      const result = validateWithSchema(testSchema, {
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      })
      expect(result.errors).toBeUndefined()
    })

    it('returns errors for invalid input', () => {
      const result = validateWithSchema(testSchema, {
        name: '',
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      expect(result.fieldErrors).toBeDefined()
      expect(result.fieldErrors?.name).toBe('Name is required')
      expect(result.fieldErrors?.email).toBe('Invalid email')
    })

    it('handles nested path errors', () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1, 'Name required'),
          }),
        }),
      })

      const result = validateWithSchema(nestedSchema, {
        user: { profile: { name: '' } },
      })

      expect(result.success).toBe(false)
      expect(result.fieldErrors?.['user.profile.name']).toBe('Name required')
    })
  })

  describe('zodErrorsToVeeValidate', () => {
    it('converts Zod errors to field errors format', () => {
      const parseResult = testSchema.safeParse({ name: '', email: 'bad' })

      expect(parseResult.success).toBe(false)
      // Use type assertion after the success check - the test will fail above if success is true
      const zodError = (parseResult as { success: false; error: z.ZodError }).error
      const result = zodErrorsToVeeValidate(zodError)
      expect(result.name).toBe('Name is required')
      expect(result.email).toBe('Invalid email')
    })
  })

  describe('getValidationState', () => {
    it('returns valid state for correct data', () => {
      const state = getValidationState(testSchema, {
        name: 'Test',
        email: 'test@test.com',
      })

      expect(state.isValid).toBe(true)
      expect(state.hasErrors).toBe(false)
      expect(state.errors).toEqual({})
    })

    it('returns invalid state with errors for bad data', () => {
      const state = getValidationState(testSchema, {
        name: '',
        email: 'bad',
      })

      expect(state.isValid).toBe(false)
      expect(state.hasErrors).toBe(true)
      expect(state.errors.name).toContain('Name is required')
    })
  })

  describe('formatApiValidationErrors', () => {
    it('converts API error format to simple field errors', () => {
      const apiErrors = {
        email: ['Email is already taken', 'Email must be valid'],
        password: ['Password is too short'],
      }

      const result = formatApiValidationErrors(apiErrors)

      expect(result.email).toBe('Email is already taken')
      expect(result.password).toBe('Password is too short')
    })
  })

  describe('hasValidationErrors', () => {
    it('returns true if any error exists', () => {
      expect(hasValidationErrors({ name: 'Required' })).toBe(true)
      expect(hasValidationErrors({ name: undefined, email: 'Invalid' })).toBe(true)
    })

    it('returns false if no errors', () => {
      expect(hasValidationErrors({})).toBe(false)
      expect(hasValidationErrors({ name: undefined, email: '' })).toBe(false)
    })
  })

  describe('getFirstError', () => {
    it('returns first non-empty error', () => {
      expect(getFirstError({ name: '', email: 'Invalid email' })).toBe('Invalid email')
      expect(getFirstError({ name: 'Required', email: 'Invalid' })).toBe('Required')
    })

    it('returns null if no errors', () => {
      expect(getFirstError({})).toBeNull()
      expect(getFirstError({ name: undefined })).toBeNull()
    })
  })

  describe('cleanValidationErrors', () => {
    it('removes empty string errors', () => {
      const errors = {
        name: 'Required',
        email: '',
        password: undefined,
        confirm: '   ',
      }

      const cleaned = cleanValidationErrors(errors)

      expect(cleaned).toEqual({ name: 'Required' })
    })
  })
})
