<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Meeting } from '@/types/meeting'
import { useMeetingsStore } from '@/stores/meetings'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  Clock,
  Calendar,
  Users,
  MapPin,
  Video,
  User as UserIcon,
  Mail,
  FileText,
  AlertTriangle,
  Loader2,
  KeyRound,
  ClipboardCopy,
  Eye,
  EyeOff,
  Link,
  Copy,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const props = defineProps<{
  open: boolean
  meeting: Meeting | null
}>()

const emit = defineEmits(['update:open'])
const meetingsStore = useMeetingsStore()
const authStore = useAuthStore()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const detailedMeeting = ref<Meeting | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const showPassword = ref(false)
const showHostKey = ref(false)

const isOrganizer = computed(() => {
  return detailedMeeting.value?.organizer.id === authStore.user?.id
})

const canViewHostKey = computed(() => {
  return authStore.hasPermission('view host key') || isOrganizer.value
})

const participants = computed(() => {
  return detailedMeeting.value?.participants || []
})

async function loadMeetingDetails() {
  if (!props.meeting) return
  isLoading.value = true
  error.value = null
  try {
    const fetchedMeeting = await meetingsStore.fetchMeeting(props.meeting.id)
    detailedMeeting.value = fetchedMeeting
  } catch {
    error.value = 'Failed to load meeting details.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      loadMeetingDetails()
    } else {
      detailedMeeting.value = null
      isLoading.value = false
      error.value = null
      showPassword.value = false
      showHostKey.value = false
    }
  },
)

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const formattedStartTime = computed(() => {
  if (!detailedMeeting.value) return ''
  return new Date(detailedMeeting.value.start_time).toLocaleString([], {
    dateStyle: 'full',
    timeStyle: 'short',
  })
})

const invitationText = computed(() => {
  if (!detailedMeeting.value) return ''
  let text = `You are invited to the following meeting:\n\n`
  text += `Topic: ${detailedMeeting.value.topic}\n`
  text += `Organizer: ${detailedMeeting.value.organizer.name}\n`
  text += `Time: ${formattedStartTime.value}\n`

  if (detailedMeeting.value.description) {
    text += `\nDescription:\n${detailedMeeting.value.description}\n`
  }

  if (detailedMeeting.value.type !== 'offline' && detailedMeeting.value.zoom_meeting) {
    text += `\nJoin Zoom Meeting:\n${detailedMeeting.value.zoom_meeting.join_url}\n`
    if (detailedMeeting.value.zoom_meeting.password) {
      text += `Password: ${detailedMeeting.value.zoom_meeting.password}\n`
    }
  } else if (detailedMeeting.value.location) {
    text += `\nLocation: ${detailedMeeting.value.location.name}\n`
  }
  return text
})

