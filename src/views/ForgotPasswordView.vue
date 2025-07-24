<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'vue-sonner'
import { RouterLink } from 'vue-router'
import { LoaderCircle } from 'lucide-vue-next'

const authStore = useAuthStore()
const email = ref('')
const isLoading = ref(false)

async function handleSubmit() {
  isLoading.value = true
  try {
    await authStore.forgotPassword(email.value)
    toast.success('Success', {
      description: 'If an account with that email exists, a password reset link has been sent.',
    })
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'An error occurred.',
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
        <h1 class="text-3xl font-bold">Forgot Password</h1>
        <p class="text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
        </p>
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
        <Button type="submit" class="w-full" :disabled="isLoading">
          <LoaderCircle v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
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
