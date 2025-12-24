import { z } from 'zod'

export const locationSchema = z.object({
  name: z
    .string()
    .min(1, 'Location name is required')
    .max(100, 'Name must be 100 characters or less'),
  address: z
    .string()
    .min(1, 'Address is required')
    .max(255, 'Address must be 255 characters or less'),
  room_name: z
    .string()
    .max(100, 'Room name must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  capacity: z
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be positive')
    .optional()
    .nullable(),
})

export type LocationFormValues = z.infer<typeof locationSchema>
