<script setup lang="ts">
import { computed, type Component } from 'vue'
import type { Setting } from '@/types/settings'
import ZoomSettings from './ZoomSettings.vue'
import GenericSettings from './GenericSettings.vue'
import GeneralSettings from './GeneralSettings.vue'
import SettingsErrorBoundary from './SettingsErrorBoundary.vue'

interface Props {
  groupName: string
  settings: Setting[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  retry: [groupName: string]
}>()

/**
 * Component mapping logic to determine which settings component to render
 * Maps group names to their corresponding Vue components
 */
const componentMap: Record<string, Component> = {
  zoom: ZoomSettings,
  General: GeneralSettings,
  // Add more mappings as new setting group components are created
}

/**
 * Computed property that determines which component to render
 * Falls back to GenericSettings for unknown group types
 */
const componentToRender = computed(() => {
  return componentMap[props.groupName] || GenericSettings
})

/**
 * Computed props to pass to the rendered component
 * Different components may expect different prop structures
 */
const componentProps = computed(() => {
  // For ZoomSettings, pass the settings so it doesn't need to fetch its own data
  if (props.groupName === 'zoom') {
    return {
      settings: props.settings,
    }
  }

  // For GeneralSettings, pass the settings array
  if (props.groupName === 'General') {
    return {
      settings: props.settings,
    }
  }

  // For GenericSettings and other components, pass groupName and settings
  return {
    groupName: props.groupName,
    settings: props.settings,
  }
})

/**
 * Handle retry from error boundary
 */
const handleRetry = () => {
  emit('retry', props.groupName)
}
</script>

<template>
  <div class="settings-group-section">
    <!-- Wrap each settings group in an error boundary -->
    <SettingsErrorBoundary
      :fallback-title="`Error loading ${groupName} settings`"
      :fallback-message="`There was a problem loading the ${groupName.toLowerCase()} settings. Please try again.`"
      @retry="handleRetry"
    >
      <!-- Render the appropriate component based on group type -->
      <component :is="componentToRender" v-bind="componentProps" />
    </SettingsErrorBoundary>
  </div>
</template>

<style scoped>
.settings-group-section {
  /* Container styles if needed */
}
</style>
