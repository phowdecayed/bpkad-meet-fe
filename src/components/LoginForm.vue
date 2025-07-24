<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-vue-next'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const error = ref<string | null>(null)

const authStore = useAuthStore()
const router = useRouter()

async function handleSubmit() {
  error.value = null
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/app/dashboard')
  }
  catch (err) {
    error.value = 'Failed to login. Please check your credentials.'
    console.error(err)
  }
}
</script>

<template>
  <form :class="cn('flex flex-col gap-6', props.class)" @submit.prevent="handleSubmit">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold">Login to your account</h1>
      <p class="text-muted-foreground text-sm text-balance">
        Enter your email below to login to your account
      </p>
    </div>
    <div class="grid gap-6">
      <div class="grid gap-3">
        <Label for="email">Email</Label>
        <Input id="email" v-model="email" type="email" placeholder="m@example.com" required />
      </div>
      <div class="grid gap-3">
        <div class="flex items-center">
          <Label for="password">Password</Label>
          <RouterLink to="/forgot-password" class="ml-auto text-sm underline-offset-4 hover:underline">
            Forgot your password?
          </RouterLink>
        </div>
        <div class="relative">
          <Input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" required placeholder="Enter your password" />
          <Button type="button" variant="ghost" size="icon" class="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" @click="showPassword = !showPassword">
            <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div v-if="error" class="text-red-500 text-sm text-center">
        {{ error }}
      </div>
      <Button type="submit" class-name="w-full">Login</Button>
    </div>
  </form>
</template>

