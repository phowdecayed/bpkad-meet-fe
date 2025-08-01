<!--
@file This component displays a confirmation dialog.
@author BPKAD
@version 1.0.0
-->

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
  /**
   * The title of the dialog.
   * @type {string}
   */
  title: string
  /**
   * The description of the dialog.
   * @type {string}
   */
  description: string
}>()

const open = defineModel<boolean>('open')
const emit = defineEmits(['confirm'])

/**
 * Handles the confirm event.
 * Emits the confirm event and closes the dialog.
 */
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
