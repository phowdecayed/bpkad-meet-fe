<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoaderCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useLocationsStore } from '@/stores/locations'
import type { MeetingLocation } from '@/types/meeting'

const props = defineProps<{
  open: boolean
  location: MeetingLocation | null
}>()

const emit = defineEmits(['update:open', 'saved'])

const locationsStore = useLocationsStore()
const isSaving = ref(false)

const form = ref({
  name: '',
  address: '',
  room_name: '',
  capacity: null as number | null,
})

const isEditing = computed(() => !!props.location)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      if (props.location) {
        form.value = {
          name: props.location.name,
          address: props.location.address,
          room_name: props.location.room_name || '',
          capacity: props.location.capacity,
        }
      } else {
        form.value = { name: '', address: '', room_name: '', capacity: null }
      }
    }
  },
)

async function handleSave() {
  isSaving.value = true
  try {
    const locationData = {
      ...form.value,
      capacity: form.value.capacity || null,
    }

    if (isEditing.value && props.location) {
      await locationsStore.updateLocation(props.location.id, locationData)
      toast.success('Location Updated', {
        description: `${locationData.name} has been updated successfully.`,
      })
    } else {
      await locationsStore.createLocation(locationData)
      toast.success('Location Created', {
        description: `${locationData.name} has been created successfully.`,
      })
    }
    emit('saved')
    emit('update:open', false)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    toast.error('Save Failed', { description: message })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(val) => emit('update:open', val)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ isEditing ? 'Edit Location' : 'Create Location' }}</DialogTitle>
        <DialogDescription>
          {{
            isEditing
              ? 'Update the details for this location.'
              : 'Enter the details for the new location.'
          }}
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSave">
        <div class="grid gap-2">
          <Label for="name">Location Name</Label>
          <Input id="name" v-model="form.name" placeholder="e.g., Main Office" />
        </div>
        <div class="grid gap-2">
          <Label for="address">Address</Label>
          <Input id="address" v-model="form.address" placeholder="e.g., 123 Government St" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="room_name">Room Name (Optional)</Label>
            <Input id="room_name" v-model="form.room_name" placeholder="e.g., Conference Room A" />
          </div>
          <div class="grid gap-2">
            <Label for="capacity">Capacity (Optional)</Label>
            <Input id="capacity" v-model.number="form.capacity" type="number" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose as-child>
            <Button type="button" variant="secondary" :disabled="isSaving"> Cancel </Button>
          </DialogClose>
          <Button type="submit" :disabled="isSaving">
            <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
            Save
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
