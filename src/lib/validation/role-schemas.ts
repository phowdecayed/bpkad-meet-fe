import { z } from 'zod'

export const roleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(50, 'Name must be 50 characters or less'),
})

export type RoleFormValues = z.infer<typeof roleSchema>
