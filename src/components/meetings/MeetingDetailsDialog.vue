<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMeetingsStore } from '@/stores/meetings'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'vue-sonner'
import { 
  Eye, EyeOff, Loader2, User, Mail, Calendar, Clock, 
  FileText, Laptop, Building, Users, Link, KeyRound, Copy 
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  meeting: Meeting | null
}>()

const emit = defineEmits(['update:open'])

const meetingsStore = useMeetingsStore()
const detailedMeeting = ref<Meeting | null>(null)
const isLoading = ref(false)
const showPassword = ref(false)
const showHostKey = ref(false)

watch(() => props.open, async (isOpen) => {
  if (isOpen && props.meeting) {
    isLoading.value = true
    try {
      detailedMeeting.value = await meetingsStore.fetchMeeting(props.meeting.id)
    } catch (error) {
      toast.error('Failed to fetch meeting details.')
      console.error(error)
    } finally {
      isLoading.value = false
    }
  } else if (!isOpen) {
    detailedMeeting.value = null
    showPassword.value = false
    showHostKey.value = false
  }
})

const meetingTypeIcon = computed(() => {
  if (!detailedMeeting.value) return null
  switch (detailedMeeting.value.type) {
    case 'online': return Laptop
    case 'offline': return Building
    case 'hybrid': return Users
    default: return FileText
  }
})

const invitationText = computed(() => {
  if (!detailedMeeting.value) return ''
  
  let text = `You are invited to a meeting.\n\n`
  text += `Organizer: ${detailedMeeting.value.organizer.name} (${detailedMeeting.value.organizer.email})\n`
  text += `Topic: ${detailedMeeting.value.topic}\n`
  text += `Time: ${new Date(detailedMeeting.value.start_time).toLocaleString()}\n`
  
  if ((detailedMeeting.value.type === 'online' || detailedMeeting.value.type === 'hybrid') && detailedMeeting.value.zoom_meeting) {
    text += `Join Zoom Meeting: ${detailedMeeting.value.zoom_meeting.join_url}\n`
    text += `Meeting ID: ${detailedMeeting.value.zoom_meeting.zoom_id}\n`
    if (detailedMeeting.value.zoom_meeting.password) {
      text += `Password: ${detailedMeeting.value.zoom_meeting.password}\n`
    n  }
  }
  
  if (detailedMeeting.value.location) {
    text += `Location: ${detailedMeeting.value.location.name}\n`
  }
  
  return text
})

function copyInvitation() {
  navigator.clipboard.writeText(invitationText.value).then(() => {
    toast.success('Meeting invitation copied to clipboard.')
  }).catch(err => {
    toast.error('Failed to copy invitation.')
    console.error('Failed to copy invitation: ', err)
  })
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="props.open" @update:open="handleClose">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle class="text-2xl">{{ meeting?.topic }}</DialogTitle>
        <DialogDescription>
          Review the meeting details below.
        </DialogDescription>
      </DialogHeader>

      <div v-if="isLoading" class="flex items-center justify-center p-12">
        <Loader2 class="h-10 w-10 animate-spin text-primary" />
      </div>

      <div v-else-if="detailedMeeting" class="space-y-6 py-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center text-lg">
              <User class="mr-3 h-5 w-5" />
              Organizer
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm">
            <p>{{ detailedMeeting.organizer.name }}</p>
            <p class="text-muted-foreground">{{ detailedMeeting.organizer.email }}</p>
          </CardContent>
        </Card>

        <div class="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center text-lg">
                <Calendar class="mr-3 h-5 w-5" />
                Schedule & Details
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 text-sm">
              <div class="flex items-start">
                <FileText class="mr-3 mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <ScrollArea class="h-24 w-full">
                  <p>{{ detailedMeeting.description || 'No description provided.' }}</p>
                </ScrollArea>
              </div>
              <div class="flex items-center">
                <Clock class="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>{{ new Date(detailedMeeting.start_time).toLocaleString() }} ({{ detailedMeeting.duration }} minutes)</span>
              </div>
              <div class="flex items-center">
                <component :is="meetingTypeIcon" class="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span class="capitalize">{{ detailedMeeting.type }} Meeting</span>
              </div>
              <div v-if="detailedMeeting.type !== 'online' && detailedMeeting.location" class="flex items-center">
                <Building class="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span>{{ detailedMeeting.location.name }}</span>
              </div>
            </CardContent>
          </Card>

          <Card v-if="(detailedMeeting.type === 'online' || detailedMeeting.type === 'hybrid') && detailedMeeting.zoom_meeting">
            <CardHeader>
              <CardTitle class="flex items-center text-lg">
                <Laptop class="mr-3 h-5 w-5" />
                Zoom Details
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-3 text-sm">
              <div class="flex items-center">
                <Link class="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <a :href="detailedMeeting.zoom_meeting.join_url" target="_blank" class="text-primary hover:underline truncate">
                  {{ detailedMeeting.zoom_meeting.join_url }}
                </a>
              </div>
              <div v-if="detailedMeeting.zoom_meeting.password" class="flex items-center justify-between">
                <div class="flex items-center">
                  <KeyRound class="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span class="font-mono">{{ showPassword ? detailedMeeting.zoom_meeting.password : '••••••••' }}</span>
                </div>
                <Button variant="ghost" size="icon" @click="showPassword = !showPassword" class="h-7 w-7">
                  <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
                </Button>
              </div>
              <div v-if="detailedMeeting.host_key" class="flex items-center justify-between">
                <div class="flex items-center">
                  <KeyRound class="mr-3 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span class="font-mono">{{ showHostKey ? detailedMeeting.host_key : '••••••••' }}</span>
                </div>
                <Button variant="ghost" size="icon" @click="showHostKey = !showHostKey" class="h-7 w-7">
                  <component :is="showHostKey ? EyeOff : Eye" class="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div v-else class="p-12 text-center text-muted-foreground">
        <p>No meeting details available.</p>
      </div>

      <DialogFooter>
        <Button @click="copyInvitation">
          <Copy class="mr-2 h-4 w-4" />
          Copy Invitation
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>


