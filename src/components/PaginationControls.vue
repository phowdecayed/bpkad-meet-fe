<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw, AlertCircle } from 'lucide-vue-next'

// Component props interface
export interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
  isLoading?: boolean
  maxVisiblePages?: number
  showEdges?: boolean
  showInfo?: boolean
  error?: {
    message: string
    retryable: boolean
  } | null
}

// Component emits interface
export interface PaginationControlsEmits {
  (e: 'page-change', page: number): void
  (e: 'first-page'): void
  (e: 'last-page'): void
  (e: 'next-page'): void
  (e: 'prev-page'): void
  (e: 'retry'): void
}

const props = withDefaults(defineProps<PaginationControlsProps>(), {
  isLoading: false,
  maxVisiblePages: 7,
  showEdges: true,
  showInfo: true,
  error: null,
})

const emit = defineEmits<PaginationControlsEmits>()

// Page range calculation with ellipsis support
interface PageRange {
  pages: (number | 'ellipsis')[]
  showFirst: boolean
  showLast: boolean
}

function calculatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7,
): PageRange {
  if (totalPages <= maxVisible) {
    // Show all pages if total is within max visible
    return {
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      showFirst: false,
      showLast: false,
    }
  }

  const pages: (number | 'ellipsis')[] = []
  const sidePages = Math.floor((maxVisible - 3) / 2) // Reserve space for first, last, and ellipsis

  // Always show first page
  pages.push(1)

  if (currentPage <= sidePages + 2) {
    // Current page is near the beginning
    for (let i = 2; i <= Math.min(maxVisible - 1, totalPages - 1); i++) {
      pages.push(i)
    }
    if (totalPages > maxVisible - 1) {
      pages.push('ellipsis')
    }
  } else if (currentPage >= totalPages - sidePages - 1) {
    // Current page is near the end
    if (totalPages > maxVisible - 1) {
      pages.push('ellipsis')
    }
    for (let i = Math.max(2, totalPages - maxVisible + 2); i <= totalPages - 1; i++) {
      pages.push(i)
    }
  } else {
    // Current page is in the middle
    pages.push('ellipsis')
    for (let i = currentPage - sidePages; i <= currentPage + sidePages; i++) {
      pages.push(i)
    }
    pages.push('ellipsis')
  }

  // Always show last page (if more than 1 page)
  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return {
    pages,
    showFirst: true,
    showLast: true,
  }
}

// Responsive page range calculation
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 640
})

const responsiveMaxVisible = computed(() => {
  if (isMobile.value) {
    return 3 // Show only current page and maybe 1 on each side on mobile
  }
  return props.maxVisiblePages
})

const pageRange = computed(() =>
  calculatePageRange(props.currentPage, props.totalPages, responsiveMaxVisible.value),
)

// Pagination info calculation with edge case handling
const paginationInfo = computed(() => {
  // Handle edge case when there are no results
  if (props.totalItems === 0) {
    return {
      start: 0,
      end: 0,
      total: 0,
    }
  }

  // Calculate start position (1-indexed)
  const start = (props.currentPage - 1) * props.itemsPerPage + 1

  // Calculate end position, ensuring it doesn't exceed total items
  const end = Math.min(props.currentPage * props.itemsPerPage, props.totalItems)

  // Handle edge case for first page
  const actualStart = Math.min(start, props.totalItems)

  return {
    start: actualStart,
    end,
    total: props.totalItems,
  }
})

// Event handlers
function handlePageChange(page: number) {
  if (page !== props.currentPage && !props.isLoading && !props.error) {
    emit('page-change', page)
  }
}

function handleRetry() {
  if (!props.isLoading) {
    emit('retry')
  }
}

function handleFirstPage() {
  if (props.hasPrevPage && !props.isLoading && !props.error) {
    emit('first-page')
    emit('page-change', 1)
  }
}

function handleLastPage() {
  if (props.hasNextPage && !props.isLoading && !props.error) {
    emit('last-page')
    emit('page-change', props.totalPages)
  }
}

function handleNextPage() {
  if (props.hasNextPage && !props.isLoading && !props.error) {
    emit('next-page')
    emit('page-change', props.currentPage + 1)
  }
}

function handlePrevPage() {
  if (props.hasPrevPage && !props.isLoading && !props.error) {
    emit('prev-page')
    emit('page-change', props.currentPage - 1)
  }
}

