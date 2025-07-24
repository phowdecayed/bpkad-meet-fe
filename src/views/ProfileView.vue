<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'vue-sonner'
import { Eye, EyeOff, AlertTriangle } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()
const user = ref(authStore.user)

const name = ref(user.value?.name || '')
const email = ref(user.value?.email || '')

const current_password = ref('')
const password = ref('')
const password_confirmation = ref('')

const showCurrentPassword = ref(false)
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchUser()
    user.value = authStore.user
    name.value = user.value?.name || ''
    email.value = user.value?.email || ''
  }
})

async function handleUpdateProfile() {
  try {
    if (name.value !== user.value?.name) {
      await authStore.changeName(name.value)
    }
    if (email.value !== user.value?.email) {
      await authStore.changeEmail(email.value)
    }
    await authStore.fetchUser()
    user.value = authStore.user
    toast.success('Success', {
      description: 'Profile updated successfully.',
    })
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'Failed to update profile.',
    })
  }
}

async function handleChangePassword() {
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
  } catch (error: any) {
    toast.error('Error', {
      description: error.response?.data?.message || 'Failed to update password.',
    })
  }
}
</script>

<template>
  <div class="container mx-auto p-4 space-y-8">
    <h1 class="text-2xl font-bold">Profile</h1>
    <Card v-if="user">
      <CardHeader>
        <div class="flex items-center gap-4">
          <Avatar class="h-16 w-16">
            <AvatarImage v-if="user.avatar" :src="user.avatar" :alt="user.name" />
            <AvatarFallback class="text-2xl">
              {{ user.name?.charAt(0).toUpperCase() }}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle class="text-xl">
              {{ user.name }}
            </CardTitle>
            <CardDescription> Manage your profile settings. </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-6">
        <form class="space-y-4" @submit.prevent="handleUpdateProfile">
          <div class="grid gap-2">
            <Label for="name">Name</Label>
            <Input id="name" v-model="name" type="text" />
          </div>
          <div class="grid gap-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="email" type="email" />
          </div>
          <Button type="submit"> Save Changes </Button>
        </form>

        <form class="space-y-4" @submit.prevent="handleChangePassword">
          <h3 class="text-lg font-medium">Change Password</h3>
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
          <Button type="submit"> Change Password </Button>
        </form>
      </CardContent>
    </Card>
    <div v-else>Loading profile...</div>
  </div>
</template>
