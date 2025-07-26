<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { toast } from 'vue-sonner'
import { useSettingsStore } from '@/stores/settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoaderCircle, Settings } from 'lucide-vue-next'
import { Skeleton } from '@/components/ui/skeleton'
import type { Setting } from '@/types/settings'

// Props
interface Props {
  settings: Setting[]
}

const props = defineProps<Props>()

// Store
const settingsStore = useSettingsStore()

// Form validation schema
const generalSettingsSchema = z.object({
  apps_name: z
    .string()
    .min(1, 'Application name is required')
    .max(100, 'Application name must be less than 100 characters'),
})

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>

// Form setup
const { handleSubmit, errors, setFieldValue, resetForm, meta, defineField } =
  useForm<GeneralSettingsForm>({
    validationSchema: toTypedSchema(generalSettingsSchema),
    initialValues: {
      apps_name: '',
    },
  })

// Define form fields
const [appsName, appsNameAttrs] = defineField('apps_name')

// State
const isSaving = ref(false)
const isInitialized = ref(false)

// Computed
const generalSetting = computed(() => {
  // Look for a setting that has apps_name in its payload
  return props.settings.find((setting) => setting.payload?.apps_name !== undefined) || null
})

const hasChanges = computed(() => {
  if (!generalSetting.value || !isInitialized.value) return false
  return appsName.value !== generalSetting.value.payload.apps_name
})

// Initialize form with existing data
function initializeForm() {
  if (generalSetting.value?.payload?.apps_name) {
    setFieldValue('apps_name', generalSetting.value.payload.apps_name)
  }
  isInitialized.value = true
}

// Watch for settings changes
watch(
  () => props.settings,
  () => {
    if (!isInitialized.value) {
      initializeForm()
    }
  },
  { immediate: true },
)

// Form handlers
const onSubmit = handleSubmit(async (formData) => {
  if (!hasChanges.value) {
    toast.info('No Changes', {
      description: 'No changes were made to save.',
    })
    return
  }

  isSaving.value = true

  try {
    const payload = {
      payload: {
        apps_name: formData.apps_name,
      },
    }

    if (generalSetting.value) {
      // Update existing setting
      await settingsStore.updateSetting(generalSetting.value.id, payload)
      toast.success('Settings Saved', {
        description: 'General settings have been updated successfully.',
      })
    } else {
      // Create new setting
      await settingsStore.createSetting({
        name: 'Application Name',
        group: 'General',
        payload: payload.payload,
      })
      toast.success('Settings Created', {
        description: 'General settings have been created successfully.',
      })
    }

    // Refresh settings to get updated data
    await settingsStore.fetchAllSettings()
  } catch (error: any) {
    console.error('Failed to save general settings:', error)

    let errorMessage = 'Failed to save general settings. Please try again.'
    if (error.response?.status === 400) {
      errorMessage = 'Invalid settings data. Please check your input and try again.'
    } else if (error.response?.status === 401) {
      errorMessage = 'You are not authorized to update settings. Please log in again.'
    } else if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to update general settings.'
    } else if (error.response?.status >= 500) {
      errorMessage = 'Server error. Please try again later.'
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    }

    toast.error('Save Failed', {
      description: errorMessage,
      action: {
        label: 'Retry',
        onClick: () => onSubmit(),
      },
    })
  } finally {
    isSaving.value = false
  }
})

function handleReset() {
  if (generalSetting.value?.payload?.apps_name) {
    setFieldValue('apps_name', generalSetting.value.payload.apps_name)
  } else {
    resetForm()
  }
  toast.info('Form Reset', {
    description: 'Form has been reset to original values.',
  })
}

// Mount
onMounted(() => {
  if (!isInitialized.value) {
    initializeForm()
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="space-y-1">
      <h1 class="text-3xl font-bold">General Settings</h1>
      <p class="text-sm text-muted-foreground">
        Configure general application settings and preferences.
      </p>
    </div>

    <div class="p-6 border rounded-lg">
      <div v-if="!isInitialized" class="space-y-4">
        <Skeleton class="h-4 w-32" />
        <Skeleton class="h-10 w-full" />
        <div class="flex justify-end space-x-2">
          <Skeleton class="h-10 w-16" />
          <Skeleton class="h-10 w-24" />
        </div>
      </div>

      <form v-else @submit.prevent="onSubmit" class="space-y-4">
        <div class="grid gap-2">
          <Label for="apps-name">
            Application Name
            <span class="text-destructive">*</span>
          </Label>
          <Input
            id="apps-name"
            v-model="appsName"
            v-bind="appsNameAttrs"
            placeholder="Enter application name"
            :class="{ 'border-destructive': errors.apps_name }"
          />
          <p v-if="errors.apps_name" class="text-sm text-destructive">
            {{ errors.apps_name }}
          </p>
          <p class="text-xs text-muted-foreground">
            This name will be displayed throughout the application interface.
          </p>
        </div>

        <div class="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            @click="handleReset"
            :disabled="isSaving || !hasChanges"
          >
            Reset
          </Button>
          <Button type="submit" :disabled="isSaving || !meta.valid || !hasChanges">
            <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Save Changes
          </Button>
        </div>

        <!-- Status indicator -->
        <div v-if="hasChanges && meta.valid" class="text-xs text-muted-foreground">
          You have unsaved changes.
        </div>
      </form>
    </div>

    <!-- Empty state when no settings exist -->
    <div
      v-if="isInitialized && !generalSetting"
      class="text-center text-muted-foreground py-8 border rounded-lg"
    >
      <Settings class="h-12 w-12 mx-auto mb-4" />
      <h3 class="text-lg font-semibold">No General Settings</h3>
      <p class="text-sm">Configure your first general setting above.</p>
    </div>
  </div>
</template>
