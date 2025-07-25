<script setup lang="ts">
import { computed } from 'vue'
import { Checkbox as CheckboxPrimitive } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked?: boolean
  disabled?: boolean
  required?: boolean
  name?: string
  value?: string
  id?: string
  class?: string
}

const props = defineProps<CheckboxProps>()
const emit = defineEmits<{
  'update:checked': [value: boolean]
}>()

const checkboxClasses = computed(() =>
  cn(
    'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
    props.class,
  ),
)
</script>

<template>
  <CheckboxPrimitive
    :id="id"
    :class="checkboxClasses"
    :checked="checked"
    :disabled="disabled"
    :required="required"
    :name="name"
    :value="value"
    @update:checked="emit('update:checked', $event)"
  >
    <template #indicator>
      <Check class="h-4 w-4" />
    </template>
  </CheckboxPrimitive>
</template>
