import { z } from 'zod'

export const userSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().optional(),
    password_confirmation: z.string().optional(),
  })
  .refine(
    (data) => {
      // If password is provided, validation rules apply (handled by backend or we can add length here)
      if (data.password && data.password.length < 8) {
        return false
      }
      return true
    },
    {
      message: 'Password must be at least 8 characters',
      path: ['password'],
    },
  )
  .refine(
    (data) => {
      if (data.password && data.password !== data.password_confirmation) {
        return false
      }
      return true
    },
    {
      message: 'Passwords do not match',
      path: ['password_confirmation'],
    },
  )

export type UserFormValues = z.infer<typeof userSchema>
