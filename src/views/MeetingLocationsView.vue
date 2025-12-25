<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLocationsStore } from '@/stores/locations'
import type { MeetingLocation } from '@/types/meeting'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import LocationDialog from '@/components/locations/LocationDialog.vue'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'vue-sonner'
import { PlusCircle, Trash2, Pencil } from 'lucide-vue-next'

const locationsStore = useLocationsStore()
const { locations, isLoading } = storeToRefs(locationsStore)

const isDialogOpen = ref(false)
const isConfirmDialogOpen = ref(false)
const selectedLocation = ref<MeetingLocation | null>(null)
const locationToDelete = ref<MeetingLocation | null>(null)

onMounted(() => {
  locationsStore.fetchLocations()
})

function openCreateDialog() {
  selectedLocation.value = null
  isDialogOpen.value = true
}

function openEditDialog(location: MeetingLocation) {
  selectedLocation.value = location
  isDialogOpen.value = true
}

function handleSaved() {
  // Store handles refresh automatically
}

function handleDelete(location: MeetingLocation) {
  locationToDelete.value = location
  isConfirmDialogOpen.value = true
}

async function onConfirmDelete() {
  if (!locationToDelete.value) return
  try {
    await locationsStore.deleteLocation(locationToDelete.value.id)
    toast.success('Location Deleted', {
      description: `${locationToDelete.value.name} has been deleted.`,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred'
    toast.error('Delete Failed', { description: message })
  } finally {
    locationToDelete.value = null
  }
}
</script>

<template>
  <div class="flex-1 space-y-4 p-4 pt-6 md:p-8">
    <div class="flex items-center justify-between">
      <div class="space-y-1">
        <h1 class="text-3xl font-bold">Meeting Locations</h1>
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
            <TableHead class="text-right"> Actions </TableHead>
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

    <LocationDialog v-model:open="isDialogOpen" :location="selectedLocation" @saved="handleSaved" />

    <ConfirmationDialog
      v-if="locationToDelete"
      v-model:open="isConfirmDialogOpen"
      title="Are you sure?"
      :description="`This will permanently delete the location '${locationToDelete.name}'. This action cannot be undone.`"
      @confirm="onConfirmDelete"
    />
  </div>
</template>
