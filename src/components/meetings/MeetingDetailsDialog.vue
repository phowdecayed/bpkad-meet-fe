<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
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
  } catch (e) {
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
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="text-2xl">{{ meeting?.topic }}</DialogTitle>
        <DialogDescription>
          Organized by {{ meeting?.organizer.name }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="meeting" class="flex flex-col min-h-0">
        <ScrollArea class="flex-1 pr-6 -mr-6">
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
                      <span>{{ meeting.duration }} minutes</span>
                    </p>
                  </div>
                </div>
              </div>

              <div class="flex items-start gap-4">
                <FileText class="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <h3 class="font-semibold">Description</h3>
                  <p class="text-sm text-muted-foreground">
                    {{ meeting.description || 'No description provided.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Location / Type -->
            <div class="flex items-start gap-4">
              <component
                :is="meeting.type === 'online' ? Video : MapPin"
                class="h-5 w-5 text-muted-foreground mt-1"
              />
              <div>
                <h3 class="font-semibold">Location & Type</h3>
                <div class="flex items-center gap-2">
                  <Badge :variant="meeting.type === 'online' ? 'default' : 'secondary'">
                    {{ meeting.type }}
                  </Badge>
                  <span class="text-sm text-muted-foreground">
                    {{ meeting.type === 'online' ? 'Zoom Meeting' : meeting.location?.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Connection Details -->
            <div
              v-if="meeting.zoom_meeting && (meeting.type === 'online' || meeting.type === 'hybrid')"
              class="space-y-4"
            >
              <div class="flex items-start gap-4">
                <Link class="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <h3 class="font-semibold">Connection Details</h3>
                  <div class="space-y-2 text-sm text-muted-foreground">
                    <div v-if="meeting.zoom_meeting.join_url" class="flex items-center gap-2">
                      <a
                        :href="meeting.zoom_meeting.join_url"
                        target="_blank"
                        class="text-primary hover:underline truncate"
                      >
                        {{ meeting.zoom_meeting.join_url }}
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        @click="copyToClipboard(meeting.zoom_meeting.join_url, 'Join URL')"
                      >
                        <ClipboardCopy class="h-4 w-4" />
                      </Button>
                    </div>

                    <div v-if="meeting.zoom_meeting.password" class="flex items-center gap-2">
                      <KeyRound class="h-4 w-4" />
                      <span>Password:</span>
                      <Input
                        :type="showPassword ? 'text' : 'password'"
                        readonly
                        :value="meeting.zoom_meeting.password"
                        class="h-8 flex-1"
                      />
                      <Button size="sm" variant="ghost" @click="showPassword = !showPassword">
                        <component :is="showPassword ? EyeOff : Eye" class="h-4 w-4" />
                      </Button>
                    </div>

                    <div v-if="canViewHostKey && meeting.host_key" class="flex items-center gap-2">
                      <KeyRound class="h-4 w-4" />
                      <span>Host Key:</span>
                      <Input
                        :type="showHostKey ? 'text' : 'password'"
                        readonly
                        :value="meeting.host_key"
                        class="h-8 flex-1"
                      />
                      <Button size="sm" variant="ghost" @click="showHostKey = !showHostKey">
                        <component :is="showHostKey ? EyeOff : Eye" class="h-4 w-4" />
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
                    <AvatarFallback>{{ getInitials(meeting.organizer.name || '') }}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p class="text-sm font-medium">{{ meeting.organizer.name }}</p>
                    <p class="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail class="h-3 w-3" />
                      {{ meeting.organizer.email }}
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
                <div v-if="isLoading" class="space-y-3 mt-2">
                  <div v-for="i in 3" :key="i" class="flex items-center gap-3">
                    <Skeleton class="h-8 w-8 rounded-full" />
                    <div class="space-y-2">
                      <Skeleton class="h-4 w-24" />
                      <Skeleton class="h-3 w-32" />
                    </div>
                  </div>
                </div>
                <Alert v-else-if="error" variant="destructive" class="mt-2">
                  <AlertTriangle class="h-4 w-4" />
                  <AlertDescription class="flex items-center justify-between">
                    <span>{{ error }}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      @click="loadMeetingDetails"
                      :disabled="isLoading"
                    >
                      <Loader2 v-if="isLoading" class="mr-2 h-4 w-4 animate-spin" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
                <div v-else-if="participants.length === 0" class="text-sm text-muted-foreground mt-2">
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
        </ScrollArea>

        <div class="pt-4 border-t mt-6">
          <Button variant="outline" @click="isOpen = false" class="w-full">Close</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
