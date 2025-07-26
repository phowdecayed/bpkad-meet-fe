<script setup lang="ts">
import type { SelectRootEmits, SelectRootProps } from 'reka-ui'
import { SelectRoot, useForwardPropsEmits } from 'reka-ui'

const props = defineProps<SelectRootProps>()
const emits = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

defineOptions({
  name: 'BaseSelect',
})
</script>

<template>
  <SelectRoot data-slot="select" v-bind="forwarded">
    <slot />
  </SelectRoot>
</template>