// Focus management
const paginationRef = ref<HTMLElement>()
const currentFocusIndex = ref(-1)

// Get all focusable pagination elements
const getFocusableElements = (): HTMLElement[] => {
  if (!paginationRef.value) return []

  const selector = 'button:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
  return Array.from(paginationRef.value.querySelectorAll(selector)) as HTMLElement[]
}

// Focus management functions
function focusElement(index: number) {
  const elements = getFocusableElements()
  if (elements[index]) {
    elements[index].focus()
    currentFocusIndex.value = index
  }
}

function findCurrentFocusIndex(): number {
  const elements = getFocusableElements()
  const activeElement = document.activeElement as HTMLElement
  return elements.findIndex((el) => el === activeElement)
}

// Enhanced keyboard navigation support
function handleKeydown(event: KeyboardEvent) {
  // Only handle keyboard events when pagination is focused or active
  const activeElement = document.activeElement
  const isPaginationFocused = activeElement?.closest('[data-pagination-controls]')

  if (!isPaginationFocused) return

  const elements = getFocusableElements()
  const currentIndex = findCurrentFocusIndex()

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      if (currentIndex > 0) {
        focusElement(currentIndex - 1)
      } else {
        handlePrevPageWithAnnouncement()
      }
      break

    case 'ArrowRight':
      event.preventDefault()
      if (currentIndex < elements.length - 1) {
        focusElement(currentIndex + 1)
      } else {
        handleNextPageWithAnnouncement()
      }
      break

    case 'Home':
      event.preventDefault()
      handleFirstPageWithAnnouncement()
      // Focus first page button after navigation
      nextTick(() => {
        const firstPageButton = paginationRef.value?.querySelector(
          '[data-testid="pagination-page-1"]',
        ) as HTMLElement
        if (firstPageButton) {
          firstPageButton.focus()
        }
      })
      break

    case 'End':
      event.preventDefault()
      handleLastPageWithAnnouncement()
      // Focus last page button after navigation
      nextTick(() => {
        const lastPageButton = paginationRef.value?.querySelector(
          `[data-testid="pagination-page-${props.totalPages}"]`,
        ) as HTMLElement
        if (lastPageButton) {
          lastPageButton.focus()
        }
      })
      break

    case 'PageUp':
      event.preventDefault()
      // Jump back 5 pages or to first page
      const targetPageUp = Math.max(1, props.currentPage - 5)
      if (targetPageUp !== props.currentPage) {
        handlePageChangeWithAnnouncement(targetPageUp)
      }
      break

    case 'PageDown':
      event.preventDefault()
      // Jump forward 5 pages or to last page
      const targetPageDown = Math.min(props.totalPages, props.currentPage + 5)
      if (targetPageDown !== props.currentPage) {
        handlePageChangeWithAnnouncement(targetPageDown)
      }
      break

    case 'Enter':
    case ' ':
      // Let the button handle these events naturally
      break

    default:
      // Handle number keys for direct page navigation
      if (event.key >= '1' && event.key <= '9') {
        event.preventDefault()
        const pageNumber = parseInt(event.key)
        if (pageNumber <= props.totalPages) {
          handlePageChangeWithAnnouncement(pageNumber)
          // Focus the corresponding page button
          nextTick(() => {
            const pageButton = paginationRef.value?.querySelector(
              `[data-testid="pagination-page-${pageNumber}"]`,
            ) as HTMLElement
            if (pageButton) {
              pageButton.focus()
            }
          })
        }
      }
      break
  }
}

// Screen reader announcements
function announcePageChange(page: number) {
  const announcement = `Page ${page} of ${props.totalPages}`

  // Create or update live region for screen reader announcements
  let liveRegion = document.getElementById('pagination-live-region')
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'pagination-live-region'
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    document.body.appendChild(liveRegion)
  }

  liveRegion.textContent = announcement
}

// Enhanced event handlers with screen reader support
function handlePageChangeWithAnnouncement(page: number) {
  handlePageChange(page)
  announcePageChange(page)
}

function handleFirstPageWithAnnouncement() {
  handleFirstPage()
  announcePageChange(1)
}

function handleLastPageWithAnnouncement() {
  handleLastPage()
  announcePageChange(props.totalPages)
}

function handleNextPageWithAnnouncement() {
  handleNextPage()
  announcePageChange(props.currentPage + 1)
}

