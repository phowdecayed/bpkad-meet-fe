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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Clock,
  Calendar,
  Users,
  MapPin,
  Video,
  User as UserIcon,
  Mail,
  Info,
  FileText,
  AlertTriangle,
  Loader2,
  KeyRound,
  ClipboardCopy,
  Eye,
  EyeOff,
  Link,
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
  return new Date(detailedMeeting.value.start_time).toLocaleString()
})

async function copyToClipboard(text: string, type: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${type} copied to clipboard!`)
  } catch {
    toast.error(`Failed to copy ${type}.`)
  }
}
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-lg grid-rows-[auto_minmax(0,1fr)_auto] p-0 max-h-[90dvh]">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="text-2xl">{{ detailedMeeting?.topic || meeting?.topic }}</DialogTitle>
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

      <div v-else-if="detailedMeeting" class="grid gap-4 py-4 overflow-y-auto px-6">
        <div class="space-y-6">
          <!-- Meeting Info -->
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <Info class="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <h3 class="font-semibold">General Information</h3>
                <div class="text-sm text-muted-foreground">
                  <p class="flex items-center gap-2">
                    <Calendar class="h-4 w-4" />
                    <span>{{ formattedStartTime }}</span>
                  </p>
                  <p class="flex items-center gap-2">
                    <Clock class="h-4 w-4" />
                    <span>{{ detailedMeeting.duration }} minutes</span>
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <FileText class="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <h3 class="font-semibold">Description</h3>
                <p class="text-sm text-muted-foreground">
                  {{ detailedMeeting.description || 'No description provided.' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Location / Type -->
          <div class="flex items-start gap-4">
            <component
              :is="detailedMeeting.type === 'online' ? Video : MapPin"
              class="h-5 w-5 text-muted-foreground mt-1"
            />
            <div>
              <h3 class="font-semibold">Location & Type</h3>
              <div class="flex items-center gap-2">
                <Badge :variant="detailedMeeting.type === 'online' ? 'default' : 'secondary'">
                  {{ detailedMeeting.type }}
                </Badge>
                <span class="text-sm text-muted-foreground">
                  {{
                    detailedMeeting.type === 'online'
                      ? 'Zoom Meeting'
                      : detailedMeeting.location?.name
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Connection Details -->
          <div
            v-if="
              detailedMeeting.zoom_meeting &&
              (detailedMeeting.type === 'online' || detailedMeeting.type === 'hybrid')
            "
            class="space-y-4"
          >
            <div class="flex items-start gap-4">
              <Link class="h-5 w-5 text-muted-foreground mt-1" />
              <div>
                <h3 class="font-semibold">Connection Details</h3>
                <div class="space-y-2 text-sm text-muted-foreground">
                  <div v-if="detailedMeeting.zoom_meeting.join_url" class="flex items-center gap-2">
                    <a
                      :href="detailedMeeting.zoom_meeting.join_url"
                      target="_blank"
                      class="text-primary hover:underline break-words"
                    >
                      {{ detailedMeeting.zoom_meeting.join_url }}
                    </a>
                    <Button
                      size="sm"
                      variant="ghost"
                      @click="copyToClipboard(detailedMeeting.zoom_meeting.join_url, 'Join URL')"
                    >
                      <ClipboardCopy class="h-4 w-4" />
                    </Button>
                  </div>

                  <div v-if="detailedMeeting.zoom_meeting.password" class="flex items-center gap-2">
                    <KeyRound class="h-4 w-4" />
                    <span>Password:</span>
                    <span class="font-mono text-sm">
                      {{ showPassword ? detailedMeeting.zoom_meeting.password : '••••••••' }}
                    </span>
                    <Button size="sm" variant="ghost" @click="showPassword = !showPassword">
                      <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      @click="copyToClipboard(detailedMeeting.zoom_meeting.password, 'Password')"
                    >
                      <ClipboardCopy class="h-4 w-4" />
                    </Button>
                  </div>

                  <div
                    v-if="canViewHostKey && detailedMeeting.host_key"
                    class="flex items-center gap-2"
                  >
                    <KeyRound class="h-4 w-4" />
                    <span>Host Key:</span>
                    <span class="font-mono text-sm">
                      {{ showHostKey ? detailedMeeting.host_key : '••••••' }}
                    </span>
                    <Button size="sm" variant="ghost" @click="showHostKey = !showHostKey">
                      <component :is="showHostKey ? EyeOff : Eye" class="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      @click="copyToClipboard(detailedMeeting.host_key, 'Host Key')"
                    >
                      <ClipboardCopy class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Organizer -->
          <div class="flex items-start gap-4">
            <UserIcon class="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <h3 class="font-semibold">Organizer</h3>
              <div class="flex items-center gap-3">
                <Avatar class="h-8 w-8">
                  <AvatarFallback>{{
                    getInitials(detailedMeeting.organizer.name || '')
                  }}</AvatarFallback>
                </Avatar>
                <div>
                  <p class="text-sm font-medium">{{ detailedMeeting.organizer.name }}</p>
                  <p class="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail class="h-3 w-3" />
                    {{ detailedMeeting.organizer.email }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Participants -->
          <div class="flex items-start gap-4">
            <Users class="h-5 w-5 text-muted-foreground mt-1" />
            <div>
              <h3 class="font-semibold">Participants ({{ participants.length }})</h3>
              <div v-if="participants.length === 0" class="text-sm text-muted-foreground mt-2">
                No participants found.
              </div>
              <div v-else class="space-y-3 mt-2">
                <div
                  v-for="participant in participants"
                  :key="participant.id"
                  class="flex items-center gap-3"
                >
                  <Avatar class="h-8 w-8">
                    <AvatarFallback>{{ getInitials(participant.name) }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="text-sm font-medium">{{ participant.name }}</p>
                    <p class="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail class="h-3 w-3" />
                      {{ participant.email }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="p-6 pt-0">
        <Button variant="outline" @click="isOpen = false" class="w-full">Close</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
