<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, Plus, Eye } from 'lucide-vue-next'
import type { Meeting } from '@/types/meeting'
import type { BadgeVariants } from '@/components/ui/badge'

defineProps<{
  meetings: Meeting[]
  isLoading: boolean
  perPage: string
  hasActiveFilters: boolean
  canCreateMeetings: boolean
  canEditMeeting: (meeting: Meeting) => boolean
  canDeleteMeeting: (meeting: Meeting) => boolean
}>()

const emit = defineEmits(['create', 'edit', 'delete', 'details', 'clear-filters'])

// Helpers
const getMeetingStatus = (startTime: string, duration: number) => {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(start.getTime() + duration * 60000)

  if (now < start) {
    return 'Upcoming'
  } else if (now >= start && now <= end) {
    return 'Ongoing'
  } else {
    return 'Past'
  }
}

const getStatusVariant = (status: string): BadgeVariants['variant'] => {
  switch (status) {
    case 'Ongoing':
      return 'default'
    case 'Upcoming':
      return 'secondary'
    case 'Past':
      return 'destructive'
    default:
      return 'outline'
  }
}

const getTypeVariant = (type: string): BadgeVariants['variant'] => {
  switch (type) {
    case 'online':
      return 'default'
    case 'offline':
      return 'secondary'
    case 'hybrid':
      return 'outline'
    default:
      return 'outline'
  }
}
</script>

<template>
  <div class="border rounded-lg overflow-x-auto">
    <Table class="min-w-[800px]">
      <TableHeader>
        <TableRow>
          <TableHead class="min-w-[200px]">Topic</TableHead>
          <TableHead class="min-w-[100px]">Status</TableHead>
          <TableHead class="min-w-[100px]">Type</TableHead>
          <TableHead class="min-w-[120px]">Start Time</TableHead>
          <TableHead class="min-w-[80px]">Duration</TableHead>
          <TableHead class="min-w-[120px]">Location</TableHead>
          <TableHead class="text-right min-w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="isLoading">
          <TableRow v-for="i in parseInt(perPage)" :key="i">
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
            <TableCell><Skeleton class="h-4 w-full" /></TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableEmpty v-if="meetings.length === 0" :colspan="7">
            <div class="text-center py-8">
              <p class="text-muted-foreground mb-4">
                {{
                  hasActiveFilters
                    ? 'No meetings found matching your current filters.'
                    : 'No meetings found.'
                }}
              </p>
              <div v-if="hasActiveFilters" class="mb-4">
                <p class="text-sm text-muted-foreground mb-2">Try adjusting your filters or</p>
                <Button variant="outline" size="sm" @click="emit('clear-filters')">
                  Clear all filters
                </Button>
              </div>
              <Button
                v-if="canCreateMeetings && !hasActiveFilters"
                @click="emit('create')"
                variant="outline"
              >
                <Plus class="h-4 w-4 mr-2" />
                Create your first meeting
              </Button>
            </div>
          </TableEmpty>

          <TableRow v-for="meeting in meetings" :key="meeting.id">
            <TableCell>
              <div>
                <span class="block max-w-xs truncate font-medium">{{ meeting.topic }}</span>
                <span
                  v-if="meeting.description"
                  class="block max-w-xs truncate text-sm text-muted-foreground"
                >
                  {{ meeting.description }}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Badge
                :variant="getStatusVariant(getMeetingStatus(meeting.start_time, meeting.duration))"
              >
                {{ getMeetingStatus(meeting.start_time, meeting.duration) }}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge :variant="getTypeVariant(meeting.type)">
                {{ meeting.type }}
              </Badge>
            </TableCell>
            <TableCell>
              <div class="text-sm">
                <div>{{ new Date(meeting.start_time).toLocaleDateString() }}</div>
                <div class="text-muted-foreground">
                  {{ new Date(meeting.start_time).toLocaleTimeString() }}
                </div>
              </div>
            </TableCell>
            <TableCell>{{ meeting.duration }} min</TableCell>
            <TableCell>
              <span class="text-sm">
                {{ meeting.type === 'online' ? 'Zoom Meeting' : meeting.location?.name || 'N/A' }}
              </span>
            </TableCell>
            <TableCell class="text-right">
              <div class="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="isLoading"
                  @click="emit('details', meeting)"
                  :data-testid="`view-details-${meeting.id}`"
                >
                  <Eye class="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button
                      variant="ghost"
                      size="icon"
                      :disabled="
                        isLoading || !(canEditMeeting(meeting) || canDeleteMeeting(meeting))
                      "
                      :data-testid="`meeting-actions-${meeting.id}`"
                    >
                      <MoreHorizontal class="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    v-if="canEditMeeting(meeting) || canDeleteMeeting(meeting)"
                    align="end"
                  >
                    <DropdownMenuItem v-if="canEditMeeting(meeting)" @click="emit('edit', meeting)">
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="canDeleteMeeting(meeting)"
                      @click="emit('delete', meeting)"
                      class="text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </template>
      </TableBody>
    </Table>
  </div>
</template>
