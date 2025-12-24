<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue'
import { AlertTriangle, RefreshCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const hasError = ref(false)
const errorMessage = ref('')
const errorStack = ref('')

onErrorCaptured((error, instance, info) => {
  console.error('ErrorBoundary caught:', error, info)
  hasError.value = true
  errorMessage.value = error instanceof Error ? error.message : String(error)
  errorStack.value = error instanceof Error ? error.stack || '' : ''
  // Prevent error from propagating
  return false
})

function handleReload() {
  window.location.reload()
}

// Reset error state when component mounts (allows retry)
onMounted(() => {
  hasError.value = false
})
</script>

<template>
  <div v-if="hasError" class="min-h-screen flex items-center justify-center bg-background p-4">
    <div class="max-w-md w-full text-center space-y-6">
      <div
        class="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
      >
        <AlertTriangle class="w-8 h-8 text-destructive" />
      </div>

      <div class="space-y-2">
        <h1 class="text-2xl font-semibold text-foreground">Terjadi Kesalahan</h1>
        <p class="text-muted-foreground">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba muat ulang halaman.
        </p>
      </div>

      <div v-if="errorMessage" class="p-4 bg-muted rounded-lg text-left">
        <p class="text-sm font-mono text-destructive break-all">{{ errorMessage }}</p>
      </div>

      <Button @click="handleReload" class="gap-2">
        <RefreshCcw class="w-4 h-4" />
        Muat Ulang Halaman
      </Button>
    </div>
  </div>

  <slot v-else />
</template>
