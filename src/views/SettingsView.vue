<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import SettingsGroupSection from '@/components/settings/SettingsGroupSection.vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Settings, RefreshCw } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const settingsStore = useSettingsStore()
const isRetrying = ref(false)

// Fetch all settings when component mounts
onMounted(async () => {
  await fetchSettingsWithErrorHandling()
})

// Enhanced fetch function with error handling
const fetchSettingsWithErrorHandling = async () => {
  try {
    await settingsStore.fetchAllSettings()
  } catch (error: unknown) {
    console.error('Failed to fetch settings:', error)
    toast.error('Failed to Load Settings', {
      description: 'Unable to load settings. Please check your connection and try again.',
    })
  }
}

// Retry function for failed API requests
const retryFetch = async () => {
  isRetrying.value = true
  try {
    await settingsStore.fetchAllSettings()
    toast.success('Settings Loaded', {
      description: 'Settings have been successfully loaded.',
    })
  } catch (error: unknown) {
    console.error('Retry failed:', error)
    toast.error('Retry Failed', {
      description: 'Still unable to load settings. Please try again later.',
    })
  } finally {
    isRetrying.value = false
  }
}

// Handle retry from specific settings group
const handleGroupRetry = async (groupName: string) => {
  toast.info('Refreshing Settings', {
    description: `Refreshing ${groupName} settings...`,
  })
  await retryFetch()
}
</script>

<template>
  <div class="flex-1 space-y-8 p-4 pt-6 md:p-8">
    <!-- Loading State -->
    <div v-if="settingsStore.isLoading" class="space-y-6">
      <Skeleton class="h-8 w-64" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-32 w-full" />
    </div>

    <!-- Error State -->
    <div v-else-if="settingsStore.error" class="text-center py-8">
      <AlertCircle class="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 class="text-lg font-semibold">Failed to load settings</h3>
      <p class="text-muted-foreground mb-4">{{ settingsStore.error }}</p>

      <!-- Error details -->
      <div class="max-w-md mx-auto mb-6">
        <details class="text-left p-4 bg-muted rounded-lg">
          <summary class="cursor-pointer text-sm font-medium">What can I do?</summary>
          <div class="mt-2 text-sm text-muted-foreground space-y-2">
            <p>• Check your internet connection</p>
            <p>• Verify you have permission to access settings</p>
            <p>• Try refreshing the page</p>
            <p>• Contact your administrator if the problem persists</p>
          </div>
        </details>
      </div>

      <div class="flex justify-center space-x-2">
        <Button @click="retryFetch" variant="outline" :disabled="isRetrying">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isRetrying }" />
          {{ isRetrying ? 'Retrying...' : 'Try Again' }}
        </Button>
        <Button @click="() => window.location.reload()" variant="secondary"> Reload Page </Button>
      </div>
    </div>

    <!-- Settings Groups -->
    <div v-else-if="Object.keys(settingsStore.groupedSettings).length > 0" class="space-y-8">
      <Tabs
        :default-value="Object.keys(settingsStore.groupedSettings)[0].toString()"
        class="w-full"
      >
        <TabsList>
          <TabsTrigger
            v-for="groupName in Object.keys(settingsStore.groupedSettings)"
            :key="groupName"
            :value="String(groupName)"
          >
            {{ String(groupName) }}
          </TabsTrigger>
        </TabsList>
        <TabsContent
          v-for="(groupSettings, groupName) in settingsStore.groupedSettings"
          :key="groupName"
          :value="String(groupName)"
          class="mt-4"
        >
          <SettingsGroupSection
            :group-name="String(groupName)"
            :settings="groupSettings"
            @retry="handleGroupRetry"
          />
        </TabsContent>
      </Tabs>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <Settings class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 class="text-lg font-semibold">No settings configured</h3>
      <p class="text-muted-foreground">
        Contact your administrator to configure application settings.
      </p>
    </div>
  </div>
</template>
