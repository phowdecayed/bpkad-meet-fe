<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import { PlusCircle, Settings, ChevronRight } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import AccountSettingsForm from './AccountSettingsForm.vue'
import AddZoomAccountDialog from './AddZoomAccountDialog.vue'
import type { Setting } from '@/types/settings'
import { isApiError } from '@/lib/error-handling'

// Props interface for when used within SettingsGroupSection
interface Props {
  settings?: Setting[]
}

const props = defineProps<Props>()

const settingsStore = useSettingsStore()
const { settings: storeSettings, isLoading } = storeToRefs(settingsStore)

const isSaving = ref<Record<number, boolean>>({})
const isAddDialogOpen = ref(false)
const selectedAccountId = ref<number | null>(null)

onMounted(() => {
  // Only fetch settings if not provided via props (backward compatibility)
  if (!props.settings) {
    settingsStore.fetchSettingsByGroup('zoom')
  }
})

// Use either passed-in settings or store settings
const currentSettings = computed(() => {
  return props.settings || storeSettings.value
})

// Computed property for loading state - only show loading if we're fetching our own data
const isLoadingSettings = computed(() => {
  return !props.settings && isLoading.value
})

const selectedSetting = computed(() => {
  if (!selectedAccountId.value) return null
  return currentSettings.value.find((s) => s.id === selectedAccountId.value) || null
})

function selectAccount(id: number) {
  selectedAccountId.value = id
}

async function handleUpdate(setting: Setting) {
  isSaving.value[setting.id] = true
  try {
    await settingsStore.updateSetting(setting.id, { payload: setting.payload })
    // Only refetch if we're managing our own data (not using passed-in settings)
    if (!props.settings) {
      await settingsStore.fetchSettingsByGroup('zoom')
    } else {
      // If using passed-in settings, refresh all settings to update the parent
      await settingsStore.fetchAllSettings()
    }
    toast.success('Settings Saved', {
      description: `${setting.name} has been updated successfully.`,
    })
  } catch (error: unknown) {
    let errorMessage = 'Failed to save settings. Please try again.'
    if (isApiError(error) && error.response) {
      if (error.response?.status === 400) {
        errorMessage = 'Invalid settings data. Please check your input and try again.'
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to update settings. Please log in again.'
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to update this setting.'
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
    }

    toast.error('Save Failed', {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => handleUpdate(setting),
      },
    })
  } finally {
    isSaving.value[setting.id] = false
  }
}

async function handleDelete(setting: Setting) {
  if (
    confirm(`Are you sure you want to delete "${setting.name}"?\n\nThis action cannot be undone.`)
  ) {
    try {
      await settingsStore.deleteSetting(setting.id)
      // Only refetch if we're managing our own data (not using passed-in settings)
      if (!props.settings) {
        await settingsStore.fetchSettingsByGroup('zoom')
      } else {
        // If using passed-in settings, refresh all settings to update the parent
        await settingsStore.fetchAllSettings()
      }
      toast.success('Setting Deleted', {
        description: `${setting.name} has been deleted successfully.`,
      })
      if (selectedAccountId.value === setting.id) {
        selectedAccountId.value = null
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to delete setting. Please try again.'
      if (isApiError(error) && error.response) {
        if (error.response?.status === 401) {
          errorMessage = 'You are not authorized to delete settings. Please log in again.'
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to delete this setting.'
        } else if (error.response?.status === 404) {
          errorMessage = 'Setting not found. It may have already been deleted.'
        } else if (error.response?.status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        }
      }

      toast.error('Delete Failed', {
        description: errorMessage,
        action: {
          label: 'Retry',
          onClick: () => handleDelete(setting),
        },
      })
    }
  }
}

async function onAccountCreated() {
  if (!props.settings) {
    await settingsStore.fetchSettingsByGroup('zoom')
  } else {
    await settingsStore.fetchAllSettings()
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">Zoom Account Integrations</h1>
        <p class="text-sm text-muted-foreground">
          Manage the Zoom accounts used to create meetings.
        </p>
      </div>

      <Button @click="isAddDialogOpen = true">
        <PlusCircle class="mr-2 h-4 w-4" />
        Add New Account
      </Button>

      <AddZoomAccountDialog v-model:open="isAddDialogOpen" @created="onAccountCreated" />
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
      <!-- Left Column: Account List -->
      <div class="md:col-span-1">
        <div v-if="isLoadingSettings" class="space-y-2">
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
          <Skeleton class="h-12 w-full" />
        </div>
        <div v-else-if="currentSettings && currentSettings.length > 0" class="space-y-2">
          <button
            v-for="setting in currentSettings"
            :key="setting.id"
            class="w-full text-left p-3 rounded-lg transition-colors"
            :class="{
              'bg-primary text-primary-foreground': selectedAccountId === setting.id,
              'hover:bg-muted': selectedAccountId !== setting.id,
            }"
            @click="selectAccount(setting.id)"
          >
            <div class="flex justify-between items-center">
              <span class="font-medium">{{ setting.name }}</span>
              <ChevronRight class="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        </div>
        <div v-else class="text-center text-muted-foreground py-8 border rounded-lg">
          <h3 class="text-lg font-semibold">No Zoom Accounts</h3>
          <p class="text-sm">Click "Add New Account" to get started.</p>
        </div>
      </div>

      <!-- Right Column: Settings Form -->
      <div class="md:col-span-2">
        <div v-if="selectedSetting" class="p-6 border rounded-lg">
          <AccountSettingsForm
            :key="selectedSetting.id"
            :setting="selectedSetting"
            :is-saving="isSaving[selectedSetting.id] || false"
            @update="handleUpdate"
            @delete="handleDelete"
          />
        </div>
        <div
          v-else
          class="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border rounded-lg h-full"
        >
          <Settings class="h-12 w-12 mb-4" />
          <h3 class="text-lg font-semibold">Select an Account</h3>
          <p class="text-sm">Choose an account from the list to view and edit its settings.</p>
        </div>
      </div>
    </div>
  </div>
</template>
