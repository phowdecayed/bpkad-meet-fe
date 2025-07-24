<script setup lang="ts">
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

defineProps<{
  title: string
  description: string
}>()

const open = defineModel<boolean>('open')
const emit = defineEmits(['confirm'])

function handleConfirm() {
  emit('confirm')
  open.value = false
}
</script>

<template>
  <AlertDialog :open="open" @update:open="open = $event">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ title }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{ description }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel as-child>
          <Button variant="outline"> Cancel </Button>
        </AlertDialogCancel>
        <AlertDialogAction as-child>
          <Button variant="destructive" @click="handleConfirm"> Confirm </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
