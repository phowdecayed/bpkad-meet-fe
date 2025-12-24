<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { LoaderCircle, Camera, MailWarning } from 'lucide-vue-next'
import { isApiError } from '@/lib/error-handling'
import ProfileForm from '@/components/profile/ProfileForm.vue'
import PasswordChangeForm from '@/components/profile/PasswordChangeForm.vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

// UI state
const isResendingVerification = ref(false)

// Avatar state
const avatarPreview = ref<string | null>(null)
const avatarFile = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  if (!user.value) {
    await authStore.fetchUser()
  }
})

function triggerAvatarUpload() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    avatarFile.value = file
    avatarPreview.value = URL.createObjectURL(file)
    handleAvatarUpload()
  }
}

async function handleAvatarUpload() {
  if (!avatarFile.value) return
  // Mock avatar upload.
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    // In real app: await authStore.uploadAvatar(avatarFile.value)
    toast.success('Avatar Updated')
    avatarPreview.value = null
    avatarFile.value = null
  } catch {
    toast.error('Failed to upload avatar')
  }
}

async function handleResendVerificationEmail() {
  isResendingVerification.value = true
  try {
    await authStore.resendVerificationEmail()
    toast.success('Verification Email Sent', {
      description: 'A new verification link has been sent to your email address.',
    })
  } catch (error: unknown) {
    if (isApiError(error) && error.response) {
      toast.error('Error', {
        description: error.response.data.message || 'Failed to send verification email.',
      })
    } else {
      toast.error('Error', {
        description: 'An unexpected error occurred.',
      })
    }
  } finally {
    isResendingVerification.value = false
  }
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <h1 class="text-3xl font-bold tracking-tight">My Profile</h1>
    <div v-if="user" class="grid grid-cols-1 gap-8 lg:grid-cols-4">
      <div class="col-span-1 lg:col-span-1">
        <Card class="overflow-hidden text-center">
          <CardHeader class="relative bg-muted/20 p-0">
            <div class="flex h-24 items-center justify-center bg-primary/10"></div>
            <div
              class="group relative mx-auto -mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-background"
            >
              <Avatar class="h-full w-full">
                <AvatarImage
                  v-if="avatarPreview || user.id"
                  :src="avatarPreview || `https://avatar.iran.liara.run/public/${user.id}`"
                  :alt="user.name"
                />
                <AvatarFallback class="text-4xl">
                  {{ user.name?.charAt(0).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <div
                class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                @click="triggerAvatarUpload"
              >
                <Camera class="h-8 w-8 text-white" />
              </div>
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/png, image/jpeg, image/gif"
                @change="onFileChange"
              />
            </div>
          </CardHeader>
          <CardContent class="p-4">
            <CardTitle class="text-xl">
              {{ user.name }}
            </CardTitle>
            <CardDescription class="mt-1">
              {{ user.email }}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <div class="col-span-1 lg:col-span-3">
        <Tabs default-value="profile" class="w-full">
          <TabsList class="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="profile"> Profile Settings </TabsTrigger>
            <TabsTrigger value="security"> Security </TabsTrigger>
          </TabsList>
          <TabsContent value="profile">
            <ProfileForm />
          </TabsContent>
          <TabsContent value="security" class="space-y-6">
            <Card v-if="!user.email_verified_at">
              <CardHeader>
                <CardTitle class="flex items-center gap-2">
                  <MailWarning class="h-5 w-5 text-destructive" />
                  Email Verification
                </CardTitle>
                <CardDescription
                  >Your email address is not verified. Please check your inbox for a verification
                  link, or resend it below.</CardDescription
                >
              </CardHeader>
              <CardContent>
                <Button @click="handleResendVerificationEmail" :disabled="isResendingVerification">
                  <LoaderCircle v-if="isResendingVerification" class="mr-2 h-4 w-4 animate-spin" />
                  Resend Verification Email
                </Button>
              </CardContent>
            </Card>

            <PasswordChangeForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    <div v-else class="flex h-64 items-center justify-center">
      <LoaderCircle class="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  </div>
</template>
