<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMeetingsStore } from '@/stores/meetings'
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
import PaginationControls from '@/components/PaginationControls.vue'
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
import { useMeetingFilters } from '@/composables/useMeetingFilters'

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

const {
  searchQuery,
  selectedType,
  selectedLocation,
  startDate,
  endDate,
  perPage,
  hasActiveFilters,
  getActiveFilterCount,
  availableLocations,
  locationsCount,
  buildQueryParams,
  clearFilters,
} = useMeetingFilters(meetings, async (params) => {
  await meetingsStore.fetchMeetings(params)
})

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

// Pagination handlers updated to work with PaginationControls component

// Pagination handlers updated to work with PaginationControls component
async function goToPage(page: number) {
  const params = buildQueryParams()
  params.page = page
  await meetingsStore.fetchMeetings(params)
}

async function handlePageChange(page: number) {
  await goToPage(page)
}

async function handleFirstPage() {
  await goToPage(1)
}

async function handleLastPage() {
  await goToPage(pagination.value.totalPages)
}

async function handleNextPage() {
  if (pagination.value.hasNextPage) {
    await goToPage(pagination.value.currentPage + 1)
  }
}

async function handlePrevPage() {
  if (pagination.value.hasPrevPage) {
    await goToPage(pagination.value.currentPage - 1)
  }
}

// Error handling
async function retryFetch() {
  meetingsStore.clearError()
  const params = buildQueryParams()
  params.page = pagination.value.currentPage
  await meetingsStore.fetchMeetings(params)
}

// Initialize
onMounted(() => {
  meetingsStore.fetchMeetings(buildQueryParams())
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
          <span v-if="hasActiveFilters" class="text-primary font-medium">
            ({{ getActiveFilterCount() }} filter{{ getActiveFilterCount() > 1 ? 's' : '' }} active)
          </span>
        </p>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="space-y-4">
      <!-- Search Bar - Full width -->
      <div class="flex-1 space-y-2">
        <Label for="search">Search meetings</Label>
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            v-model="searchQuery"
            placeholder="Search by topic or description..."
            class="pl-10"
            :class="{ 'border-primary': searchQuery.trim() !== '' }"
          />
        </div>
      </div>

      <!-- Filters - Responsive grid -->
      <div class="flex flex-col lg:flex-row gap-4">
        <div class="flex-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="space-y-2">
              <Label for="type">Type</Label>
              <Select v-model="selectedType">
                <SelectTrigger
                  id="type"
                  :class="{
                    'border-primary': selectedType !== undefined && selectedType !== 'all',
                  }"
                >
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
              <Label for="location">Location ({{ locationsCount }} available)</Label>
              <Select v-model="selectedLocation">
                <SelectTrigger
                  id="location"
                  :class="{ 'border-primary': selectedLocation !== 'all' }"
                >
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem
                    v-for="locationName in availableLocations"
                    :key="locationName"
                    :value="locationName"
                  >
                    {{ locationName }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label for="start-date">From</Label>
              <Input
                id="start-date"
                v-model="startDate"
                type="date"
                :class="{ 'border-primary': startDate !== '' }"
              />
            </div>

            <div class="space-y-2">
              <Label for="end-date">To</Label>
              <Input
                id="end-date"
                v-model="endDate"
                type="date"
                :class="{ 'border-primary': endDate !== '' }"
              />
            </div>

            <div class="space-y-2">
              <Label for="per-page">Per Page</Label>
              <Select v-model="perPage">
                <SelectTrigger id="per-page">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <!-- Action Buttons - Align to bottom on large screens -->
        <div class="flex flex-col lg:flex-row gap-2 lg:items-end lg:self-end">
          <Button
            variant="outline"
            @click="clearFilters"
            size="sm"
            :class="{ 'border-primary text-primary': hasActiveFilters }"
          >
            Clear
            <Badge v-if="hasActiveFilters" variant="secondary" class="ml-2 h-4 px-1 text-xs">
              {{ getActiveFilterCount() }}
            </Badge>
          </Button>
          <Button variant="outline" @click="retryFetch" size="sm" :disabled="isLoading">
            <RefreshCw :class="['h-4 w-4', isLoading && 'animate-spin']" />
          </Button>
        </div>
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

    <!-- Meetings Table -->
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
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
              <TableCell>
                <Skeleton class="h-4 w-full" />
              </TableCell>
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
                  <Button variant="outline" size="sm" @click="clearFilters">
                    Clear all filters
                  </Button>
                </div>
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
                  :variant="
                    getStatusVariant(getMeetingStatus(meeting.start_time, meeting.duration))
                  "
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
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <PaginationControls
      :current-page="pagination.currentPage"
      :total-pages="pagination.totalPages"
      :total-items="pagination.totalItems"
      :items-per-page="pagination.itemsPerPage"
      :has-next-page="pagination.hasNextPage"
      :has-prev-page="pagination.hasPrevPage"
      :is-loading="isLoading"
      :error="error"
      @page-change="handlePageChange"
      @first-page="handleFirstPage"
      @last-page="handleLastPage"
      @next-page="handleNextPage"
      @prev-page="handlePrevPage"
      @retry="retryFetch"
      data-testid="pagination"
    />

    <!-- Dialogs -->
    <CreateMeetingDialog v-model:open="showCreateDialog" />
    <EditMeetingDialog v-model:open="showEditDialog" :meeting="selectedMeeting" />
    <MeetingDetailsDialog v-model:open="showDetailsDialog" :meeting="selectedMeeting" />
    <ConfirmationDialog
      v-model:open="showDeleteDialog"
      title="Delete Meeting"
      description="Are you sure you want to delete this meeting? This action cannot be undone."
      @confirm="handleDeleteMeeting"
    ></ConfirmationDialog>
  </div>
</template>
