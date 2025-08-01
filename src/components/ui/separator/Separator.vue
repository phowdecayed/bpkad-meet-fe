<script setup lang="ts">
import { computed } from 'vue'
import { Separator as SeparatorPrimitive } from 'reka-ui'
import { cn } from '@/lib/utils'

interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
  class?: string
}

const props = withDefaults(defineProps<SeparatorProps>(), {
  orientation: 'horizontal',
  decorative: true,
})

const separatorClasses = computed(() =>
  cn(
    'shrink-0 bg-border',
    props.orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
    props.class,
  ),
)

defineOptions({
  name: 'BaseSelect',
})
</script>

<template>
  <SeparatorPrimitive
    :class="separatorClasses"
    :orientation="orientation"
    :decorative="decorative"
  />
</template>
