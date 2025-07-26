<script setup lang="ts">
import { ref, onErrorCaptured, provide } from 'vue'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

interface Props {
  fallbackTitle?: string
  fallbackMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  fallbackTitle: 'Something went wrong',
  fallbackMessage: 'An error occurred while loading this settings section.',
})

const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')

// Capture errors from child components
onErrorCaptured((error, instance, info) => {
  console.error('Settings Error Boundary caught error:', error, info)

  hasError.value = true
  errorMessage.value = error.message || 'Unknown error occurred'
  errorDetails.value = info || ''

  // Prevent the error from propagating further
  return false
})

// Provide a way for child components to report errors
const reportError = (error: Error, context?: string) => {
  console.error('Settings component reported error:', error, context)

  hasError.value = true
  errorMessage.value = error.message || 'Unknown error occurred'
  errorDetails.value = context || ''
}

provide('reportError', reportError)

// Reset error state
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
}

// Retry by reloading the page or resetting state
const handleRetry = () => {
  resetError()
  // Emit event to parent to retry loading
  emit('retry')
}

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <div>
    <!-- Error State -->
    <div v-if="hasError" class="text-center py-12 px-6">
      <div class="max-w-md mx-auto">
        <AlertTriangle class="h-16 w-16 text-destructive mx-auto mb-4" />
        <h3 class="text-xl font-semibold mb-2">{{ fallbackTitle }}</h3>
        <p class="text-muted-foreground mb-4">{{ fallbackMessage }}</p>

        <!-- Error details (collapsible) -->
        <details class="text-left mb-6 p-4 bg-muted rounded-lg">
          <summary class="cursor-pointer text-sm font-medium">Technical Details</summary>
          <div class="mt-2 text-xs text-muted-foreground space-y-1">
            <p><strong>Error:</strong> {{ errorMessage }}</p>
            <p v-if="errorDetails"><strong>Context:</strong> {{ errorDetails }}</p>
          </div>
        </details>

        <div class="flex justify-center space-x-2">
          <Button @click="handleRetry" variant="outline">
            <RefreshCw class="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button @click="() => window.location.reload()" variant="secondary">
            Reload Page
          </Button>
        </div>
      </div>
    </div>

    <!-- Normal Content -->
    <slot v-else />
  </div>
</template>
</script>
