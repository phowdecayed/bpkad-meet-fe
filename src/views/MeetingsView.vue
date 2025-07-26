<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useMeetingsStore, type MeetingQueryParams } from '@/stores/meetings'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import type { Meeting } from '@/types/meeting'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import EditMeetingDialog from '@/components/meetings/EditMeetingDialog.vue'
import CreateMeetingDialog from '@/components/meetings/CreateMeetingDialog.vue'
import MeetingDetailsDialog from '@/components/meetings/MeetingDetailsDialog.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Plus, Search, RefreshCw, AlertCircle, Eye } from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { BadgeVariants } from '@/components/ui/badge'
import { toast } from 'vue-sonner'
import debounce from 'lodash-es/debounce'

const meetingsStore = useMeetingsStore()
const authStore = useAuthStore()
const { meetings, isLoading, error, pagination } = storeToRefs(meetingsStore)
const { hasPermission } = storeToRefs(authStore)

// Dialog states
const showEditDialog = ref(false)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedMeeting = ref<Meeting | null>(null)

// Search and filter states
const searchQuery = ref('')
const selectedType = ref<string | undefined>(undefined)
const startDate = ref('')
const endDate = ref('')

// Permission checks
const canCreateMeetings = computed(() => hasPermission.value('create meetings'))
const canEditMeetings = computed(() => hasPermission.value('edit meetings'))
const canDeleteMeetings = computed(() => hasPermission.value('delete meetings'))
const canViewAllMeetings = computed(() => hasPermission.value('view meetings'))

// Dialog handlers
function openEditDialog(meeting: Meeting) {
  selectedMeeting.value = meeting
  showEditDialog.value = true
}

function openCreateDialog() {
  showCreateDialog.value = true
}

function openDeleteDialog(meeting: Meeting) {
  selectedMeeting.value = meeting
  showDeleteDialog.value = true
}

function openDetailsDialog(meeting: Meeting) {
  selectedMeeting.value = meeting
  showDetailsDialog.value = true
}

async function handleDeleteMeeting() {
  if (!selectedMeeting.value) return

  try {
    await meetingsStore.deleteMeeting(selectedMeeting.value.id)
    toast.success('Meeting deleted successfully!')
    selectedMeeting.value = null
  } catch {
    const errorMessage = meetingsStore.error?.message || 'Failed to delete meeting'
    toast.error(errorMessage)
  }
}

// Permission checks for individual meetings
function canEditMeeting(meeting: Meeting): boolean {
  return canEditMeetings.value || meeting.organizer.id === authStore.user?.id
}

function canDeleteMeeting(meeting: Meeting): boolean {
  return canDeleteMeetings.value || meeting.organizer.id === authStore.user?.id
}

// Meeting status and type helpers
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

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    selectedType.value !== undefined ||
    startDate.value !== '' ||
    endDate.value !== ''
  )
})

// Search and filter functionality
const buildQueryParams = (): MeetingQueryParams => {
  const params: MeetingQueryParams = {}

  if (searchQuery.value.trim()) {
    params.search = searchQuery.value.trim()
  }

  if (selectedType.value) {
    params.type = selectedType.value
  }

  if (startDate.value) {
    params.start_date = startDate.value
  }

  if (endDate.value) {
    params.end_date = endDate.value
  }

  return params
}

const debouncedSearch = debounce(() => {
  goToPage(1)
}, 300)

// Watch for search changes
watch(
  () => [searchQuery.value, selectedType.value, startDate.value, endDate.value],
  debouncedSearch,
)

// Pagination handlers
async function goToPage(page: number) {
  const params = buildQueryParams()
  params.page = page
  await meetingsStore.fetchMeetings(params)
}

async function nextPage() {
  if (pagination.value.hasNextPage) {
    await goToPage(pagination.value.currentPage + 1)
  }
}

async function prevPage() {
  if (pagination.value.hasPrevPage) {
    await goToPage(pagination.value.currentPage - 1)
  }
}

// Error handling
async function retryFetch() {
  meetingsStore.clearError()
  const params = buildQueryParams()
  await meetingsStore.fetchMeetings(params)
}

function clearFilters() {
  searchQuery.value = ''
  selectedType.value = undefined
  startDate.value = ''
  endDate.value = ''
}

// Initialize
onMounted(() => {
  meetingsStore.fetchMeetings()
})
</script>

