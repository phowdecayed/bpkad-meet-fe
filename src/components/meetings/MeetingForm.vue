<script setup lang="ts">
import { computed, ref } from 'vue'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface MeetingFormData {
  topic: string
  description: string
  start_time: string
  duration: number
  type: 'online' | 'offline' | 'hybrid'
  location_id?: number
  password?: string
  participants: number[]
}

interface Location {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
}

const props = defineProps<{
  modelValue: MeetingFormData
  currentStep: number
  locations: Location[]
  users: User[]
  validationErrors: Record<string, string>
  isEditMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: MeetingFormData): void
}>()

const openParticipantsPopover = ref(false)

const localData = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const isLocationRequired = computed(
  () => localData.value.type === 'offline' || localData.value.type === 'hybrid',
)
const isPasswordVisible = computed(
  () => localData.value.type === 'online' || localData.value.type === 'hybrid',
)

const selectedUsers = computed(() =>
  props.users.filter((user) => localData.value.participants.includes(user.id)),
)

// For Edit Mode Participants (Checkbox style)
const availableUsersForCheckbox = computed(() => props.users)

function toggleParticipant(userId: number) {
  const currentParticipants = [...localData.value.participants]
  const index = currentParticipants.indexOf(userId)
  if (index > -1) {
    currentParticipants.splice(index, 1)
  } else {
    currentParticipants.push(userId)
  }
  localData.value = { ...localData.value, participants: currentParticipants }
}

// For Create Mode Participants (Command/Combobox style)
function toggleParticipantCreate(userId: number) {
  toggleParticipant(userId)
  // openParticipantsPopover.value = false // Keep open for multi-select
}
</script>

<template>
  <div class="space-y-4 py-4">
    <!-- Step 1: Basic Info -->
    <div v-if="currentStep === 1" class="space-y-4">
      <div class="grid gap-2">
        <Label for="topic">Topic *</Label>
        <Input
          id="topic"
          v-model="localData.topic"
          :class="{ 'border-red-500': validationErrors.topic }"
          placeholder="Enter meeting topic"
        />
        <p v-if="validationErrors.topic" class="text-sm text-red-500 mt-1">
          {{ validationErrors.topic }}
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="description">Description</Label>
        <Textarea
          id="description"
          v-model="localData.description"
          :class="{ 'border-red-500': validationErrors.description }"
          placeholder="Optional meeting description"
          rows="3"
        />
        <p v-if="validationErrors.description" class="text-sm text-red-500 mt-1">
          {{ validationErrors.description }}
        </p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="start_time">Start Time *</Label>
          <Input
            id="start_time"
            v-model="localData.start_time"
            type="datetime-local"
            :class="{ 'border-red-500': validationErrors.start_time }"
          />
          <p v-if="validationErrors.start_time" class="text-sm text-red-500 mt-1">
            {{ validationErrors.start_time }}
          </p>
        </div>
        <div class="grid gap-2">
          <Label for="duration">Duration (minutes) *</Label>
          <Input
            id="duration"
            v-model.number="localData.duration"
            type="number"
            min="1"
            max="1440"
            :class="{ 'border-red-500': validationErrors.duration }"
            placeholder="60"
          />
          <p v-if="validationErrors.duration" class="text-sm text-red-500 mt-1">
            {{ validationErrors.duration }}
          </p>
        </div>
      </div>
    </div>

    <!-- Step 2: Details -->
    <div v-if="currentStep === 2" class="space-y-4">
      <div class="grid gap-2">
        <Label for="type">Type *</Label>
        <Select v-model="localData.type">
          <SelectTrigger :class="{ 'border-red-500': validationErrors.type }">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="hybrid">Hybrid</SelectItem>
          </SelectContent>
        </Select>
        <p v-if="validationErrors.type" class="text-sm text-red-500 mt-1">
          {{ validationErrors.type }}
        </p>
      </div>

      <div v-if="isLocationRequired" class="grid gap-2">
        <Label for="location">Location *</Label>
        <Select v-model="localData.location_id">
          <SelectTrigger :class="{ 'border-red-500': validationErrors.location_id }">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p v-if="validationErrors.location_id" class="text-sm text-red-500 mt-1">
          {{ validationErrors.location_id }}
        </p>
      </div>

      <div v-if="isPasswordVisible" class="grid gap-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          v-model="localData.password"
          :type="isEditMode ? 'password' : 'text'"
          :class="{ 'border-red-500': validationErrors.password }"
          :placeholder="
            isEditMode
              ? 'Optional: Leave empty to keep unchanged'
              : 'Optional meeting password (max 10 chars)'
          "
          maxlength="10"
        />
        <p v-if="validationErrors.password" class="text-sm text-red-500 mt-1">
          {{ validationErrors.password }}
        </p>
      </div>
    </div>

    <!-- Step 3: Participants -->
    <div v-if="currentStep === 3" class="space-y-4">
      <div v-if="!isEditMode">
        <div class="grid gap-2">
          <Label>Invite Participants</Label>
          <Popover v-model:open="openParticipantsPopover">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                role="combobox"
                :aria-expanded="openParticipantsPopover"
                class="w-full justify-between"
              >
                {{
                  selectedUsers.length > 0
                    ? selectedUsers.map((u) => u.name).join(', ')
                    : 'Select participants...'
                }}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Search users..." />
                <CommandEmpty>No users found.</CommandEmpty>
                <CommandGroup>
                  <CommandList>
                    <CommandItem
                      v-for="user in users"
                      :key="user.id"
                      :value="user.name"
                      @select="toggleParticipantCreate(user.id)"
                    >
                      <Check
                        :class="
                          cn(
                            'mr-2 h-4 w-4',
                            localData.participants.includes(user.id) ? 'opacity-100' : 'opacity-0',
                          )
                        "
                      />
                      {{ user.name }}
                    </CommandItem>
                  </CommandList>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <p class="text-sm text-muted-foreground">
            Select users to invite to the meeting. This step is optional.
          </p>
        </div>
      </div>

      <div v-else>
        <!-- Edit Mode: Checkbox List -->
        <div class="grid gap-2">
          <Label>
            Participants
            <span
              v-if="localData.participants.length > 0"
              class="ml-2 text-xs text-muted-foreground"
            >
              ({{ localData.participants.length }} selected)
            </span>
          </Label>
          <ScrollArea class="h-48 border rounded-md p-3">
            <div class="space-y-2">
              <div
                v-for="user in availableUsersForCheckbox"
                :key="user.id"
                class="flex items-center space-x-2"
              >
                <Checkbox
                  :id="`user-edit-${user.id}`"
                  :checked="localData.participants.includes(user.id)"
                  @update:checked="toggleParticipant(user.id)"
                />
                <Label
                  :for="`user-edit-${user.id}`"
                  class="text-sm font-normal cursor-pointer flex-1"
                >
                  {{ user.name }} ({{ user.email }})
                </Label>
              </div>
              <div
                v-if="availableUsersForCheckbox.length === 0"
                class="text-sm text-muted-foreground text-center py-4"
              >
                No other users available
              </div>
            </div>
          </ScrollArea>
          <p class="text-sm text-muted-foreground">Select users to invite to this meeting.</p>
        </div>
      </div>
    </div>
  </div>
</template>
