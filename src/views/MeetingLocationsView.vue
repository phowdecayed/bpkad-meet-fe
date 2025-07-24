<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLocationsStore } from '@/stores/locations'
import type { MeetingLocation } from '@/types/meeting'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'vue-sonner'
import { PlusCircle, Trash2, Pencil, LoaderCircle } from 'lucide-vue-next'

const locationsStore = useLocationsStore()
const { locations, isLoading } = storeToRefs(locationsStore)

const isDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const selectedLocation = ref<MeetingLocation | null>(null)
const locationToDelete = ref<MeetingLocation | null>(null)

const form = ref({
  name: '',
  address: '',
  room_name: '',
  capacity: null as number | null,
})

onMounted(() => {
  locationsStore.fetchLocations()
})

function openCreateDialog() {
  isEditing.value = false
  selectedLocation.value = null
  form.value = { name: '', address: '', room_name: '', capacity: null }
  isDialogOpen.value = true
}

function openEditDialog(location: MeetingLocation) {
  isEditing.value = true
  selectedLocation.value = location
  form.value = {
    name: location.name,
    address: location.address,
    room_name: location.room_name || '',
    capacity: location.capacity,
  }
  isDialogOpen.value = true
}

async function handleSave() {
  isSaving.value = true
  try {
    const locationData = {
      ...form.value,
      capacity: form.value.capacity || null,
    }

    if (isEditing.value && selectedLocation.value) {
      await locationsStore.updateLocation(selectedLocation.value.id, locationData)
      toast.success('Location Updated', { description: `${locationData.name} has been updated successfully.` })
    }
    else {
      await locationsStore.createLocation(locationData)
      toast.success('Location Created', { description: `${locationData.name} has been created successfully.` })
    }
    isDialogOpen.value = false
  }
  catch (error: any) {
    toast.error('Save Failed', { description: error.message })
  }
  finally {
    isSaving.value = false
  }
}

function handleDelete(location: MeetingLocation) {
  locationToDelete.value = location
  isConfirmDialogOpen.value = true
}

async function onConfirmDelete() {
  if (!locationToDelete.value) return
  try {
    await locationsStore.deleteLocation(locationToDelete.value.id)
    toast.success('Location Deleted', { description: `${locationToDelete.value.name} has been deleted.` })
  } catch (error: any) {
    toast.error('Delete Failed', { description: error.message })
  } finally {
    locationToDelete.value = null
  }
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">
          Meeting Locations
        </h1>
        <p class="text-sm text-muted-foreground">
          Manage the physical locations and rooms for offline and hybrid meetings.
        </p>
      </div>
      <Button @click="openCreateDialog">
        <PlusCircle class="mr-2 h-4 w-4" />
        Create Location
      </Button>
    </div>

    <div v-if="isLoading">
      <Skeleton class="h-48 w-full" />
    </div>
    <div v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead class="text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="location in locations" :key="location.id">
            <TableCell>{{ location.name }}</TableCell>
            <TableCell>{{ location.address }}</TableCell>
            <TableCell>{{ location.room_name || 'N/A' }}</TableCell>
            <TableCell>{{ location.capacity || 'N/A' }}</TableCell>
            <TableCell class="text-right">
              <Button variant="ghost" size="icon" @click="openEditDialog(location)">
                <Pencil class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" @click="handleDelete(location)">
                <Trash2 class="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Edit Location' : 'Create Location' }}</DialogTitle>
          <DialogDescription>
            {{ isEditing ? 'Update the details for this location.' : 'Enter the details for the new location.' }}
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
              <Button type="button" variant="secondary" :disabled="isSaving">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" :disabled="isSaving">
              <LoaderCircle v-if="isSaving" class="mr-2 h-4 w-4 animate-spin" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <ConfirmationDialog
      v-if="locationToDelete"
      v-model:open="isConfirmDialogOpen"
      title="Are you sure?"
      :description="`This will permanently delete the location '${locationToDelete.name}'. This action cannot be undone.`"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
