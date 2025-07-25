import { describe, it, expect } from 'vitest'
import {
  getMeetingTypeValidation,
  isFieldRequiredForType,
  getRequiredFieldsForType,
  validateConditionalRules,
  createMeetingTypeSchema,
  validateMeetingByType,
  getFieldVisibilityForType,
  getFieldRequirementsForType,
} from '../meeting-type-validation'

describe('Meeting Type Validation', () => {
  describe('getMeetingTypeValidation', () => {
    it('should return validation config for online meetings', () => {
      const validation = getMeetingTypeValidation('online')

      expect(validation).toBeDefined()
      expect(validation?.type).toBe('online')
      expect(validation?.requiredFields).toContain('topic')
      expect(validation?.requiredFields).toContain('start_time')
      expect(validation?.requiredFields).toContain('duration')
      expect(validation?.requiredFields).not.toContain('location_id')
    })

    it('should return validation config for offline meetings', () => {
      const validation = getMeetingTypeValidation('offline')

      expect(validation).toBeDefined()
      expect(validation?.type).toBe('offline')
      expect(validation?.requiredFields).toContain('location_id')
      expect(validation?.optionalFields).not.toContain('password')
    })

    it('should return validation config for hybrid meetings', () => {
      const validation = getMeetingTypeValidation('hybrid')

      expect(validation).toBeDefined()
      expect(validation?.type).toBe('hybrid')
      expect(validation?.requiredFields).toContain('location_id')
      expect(validation?.optionalFields).toContain('password')
    })

    it('should return null for invalid meeting type', () => {
      const validation = getMeetingTypeValidation('invalid')
      expect(validation).toBeNull()
    })
  })

  describe('isFieldRequiredForType', () => {
    it('should return true for required fields', () => {
      expect(isFieldRequiredForType('topic', 'online')).toBe(true)
      expect(isFieldRequiredForType('location_id', 'offline')).toBe(true)
      expect(isFieldRequiredForType('location_id', 'hybrid')).toBe(true)
    })

    it('should return false for optional fields', () => {
      expect(isFieldRequiredForType('password', 'online')).toBe(false)
      expect(isFieldRequiredForType('location_id', 'online')).toBe(false)
      expect(isFieldRequiredForType('password', 'offline')).toBe(false)
    })

    it('should return false for invalid meeting type', () => {
      expect(isFieldRequiredForType('topic', 'invalid')).toBe(false)
    })
  })

  describe('getRequiredFieldsForType', () => {
    it('should return all required fields for online meetings', () => {
      const fields = getRequiredFieldsForType('online')
      expect(fields).toContain('topic')
      expect(fields).toContain('start_time')
      expect(fields).toContain('duration')
      expect(fields).not.toContain('location_id')
    })

    it('should return all required fields for offline meetings', () => {
      const fields = getRequiredFieldsForType('offline')
      expect(fields).toContain('topic')
      expect(fields).toContain('start_time')
      expect(fields).toContain('duration')
      expect(fields).toContain('location_id')
    })

    it('should return empty array for invalid type', () => {
      const fields = getRequiredFieldsForType('invalid')
      expect(fields).toEqual([])
    })
  })

  describe('validateConditionalRules', () => {
    it('should return no errors for valid offline meeting', () => {
      const data = {
        type: 'offline',
        topic: 'Test Meeting',
        location_id: 1,
      }
      const errors = validateConditionalRules(data, 'offline')
      expect(errors).toHaveLength(0)
    })

    it('should return error for offline meeting without location', () => {
      const data = {
        type: 'offline',
        topic: 'Test Meeting',
        // missing location_id
      }
      const errors = validateConditionalRules(data, 'offline')
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBe('Location is required for offline meetings')
    })

    it('should return error for hybrid meeting without location', () => {
      const data = {
        type: 'hybrid',
        topic: 'Test Meeting',
        // missing location_id
      }
      const errors = validateConditionalRules(data, 'hybrid')
      expect(errors).toHaveLength(1)
      expect(errors[0]).toBe('Location is required for hybrid meetings')
    })

    it('should return no errors for online meeting', () => {
      const data = {
        type: 'online',
        topic: 'Test Meeting',
      }
      const errors = validateConditionalRules(data, 'online')
      expect(errors).toHaveLength(0)
    })
  })

  describe('createMeetingTypeSchema', () => {
    const baseValidData = {
      topic: 'Test Meeting',
      start_time: '2025-12-01T10:00:00Z',
      duration: 60,
      type: 'online' as const,
    }

    it('should create schema for online meetings', () => {
      const schema = createMeetingTypeSchema('online')
      const result = schema.safeParse(baseValidData)
      expect(result.success).toBe(true)
    })

    it('should create schema for offline meetings requiring location', () => {
      const schema = createMeetingTypeSchema('offline')
      const offlineData = {
        ...baseValidData,
        type: 'offline' as const,
        location_id: 1,
      }
      const result = schema.safeParse(offlineData)
      expect(result.success).toBe(true)
    })

    it('should reject offline meeting without location', () => {
      const schema = createMeetingTypeSchema('offline')
      const offlineData = {
        ...baseValidData,
        type: 'offline' as const,
      }
      const result = schema.safeParse(offlineData)
      expect(result.success).toBe(false)
    })

    it('should reject offline meeting with password', () => {
      const schema = createMeetingTypeSchema('offline')
      const offlineData = {
        ...baseValidData,
        type: 'offline' as const,
        location_id: 1,
        password: 'secret',
      }
      const result = schema.safeParse(offlineData)
      expect(result.success).toBe(false)
    })
  })

  describe('validateMeetingByType', () => {
    it('should validate valid online meeting', () => {
      const data = {
        type: 'online',
        topic: 'Test Meeting',
        start_time: '2025-12-01T10:00:00Z',
        duration: 60,
      }
      const result = validateMeetingByType(data)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate valid offline meeting', () => {
      const data = {
        type: 'offline',
        topic: 'Test Meeting',
        start_time: '2025-12-01T10:00:00Z',
        duration: 60,
        location_id: 1,
      }
      const result = validateMeetingByType(data)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject meeting without type', () => {
      const data = {
        topic: 'Test Meeting',
        start_time: '2025-12-01T10:00:00Z',
        duration: 60,
      }
      const result = validateMeetingByType(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Meeting type is required')
    })

    it('should reject offline meeting without location', () => {
      const data = {
        type: 'offline',
        topic: 'Test Meeting',
        start_time: '2025-12-01T10:00:00Z',
        duration: 60,
      }
      const result = validateMeetingByType(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.some((error) => error.includes('location id'))).toBe(true)
    })

    it('should reject offline meeting with password', () => {
      const data = {
        type: 'offline',
        topic: 'Test Meeting',
        start_time: '2025-12-01T10:00:00Z',
        duration: 60,
        location_id: 1,
        password: 'secret',
      }
      const result = validateMeetingByType(data)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Password is not applicable for offline meetings')
    })
  })

  describe('getFieldVisibilityForType', () => {
    it('should show correct fields for online meetings', () => {
      const visibility = getFieldVisibilityForType('online')
      expect(visibility.topic).toBe(true)
      expect(visibility.location_id).toBe(false)
      expect(visibility.password).toBe(true)
    })

    it('should show correct fields for offline meetings', () => {
      const visibility = getFieldVisibilityForType('offline')
      expect(visibility.topic).toBe(true)
      expect(visibility.location_id).toBe(true)
      expect(visibility.password).toBe(false)
    })

    it('should show correct fields for hybrid meetings', () => {
      const visibility = getFieldVisibilityForType('hybrid')
      expect(visibility.topic).toBe(true)
      expect(visibility.location_id).toBe(true)
      expect(visibility.password).toBe(true)
    })
  })

  describe('getFieldRequirementsForType', () => {
    it('should return correct requirements for online meetings', () => {
      const requirements = getFieldRequirementsForType('online')
      expect(requirements.topic).toBe(true)
      expect(requirements.location_id).toBe(undefined) // not in config
      expect(requirements.password).toBe(false)
    })

    it('should return correct requirements for offline meetings', () => {
      const requirements = getFieldRequirementsForType('offline')
      expect(requirements.topic).toBe(true)
      expect(requirements.location_id).toBe(true)
      expect(requirements.password).toBe(undefined) // not in optional fields for offline
    })

    it('should return correct requirements for hybrid meetings', () => {
      const requirements = getFieldRequirementsForType('hybrid')
      expect(requirements.topic).toBe(true)
      expect(requirements.location_id).toBe(true)
      expect(requirements.password).toBe(false)
    })
  })
})
