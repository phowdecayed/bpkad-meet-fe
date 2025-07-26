<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMeetingsStore } from '@/stores/meetings'
import { storeToRefs } from 'pinia'
import type { Meeting } from '@/types/meeting'
import { Button } from '@/components/ui/button'
import CreateMeetingDialog from '@/components/meetings/CreateMeetingDialog.vue'
import EditMeetingDialog from '@/components/meetings/EditMeetingDialog.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const meetingsStore = useMeetingsStore()
const { meetings } = storeToRefs(meetingsStore)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const selectedMeeting = ref<Meeting | null>(null)

function openEditDialog(meeting: Meeting) {
  selectedMeeting.value = meeting
  showEditDialog.value = true
}

onMounted(() => {
  meetingsStore.fetchMeetings()
})
</script>

<template>
  <div class="flex-1 space-y-8 p-4 pt-6 md:p-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Meetings</h2>
        <p class="text-muted-foreground">
          Manage your existing meetings or create new ones.
        </p>
      </div>
      <Button @click="showCreateDialog = true">Create Meeting</Button>
    </div>
    <div class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Location</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="meetings.length === 0" :colspan="7">
            No meetings found.
          </TableEmpty>
          <TableRow v-for="meeting in meetings" :key="meeting.id">
            <TableCell>{{ meeting.topic }}</TableCell>
            <TableCell>{{ meeting.description }}</TableCell>
            <TableCell>{{ new Date(meeting.start_time).toLocaleString() }}</TableCell>
            <TableCell>{{ meeting.duration }} minutes</TableCell>
            <TableCell>{{ meeting.type }}</TableCell>
            <TableCell>{{ meeting.location?.name || 'N/A' }}</TableCell>
            <TableCell class="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal class="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem @click="openEditDialog(meeting)">Edit</DropdownMenuItem>
                  <DropdownMenuItem @click="meetingsStore.deleteMeeting(meeting.id)">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <CreateMeetingDialog v-model:open="showCreateDialog" />
    <EditMeetingDialog v-model:open="showEditDialog" :meeting="selectedMeeting" />
  </div>
</template>

