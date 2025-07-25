import { z } from 'zod'

// Base meeting validation schema
export const meetingBaseSchema = z.object({
  topic: z
    .string()
    .min(1, 'Topic is required')
    .max(255, 'Topic must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
  start_time: z
    .string()
    .datetime('Please select a valid date and time')
    .refine((date) => new Date(date) > new Date(), {
      message: 'Meeting must be scheduled for a future date and time',
    }),
  duration: z
    .number()
    .min(1, 'Duration must be at least 1 minute')
    .max(1440, 'Duration cannot exceed 24 hours'),
  type: z.enum(['online', 'offline', 'hybrid'], {
    errorMap: () => ({ message: 'Please select a valid meeting type' }),
  }),
  location_id: z.number().optional(),
  password: z
    .string()
    .max(10, 'Password must be 10 characters or less')
    .optional()
    .or(z.literal('')),
  participants: z.array(z.number()).optional().default([]),
})

// Create meeting schema with conditional validation
export const createMeetingSchema = meetingBaseSchema
  .refine(
    (data) => {
      // Location required for offline/hybrid meetings
      if ((data.type === 'offline' || data.type === 'hybrid') && !data.location_id) {
        return false
      }
      return true
    },
    {
      message: 'Location is required for offline and hybrid meetings',
      path: ['location_id'],
    },
  )
  .refine(
    (data) => {
      // Password only allowed for online/hybrid meetings
      if (data.type === 'offline' && data.password && data.password.trim() !== '') {
        return false
      }
      return true
    },
    {
      message: 'Password is not applicable for offline meetings',
      path: ['password'],
    },
  )

// Update meeting schema (similar to create but may have different rules)
export const updateMeetingSchema = createMeetingSchema

// Participant management schema
export const participantSchema = z.object({
  meeting_id: z.number().positive('Invalid meeting ID'),
  user_id: z.number().positive('Invalid user ID'),
})

export const bulkParticipantSchema = z.object({
  meeting_id: z.number().positive('Invalid meeting ID'),
  user_ids: z.array(z.number().positive()).min(1, 'At least one participant must be selected'),
})

// Meeting query/filter schema
export const meetingQuerySchema = z
  .object({
    page: z.number().min(1).optional().default(1),
    per_page: z.number().min(1).max(100).optional().default(10),
    search: z.string().optional(),
    type: z.enum(['online', 'offline', 'hybrid']).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
    organizer_id: z.number().optional(),
  })
  .refine(
    (data) => {
      // End date must be after start date
      if (data.start_date && data.end_date) {
        return new Date(data.end_date) > new Date(data.start_date)
      }
      return true
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    },
  )

// Type exports for form payloads
export type CreateMeetingPayload = z.infer<typeof createMeetingSchema>
export type UpdateMeetingPayload = z.infer<typeof updateMeetingSchema>
export type ParticipantPayload = z.infer<typeof participantSchema>
export type BulkParticipantPayload = z.infer<typeof bulkParticipantSchema>
export type MeetingQueryParams = z.infer<typeof meetingQuerySchema>
