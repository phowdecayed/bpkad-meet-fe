<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useMeetingsStore } from '@/stores/meetings'
import { useAuthStore } from '@/stores/auth'
import { useLocationsStore } from '@/stores/locations'

import { storeToRefs } from 'pinia'
import type { Meeting } from '@/types/meeting'
import { Button } from '@/components/ui/button'
import PaginationControls from '@/components/PaginationControls.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import EditMeetingDialog from '@/components/meetings/EditMeetingDialog.vue'
import CreateMeetingDialog from '@/components/meetings/CreateMeetingDialog.vue'
import MeetingDetailsDialog from '@/components/meetings/MeetingDetailsDialog.vue'
import MeetingFilters from '@/components/meetings/MeetingFilters.vue'
import MeetingTable from '@/components/meetings/MeetingTable.vue'
import ConfirmationDialog from '@/components/ConfirmationDialog.vue'
import { AlertCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useMeetingFilters } from '@/composables/useMeetingFilters'
import { PERMISSIONS } from '@/constants/permissions'

const meetingsStore = useMeetingsStore()
const authStore = useAuthStore()
const locationsStore = useLocationsStore()
const { meetings, isLoading, error, pagination } = storeToRefs(meetingsStore)
const { hasPermission } = storeToRefs(authStore)
const { locations } = storeToRefs(locationsStore)

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
} = useMeetingFilters(
  meetings,
  async (params) => {
    await meetingsStore.fetchMeetings(params)
  },
  locations,
)

// Permission checks
const canCreateMeetings = computed(() => hasPermission.value(PERMISSIONS.MEETINGS.CREATE))
const canEditMeetings = computed(() => hasPermission.value(PERMISSIONS.MEETINGS.EDIT))
const canDeleteMeetings = computed(() => hasPermission.value(PERMISSIONS.MEETINGS.DELETE))
const canViewAllMeetings = computed(() => hasPermission.value(PERMISSIONS.MEETINGS.VIEW))

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
    handleMeetingDeleted()
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

async function handleMeetingCreated() {
  const params = buildQueryParams()
  params.page = pagination.value.currentPage
  await meetingsStore.fetchMeetings(params)
}

async function handleMeetingUpdated() {
  // If the updated meeting is the one we are currently viewing details for, we could refresh details.
  // But primarily we need to refresh the list to respect filters.
  const params = buildQueryParams()
  params.page = pagination.value.currentPage
  await meetingsStore.fetchMeetings(params)
}

async function handleMeetingDeleted() {
  const params = buildQueryParams()
  params.page = pagination.value.currentPage

  await meetingsStore.fetchMeetings(params)

  // Auto-navigate to previous page if current page is empty and not the first page
  if (meetings.value.length === 0 && pagination.value.currentPage > 1) {
    params.page = pagination.value.currentPage - 1
    await meetingsStore.fetchMeetings(params)
  }
}

// Initialize
onMounted(() => {
  meetingsStore.fetchMeetings(buildQueryParams())
  locationsStore.fetchLocations()
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
    <MeetingFilters
      v-model:search-query="searchQuery"
      v-model:selected-type="selectedType"
      v-model:selected-location="selectedLocation"
      v-model:start-date="startDate"
      v-model:end-date="endDate"
      v-model:per-page="perPage"
      :has-active-filters="hasActiveFilters"
      :active-filter-count="getActiveFilterCount()"
      :available-locations="availableLocations"
      :locations-count="locationsCount"
      :is-loading="isLoading"
      @clear="clearFilters"
      @retry="retryFetch"
    />

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
    <MeetingTable
      :meetings="meetings"
      :is-loading="isLoading"
      :per-page="perPage"
      :has-active-filters="hasActiveFilters"
      :can-create-meetings="canCreateMeetings"
      :can-edit-meeting="canEditMeeting"
      :can-delete-meeting="canDeleteMeeting"
      @create="openCreateDialog"
      @edit="openEditDialog"
      @delete="openDeleteDialog"
      @details="openDetailsDialog"
      @clear-filters="clearFilters"
    />

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
    <CreateMeetingDialog v-model:open="showCreateDialog" @success="handleMeetingCreated" />
    <EditMeetingDialog
      v-model:open="showEditDialog"
      :meeting="selectedMeeting"
      @success="handleMeetingUpdated"
    />
    <MeetingDetailsDialog v-model:open="showDetailsDialog" :meeting="selectedMeeting" />
    <ConfirmationDialog
      v-model:open="showDeleteDialog"
      title="Delete Meeting"
      description="Are you sure you want to delete this meeting? This action cannot be undone."
      @confirm="handleDeleteMeeting"
    ></ConfirmationDialog>
  </div>
</template>
