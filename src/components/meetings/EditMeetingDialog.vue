<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMeetingsStore, type UpdateMeetingPayload } from '@/stores/meetings'
import type { Meeting } from '@/types/meeting'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps<{
  open: boolean
  meeting: Meeting | null
}>()

const emit = defineEmits(['update:open'])

const meetingsStore = useMeetingsStore()

const topic = ref('')
const description = ref('')
const startTime = ref('')
const duration = ref(60)

watch(
  () => props.meeting,
  (newMeeting) => {
    if (newMeeting) {
      topic.value = newMeeting.topic
      description.value = newMeeting.description || ''
      startTime.value = new Date(newMeeting.start_time).toISOString().slice(0, 16)
      duration.value = newMeeting.duration
    }
  },
)

async function updateMeeting() {
  if (props.meeting) {
    const updateData: UpdateMeetingPayload = {
      topic: topic.value,
      description: description.value,
      start_time: startTime.value,
      duration: duration.value,
    }

    await meetingsStore.updateMeeting(props.meeting.id, updateData)
    emit('update:open', false)
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="(value) => emit('update:open', value)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Meeting</DialogTitle>
        <DialogDescription> Fill out the form below to edit the meeting. </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="topic" class="text-right"> Topic </Label>
          <Input id="topic" v-model="topic" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="description" class="text-right"> Description </Label>
          <Textarea id="description" v-model="description" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="start_time" class="text-right"> Start Time </Label>
          <Input id="start_time" v-model="startTime" type="datetime-local" class="col-span-3" />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="duration" class="text-right"> Duration (minutes) </Label>
          <Input id="duration" v-model.number="duration" type="number" class="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button @click="updateMeeting"> Update </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
