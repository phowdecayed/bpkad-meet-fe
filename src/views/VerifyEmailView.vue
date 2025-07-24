<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const route = useRoute()
const authStore = useAuthStore()

const verificationStatus = ref('verifying') // 'verifying', 'success', 'error'
const errorMessage = ref('')

onMounted(async () => {
  const { id, hash } = route.query
  const query = route.query

  if (!id || !hash) {
    verificationStatus.value = 'error'
    errorMessage.value = 'Invalid verification link.'
    return
  }

  try {
    await authStore.verifyEmail(id as string, hash as string, query)
    verificationStatus.value = 'success'
    toast.success('Success', {
      description: 'Your email has been verified. You can now log in.',
    })
  }
  catch (error: any) {
    verificationStatus.value = 'error'
    errorMessage.value = error.response?.data?.message || 'Verification failed. The link may be invalid or expired.'
    toast.error('Error', {
      description: errorMessage.value,
    })
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center text-center p-4">
    <div v-if="verificationStatus === 'verifying'">
      <h1 class="text-3xl font-bold">
        Verifying Your Email...
      </h1>
      <p class="text-muted-foreground mt-2">
        Please wait a moment.
      </p>
    </div>
    <div v-else-if="verificationStatus === 'success'">
      <h1 class="text-3xl font-bold text-green-600">
        Email Verified!
      </h1>
      <p class="text-muted-foreground mt-2">
        Thank you for verifying your email address.
      </p>
      <RouterLink to="/" class="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
        Go to Login
      </RouterLink>
    </div>
    <div v-else-if="verificationStatus === 'error'">
      <h1 class="text-3xl font-bold text-red-600">
        Verification Failed
      </h1>
      <p class="text-muted-foreground mt-2">
        {{ errorMessage }}
      </p>
      <RouterLink to="/" class="mt-8 inline-block rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90">
        Back to Login
      </RouterLink>
    </div>
  </div>
</template>
