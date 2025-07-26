<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface AlertProps {
  variant?: 'default' | 'destructive'
  class?: string
}

const props = withDefaults(defineProps<AlertProps>(), {
  variant: 'default',
})

const alertClasses = computed(() =>
  cn(
    'relative w-full rounded-lg border p-4',
    {
      'border-border text-foreground': props.variant === 'default',
      'border-destructive/50 text-destructive dark:border-destructive':
        props.variant === 'destructive',
    },
    props.class,
  ),
)

defineOptions({
  name: 'BaseAlert',
})
</script>

<template>
  <div :class="alertClasses">
    <slot />
  </div>
</template>