function handlePrevPageWithAnnouncement() {
  handlePrevPage()
  announcePageChange(props.currentPage - 1)
}

// Lifecycle hooks for keyboard navigation
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)

  // Clean up live region
  const liveRegion = document.getElementById('pagination-live-region')
  if (liveRegion) {
    document.body.removeChild(liveRegion)
  }
})
</script>

<template>
  <div
    v-if="(totalPages > 1 && totalItems > 0) || error"
    ref="paginationRef"
    class="flex flex-col gap-4"
    data-pagination-controls
    role="navigation"
    aria-label="Pagination Navigation"
  >
    <!-- Error State -->
    <Alert v-if="error && !isLoading" variant="destructive" class="mb-4">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription class="flex items-center justify-between">
        <span>{{ error.message }}</span>
        <Button
          v-if="error.retryable"
          variant="outline"
          size="sm"
          @click="handleRetry"
          class="ml-4"
        >
          <RefreshCw class="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>

    <!-- Loading State -->
    <div v-if="isLoading && totalPages <= 1" class="flex items-center justify-center py-4">
      <div class="flex items-center gap-2">
        <RefreshCw class="h-4 w-4 animate-spin" />
        <span class="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>

    <!-- Main Pagination Content -->
    <div
      v-if="totalPages > 1"
      class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      :class="{ 'opacity-50 pointer-events-none': isLoading }"
    >
      <!-- Pagination Info -->
      <div
        v-if="showInfo && paginationInfo.total > 0"
        class="text-sm text-muted-foreground order-2 sm:order-1"
      >
        <template v-if="isLoading">
          <Skeleton class="h-4 w-32 inline-block" />
        </template>
        <template v-else>
          <span class="hidden sm:inline">Showing </span>
          {{ paginationInfo.start }} to {{ paginationInfo.end }} of {{ paginationInfo.total }}
          <span class="hidden sm:inline"> results</span>
        </template>
      </div>

      <!-- Pagination Controls -->
      <div class="order-1 sm:order-2">
        <Pagination
          :total="totalItems"
          :items-per-page="itemsPerPage"
          :page="currentPage"
          :sibling-count="1"
          :show-edges="showEdges && !isMobile"
          @update:page="handlePageChange"
        >
          <PaginationContent>
            <!-- First Page Button (Desktop only) -->
            <PaginationFirst
              v-if="showEdges && !isMobile"
              @click="handleFirstPageWithAnnouncement"
              :disabled="!hasPrevPage || isLoading || !!error"
              :aria-label="'Go to first page'"
              data-testid="pagination-first"
            />

            <!-- Previous Page Button -->
            <PaginationPrevious
              @click="handlePrevPageWithAnnouncement"
              :disabled="!hasPrevPage || isLoading || !!error"
              :aria-label="'Go to previous page'"
              data-testid="pagination-previous"
            />

            <!-- Page Numbers -->
            <template v-for="(item, index) in pageRange.pages" :key="`page-${index}`">
              <PaginationEllipsis v-if="item === 'ellipsis'" :aria-label="'More pages'" />
              <PaginationItem v-else :value="item" :is-active="item === currentPage" as-child>
                <Button
                  class="w-10 h-10 p-0 relative"
                  :variant="item === currentPage ? 'default' : 'outline'"
                  @click="() => handlePageChangeWithAnnouncement(item)"
                  :disabled="isLoading || !!error"
                  :aria-label="`Go to page ${item}`"
                  :aria-current="item === currentPage ? 'page' : undefined"
                  :data-testid="`pagination-page-${item}`"
                >
                  <template v-if="isLoading && item === currentPage">
                    <RefreshCw class="h-4 w-4 animate-spin" />
                  </template>
                  <template v-else>
                    {{ item }}
                  </template>
                </Button>
              </PaginationItem>
            </template>

            <!-- Next Page Button -->
            <PaginationNext
              @click="handleNextPageWithAnnouncement"
              :disabled="!hasNextPage || isLoading || !!error"
              :aria-label="'Go to next page'"
              data-testid="pagination-next"
            />

            <!-- Last Page Button (Desktop only) -->
            <PaginationLast
              v-if="showEdges && !isMobile"
              @click="handleLastPageWithAnnouncement"
              :disabled="!hasNextPage || isLoading || !!error"
              :aria-label="'Go to last page'"
              data-testid="pagination-last"
            />
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  </div>
</template>
