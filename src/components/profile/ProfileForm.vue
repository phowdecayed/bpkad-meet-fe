<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { isApiError } from '@/lib/error-handling'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const name = ref('')
const email = ref('')
const isUpdatingProfile = ref(false)

watch(
  user,
  (newUser) => {
    if (newUser) {
      name.value = newUser.name
      email.value = newUser.email
    } else {
      name.value = ''
      email.value = ''
    }
  },
  { immediate: true },
)

async function handleUpdateProfile() {
  isUpdatingProfile.value = true
  try {
    const profileUpdates = []
    if (name.value !== user.value?.name) {
      profileUpdates.push(authStore.changeName(name.value))
    }
    if (email.value !== user.value?.email) {
      profileUpdates.push(authStore.changeEmail(email.value))
    }

    await Promise.all(profileUpdates)
    await authStore.fetchUser()

    toast.success('Success', {
      description: 'Profile updated successfully.',
    })
  } catch (error: unknown) {
    if (isApiError(error) && error.response) {
      toast.error('Error', {
        description: error.response.data.message || 'Failed to update profile.',
      })
    } else {
      toast.error('Error', {
        description: 'An unexpected error occurred.',
      })
    }
  } finally {
    isUpdatingProfile.value = false
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Profile Information</CardTitle>
      <CardDescription>Update your personal details here.</CardDescription>
    </CardHeader>
    <CardContent>
      <form class="space-y-6" @submit.prevent="handleUpdateProfile">
        <div class="grid gap-2">
          <Label for="name">Name</Label>
          <Input id="name" v-model="name" type="text" />
        </div>
        <div class="grid gap-2">
          <Label for="email">Email</Label>
          <Input id="email" v-model="email" type="email" />
        </div>
        <Button type="submit" :disabled="isUpdatingProfile">
          <LoaderCircle v-if="isUpdatingProfile" class="mr-2 h-4 w-4 animate-spin" />
          Save Changes
        </Button>
      </form>
    </CardContent>
  </Card>
</template>
