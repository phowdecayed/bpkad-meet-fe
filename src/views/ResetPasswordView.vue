<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next'
import { isApiError } from '@/lib/error-handling'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = ref('')
const email = ref('')
const password = ref('')
const password_confirmation = ref('')
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)
const isLoading = ref(false)

onMounted(() => {
  const queryToken = route.query.token as string
  const queryEmail = route.query.email as string

  if (!queryToken || !queryEmail) {
    toast.error('Invalid Link', {
      description: 'The password reset link is invalid or incomplete. Please request a new one.',
    })
    router.push({ name: 'login' })
    return
  }

  token.value = queryToken
  email.value = queryEmail
})

async function handleSubmit() {
  isLoading.value = true
  try {
    await authStore.resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    })
    toast.success('Success', {
      description: 'Your password has been reset. You can now log in.',
    })
    router.push({ name: 'login' })
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred. Please try again.'
    if (isApiError(error) && error.response?.data) {
      if (error.response.data.errors) {
        const errors = error.response.data.errors as Record<string, string[]>
        const errorKey = Object.keys(errors)[0]
        if (errorKey && errors[errorKey] && errors[errorKey][0]) {
          errorMessage = errors[errorKey][0]
        }
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    toast.error('Reset Failed', {
      description: errorMessage,
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="w-full max-w-md space-y-6 p-4">
      <div class="text-center">
        <h1 class="text-3xl font-bold">Reset Your Password</h1>
        <p class="text-muted-foreground">Enter your new password below.</p>
      </div>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="email"
            type="email"
            placeholder="m@example.com"
            required
            :disabled="isLoading"
          />
        </div>
        <div class="grid gap-2 relative">
          <Label for="password">New Password</Label>
          <Input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            :disabled="isLoading"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-7 h-7 w-7"
            @click="showPassword = !showPassword"
          >
            <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
          </Button>
        </div>
        <div class="grid gap-2 relative">
          <Label for="password_confirmation">Confirm New Password</Label>
          <Input
            id="password_confirmation"
            v-model="password_confirmation"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            required
            :disabled="isLoading"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-7 h-7 w-7"
            @click="showPasswordConfirmation = !showPasswordConfirmation"
          >
            <component :is="showPasswordConfirmation ? EyeOff : Eye" class="h-4 w-4" />
          </Button>
        </div>
        <Button type="submit" class="w-full" :disabled="isLoading">
          <LoaderCircle v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Resetting...' : 'Reset Password' }}
        </Button>
      </form>
      <div class="text-center">
        <RouterLink to="/" class="text-sm text-muted-foreground hover:underline">
          Back to login
        </RouterLink>
      </div>
    </div>
  </div>
</template>
