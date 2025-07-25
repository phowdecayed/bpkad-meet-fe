import { describe, it, expect } from 'vitest'
import {
  createMeetingSchema,
  updateMeetingSchema,
  participantSchema,
  bulkParticipantSchema,
  meetingQuerySchema,
} from '../meeting-schemas'

describe('Meeting Validation Schemas', () => {
  describe('createMeetingSchema', () => {
    const validBaseData = {
      topic: 'Test Meeting',
      description: 'Test description',
      start_time: '2025-12-01T10:00:00Z',
      duration: 60,
      type: 'online' as const,
      participants: [1, 2, 3],
    }

    it('should validate valid online meeting data', () => {
      const result = createMeetingSchema.safeParse(validBaseData)
      expect(result.success).toBe(true)
    })

    it('should validate valid offline meeting data with location', () => {
      const offlineData = {
        ...validBaseData,
        type: 'offline' as const,
        location_id: 1,
      }
      const result = createMeetingSchema.safeParse(offlineData)
      expect(result.success).toBe(true)
    })

    it('should validate valid hybrid meeting data with location and password', () => {
      const hybridData = {
        ...validBaseData,
        type: 'hybrid' as const,
        location_id: 1,
        password: 'secret123',
      }
      const result = createMeetingSchema.safeParse(hybridData)
      expect(result.success).toBe(true)
    })

    it('should require topic', () => {
      const invalidData = { ...validBaseData, topic: '' }
      const result = createMeetingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('topic')
        expect(result.error.errors[0].message).toBe('Topic is required')
      }
    })

    it('should reject topic longer than 255 characters', () => {
      const longTopic = 'a'.repeat(256)
      const invalidData = { ...validBaseData, topic: longTopic }
      const result = createMeetingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('topic')
        expect(result.error.errors[0].message).toBe('Topic must be less than 255 characters')
      }
    })

    it('should reject past start_time', () => {
      const pastData = {
        ...validBaseData,
        start_time: '2020-01-01T10:00:00Z',
      }
      const result = createMeetingSchema.safeParse(pastData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('start_time')
        expect(result.error.errors[0].message).toBe(
          'Meeting must be scheduled for a future date and time',
        )
      }
    })

    it('should require minimum duration of 1 minute', () => {
      const invalidData = { ...validBaseData, duration: 0 }
      const result = createMeetingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('duration')
        expect(result.error.errors[0].message).toBe('Duration must be at least 1 minute')
      }
    })

    it('should reject duration longer than 24 hours', () => {
      const invalidData = { ...validBaseData, duration: 1441 }
      const result = createMeetingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('duration')
        expect(result.error.errors[0].message).toBe('Duration cannot exceed 24 hours')
      }
    })

    it('should require location_id for offline meetings', () => {
      const offlineData = {
        ...validBaseData,
        type: 'offline' as const,
        // missing location_id
      }
      const result = createMeetingSchema.safeParse(offlineData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('location_id')
        expect(result.error.errors[0].message).toBe(
          'Location is required for offline and hybrid meetings',
        )
      }
    })

    it('should require location_id for hybrid meetings', () => {
      const hybridData = {
        ...validBaseData,
        type: 'hybrid' as const,
        // missing location_id
      }
      const result = createMeetingSchema.safeParse(hybridData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('location_id')
        expect(result.error.errors[0].message).toBe(
          'Location is required for offline and hybrid meetings',
        )
      }
    })

    it('should reject password for offline meetings', () => {
      const offlineData = {
        ...validBaseData,
        type: 'offline' as const,
        location_id: 1,
        password: 'secret123',
      }
      const result = createMeetingSchema.safeParse(offlineData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('password')
        expect(result.error.errors[0].message).toBe(
          'Password is not applicable for offline meetings',
        )
      }
    })

    it('should reject password longer than 10 characters', () => {
      const invalidData = {
        ...validBaseData,
        password: 'verylongpassword123',
      }
      const result = createMeetingSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('password')
        expect(result.error.errors[0].message).toBe('Password must be 10 characters or less')
      }
    })

    it('should accept empty description', () => {
      const dataWithEmptyDescription = {
        ...validBaseData,
        description: '',
      }
      const result = createMeetingSchema.safeParse(dataWithEmptyDescription)
      expect(result.success).toBe(true)
    })

    it('should accept undefined optional fields', () => {
      const minimalData = {
        topic: 'Test Meeting',
        start_time: '2025-12-01T10:00:00Z',
        duration: 60,
        type: 'online' as const,
      }
      const result = createMeetingSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
    })
  })

  describe('participantSchema', () => {
    it('should validate valid participant data', () => {
      const validData = {
        meeting_id: 1,
        user_id: 2,
      }
      const result = participantSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid meeting_id', () => {
      const invalidData = {
        meeting_id: -1,
        user_id: 2,
      }
      const result = participantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('meeting_id')
        expect(result.error.errors[0].message).toBe('Invalid meeting ID')
      }
    })

    it('should reject invalid user_id', () => {
      const invalidData = {
        meeting_id: 1,
        user_id: 0,
      }
      const result = participantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('user_id')
        expect(result.error.errors[0].message).toBe('Invalid user ID')
      }
    })
  })

  describe('bulkParticipantSchema', () => {
    it('should validate valid bulk participant data', () => {
      const validData = {
        meeting_id: 1,
        user_ids: [1, 2, 3],
      }
      const result = bulkParticipantSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty user_ids array', () => {
      const invalidData = {
        meeting_id: 1,
        user_ids: [],
      }
      const result = bulkParticipantSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('user_ids')
        expect(result.error.errors[0].message).toBe('At least one participant must be selected')
      }
    })
  })

  describe('meetingQuerySchema', () => {
    it('should validate valid query parameters', () => {
      const validData = {
        page: 1,
        per_page: 10,
        search: 'test',
        type: 'online' as const,
      }
      const result = meetingQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should apply default values', () => {
      const minimalData = {}
      const result = meetingQuerySchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.page).toBe(1)
        expect(result.data.per_page).toBe(10)
      }
    })

    it('should reject invalid page number', () => {
      const invalidData = { page: 0 }
      const result = meetingQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject per_page greater than 100', () => {
      const invalidData = { per_page: 101 }
      const result = meetingQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate date range', () => {
      const validData = {
        start_date: '2025-01-01T00:00:00Z',
        end_date: '2025-01-02T00:00:00Z',
      }
      const result = meetingQuerySchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid date range', () => {
      const invalidData = {
        start_date: '2025-01-02T00:00:00Z',
        end_date: '2025-01-01T00:00:00Z',
      }
      const result = meetingQuerySchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('end_date')
        expect(result.error.errors[0].message).toBe('End date must be after start date')
      }
    })
  })
})
