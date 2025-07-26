<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoaderCircle, CircleCheck, CircleX } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const verificationStatus = ref('verifying') // 'verifying', 'success', 'error'
const errorMessage = ref('')

onMounted(async () => {
  const { id, hash } = route.query
  const query = route.query
  const isAdminAction = ref(false)

  if (!id || !hash) {
    verificationStatus.value = 'error'
    errorMessage.value = 'Invalid verification link. Please check the URL and try again.'
    return
  }

  try {
    // Security Check: If a user is logged in, ensure they are the correct user OR an admin.
    if (authStore.isAuthenticated && authStore.user && String(authStore.user.id) !== id) {
      if (authStore.hasPermission('manage users')) {
        isAdminAction.value = true
      } else {
        await authStore.logout()
        toast.info('You have been logged out', {
          description: 'The verification link you used belongs to a different account.',
        })
      }
    }

    await authStore.verifyEmail(id as string, hash as string, query)
    verificationStatus.value = 'success'

    // After successful verification, check auth state again.
    if (authStore.isAuthenticated) {
      await authStore.fetchUser() // Refresh current user's data

      if (isAdminAction.value) {
        toast.success('Verification Successful', {
          description: "The user's email address has been verified.",
        })
        router.push({ name: 'users' })
      } else {
        toast.success('Success', {
          description: 'Your email has been verified.',
        })
        router.push({ name: 'profile' })
      }
    } else {
      // This runs if the user was not logged in, or was just logged out.
      toast.success('Email Verified!', {
        description: 'Your email has been verified. You can now log in.',
      })
    }
  } catch (error: any) {
    verificationStatus.value = 'error'
    errorMessage.value =
      error.response?.data?.message || 'Verification failed. The link may be invalid or expired.'
    toast.error('Error', {
      description: errorMessage.value,
    })
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted p-4">
    <Card class="w-full max-w-md text-center shadow-lg">
      <CardHeader>
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <transition name="fade" mode="out-in">
            <LoaderCircle
              v-if="verificationStatus === 'verifying'"
              class="h-8 w-8 animate-spin text-primary"
            />
            <CircleCheck
              v-else-if="verificationStatus === 'success'"
              class="pop-in h-8 w-8 text-green-500"
            />
            <CircleX
              v-else-if="verificationStatus === 'error'"
              class="pop-in h-8 w-8 text-red-500"
            />
          </transition>
        </div>
        <CardTitle class="text-2xl font-bold">
          <span v-if="verificationStatus === 'verifying'">Verifying Your Email...</span>
          <span v-else-if="verificationStatus === 'success'">Email Verified!</span>
          <span v-else-if="verificationStatus === 'error'">Verification Failed</span>
        </CardTitle>
        <CardDescription>
          <span v-if="verificationStatus === 'verifying'"
            >Please wait a moment while we confirm your email address.</span
          >
          <span v-else-if="verificationStatus === 'success'"
            >Thank you for verifying your email. Welcome aboard!</span
          >
          <span v-else-if="verificationStatus === 'error'">{{ errorMessage }}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          v-if="verificationStatus === 'success' && !authStore.isAuthenticated"
          as-child
          class="w-full"
        >
          <RouterLink to="/"> Go to Login </RouterLink>
        </Button>
        <Button
          v-else-if="verificationStatus === 'success' && authStore.isAuthenticated"
          as-child
          class="w-full"
        >
          <RouterLink to="/app/profile"> Go to Your Dashboard </RouterLink>
        </Button>
        <Button v-else-if="verificationStatus === 'error'" as-child class="w-full">
          <RouterLink to="/"> Back to Home </RouterLink>
        </Button>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.pop-in {
  animation: pop-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

@keyframes pop-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
