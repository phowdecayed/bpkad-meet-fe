<script setup lang="ts">
import { computed, ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-vue-next'

// By using <script setup>, the component is automatically named based on its filename,
// allowing for recursive self-reference in the template.
defineOptions({
  name: 'RecursiveFormField',
})

const props = defineProps<{
  id: string | number
  fieldKey: string
  modelValue: any
  isRoot?: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

const isSecretVisible = ref(false)

const isObject = computed(() => {
  return (
    props.modelValue !== null &&
    typeof props.modelValue === 'object' &&
    !Array.isArray(props.modelValue)
  )
})

const isSecretField = computed(() => {
  return props.fieldKey.includes('secret') || props.fieldKey.includes('password')
})

// Convert snake_case or camelCase to Title Case for the label
const formattedLabel = computed(() => {
  // We don't want to display a label for the root payload object itself.
  if (props.isRoot) return ''

  const key = props.fieldKey.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
  return key.charAt(0).toUpperCase() + key.slice(1)
})

const inputType = computed(() => {
  if (isSecretField.value && !isSecretVisible.value) return 'password'

  return 'text'
})

function toggleSecretVisibility() {
  isSecretVisible.value = !isSecretVisible.value
}
</script>

<template>
  <!-- If the value is an object, recursively render fields for its properties -->
  <div v-if="isObject" class="grid gap-4" :class="{ 'rounded-md border p-4 mt-2': !isRoot }">
    <h4 v-if="!isRoot" class="font-semibold">
      {{ formattedLabel }}
    </h4>
    <RecursiveFormField
      v-for="key in Object.keys(modelValue)"
      :id="`${id}-${key}`"
      :key="key"
      :field-key="key"
      v-model="modelValue[key]"
    />
  </div>

  <!-- If the value is a primitive, render a label and input field -->
  <div v-else class="grid gap-2">
    <Label :for="`${id}-${fieldKey}`">{{ formattedLabel }}</Label>
    <div class="relative">
      <Input :id="`${id}-${fieldKey}`" v-model="localValue" :type="inputType" />
      <Button
        v-if="isSecretField"
        type="button"
        variant="ghost"
        size="icon"
        class="absolute inset-y-0 right-0 h-full"
        @click="toggleSecretVisibility"
      >
        <EyeOff v-if="isSecretVisible" class="h-4 w-4" />
        <Eye v-else class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
