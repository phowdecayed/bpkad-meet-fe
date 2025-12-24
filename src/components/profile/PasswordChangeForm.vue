<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, AlertTriangle, LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { isApiError } from '@/lib/error-handling'

const authStore = useAuthStore()
const router = useRouter()

const current_password = ref('')
const password = ref('')
const password_confirmation = ref('')
const isChangingPassword = ref(false)

const showCurrentPassword = ref(false)
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)
const isConfirmDialogOpen = ref(false)

function handleChangePassword() {
  isConfirmDialogOpen.value = true
}

async function onConfirmChangePassword() {
  isChangingPassword.value = true
  try {
    await authStore.changePassword({
      current_password: current_password.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    })

    await authStore.logout()

    toast.success('Password Changed', {
      description: 'Your password has been updated. Please log in again.',
    })

    router.push({ name: 'login' })
  } catch (error: unknown) {
    if (isApiError(error) && error.response) {
      toast.error('Error', {
        description: error.response.data.message || 'Failed to update password.',
      })
    } else {
      toast.error('Error', {
        description: 'An unexpected error occurred.',
      })
    }
  } finally {
    isChangingPassword.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Change Password</CardTitle>
      <CardDescription
        >For security, you will be logged out after changing your password.</CardDescription
      >
    </CardHeader>
    <CardContent>
      <form class="space-y-6" @submit.prevent="handleChangePassword">
        <div class="grid gap-2 relative">
          <Label for="current_password">Current Password</Label>
          <Input
            id="current_password"
            v-model="current_password"
            :type="showCurrentPassword ? 'text' : 'password'"
            placeholder="Enter Current Password"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-7 h-7 w-7"
            @click="showCurrentPassword = !showCurrentPassword"
          >
            <component :is="showCurrentPassword ? EyeOff : Eye" class="h-4 w-4" />
          </Button>
        </div>
        <div class="grid gap-2 relative">
          <Label for="password">New Password</Label>
          <Input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter New Password"
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
            placeholder="Enter Confirmation Password"
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
        <Alert variant="destructive" class="flex items-center gap-4">
          <AlertTriangle class="h-5 w-5" />
          <AlertDescription>
            Changing your password will log you out from all devices.
          </AlertDescription>
        </Alert>
        <Button type="submit" :disabled="isChangingPassword">
          <LoaderCircle v-if="isChangingPassword" class="mr-2 h-4 w-4 animate-spin" />
          Change Password
        </Button>
      </form>
    </CardContent>
  </Card>

  <ConfirmationDialog
    v-model:open="isConfirmDialogOpen"
    title="Are you absolutely sure?"
    description="This action will change your password and log you out from all devices. This cannot be undone."
    @confirm="onConfirmChangePassword"
  />
</template>
