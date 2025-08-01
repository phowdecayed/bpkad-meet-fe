<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useSettingsStore } from '@/stores/settings'
import type { Setting } from '@/types/settings'
import axios from 'axios'

interface Props {
  groupName: string
  settings: Setting[]
}

const props = defineProps<Props>()

const settingsStore = useSettingsStore()
const isSaving = ref<Record<number, boolean>>({})
const editingSettings = ref<Record<number, string>>({})

// Initialize editing state for each setting
const initializeEditingState = () => {
  props.settings.forEach((setting) => {
    if (!editingSettings.value[setting.id]) {
      editingSettings.value[setting.id] = JSON.stringify(setting.payload, null, 2)
    }
  })
}

// Initialize on mount and when settings change
initializeEditingState()

const isValidJson = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString)
    return true
  } catch {
    return false
  }
}

const handleSave = async (setting: Setting) => {
  const editedJson = editingSettings.value[setting.id]

  if (!isValidJson(editedJson)) {
    toast.error('Invalid JSON', {
      description: 'Please check your JSON syntax and try again.',
    })
    return
  }

  isSaving.value[setting.id] = true
  try {
    const updatedPayload = JSON.parse(editedJson)
    await settingsStore.updateSetting(setting.id, updatedPayload)
    toast.success('Settings Saved', {
      description: `${setting.name} has been updated successfully.`,
    })
  } catch (error: unknown) {
    console.error('Failed to save generic setting:', error)

    let errorMessage = 'Failed to save settings. Please try again.'
    if (axios.isAxiosError(error) && error.response) {
      if (error.response?.status === 400) {
        errorMessage = 'Invalid settings data. Please check your JSON syntax and try again.'
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
        onClick: () => handleSave(setting),
      },
    })
  } finally {
    isSaving.value[setting.id] = false
  }
}

const handleReset = (setting: Setting) => {
  editingSettings.value[setting.id] = JSON.stringify(setting.payload, null, 2)
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">{{ groupName }} Settings</h1>
      <p class="text-sm text-muted-foreground">
        Configure {{ groupName.toLowerCase() }} settings using the JSON editor below.
      </p>
    </div>

    <!-- Warning about unknown setting type -->
    <div class="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <AlertTriangle class="h-5 w-5 text-yellow-600" />
      <div class="text-sm">
        <p class="font-medium text-yellow-800">Unknown Setting Type</p>
        <p class="text-yellow-700">
          This setting group doesn't have a dedicated interface. You can edit the raw JSON data
          below.
        </p>
      </div>
    </div>

    <!-- Settings List -->
    <div class="space-y-6">
      <div v-for="setting in settings" :key="setting.id" class="p-6 border rounded-lg space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-semibold">{{ setting.name }}</h3>
            <p class="text-sm text-muted-foreground">
              Last updated: {{ new Date(setting.updated_at).toLocaleDateString() }}
            </p>
          </div>
        </div>

        <div class="space-y-2">
          <Label :for="`setting-${setting.id}`">Configuration (JSON)</Label>
          <Textarea
            :id="`setting-${setting.id}`"
            v-model="editingSettings[setting.id]"
            class="font-mono text-sm min-h-[200px]"
            placeholder="Enter JSON configuration..."
          />
          <p class="text-xs text-muted-foreground">
            Edit the JSON configuration for this setting. Make sure to use valid JSON syntax.
          </p>
        </div>

        <div class="flex justify-end space-x-2">
          <Button type="button" variant="secondary" @click="handleReset(setting)"> Reset </Button>
          <Button
            type="button"
            :disabled="isSaving[setting.id] || !isValidJson(editingSettings[setting.id])"
            @click="handleSave(setting)"
          >
            <LoaderCircle v-if="isSaving[setting.id]" class="mr-2 h-4 w-4 animate-spin" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="settings.length === 0" class="text-center py-12 border rounded-lg">
      <h3 class="text-lg font-semibold text-muted-foreground">No Settings Found</h3>
      <p class="text-sm text-muted-foreground">
        No settings are configured for the {{ groupName }} group.
      </p>
    </div>
  </div>
</template>
