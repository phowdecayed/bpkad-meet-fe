<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Meeting } from '@/types/meeting'
import type { User } from '@/types/user'
import { useMeetingsStore } from '@/stores/meetings'
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
} from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  meeting: Meeting | null
}>()

const emit = defineEmits(['update:open'])
const meetingsStore = useMeetingsStore()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

const participants = ref<User[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

async function loadParticipants() {
  if (!props.meeting) return
  isLoading.value = true
  error.value = null
  try {
    const fetchedParticipants = await meetingsStore.fetchParticipants(props.meeting.id)
    participants.value = fetchedParticipants
  } catch (e) {
    error.value = 'Failed to load participants.'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      // If the meeting object already has participants, use them. Otherwise, fetch them.
      if (props.meeting?.participants && props.meeting.participants.length > 0) {
        participants.value = props.meeting.participants
      } else {
        loadParticipants()
      }
    } else {
      // Reset when closing
      participants.value = []
      isLoading.value = false
      error.value = null
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
  if (!props.meeting) return ''
  return new Date(props.meeting.start_time).toLocaleString()
})
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

            <!-- Organizer -->
            <div class="flex items-start gap-4">
              <User class="h-5 w-5 text-muted-foreground mt-1" />
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
                      @click="loadParticipants"
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