<template>
  <div class="flex-1 space-y-6 p-4 pt-6 md:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Meetings</h2>
        <p class="text-muted-foreground">
          {{
            canViewAllMeetings
              ? 'Manage all meetings in your organization.'
              : 'Manage your meetings.'
          }}
        </p>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="flex flex-col gap-4 md:flex-row md:items-end">
      <div class="flex-1 space-y-2">
        <Label for="search">Search meetings</Label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            v-model="searchQuery"
            placeholder="Search by topic or description..."
            class="pl-10"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-2">
        <div class="space-y-2">
          <Label for="type">Type</Label>
          <Select v-model="selectedType">
            <SelectTrigger id="type">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label for="start-date">From</Label>
          <Input id="start-date" v-model="startDate" type="date" />
        </div>

        <div class="space-y-2">
          <Label for="end-date">To</Label>
          <Input id="end-date" v-model="endDate" type="date" />
        </div>
      </div>

      <div class="flex gap-2">
        <Button variant="outline" @click="clearFilters" size="sm"> Clear </Button>
        <Button variant="outline" @click="retryFetch" size="sm" :disabled="isLoading">
          <RefreshCw :class="['h-4 w-4', isLoading && 'animate-spin']" />
        </Button>
      </div>
    </div>

    <!-- Error Display -->
    <Alert v-if="error && !isLoading" variant="destructive">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription class="flex items-center justify-between">
        <span>{{ error.message }}</span>
        <Button v-if="error.retryable" variant="outline" size="sm" @click="retryFetch" class="ml-4">
          Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <div
      v-if="isLoading && meetings.length === 0"
      class="border rounded-lg"
      data-testid="loading-skeleton"
    >
      <div class="p-4">
        <div class="space-y-3">
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-3/4" />
          <Skeleton class="h-4 w-1/2" />
        </div>
      </div>
    </div>

    <!-- Meetings Table -->
    <div v-else class="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Topic</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Start Time</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Location</TableHead>
            <TableHead class="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableEmpty v-if="meetings.length === 0 && !isLoading" :colspan="7">
            <div class="text-center py-8">
              <p class="text-muted-foreground mb-4">
                {{
                  hasActiveFilters
                    ? 'No meetings found matching your criteria.'
                    : 'No meetings found.'
                }}
              </p>
              <Button
                v-if="canCreateMeetings && !hasActiveFilters"
                @click="openCreateDialog"
                variant="outline"
              >
                <Plus class="h-4 w-4 mr-2" />
                Create your first meeting
              </Button>
            </div>
          </TableEmpty>

          <TableRow
            v-for="meeting in meetings"
            :key="meeting.id"
            :class="{ 'opacity-50': isLoading }"
          >
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
                  @click="openDetailsDialog(meeting)"
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
                    <DropdownMenuItem
                      v-if="canEditMeeting(meeting)"
                      @click="openEditDialog(meeting)"
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      v-if="canDeleteMeeting(meeting)"
                      @click="openDeleteDialog(meeting)"
                      class="text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div
      v-if="pagination.totalPages > 1"
      class="flex items-center justify-between"
      data-testid="pagination"
    >
      <div class="text-sm text-muted-foreground">
        Showing {{ (pagination.currentPage - 1) * pagination.itemsPerPage + 1 }} to
        {{ Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems) }}
        of {{ pagination.totalItems }} meetings
      </div>

      <Pagination
        :total="pagination.totalItems"
        :items-per-page="pagination.itemsPerPage"
        :page="pagination.currentPage"
        :sibling-count="1"
        show-edges
        @update:page="goToPage"
        v-slot="{ page, pages }"
      >
        <PaginationContent>
          <PaginationPrevious
            @click="prevPage"
            :disabled="!pagination.hasPrevPage || isLoading"
            data-testid="pagination-previous"
          />

          <template v-for="(item, index) in pages" :key="index">
            <PaginationItem v-if="item.type === 'page'" :value="item.value" as-child>
              <Button
                class="w-10 h-10 p-0"
                :variant="item.value === page ? 'default' : 'outline'"
                @click="() => goToPage(item.value)"
              >
                {{ item.value }}
              </Button>
            </PaginationItem>
            <PaginationEllipsis v-else :key="item.type" :index="index" />
          </template>

          <PaginationNext
            @click="nextPage"
            :disabled="!pagination.hasNextPage || isLoading"
            data-testid="pagination-next"
          />
        </PaginationContent>
      </Pagination>
    </div>

    <!-- Dialogs -->
    <CreateMeetingDialog v-model:open="showCreateDialog" />
    <EditMeetingDialog v-model:open="showEditDialog" :meeting="selectedMeeting" />
    <MeetingDetailsDialog v-model:open="showDetailsDialog" :meeting="selectedMeeting" />
    <ConfirmationDialog
      v-model:open="showDeleteDialog"
      title="Delete Meeting"
      description="Are you sure you want to delete this meeting? This action cannot be undone."
      @confirm="handleDeleteMeeting"
    />
  </div>
</template>