async function copyToClipboard(text: string, type: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard!`)
  } catch {
    toast.error(`Failed to copy ${type}.`)
  }
}

function copyInvitation() {
  copyToClipboard(invitationText.value, 'Invitation')
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
      <DialogHeader class="p-6 pb-4">
        <DialogTitle class="text-2xl font-bold">
          {{ detailedMeeting?.topic || meeting?.topic }}
        </DialogTitle>
        <DialogDescription>
          Organized by {{ detailedMeeting?.organizer.name || meeting?.organizer.name }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="isLoading && !detailedMeeting" class="space-y-6 py-4 px-6">
        <div v-for="i in 4" :key="i" class="flex items-start gap-4">
          <Skeleton class="h-6 w-6 rounded" />
          <div class="flex-1 space-y-2">
            <Skeleton class="h-5 w-1/3" />
            <Skeleton class="h-4 w-2/3" />
          </div>
        </div>
      </div>

      <Alert v-else-if="error" variant="destructive" class="m-6">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription class="flex items-center justify-between">
          <span>{{ error }}</span>
          <Button variant="outline" size="sm" @click="loadMeetingDetails" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>

      <div v-else-if="detailedMeeting" class="py-4 overflow-y-auto px-6">
        <div class="space-y-6">
          <!-- Details Section -->
          <div>
            <div class="flex items-center mb-3">
              <Link class="h-5 w-5 mr-3 flex-shrink-0" />
              <h3 class="text-lg font-semibold">Details</h3>
            </div>
            <div class="space-y-4 text-sm pl-[32px]">
              <div class="flex items-center gap-4">
                <Calendar class="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span class="text-muted-foreground">{{ formattedStartTime }}</span>
              </div>
              <div class="flex items-center gap-4">
                <Clock class="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span class="text-muted-foreground">{{ detailedMeeting.duration }} minutes</span>
              </div>
              <div class="flex items-center gap-4">
                <component
                  :is="
                    detailedMeeting.type === 'online' || detailedMeeting.type === 'hybrid'
                      ? Video
                      : MapPin
                  "
                  class="h-5 w-5 text-muted-foreground flex-shrink-0"
                />
                <span class="text-muted-foreground">
                  {{
                    detailedMeeting.type === 'online'
                      ? 'Online via Zoom'
                      : detailedMeeting.location?.name
                  }}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          <!-- Connection Details -->
          <div
            v-if="
              detailedMeeting.zoom_meeting &&
              (detailedMeeting.type === 'online' || detailedMeeting.type === 'hybrid')
            "
          >
            <div class="flex items-center mb-3">
              <Link class="h-5 w-5 mr-3 flex-shrink-0" />
              <h3 class="text-lg font-semibold">Connection</h3>
            </div>
            <div class="space-y-3 text-sm pl-[32px]">
              <div v-if="detailedMeeting.zoom_meeting.join_url" class="flex items-center gap-2">
                <Button asChild>
                  <a
                    :href="detailedMeeting.zoom_meeting.join_url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Video class="mr-2 h-4 w-4" />
                    Join Meeting
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  @click="
                    detailedMeeting.zoom_meeting.join_url &&
                    copyToClipboard(detailedMeeting.zoom_meeting.join_url, 'Join URL')
                  "
                >
                  <ClipboardCopy class="h-4 w-4" />
                  <span class="sr-only">Copy Join URL</span>
                </Button>
              </div>

              <div v-if="detailedMeeting.zoom_meeting.password" class="flex items-center gap-2">
                <KeyRound class="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span class="text-muted-foreground">Password:</span>
                <span class="font-mono text-sm text-foreground">
                  {{ showPassword ? detailedMeeting.zoom_meeting.password : '••••••••' }}
                </span>
                <Button size="sm" variant="ghost" @click="showPassword = !showPassword">
                  <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="
                    detailedMeeting.zoom_meeting.password &&
                    copyToClipboard(detailedMeeting.zoom_meeting.password, 'Password')
                  "
                >
                  <ClipboardCopy class="h-4 w-4" />
                </Button>
              </div>

              <div
                v-if="canViewHostKey && detailedMeeting.host_key"
                class="flex items-center gap-2"
              >
                <KeyRound class="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <span class="text-muted-foreground">Host Key:</span>
                <span class="font-mono text-sm text-foreground">
                  {{ showHostKey ? detailedMeeting.host_key : '••••••' }}
                </span>
                <Button size="sm" variant="ghost" @click="showHostKey = !showHostKey">
                  <component :is="showHostKey ? EyeOff : Eye" class="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  @click="
                    detailedMeeting.host_key &&
                    copyToClipboard(detailedMeeting.host_key, 'Host Key')
                  "
                >
                  <ClipboardCopy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <Separator
            v-if="
              detailedMeeting.zoom_meeting &&
              (detailedMeeting.type === 'online' || detailedMeeting.type === 'hybrid')
            "
          />

          <!-- Description -->
          <div>
            <div class="flex items-center mb-2">
              <FileText class="h-5 w-5 mr-3 flex-shrink-0" />
              <h3 class="text-lg font-semibold">Description</h3>
            </div>
            <p class="text-sm text-muted-foreground pl-[32px]">
              {{ detailedMeeting.description || 'No description provided.' }}
            </p>
          </div>

          <Separator />

          <!-- Organizer & Participants -->
          <div class="grid grid-cols-2 gap-6">
            <div>
              <div class="flex items-center mb-3">
                <UserIcon class="h-5 w-5 mr-3 flex-shrink-0" />
                <h3 class="text-lg font-semibold">Organizer</h3>
              </div>
              <div class="flex items-center gap-3 pl-[32px]">
                <Avatar class="h-10 w-10">
                  <AvatarFallback>{{
                    getInitials(detailedMeeting.organizer.name || '')
                  }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="font-medium">{{ detailedMeeting.organizer.name }}</p>
                  <p class="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail class="h-3 w-3" />
                    {{ detailedMeeting.organizer.email }}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div class="flex items-center mb-3">
                <Users class="h-5 w-5 mr-3 flex-shrink-0" />
                <h3 class="text-lg font-semibold">Participants ({{ participants.length }})</h3>
              </div>
              <div v-if="participants.length > 0" class="flex -space-x-2 overflow-hidden pl-[32px]">
                <Avatar
                  v-for="participant in participants.slice(0, 5)"
                  :key="participant.id"
                  class="h-10 w-10 border-2 border-card"
                >
                  <AvatarFallback>{{ getInitials(participant.name) }}</AvatarFallback>
                </Avatar>
                <Avatar v-if="participants.length > 5" class="h-10 w-10 border-2 border-card">
                  <AvatarFallback>+{{ participants.length - 5 }}</AvatarFallback>
                </Avatar>
              </div>
              <p v-else class="text-sm text-muted-foreground pl-[32px]">No participants.</p>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 pt-4">
        <Separator class="mb-4" />
        <div class="flex justify-between gap-2">
          <Button variant="outline" @click="isOpen = false">Close</Button>
          <Button @click="copyInvitation">
            <Copy class="mr-2 h-4 w-4" />
            Copy Invitation
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
