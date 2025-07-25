import { z } from 'zod'
import type { MeetingTypeValidation } from '@/types/validation'

// Meeting type validation configurations
export const meetingTypeValidations: Record<string, MeetingTypeValidation> = {
  online: {
    type: 'online',
    requiredFields: ['topic', 'start_time', 'duration'],
    optionalFields: ['description', 'password', 'participants'],
    conditionalRules: [],
  },
  offline: {
    type: 'offline',
    requiredFields: ['topic', 'start_time', 'duration', 'location_id'],
    optionalFields: ['description', 'participants'],
    conditionalRules: [
      {
        condition: (data) => data.type === 'offline',
        requiredFields: ['location_id'],
        message: 'Location is required for offline meetings',
      },
    ],
  },
  hybrid: {
    type: 'hybrid',
    requiredFields: ['topic', 'start_time', 'duration', 'location_id'],
    optionalFields: ['description', 'password', 'participants'],
    conditionalRules: [
      {
        condition: (data) => data.type === 'hybrid',
        requiredFields: ['location_id'],
        message: 'Location is required for hybrid meetings',
      },
    ],
  },
}

/**
 * Gets validation configuration for a specific meeting type
 */
export function getMeetingTypeValidation(type: string): MeetingTypeValidation | null {
  return meetingTypeValidations[type] || null
}

/**
 * Checks if a field is required for a specific meeting type
 */
export function isFieldRequiredForType(field: string, type: string): boolean {
  const validation = getMeetingTypeValidation(type)
  return validation?.requiredFields.includes(field) || false
}

/**
 * Gets all required fields for a meeting type
 */
export function getRequiredFieldsForType(type: string): string[] {
  const validation = getMeetingTypeValidation(type)
  return validation?.requiredFields || []
}

/**
 * Validates conditional rules for a meeting type
 */
export function validateConditionalRules(data: Record<string, unknown>, type: string): string[] {
  const validation = getMeetingTypeValidation(type)
  const errors: string[] = []

  if (!validation) return errors

  validation.conditionalRules.forEach((rule) => {
    if (rule.condition(data)) {
      rule.requiredFields.forEach((field) => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
          errors.push(rule.message)
        }
      })
    }
  })

  return errors
}

/**
 * Creates a dynamic schema based on meeting type
 */
export function createMeetingTypeSchema(type: string) {
  const baseSchema = z.object({
    topic: z.string().min(1, 'Topic is required').max(255, 'Topic too long'),
    description: z.string().optional().or(z.literal('')),
    start_time: z.string().datetime('Invalid date format'),
    duration: z.number().min(1, 'Duration must be at least 1 minute'),
    type: z.enum(['online', 'offline', 'hybrid']),
    location_id: z.number().optional(),
    password: z.string().max(10, 'Password too long').optional().or(z.literal('')),
    participants: z.array(z.number()).optional().default([]),
  })

  // Add conditional validation based on type
  switch (type) {
    case 'offline':
      return baseSchema
        .refine((data) => data.location_id !== undefined && data.location_id > 0, {
          message: 'Location is required for offline meetings',
          path: ['location_id'],
        })
        .refine((data) => !data.password || data.password.trim() === '', {
          message: 'Password is not applicable for offline meetings',
          path: ['password'],
        })

    case 'hybrid':
      return baseSchema.refine((data) => data.location_id !== undefined && data.location_id > 0, {
        message: 'Location is required for hybrid meetings',
        path: ['location_id'],
      })

    case 'online':
    default:
      return baseSchema
  }
}

/**
 * Validates meeting data against type-specific rules
 */
export function validateMeetingByType(data: Record<string, unknown>): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!data.type || typeof data.type !== 'string') {
    errors.push('Meeting type is required')
    return { isValid: false, errors }
  }

  // Get type-specific validation
  const typeValidation = getMeetingTypeValidation(data.type)
  if (!typeValidation) {
    errors.push('Invalid meeting type')
    return { isValid: false, errors }
  }

  // Check required fields
  typeValidation.requiredFields.forEach((field) => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field.replace('_', ' ')} is required for ${data.type} meetings`)
    }
  })

  // Check conditional rules
  const conditionalErrors = validateConditionalRules(data, data.type)
  errors.push(...conditionalErrors)

  // Type-specific validations
  if (data.type === 'offline' && data.password && typeof data.password === 'string' && data.password.trim() !== '') {
    errors.push('Password is not applicable for offline meetings')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Gets field visibility rules for a meeting type
 */
export function getFieldVisibilityForType(type: string): Record<string, boolean> {
  return {
    topic: true,
    description: true,
    start_time: true,
    duration: true,
    type: true,
    location_id: type === 'offline' || type === 'hybrid',
    password: type === 'online' || type === 'hybrid',
    participants: true,
  }
}

/**
 * Gets field requirement status for a meeting type
 */
export function getFieldRequirementsForType(type: string): Record<string, boolean> {
  const validation = getMeetingTypeValidation(type)
  const requirements: Record<string, boolean> = {}

  if (validation) {
    // Set all fields as optional by default
    validation.optionalFields.forEach((field) => {
      requirements[field] = false
    })

    // Set required fields
    validation.requiredFields.forEach((field) => {
      requirements[field] = true
    })
  }

  return requirements
}
